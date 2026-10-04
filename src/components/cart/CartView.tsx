"use client";

import Link from "next/link";
import Image from "next/image";
import { Minus, Plus, ShoppingBag, Trash2, ArrowRight, Truck, RefreshCcw, Award, ShieldCheck, Heart, Lock, Receipt } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { formatPrice } from "@/lib/utils";

export function CartView() {
  const { items, subtotal, itemCount, removeItem, updateQuantity, isHydrated, clearCart } = useCart();

  const freeShippingThreshold = 2000;
  const progressPercentage = Math.min((subtotal / freeShippingThreshold) * 100, 100);
  const amountNeeded = Math.max(0, freeShippingThreshold - subtotal);

  if (!isHydrated) {
    return <div className="min-h-[40vh] flex items-center justify-center text-muted">Loading your bag…</div>;
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 md:py-20 px-6 bg-gradient-to-b from-white to-[#fcfaf7] rounded-3xl shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-[#d8b88d]/15 max-w-3xl mx-auto mt-4">
        <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-white shadow-sm border border-[#d8b88d]/20 flex items-center justify-center text-[#d8b88d] mb-6 md:mb-8">
          <ShoppingBag className="w-8 h-8 md:w-10 md:h-10" strokeWidth={1} />
        </div>
        <h2 className="text-2xl md:text-3xl font-display font-medium text-ink mb-3 text-center">Your bag is empty</h2>
        <p className="text-muted text-sm md:text-base text-center max-w-sm mb-6 md:mb-8">
          Discover our latest collections and find something you love.
        </p>
        <Link
          href="/shop"
          className="inline-flex items-center justify-center px-8 py-3.5 rounded-full bg-[#a27b53] text-white font-semibold text-[12px] md:text-[13px] tracking-[0.1em] uppercase hover:bg-[#8b6845] hover:shadow-xl hover:-translate-y-0.5 transition-all active:scale-95 shadow-lg shadow-[#a27b53]/20"
        >
          Explore Shop
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="grid lg:grid-cols-12 gap-6 lg:gap-8 items-start max-w-[1400px] mx-auto">
        {/* Left Column */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-6">
          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-[#d8b88d]/20">
            <div className="flex items-center justify-between pb-4 border-b border-[#d8b88d]/20 mb-2">
              <h2 className="text-lg md:text-xl font-display font-medium text-ink flex items-center gap-3">
                <ShoppingBag className="text-[#a27b53]" size={20} />
                Your Items
              </h2>
              <span className="text-sm font-medium text-ink bg-[#fdfaf5] px-4 py-1.5 rounded-full border border-[#d8b88d]/30">
                {itemCount} {itemCount === 1 ? 'item' : 'items'}
              </span>
            </div>
            
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 pt-2">
              {items.map((item) => (
                <li key={item.key} className="flex gap-4 sm:gap-5 p-4 sm:p-5 border border-[#d8b88d]/20 rounded-2xl bg-white shadow-sm hover:shadow-md transition-all">
                  <Link
                    href={`/products/${item.product.slug}`}
                    className="relative w-[80px] h-[100px] sm:w-[110px] sm:h-[130px] flex-shrink-0 overflow-hidden bg-surface rounded-xl border border-[#d8b88d]/20 group"
                  >
                    <Image
                      src={item.product.images[0]}
                      alt={item.product.name}
                      fill
                      sizes="(max-width: 640px) 80px, 110px"
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </Link>
                  
                  <div className="flex flex-col flex-1 min-w-0 py-1">
                    <div className="flex items-start justify-between gap-4 mb-1">
                      <Link
                        href={`/products/${item.product.slug}`}
                        title={item.product.name}
                        className="font-display text-lg md:text-xl font-medium text-ink hover:text-[#a27b53] transition-colors leading-tight line-clamp-2 pr-2"
                      >
                        {item.product.name.length > 40 ? `${item.product.name.substring(0, 40)}...` : item.product.name}
                      </Link>
                      <button
                        onClick={() => removeItem(item.key)}
                        aria-label={`Remove ${item.product.name}`}
                        className="text-muted hover:text-red-500 transition-colors flex-shrink-0 p-2 sm:p-2.5 border border-[#d8b88d]/30 rounded-lg bg-white shadow-sm active:scale-95 group/btn"
                      >
                        <Trash2 size={16} className="group-hover/btn:scale-110 transition-transform" />
                      </button>
                    </div>
                    
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-[13px] sm:text-[14px] text-muted">Size: <span className="text-ink">{item.size}</span></span>
                      <span className="flex items-center gap-1.5 text-[11px] sm:text-[12px] font-medium text-[#2e7d32] bg-[#edf7ed] px-2.5 py-0.5 rounded-md border border-[#c8e6c9]">
                        <span className="w-1.5 h-1.5 bg-[#2e7d32] rounded-full"></span>
                        In Stock
                      </span>
                    </div>
                    
                    <span className="text-base sm:text-lg font-bold text-ink mb-2 sm:mb-3">
                      {formatPrice(item.product.price, item.product.currency)}
                    </span>
                    
                    <div className="flex items-center gap-4 mt-auto">
                      <div className="flex items-center border border-[#d8b88d]/40 rounded-md w-fit bg-[#fdfaf5] h-8 sm:h-9 shadow-sm overflow-hidden">
                        <button
                          onClick={() => updateQuantity(item.key, item.quantity - 1)}
                          aria-label="Decrease quantity"
                          className="w-8 sm:w-9 h-full text-ink hover:bg-white hover:text-[#a27b53] transition-colors flex items-center justify-center active:bg-gray-100 border-r border-[#d8b88d]/20"
                        >
                          <Minus size={12} strokeWidth={2.5} />
                        </button>
                        <span className="w-8 sm:w-10 text-[13px] sm:text-[14px] font-bold text-center bg-white h-full flex items-center justify-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.key, item.quantity + 1)}
                          aria-label="Increase quantity"
                          className="w-8 sm:w-9 h-full text-ink hover:bg-white hover:text-[#a27b53] transition-colors flex items-center justify-center active:bg-gray-100 border-l border-[#d8b88d]/20"
                        >
                          <Plus size={12} strokeWidth={2.5} />
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            {/* Trust Badges */}
            <div className="mt-8 pt-6 border-t border-[#d8b88d]/20">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-[#fdfaf5] rounded-xl p-4 sm:p-6 border border-[#d8b88d]/30">
                <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-3 p-2">
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#a27b53] border border-[#d8b88d]/20 shrink-0 shadow-sm">
                    <Truck size={18} strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="text-[13px] font-bold text-ink">Free Shipping</p>
                    <p className="text-[11px] text-muted leading-tight mt-1">On orders above ₹2,000</p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-3 p-2">
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#a27b53] border border-[#d8b88d]/20 shrink-0 shadow-sm">
                    <RefreshCcw size={18} strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="text-[13px] font-bold text-ink">Easy Returns</p>
                    <p className="text-[11px] text-muted leading-tight mt-1">Hassle-free returns</p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-3 p-2">
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#a27b53] border border-[#d8b88d]/20 shrink-0 shadow-sm">
                    <Award size={18} strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="text-[13px] font-bold text-ink">Premium Quality</p>
                    <p className="text-[11px] text-muted leading-tight mt-1">Handpicked for you</p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-3 p-2">
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#a27b53] border border-[#d8b88d]/20 shrink-0 shadow-sm">
                    <ShieldCheck size={18} strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="text-[13px] font-bold text-ink">Secure Payment</p>
                    <p className="text-[11px] text-muted leading-tight mt-1">100% safe & secure</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Order Summary */}
        <div className="lg:col-span-5 xl:col-span-4">
          <div className="bg-white border border-[#d8b88d]/20 rounded-2xl p-6 sm:p-8 flex flex-col gap-6 sticky top-24 shadow-sm">
            <h2 className="text-xl font-display font-medium text-ink pb-4 border-b border-[#d8b88d]/20 flex items-center gap-3">
              <Receipt className="text-[#a27b53]" size={20} />
              Order Summary
            </h2>
            
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted text-[15px]">Subtotal ({itemCount} {itemCount === 1 ? 'item' : 'items'})</span>
                <span className="text-ink font-medium text-[16px]">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted text-[15px]">Shipping</span>
                <span className="text-ink text-[14px]">Calculated at checkout</span>
              </div>
            </div>

            <div className="border-t border-[#d8b88d]/20 pt-5 flex flex-col gap-2">
              <div className="flex justify-between items-end mb-6">
                <span className="font-bold text-ink text-[17px]">Total</span>
                <span className="font-display text-2xl text-ink font-bold">{formatPrice(subtotal)}</span>
              </div>

              {/* Progress Bar */}
              <div className="bg-[#fdfaf5] border border-[#d8b88d]/30 rounded-xl p-4 sm:p-5 mb-6 shadow-sm">
                <div className="flex items-start gap-4 mb-4">
                  <div className="text-[#a27b53] mt-0.5 shrink-0">
                    <Truck size={20} strokeWidth={1.5} />
                  </div>
                  {progressPercentage < 100 ? (
                    <p className="text-[13px] text-ink font-medium leading-snug">
                      Add <span className="font-bold">₹{amountNeeded.toLocaleString()}</span> more to get <span className="font-bold text-[#a27b53]">FREE Shipping!</span>
                    </p>
                  ) : (
                    <p className="text-[13px] text-ink font-medium leading-snug">
                      Congratulations! You&apos;ve unlocked <span className="font-bold text-[#a27b53]">FREE Shipping!</span>
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
                  <span className="text-[11px] font-bold text-muted shrink-0">₹2,000</span>
                </div>
              </div>
              
              <Link
                href="/checkout"
                className="flex items-center justify-center gap-2 w-full bg-[#a27b53] text-white rounded-xl py-4 sm:py-4.5 text-[12px] font-bold tracking-[0.1em] hover:bg-[#8b6845] transition-all shadow-md active:scale-95 hover:shadow-lg hover:-translate-y-0.5"
              >
                <Lock size={15} />
                SECURE CHECKOUT
              </Link>
              
              <div className="flex items-center gap-4 my-3">
                <div className="flex-1 h-[1px] bg-[#d8b88d]/30" />
                <span className="text-[11px] text-muted lowercase">or</span>
                <div className="flex-1 h-[1px] bg-[#d8b88d]/30" />
              </div>

              <Link 
                href="/shop" 
                className="flex items-center justify-center gap-2 w-full bg-transparent border border-[#d8b88d]/50 text-ink rounded-xl py-4 sm:py-4.5 text-[12px] font-bold tracking-[0.1em] hover:bg-[#fcfaf7] transition-all"
              >
                <ShoppingBag size={15} />
                CONTINUE SHOPPING
              </Link>

              <div className="flex items-center justify-center gap-1.5 mt-5 text-muted">
                <ShieldCheck size={14} />
                <span className="text-[11px]">Your data is protected and encrypted</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Banner */}
      <div className="max-w-[1400px] mx-auto mt-8 sm:mt-12">
        <div className="bg-[#fdfaf5] border border-[#d8b88d]/30 rounded-2xl p-6 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-6 md:gap-10 shadow-sm">
          <div className="flex items-center gap-6">
            <div className="text-[#a27b53] opacity-60">
              <Heart size={48} strokeWidth={1} />
            </div>
            <div>
              <h3 className="text-xl md:text-2xl font-display font-medium text-ink mb-1">Don&apos;t see what you love?</h3>
              <p className="text-sm text-muted">Explore more styles and find your next favorite.</p>
            </div>
          </div>
          <Link
            href="/shop"
            className="flex items-center justify-center px-8 py-4 bg-[#a27b53] text-white rounded-xl text-[12px] font-bold tracking-[0.1em] uppercase hover:bg-[#8b6845] hover:shadow-xl hover:-translate-y-0.5 transition-all active:scale-95 shrink-0"
          >
            SHOP NEW ARRIVALS
          </Link>
        </div>
      </div>
    </>
  );
}
