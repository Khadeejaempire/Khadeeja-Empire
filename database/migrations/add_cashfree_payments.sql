-- Replace PayU as the active online-payment provider while retaining existing
-- PayU attempts for historical reporting.
alter table public.payment_attempts drop constraint if exists payment_attempts_provider_check;
alter table public.payment_attempts add constraint payment_attempts_provider_check
  check (provider in ('payu', 'cashfree'));

create or replace function public.create_cashfree_payment_attempt(
  p_order_id text, p_transaction_id text, p_amount numeric, p_currency text,
  p_product_info text, p_customer_name text, p_customer_email text, p_customer_phone text,
  p_coupon_id text default null
) returns public.payment_attempts language plpgsql security invoker set search_path = public as $$
declare v_attempt public.payment_attempts; v_coupon public.coupons; v_expired integer := 0;
begin
  if p_coupon_id is not null then
    select * into v_coupon from coupons where id = p_coupon_id for update;
    if not found then raise exception 'Coupon not found'; end if;
    with released as (
      update payment_attempts set coupon_reserved = false
      where coupon_id = p_coupon_id and coupon_reserved and status in ('created','pending') and reservation_expires_at <= timezone('utc', now()) returning 1
    ) select count(*) into v_expired from released;
    if v_expired > 0 then update coupons set used_count = greatest(0, used_count - v_expired) where id = p_coupon_id; end if;
    select * into v_coupon from coupons where id = p_coupon_id for update;
    if v_coupon.maximum_uses is not null and v_coupon.used_count >= v_coupon.maximum_uses then raise exception 'Coupon usage limit reached'; end if;
    update coupons set used_count = used_count + 1 where id = p_coupon_id;
  end if;
  insert into payment_attempts(order_id,provider,transaction_id,status,amount,currency,product_info,customer_name,customer_email,customer_phone,coupon_id,coupon_reserved,reservation_expires_at)
  values(p_order_id,'cashfree',p_transaction_id,'pending',p_amount,p_currency,p_product_info,p_customer_name,p_customer_email,p_customer_phone,p_coupon_id,p_coupon_id is not null,case when p_coupon_id is null then null else timezone('utc',now()) + interval '30 minutes' end)
  returning * into v_attempt;
  return v_attempt;
end; $$;

revoke all on function public.create_cashfree_payment_attempt(text,text,numeric,text,text,text,text,text,text) from public, anon, authenticated;
grant execute on function public.create_cashfree_payment_attempt(text,text,numeric,text,text,text,text,text,text) to service_role;

create or replace function public.apply_verified_cashfree_result(
  p_transaction_id text, p_status text, p_provider_payment_id text default null,
  p_failure_code text default null, p_failure_message text default null
) returns public.payment_attempts language plpgsql security invoker set search_path = public as $$
declare v_attempt public.payment_attempts; v_order public.orders; v_newly_paid boolean := false;
begin
  if p_status not in ('paid', 'failed') then raise exception 'Invalid payment status'; end if;
  select * into v_attempt from public.payment_attempts where transaction_id = p_transaction_id for update;
  if not found then raise exception 'Payment attempt not found'; end if;
  select * into v_order from public.orders where id = v_attempt.order_id for update;
  if not found or v_order.payment_method <> 'cashfree' then raise exception 'Cashfree order not found'; end if;
  if v_attempt.status not in ('paid', 'refunded') then
    v_newly_paid := p_status = 'paid';
    update public.payment_attempts set status = p_status, provider_payment_id = coalesce(p_provider_payment_id, provider_payment_id),
      failure_code = case when p_status = 'paid' then null else p_failure_code end,
      failure_message = case when p_status = 'paid' then null else p_failure_message end,
      verified_at = timezone('utc', now()), updated_at = timezone('utc', now())
    where id = v_attempt.id returning * into v_attempt;
    update public.orders set payment_status = p_status, status = case when p_status = 'paid' and status in ('pending','confirmed') then 'confirmed' else status end,
      updated_at = timezone('utc', now()) where id = v_order.id;
    if p_status = 'failed' and v_attempt.coupon_id is not null and v_attempt.coupon_reserved then
      update public.coupons set used_count = greatest(0, used_count - 1) where id = v_attempt.coupon_id;
      update public.payment_attempts set coupon_reserved = false where id = v_attempt.id returning * into v_attempt;
    end if;
  end if;
  return v_attempt;
end; $$;

revoke all on function public.apply_verified_cashfree_result(text,text,text,text,text) from public, anon, authenticated;
grant execute on function public.apply_verified_cashfree_result(text,text,text,text,text) to service_role;
