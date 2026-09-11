-- Run once in Supabase SQL Editor before deploying the PayU integration.
begin;

create table if not exists public.payment_attempts (
  id text primary key default gen_random_uuid()::text,
  order_id text not null references public.orders(id) on delete cascade,
  provider text not null default 'payu' check (provider = 'payu'),
  transaction_id text not null unique,
  provider_payment_id text,
  status text not null default 'created' check (status in ('created', 'pending', 'paid', 'failed', 'cancelled', 'refunded')),
  amount numeric(12, 2) not null check (amount >= 0),
  currency text not null default 'INR',
  product_info text not null,
  customer_name text not null,
  customer_email text not null,
  customer_phone text not null,
  coupon_id text references public.coupons(id) on delete set null,
  coupon_reserved boolean not null default false,
  reservation_expires_at timestamptz,
  failure_code text,
  failure_message text,
  verified_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists payment_attempts_order_idx
  on public.payment_attempts(order_id, created_at desc);
create unique index if not exists payment_attempts_provider_payment_idx
  on public.payment_attempts(provider_payment_id)
  where provider_payment_id is not null;

alter table public.payment_attempts enable row level security;

create or replace function public.create_payu_payment_attempt(
  p_order_id text, p_transaction_id text, p_amount numeric, p_currency text,
  p_product_info text, p_customer_name text, p_customer_email text, p_customer_phone text,
  p_coupon_id text default null
) returns public.payment_attempts language plpgsql security invoker set search_path = public as $$
declare v_attempt public.payment_attempts; v_coupon public.coupons; v_expired integer := 0;
begin
  if p_coupon_id is not null then
    select * into v_coupon from public.coupons where id = p_coupon_id for update;
    if not found then raise exception 'Coupon not found'; end if;
    with released as (
      update public.payment_attempts set coupon_reserved = false
      where coupon_id = p_coupon_id and coupon_reserved and status in ('created','pending') and reservation_expires_at <= timezone('utc', now())
      returning 1
    ) select count(*) into v_expired from released;
    if v_expired > 0 then
      update public.coupons set used_count = greatest(0, used_count - v_expired) where id = p_coupon_id;
    end if;
    select * into v_coupon from public.coupons where id = p_coupon_id for update;
    -- Recalculate from committed uses plus currently live reservations kept in used_count.
    if v_coupon.maximum_uses is not null and v_coupon.used_count >= v_coupon.maximum_uses then
      raise exception 'Coupon usage limit reached';
    end if;
    update public.coupons set used_count = used_count + 1 where id = p_coupon_id;
  end if;
  insert into public.payment_attempts(order_id,provider,transaction_id,status,amount,currency,product_info,customer_name,customer_email,customer_phone,coupon_id,coupon_reserved,reservation_expires_at)
  values(p_order_id,'payu',p_transaction_id,'pending',p_amount,p_currency,p_product_info,p_customer_name,p_customer_email,p_customer_phone,p_coupon_id,p_coupon_id is not null,case when p_coupon_id is null then null else timezone('utc',now()) + interval '30 minutes' end)
  returning * into v_attempt;
  return v_attempt;
end; $$;

revoke all on function public.create_payu_payment_attempt(text,text,numeric,text,text,text,text,text,text) from public, anon, authenticated;
grant execute on function public.create_payu_payment_attempt(text,text,numeric,text,text,text,text,text,text) to service_role;

create or replace function public.apply_verified_payu_result(
  p_transaction_id text,
  p_status text,
  p_provider_payment_id text default null,
  p_failure_code text default null,
  p_failure_message text default null
)
returns public.payment_attempts
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_attempt public.payment_attempts;
  v_order public.orders;
  v_newly_paid boolean := false;
begin
  if p_status not in ('paid', 'failed') then
    raise exception 'Invalid payment status';
  end if;

  select * into v_attempt from public.payment_attempts
  where transaction_id = p_transaction_id for update;
  if not found then raise exception 'Payment attempt not found'; end if;

  select * into v_order from public.orders where id = v_attempt.order_id for update;
  if not found or v_order.payment_method <> 'payu' then
    raise exception 'PayU order not found';
  end if;

  if v_attempt.status not in ('paid', 'refunded') then
    v_newly_paid := p_status = 'paid';
    update public.payment_attempts set
      status = p_status,
      provider_payment_id = coalesce(p_provider_payment_id, provider_payment_id),
      failure_code = case when p_status = 'paid' then null else p_failure_code end,
      failure_message = case when p_status = 'paid' then null else p_failure_message end,
      verified_at = timezone('utc', now()),
      updated_at = timezone('utc', now())
    where id = v_attempt.id returning * into v_attempt;

    update public.orders set
      payment_status = p_status,
      status = case when p_status = 'paid' and status in ('pending','confirmed') then 'confirmed' else status end,
      updated_at = timezone('utc', now())
    where id = v_order.id;

    if p_status = 'failed' and v_attempt.coupon_id is not null and v_attempt.coupon_reserved then
      update public.coupons set used_count = greatest(0, used_count - 1) where id = v_attempt.coupon_id;
      update public.payment_attempts set coupon_reserved = false where id = v_attempt.id returning * into v_attempt;
    end if;
  end if;

  return v_attempt;
end;
$$;

revoke all on function public.apply_verified_payu_result(text,text,text,text,text) from public, anon, authenticated;
grant execute on function public.apply_verified_payu_result(text,text,text,text,text) to service_role;

commit;
