"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { placeOrder, previewCouponAction, type CheckoutActionResult } from "@/actions/storefront/checkout";
import { useCart } from "@/hooks/useCart";
import { Button } from "@/components/ui/Button";
import { formatPrice } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { 
  User, Mail, Phone, MapPin, Home, Building2, Map, Tag, Shield, 
  Lock, ShoppingBag, Trash2, Minus, Plus, Truck, RotateCcw, Award,
  ShieldCheck, ChevronDown, CheckCircle2, Building, Ticket, Compass, CreditCard,
  ChevronRight
} from "lucide-react";

const schema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(10, "Valid phone number is required"),
  address: z.string().min(5, "Address is required"),
  address2: z.string(),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  pincode: z.string().min(4, "Valid pincode is required"),
  couponCode: z.string(),
});

type Confirmation = Extract<CheckoutActionResult, { ok: true }>["order"];

export function CheckoutForm({ lockedEmail = null }: { lockedEmail?: string | null } = {}) {
  const router = useRouter();
  const { items, subtotal, itemCount, removeItem, updateQuantity, isHydrated, clearCart } = useCart();
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState("");
  const [pending, startTransition] = useTransition();
  const [couponPending, startCouponTransition] = useTransition();
  const attemptKey = useRef<string>("");
  const [form, setForm] = useState({ name: "", email: lockedEmail ?? "", phone: "", address: "", address2: "", city: "", state: "", pincode: "", couponCode: "" });
  const [appliedCode, setAppliedCode] = useState<string | null>(null);
  const [couponDiscount, setCouponDiscount] = useState<number | null>(null);
  const [couponMessage, setCouponMessage] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"payu" | "cod">("payu");

  const freeShippingThreshold = 2000;
  const progressPercentage = Math.min((subtotal / freeShippingThreshold) * 100, 100);
  const amountNeeded = Math.max(0, freeShippingThreshold - subtotal);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      const nextErrors: Record<string, string> = {};
      parsed.error.errors.forEach((error) => { if (error.path[0]) nextErrors[String(error.path[0])] = error.message; });
      setErrors(nextErrors);
      return;
    }
    setErrors({});
    setSubmitError("");
    if (!attemptKey.current) attemptKey.current = crypto.randomUUID();
    startTransition(async () => {
      const result = await placeOrder({
        idempotencyKey: attemptKey.current,
        items: items.map((item) => ({ productId: item.product.id, quantity: item.quantity, size: item.size || undefined })),
        customer: { name: parsed.data.name, email: parsed.data.email, phone: parsed.data.phone },
        paymentMethod,
        shippingAddress: { line1: parsed.data.address, line2: parsed.data.address2 || undefined, city: parsed.data.city, state: parsed.data.state, postalCode: parsed.data.pincode, country: "IN" },
        couponCode: parsed.data.couponCode || undefined,
      });
      if (!result.ok) {
        if (result.code === "UNAUTHENTICATED") {
          router.push("/login?next=/checkout");
          return;
        }
        setSubmitError(result.message);
        if (result.fieldErrors) setErrors(Object.fromEntries(Object.entries(result.fieldErrors).map(([key, value]) => [key, value?.[0] || "Invalid value"])));
        return;
      }
      if (result.mode === "payu") {
        const gatewayForm = document.createElement("form");
        gatewayForm.method = "POST";
        gatewayForm.action = result.gateway.actionUrl;
        for (const [name, value] of Object.entries(result.gateway.fields)) {
          const input = document.createElement("input");
          input.type = "hidden";
          input.name = name;
          input.value = value;
          gatewayForm.appendChild(input);
        }
        document.body.appendChild(gatewayForm);
        gatewayForm.submit();
        return;
      }
      setConfirmation(result.order);
      clearCart();
    });
  };

  const handleApplyCoupon = () => {
    const code = form.couponCode.trim();
    if (!code) {
      setCouponMessage("Enter a coupon code.");
      return;
    }
    startCouponTransition(async () => {
      const result = await previewCouponAction(code, subtotal);
      if (result.valid && result.code) {
        setAppliedCode(result.code);
        setCouponDiscount(result.discount ?? 0);
        setCouponMessage("");
      } else {
        setAppliedCode(null);
        setCouponDiscount(null);
        setCouponMessage(result.message ?? "That coupon could not be applied.");
      }
    });
  };

  if (!isHydrated) return <div className="min-h-[40vh] flex items-center justify-center text-muted">Loading checkout…</div>;
  
  if (confirmation) {
    return (
      <div className="flex flex-col items-center justify-center py-16 md:py-24 px-6 bg-gradient-to-b from-white to-[#fcfaf7] rounded-3xl shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-[#d8b88d]/15 max-w-2xl mx-auto mt-4">
        <div className="w-20 h-20 rounded-full bg-[#fdfaf5] shadow-sm border border-[#d8b88d]/20 flex items-center justify-center text-[#2e7d32] mb-8">
          <CheckCircle2 size={40} strokeWidth={1.5} />
        </div>
        <h2 className="text-3xl font-display font-medium text-ink mb-3 text-center">Order Confirmed</h2>
        <p className="text-muted text-center mb-8">
          Your order <strong className="text-ink font-semibold">#{confirmation.orderNumber}</strong> has been successfully placed.
        </p>
        <div className="w-full bg-white rounded-2xl p-6 border border-[#d8b88d]/20 shadow-sm mb-8 text-center">
          <p className="text-sm text-muted">
            Pay in cash when your order is delivered.
          </p>
          <div className="mt-4 pt-4 border-t border-[#d8b88d]/20 flex justify-between items-center max-w-xs mx-auto">
            <span className="font-medium text-ink">Amount Due (COD)</span>
            <span className="font-bold text-xl text-ink">{formatPrice(confirmation.total, confirmation.currency)}</span>
          </div>
        </div>
        <Link
          href="/shop"
          className="inline-flex items-center justify-center px-8 py-3.5 rounded-xl bg-[#a27b53] text-white font-semibold text-[13px] tracking-[0.1em] uppercase hover:bg-[#8b6845] transition-all shadow-md active:scale-95"
        >
          Continue Shopping
        </Link>
      </div>
    );
  }
  
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6 max-w-2xl mx-auto mt-4 text-center">
        <h2 className="text-3xl font-display font-medium text-ink mb-3">Your bag is empty</h2>
        <p className="text-muted mb-8">You need items in your bag to checkout.</p>
        <Link
          href="/shop"
          className="inline-flex items-center mt-5 justify-center px-8 py-3.5 bg-[#a27b53] text-white font-semibold text-[13px] tracking-[0.1em] uppercase hover:bg-[#8b6845] transition-all shadow-md active:scale-95"
        >
          Explore Shop
        </Link>
      </div>
    );
  }

  const field = (name: keyof typeof form, label: string, type = "text", placeholder = "", icon?: React.ReactNode, fullWidth = false, locked = false) => (
    <div className={`flex flex-col gap-1.5 w-full ${fullWidth ? "md:col-span-3" : ""}`}>
      <label htmlFor={name} className="text-[14px] md:text-[15px] font-bold text-ink/80 mb-0.5">{label}</label>
      <div className="relative">
        <input
          id={name}
          name={name}
          type={type}
          placeholder={placeholder}
          value={form[name]}
          onChange={(event)=>setForm({...form,[name]:event.target.value})}
          readOnly={locked}
          aria-readonly={locked || undefined}
          aria-invalid={!!errors[name]}
          aria-describedby={errors[name]?`${name}-error`:undefined}
          className={`w-full border-[1px] border-[#6f302a] rounded-none px-4 py-3.5 text-[14px] text-ink outline-none transition-all focus:ring-1 focus:ring-[#6f302a] placeholder:text-muted/60 ${locked ? "bg-[#fcfaf7] cursor-not-allowed text-muted" : "bg-white"}`}
        />
        {icon && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-muted/60">
            {icon}
          </div>
        )}
      </div>
      {errors[name] && <p id={`${name}-error`} className="text-[12px] text-red-500 mt-1" role="alert">{errors[name]}</p>}
    </div>
  );

  return (
    <div className="max-w-[1400px] mx-auto pb-20 pt-4 md:pt-6 px-4 md:px-6">
      {/* Breadcrumb Nav */}
      <nav className="flex items-center gap-1.5 text-[12px] md:text-[13px] font-medium tracking-wide text-muted mb-6 md:mb-8">
        <Link className="hover:text-[#a27b53] transition-colors" href="/">Home</Link>
        <ChevronRight size={14} className="opacity-40" strokeWidth={1.5} />
        <span className="text-[#a27b53]">Checkout</span>
      </nav>

      <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        
        {/* Left Column: Checkout Form */}
        <form onSubmit={handleSubmit} className="lg:col-span-7 xl:col-span-8 flex flex-col gap-3 md:gap-6" noValidate>
          
          <div>
            <h1 className="text-3xl md:text-[40px] font-display font-medium text-ink mb-2">Checkout</h1>
            <p className="text-sm text-muted">Please fill in your details to place the order</p>
          </div>

        {/* Contact and Shipping Form */}
        <div className="flex flex-col gap-4">
          <h2 className="text-2xl font-semibold text-ink leading-tight mb-2">Contact Details</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {field("name", "Full Name", "text", "Enter your full name", <User size={16} />)}
            {field("email", "Email Address", "email", "Enter your email", <Mail size={16} />, false, Boolean(lockedEmail))}
            {field("phone", "Phone Number", "tel", "Enter your phone number", <Phone size={16} />)}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {field("address", "Street Address", "text", "House no., Building, Street name", <Home size={16} />, true)}
            {field("address2", "Apartment, suite, etc. (optional)", "text", "Apartment, suite, unit, etc.", <Building size={16} />, true)}
            {field("city", "City", "text", "Enter your city", <Building2 size={16} />)}
            {field("state", "State", "text", "Select state", <Compass size={16} />)}
            {field("pincode", "Pincode", "text", "Enter pincode", <Map size={16} />)}
          </div>
        </div>

        <hr className="border-[#d8b88d]/20" />

        {/* Offer */}
        <div className="flex flex-col gap-5">
          <h2 className="text-2xl font-bold text-ink leading-tight font-semibold">Offer</h2>
          <div className="flex gap-4 items-end">
            <div className="flex-1 relative">
              <input 
                id="couponCode" 
                name="couponCode" 
                type="text" 
                placeholder="Enter coupon code"
                value={form.couponCode} 
                onChange={(event)=>{
                  setForm({...form, couponCode:event.target.value});
                  if (appliedCode) {
                    setAppliedCode(null);
                    setCouponDiscount(null);
                    setCouponMessage("");
                  }
                }} 
                className="w-full border-[1px] border-[#6f302a] rounded-none bg-white px-4 py-3.5 text-[14px] text-ink outline-none transition-all focus:ring-1 focus:ring-[#6f302a] placeholder:text-muted/60"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-muted/60">
                <Ticket size={16} />
              </div>
            </div>
            <button 
              type="button" 
              onClick={handleApplyCoupon}
              disabled={couponPending}
              className="px-6 py-3.5 rounded-none border border-[#a27b53] bg-[#a27b53] text-[#ffffff] text-[12px] font-bold tracking-[0.1em] hover:bg-[#fdfaf5] hover:text-[#a27b53] transition-colors uppercase cursor-pointer disabled:opacity-70 disabled:pointer-events-none"
              >
              {couponPending ? "CHECKING..." : "APPLY"}
            </button>
          </div>
          {appliedCode ? (
            <p className="text-[12px] text-[#2e7d32] font-medium mt-1">
              Applied {appliedCode}
            </p>
          ) : couponMessage ? (
            <p className="text-[12px] text-red-500 font-medium mt-1" role="alert">{couponMessage}</p>
          ) : null}
        </div>

        {/* Payment Mode */}
        <fieldset className="space-y-3">
          <legend className="mb-3 text-2xl font-semibold text-ink">Payment method</legend>
          {([
            { value: "payu" as const, title: "Pay online with PayU", copy: "Cards, UPI, net banking and supported wallets.", icon: <CreditCard size={20} /> },
            { value: "cod" as const, title: "Cash on Delivery", copy: "Pay in cash when your order arrives.", icon: <Shield size={20} /> },
          ]).map((option) => (
            <label key={option.value} className={`flex cursor-pointer items-center gap-4 border p-4 transition ${paymentMethod === option.value ? "border-[#6f302a] bg-[#fcfaf7]" : "border-[#d8b88d]/40 bg-white"}`}>
              <input type="radio" name="paymentMethod" value={option.value} checked={paymentMethod === option.value} onChange={() => setPaymentMethod(option.value)} className="accent-[#6f302a]" />
              <span className="text-[#a27b53]">{option.icon}</span>
              <span><strong className="block text-ink">{option.title}</strong><small className="text-muted">{option.copy}</small></span>
            </label>
          ))}
        </fieldset>

        {submitError && (
          <p className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-4 text-sm font-medium text-center shadow-sm" role="alert">
            {submitError}
          </p>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-4 mt-2">
          <button 
            type="submit" 
            disabled={pending}
            className="flex items-center justify-center gap-2 w-full bg-[#2a2420] text-white py-4.5 text-[13px] font-bold tracking-[0.1em] uppercase hover:bg-[#1a1612] transition-all shadow-md active:scale-95 disabled:opacity-70 disabled:pointer-events-none"
          >
            <Lock size={15} />
            {pending ? "PROCESSING..." : paymentMethod === "payu" ? "PAY SECURELY" : "PLACE COD ORDER"}
          </button>
          <div className="flex items-center justify-center gap-1.5 text-muted">
            <ShieldCheck size={14} />
            <span className="text-[12px]">Your data is protected and encrypted</span>
          </div>
        </div>

      </form>


      {/* Right Column: Order Summary Card (Image 2 style) */}
      <div className="lg:col-span-5 xl:col-span-4">
        <div className="bg-[#fcfaf7] border border-[#d8b88d]/30 p-6 sm:p-8 flex flex-col gap-6 sticky top-24 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between pb-4 border-b border-[#d8b88d]/20 mb-2">
            <h2 className="text-xl md:text-2xl font-display font-medium text-ink flex items-center gap-3">
              <ShoppingBag className="text-[#a27b53]" size={22} />
              Order Summary
            </h2>
            <span className="text-sm font-medium text-ink bg-[#fdfaf5] px-3 py-1 rounded-full border border-[#d8b88d]/30 shadow-sm">
              {itemCount} {itemCount === 1 ? 'item' : 'items'}
            </span>
          </div>
          
          <ul className="flex flex-col gap-6">
            {items.map((item) => (
              <li key={item.key} className="flex gap-4">
                <div className="relative w-[60px] h-[75px] sm:w-[70px] sm:h-[85px] flex-shrink-0 overflow-hidden bg-white rounded-lg border border-[#d8b88d]/30">
                  <Image
                    src={item.product.images[0]}
                    alt={item.product.name}
                    fill
                    sizes="70px"
                    className="object-cover"
                  />
                </div>
                <div className="flex flex-col flex-1 min-w-0 justify-between">
                  <div className="flex justify-between gap-2">
                    <span title={item.product.name} className="text-[13px] sm:text-[14px] font-medium text-ink leading-tight line-clamp-2">
                      {item.product.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeItem(item.key)}
                      aria-label="Remove item"
                      className="text-muted hover:text-red-500 transition-colors p-1.5 border border-[#d8b88d]/30 rounded-md bg-white shadow-sm shrink-0 h-fit"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                  
                  <span className="text-[11px] sm:text-[12px] text-muted">
                    {formatPrice(item.product.price, item.product.currency)} each
                  </span>
                  
                  <div className="flex items-center justify-between mt-1">
                    <div className="flex items-center border border-[#d8b88d]/40 rounded-md bg-white h-7 shadow-sm overflow-hidden">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.key, item.quantity - 1)}
                        className="w-7 h-full text-ink hover:bg-gray-50 transition-colors flex items-center justify-center border-r border-[#d8b88d]/20"
                      >
                        <Minus size={10} strokeWidth={2.5} />
                      </button>
                      <span className="w-8 text-[12px] font-bold text-center h-full flex items-center justify-center">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.key, item.quantity + 1)}
                        className="w-7 h-full text-ink hover:bg-gray-50 transition-colors flex items-center justify-center border-l border-[#d8b88d]/20"
                      >
                        <Plus size={10} strokeWidth={2.5} />
                      </button>
                    </div>
                    
                    <span className="text-[14px] font-bold text-ink">
                      {formatPrice(item.product.price * item.quantity, item.product.currency)}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          {/* Progress Bar */}
          <div className="bg-[#fdfaf5] border border-[#d8b88d]/30 rounded-xl p-4 sm:p-5 mt-2 shadow-sm">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-8 h-8 rounded-full bg-[#a27b53]/10 text-[#a27b53] flex items-center justify-center shrink-0">
                <Truck size={16} strokeWidth={2} />
              </div>
              {progressPercentage < 100 ? (
                <p className="text-[12px] text-ink font-medium leading-snug">
                  Add <span className="font-bold">₹{amountNeeded.toLocaleString()}</span> more to get <span className="font-bold text-[#a27b53]">FREE Shipping!</span>
                </p>
              ) : (
                <p className="text-[12px] text-ink font-medium leading-snug">
                  Congratulations! You've unlocked <span className="font-bold text-[#a27b53]">FREE Shipping!</span>
                </p>
              )}
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex-1 h-1.5 bg-[#f0ebe1] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[#a27b53] rounded-full transition-all duration-1000 ease-out" 
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
              <span className="text-[10px] font-bold text-muted shrink-0">₹2,000</span>
            </div>
          </div>

          <div className="border-t border-[#d8b88d]/20 pt-5 flex flex-col gap-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted text-[13px]">Subtotal ({itemCount} {itemCount === 1 ? 'item' : 'items'})</span>
              <span className="text-ink font-medium text-[14px]">{formatPrice(subtotal)}</span>
            </div>
            {appliedCode && couponDiscount != null && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted text-[13px]">Discount ({appliedCode})</span>
                <span className="text-[#2e7d32] font-medium text-[14px]">-{formatPrice(couponDiscount)}</span>
              </div>
            )}
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted text-[13px]">Shipping</span>
              <span className="text-ink text-[13px]">Calculated at checkout</span>
            </div>
          </div>

          <div className="border-t border-[#d8b88d]/20 pt-5 flex flex-col gap-5">
            <div className="flex justify-between items-end">
              <span className="font-bold text-ink text-[16px]">Estimated Total</span>
              <span className="font-display text-2xl text-ink font-bold">{formatPrice(Math.max(0, subtotal - (couponDiscount ?? 0)))}</span>
            </div>
            
            <button
              onClick={handleSubmit}
              disabled={pending}
              className="flex items-center justify-center gap-2 w-full bg-[#2a2420] text-white  py-4 sm:py-4.5 text-[12px] font-bold tracking-[0.1em] hover:bg-[#1a1612] transition-all shadow-md active:scale-95 disabled:opacity-70 disabled:pointer-events-none"
            >
              <Lock size={15} />
              SECURE CHECKOUT
            </button>
            

          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
