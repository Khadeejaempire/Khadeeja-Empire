import type { Metadata } from "next";
import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { ArrowRight, Flower2 } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Our Story",
  description: "The story of Khadeeja Empire — authentic Banarasi handloom sarees, handwoven in Banaras.",
};

export default function AboutPage() {
  return (
    <div className="bg-[#fcfaf7] min-h-screen pb-16 md:pb-24">
      {/* Hero Section */}
      <section className="relative w-full h-[45vh] min-h-[380px] md:h-[55vh] md:min-h-[450px] overflow-hidden">
        <Image
          src="/assets/images/3912472252555175961.jpg"
          alt="Khadeeja Empire Banarasi handloom saree craftsmanship"
          fill
          sizes="100vw"
          className="object-cover object-[center]"
          priority
        />
        {/* Dark Gradient Overlay for text readability on left side */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
        
        <Container className="relative h-full flex flex-col justify-center">
          <div className="max-w-2xl text-white">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-[2px] bg-[#d8b88d]" />
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#d8b88d]">OUR STORY</span>
            </div>
            
            <h1 className="text-[40px] sm:text-5xl md:text-6xl lg:text-7xl font-display font-medium leading-[1.1] mb-6">
              Woven in Banaras.<br />
              Draped with <span className="text-[#d8b88d] italic font-serif">Pride.</span>
            </h1>

            <p className="text-base sm:text-lg md:text-xl text-white/90 font-light mb-8">
              Handloom silk sarees, handwoven thread by thread — a craft passed down through generations.
            </p>

            <div className="flex items-center gap-3">
              <div className="w-16 h-[1px] bg-[#d8b88d]/50" />
              <Flower2 className="w-5 h-5 text-[#d8b88d]" />
              <div className="w-16 h-[1px] bg-[#d8b88d]/50" />
            </div>
          </div>
        </Container>
      </section>

      {/* Main Content Section */}
      <section className="pt-12 md:pt-20 relative z-10">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center max-w-7xl mx-auto">
            
            {/* Left Content */}
            <div className="flex flex-col max-w-xl mx-auto lg:mx-0 text-center lg:text-left">
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.2em] text-[#d8b88d] mb-4">
                KHADEEJA EMPIRE
              </span>
              
              <h2 className="text-3xl sm:text-4xl md:text-[44px] leading-[1.2] md:leading-[1.15] font-display font-bold text-ink mb-6">
                Rooted in the handlooms<br className="hidden sm:block" />
                of Banaras. Woven for<br className="hidden sm:block" />
                the way women drape today.
              </h2>

              <div className="flex items-center justify-center lg:justify-start gap-3 mb-8">
                <div className="w-12 h-[1px] bg-[#d8b88d]/40" />
                <Flower2 className="w-5 h-5 text-[#d8b88d]" />
                <div className="w-12 h-[1px] bg-[#d8b88d]/40" />
              </div>

              <div className="flex flex-col gap-6 text-[14px] md:text-[15px] text-muted leading-[1.8]">
                <p>
                  Khadeeja Empire brings you authentic Banarasi handloom sarees, handwoven by
                  master weavers in the heart of Banaras. Every saree carries a legacy of
                  craftsmanship passed down through generations of artisans.
                </p>
                <p>
                  From pure silk and tissue handloom to dupion silk weaves, each saree is adorned
                  with intricate gold zari work, traditional buttis, and heritage-inspired borders
                  — woven on the loom, never printed.
                </p>
                <p>
                  We believe a handloom saree is more than fabric — it is a story of patience,
                  skill, and heritage. Every drape from Khadeeja Empire is a tribute to the
                  timeless art of Banarasi weaving.
                </p>
              </div>
            </div>

            {/* Right Image (Arch) */}
            <div className="relative w-full max-w-[450px] mx-auto lg:ml-auto">
              {/* Arch Image Container */}
              <div className="relative aspect-[3/4] w-full overflow-hidden rounded-t-full rounded-b-xl border-[6px] border-white shadow-xl bg-surface">
                <Image
                  src="/assets/images/3931104797681236517.jpg" // Using an elegant existing image
                  alt="Banarasi handloom saree weaving details"
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>

              {/* Floating Circular Badge */}
              <div className="absolute top-1/4 -right-4 sm:-right-10 w-32 h-32 md:w-40 md:h-40 rounded-full bg-[#fdfaf5] border border-[#d8b88d]/30 shadow-xl flex flex-col items-center justify-center p-4 text-center z-10 hidden sm:flex">
                <Flower2 className="w-6 h-6 text-[#d8b88d] mb-2 md:mb-3" strokeWidth={1.5} />
                <span className="text-[7px] md:text-[8px] font-bold uppercase tracking-[0.2em] text-ink leading-loose">
                  HANDLOOM<br/>WOVEN<br/><br/>BANARASI<br/>HERITAGE
                </span>
              </div>
            </div>

          </div>

          {/* Features Box Below */}
          <div className="mt-12 md:mt-16 bg-white rounded-xl md:rounded-2xl shadow-sm py-5 px-4 md:py-6 md:px-8 w-full max-w-7xl xl:max-w-[1360px] mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 sm:gap-6 md:gap-8 divide-y sm:divide-y-0 sm:divide-x divide-[#d8b88d]/20 py-6">
              
              {/* Feature 1 */}
              <div className="flex flex-col sm:flex-col lg:flex-row items-center text-center lg:text-left gap-4 lg:gap-6 pt-4 sm:pt-0 sm:px-4">
                <div className="w-14 h-14 md:w-16 md:h-16 shrink-0 rounded-full bg-[#fcfaf7] border border-[#d8b88d]/30 flex items-center justify-center text-[#d8b88d]">
                  <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M7 4l-2 5l1.5 1.5L6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2l-.5-8.5L19 9l-2-5H7z"/><path d="M9 11h6"/></svg>
                </div>
                <div className="flex flex-col items-center lg:items-start">
                  <span className="text-[#d8b88d] font-display text-lg md:text-xl font-bold italic mb-0.5 block">01</span>
                  <h4 className="font-display font-bold text-ink text-[16px] md:text-[18px] mb-1.5 leading-tight">Pure Handloom Silk</h4>
                  <p className="text-[12px] md:text-[13px] text-muted leading-relaxed">Authentic Banarasi silk, handwoven on traditional looms.</p>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="flex flex-col sm:flex-col lg:flex-row items-center text-center lg:text-left gap-4 lg:gap-6 pt-10 sm:pt-0 sm:px-4">
                <div className="w-14 h-14 md:w-16 md:h-16 shrink-0 rounded-full bg-[#fcfaf7] border border-[#d8b88d]/30 flex items-center justify-center text-[#d8b88d]">
                  <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 9.5L9.5 14.5"/><path d="M12 2l4 4l-9 9l-4-4l9-9z"/><circle cx="16" cy="18" r="3"/></svg>
                </div>
                <div className="flex flex-col items-center lg:items-start">
                  <span className="text-[#d8b88d] font-display text-lg md:text-xl font-bold italic mb-0.5 block">02</span>
                  <h4 className="font-display font-bold text-ink text-[16px] md:text-[18px] mb-1.5 leading-tight">Zari Craftsmanship</h4>
                  <p className="text-[12px] md:text-[13px] text-muted leading-relaxed">Intricate gold zari work, woven with hand-tied precision.</p>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="flex flex-col sm:flex-col lg:flex-row items-center text-center lg:text-left gap-4 lg:gap-6 pt-10 sm:pt-0 sm:px-4">
                <div className="w-14 h-14 md:w-16 md:h-16 shrink-0 rounded-full bg-[#fcfaf7] border border-[#d8b88d]/30 flex items-center justify-center text-[#d8b88d]">
                  <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 10v-3a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2c0 .8.5 1.5 1.2 1.8"/><path d="M12 10l-9 6.5A1 1 0 0 0 3.5 18h17a1 1 0 0 0 .5-1.5L12 10z"/></svg>
                </div>
                <div className="flex flex-col items-center lg:items-start">
                  <span className="text-[#d8b88d] font-display text-lg md:text-xl font-bold italic mb-0.5 block">03</span>
                  <h4 className="font-display font-bold text-ink text-[16px] md:text-[18px] mb-1.5 leading-tight">Timeless Drape</h4>
                  <p className="text-[12px] md:text-[13px] text-muted leading-relaxed">Every saree, an heirloom for today and generations to come.</p>
                </div>
              </div>

            </div>
          </div>

          {/* Explore Button */}
          <div className="mt-12 text-center pb-8">
            <Link
              href="/shop"
              className="inline-flex items-center gap-3 px-8 md:px-10 py-3.5 md:py-4 rounded bg-[#a27b53] text-white text-[12px] md:text-[13px] font-bold uppercase tracking-[0.15em] hover:bg-[#8e6844] transition-all shadow-md hover:shadow-lg active:scale-95 group"
            >
              Explore Our Collections
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </Container>
      </section>
    </div>
  );
}
