"use client";

import Link from "next/link";
import { ArrowRight, Sparkle, Gem, Truck, RefreshCcw, ShieldCheck } from "lucide-react";
import { Container } from "@/components/ui/Container";

export function ExclusiveDeals() {
  return (
    <section className="bg-surface py-12 md:py-20 relative overflow-hidden">
      {/* Background radial gradient to give a soft glow effect similar to the image */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[radial-gradient(circle,_var(--tw-gradient-stops))] from-accent/10 via-surface/0 to-transparent opacity-70 pointer-events-none" />

      <Container className="relative z-10">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 md:mb-28 gap-6 md:gap-4">
          <div className="flex flex-col items-center md:items-start text-center md:text-left mx-auto md:mx-0 max-w-2xl">
            <div className="flex items-center gap-2 mb-4">
              <Sparkle className="w-3.5 h-3.5 text-accent fill-accent md:hidden" />
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-accent">
                EXCLUSIVE DEALS
              </span>
              <Sparkle className="w-3.5 h-3.5 text-accent fill-accent md:hidden" />
            </div>

            <h2 className="text-3xl md:text-[40px] md:leading-[44px] font-display font-medium text-ink mb-3 md:mb-4">
              Great Styles, Greater Prices
            </h2>

            <p className="text-sm md:text-base text-muted">
              Handpicked collection at unbeatable prices. Limited time offer!
            </p>
          </div>

          <div className="flex flex-col md:flex-row items-center md:justify-end shrink-0 gap-4">
            <Link
              href="/shop"
              className="inline-flex items-center gap-3 px-6 py-2.5 rounded-full bg-surface border border-[#0A1129] shadow-md text-xs font-semibold uppercase tracking-[0.18em] text-ink hover:border-[#0A1129] hover:bg-[#0A1129] hover:text-white transition-all duration-300 group hover:shadow-lg active:scale-95"
            >
              <span className="transition-colors duration-300 group-hover:text-white">Shop All Deals</span>
              <span className="w-6 h-6 rounded-full bg-[#0A1129] text-white group-hover:bg-white flex items-center justify-center transition-all duration-300 group-hover:translate-x-1">
                <ArrowRight className="w-3 h-3 text-white group-hover:text-[#0A1129] transition-colors duration-300" />
              </span>
            </Link>
          </div>
        </div>

        {/* Cards Section */}
        <div className="flex flex-wrap justify-center gap-4 sm:gap-6 md:gap-8 max-w-5xl mx-auto mb-12 md:mb-24 relative">
          
          {/* Floating Decorative Stars */}
          <Sparkle className="absolute -top-4 -left-4 md:-top-8 md:-left-8 w-6 h-6 md:w-8 md:h-8 text-accent fill-accent hidden md:block" />
          <Sparkle className="absolute top-1/2 -left-6 w-4 h-4 text-accent fill-accent hidden md:block" />
          <Sparkle className="absolute -bottom-8 left-[30%] w-8 h-8 text-accent fill-accent hidden md:block" />
          <Sparkle className="absolute -top-6 right-[30%] w-5 h-5 text-accent fill-accent hidden md:block" />
          <Sparkle className="absolute -bottom-4 -right-4 md:-bottom-8 md:-right-8 w-6 h-6 md:w-10 md:h-10 text-accent fill-accent hidden md:block" />
          <Sparkle className="absolute top-1/4 -right-6 w-4 h-4 text-accent fill-accent hidden md:block" />

          {/* Card 1 */}
          <DealCard price={10000} label="10k" />
          {/* Card 2 */}
          <DealCard price={20000} label="20k" />
          {/* Card 3 */}
          <DealCard price={30000} label="30k" />
        </div>

        {/* Features Bottom */}
        <div className="bg-[#fcfaf7] border border-[#d8b88d]/40 rounded-xl shadow-sm py-3 px-2 md:py-4 md:px-4 w-full max-w-7xl xl:max-w-[1360px] mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-y-6 gap-x-2 lg:gap-x-4 lg:divide-x lg:divide-[#d8b88d]/30">
            <FeatureItem 
              icon={Truck} 
              title="Free Shipping" 
              desc="On orders above ₹2,000" 
            />
            <FeatureItem 
              icon={Gem} 
              title="Premium Quality" 
              desc="Handpicked for you" 
            />
            <FeatureItem 
              icon={RefreshCcw} 
              title="Easy Returns" 
              desc="Hassle-free return" 
            />
            <FeatureItem 
              icon={ShieldCheck} 
              title="Secure Payment" 
              desc="100% safe & secure" 
            />
          </div>
        </div>
      </Container>
    </section>
  );
}

function DealCard({ price, label }: { price: number; label: string }) {
  return (
    <Link
      href={`/shop?price_under=${price}`}
      className="group relative block aspect-[4/5] sm:aspect-auto sm:h-[224px] md:h-[256px] w-[calc(50%-8px)] sm:w-full max-w-[224px] shrink-0 mx-auto"
    >
      {/* Outer Glow on hover */}
      <div className="absolute inset-0 bg-accent/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl" />
      
      {/* Card Body - imitating the double border from the image */}
      <div className="relative h-full w-full bg-[#fcf8f2] border-[3px] border-[#d8b88d] rounded-2xl p-2 md:p-2.5 transition-transform duration-300 group-hover:-translate-y-1">
        {/* Inner Border */}
        <div className="h-full w-full border-[1.5px] border-[#d8b88d] rounded-xl flex flex-col items-center justify-center p-3 md:p-4 text-center bg-gradient-to-b from-white/40 to-transparent">
          <span className="text-[10px] md:text-xs font-bold tracking-[0.15em] text-ink/80 mb-1 md:mb-1.5">UNDER</span>
          <div className="flex items-start justify-center">
            <span className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-ink leading-none">
              <span className="text-3xl md:text-4xl lg:text-5xl mr-1">₹</span>{label}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function FeatureItem({ icon: Icon, title, desc }: { icon: any, title: string, desc: string }) {
  return (
    <div className="flex flex-col lg:flex-row items-center text-center lg:text-left gap-2 lg:gap-4 px-1 lg:px-6 py-2">
      <div className="w-12 h-12 md:w-[60px] md:h-[60px] shrink-0 rounded-full bg-gradient-to-br from-white to-[#f4ebe1] shadow-[0_4px_12px_rgba(0,0,0,0.04)] border border-white flex items-center justify-center text-[#9b6c41]">
        <Icon className="w-5 h-5 md:w-7 md:h-7" strokeWidth={1.5} />
      </div>
      <div className="flex flex-col justify-center">
        <h4 className="font-display font-bold text-ink text-sm md:text-[17px] mb-0.5 leading-tight">{title}</h4>
        <p className="text-[10px] md:text-[13px] text-muted">{desc}</p>
      </div>
    </div>
  );
}
