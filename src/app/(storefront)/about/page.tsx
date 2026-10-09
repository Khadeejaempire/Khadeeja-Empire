import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Flower2,
  Gem,
  HeartHandshake,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { Container } from "@/components/ui/Container";

export const metadata: Metadata = {
  title: "Our Story",
  description:
    "Discover Khadeeja Empire's celebration of Indian handloom, thoughtfully curated traditional textiles, and timeless craftsmanship.",
};

type PromiseItem = {
  title: string;
  description: string;
  Icon: LucideIcon;
};

const promises: PromiseItem[] = [
  {
    title: "Authenticity First",
    description:
      "Honest product representation, with clear descriptions and considered imagery so you can shop with confidence.",
    Icon: BadgeCheck,
  },
  {
    title: "Quality You Can Feel",
    description:
      "Every piece is selected with close attention to its fabric, texture, design, drape, and overall appeal.",
    Icon: Gem,
  },
  {
    title: "Tradition Meets Elegance",
    description:
      "From timeless weaves to refined styles for modern wardrobes, our collection keeps Indian craft at its heart.",
    Icon: Sparkles,
  },
  {
    title: "Your Trust Matters",
    description:
      "We aim to make every step, from discovering a piece to receiving it, transparent, comfortable, and reliable.",
    Icon: HeartHandshake,
  },
];

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[#fcfaf7] pb-16 md:pb-24">
      <section className="relative h-[52vh] min-h-[460px] w-full overflow-hidden md:h-[62vh] md:min-h-[560px]">
        <Image
          src="/assets/images/Vibrant Traditional Handloom Workshop.png"
          alt="A traditional handloom workshop with vibrant threads prepared for weaving"
          fill
          sizes="100vw"
          className="object-cover object-[center_58%]"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#26150f]/95 via-[#26150f]/65 to-[#26150f]/10" />

        <Container className="relative flex h-full items-center">
          <div className="max-w-3xl text-white">
            <div className="mb-6 flex items-center gap-3">
              <div className="h-px w-9 bg-[#d8b88d]" />
              <span className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#e6c79e]">
                Our Story
              </span>
            </div>

            <h1 className="mb-6 font-display text-[42px] font-medium leading-[1.08] sm:text-5xl md:text-6xl lg:text-7xl">
              Woven with Tradition.
              <br />
              <span className="font-serif italic text-[#e6c79e]">Made with Love.</span>
            </h1>

            <p className="max-w-2xl text-base font-light leading-relaxed text-white/90 sm:text-lg md:text-xl">
              Every fabric has a story to tell, and every weave carries a piece of India’s rich
              heritage.
            </p>

            <div className="mt-8 flex items-center gap-3" aria-hidden="true">
              <div className="h-px w-16 bg-[#d8b88d]/60" />
              <Flower2 className="h-5 w-5 text-[#e6c79e]" strokeWidth={1.5} />
              <div className="h-px w-16 bg-[#d8b88d]/60" />
            </div>
          </div>
        </Container>
      </section>

      <section className="py-14 md:py-24">
        <Container>
          <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-20">
            <div className="mx-auto flex max-w-2xl flex-col text-center lg:mx-0 lg:text-left">
              <span className="mb-4 text-[10px] font-bold uppercase tracking-[0.24em] text-[#a27b53] sm:text-[11px]">
                The Khadeeja Empire Journey
              </span>

              <h2 className="mb-6 font-display text-3xl font-bold leading-[1.18] text-ink sm:text-4xl md:text-[46px]">
                A story told in
                <br className="hidden sm:block" /> every beautiful weave.
              </h2>

              <div className="mb-8 flex items-center justify-center gap-3 lg:justify-start" aria-hidden="true">
                <div className="h-px w-12 bg-[#d8b88d]/50" />
                <Flower2 className="h-5 w-5 text-[#c39a68]" strokeWidth={1.5} />
                <div className="h-px w-12 bg-[#d8b88d]/50" />
              </div>

              <div className="flex flex-col gap-6 text-[14px] leading-[1.9] text-muted md:text-[15px]">
                <p>
                  At Khadeeja Empire, our journey is inspired by the timeless beauty of Indian
                  handloom, the elegance of traditional craftsmanship, and a passion for bringing
                  meaningful fabrics closer to you.
                </p>
                <p>
                  Rooted in the cultural richness of Banaras, we celebrate the patient hands,
                  practiced skill, and creative spirit behind India’s weaving traditions. Each
                  textile is chosen not only for how it looks, but for the heritage and human touch
                  it carries.
                </p>
                <p>
                  Our thoughtfully curated collection brings together pure handloom sarees,
                  elegant suit fabrics, and premium traditional textiles—pieces made to bring grace
                  to everyday moments and meaning to special occasions.
                </p>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-[520px] lg:ml-auto">
              <div className="relative aspect-[4/5] w-full overflow-hidden rounded-t-full rounded-b-2xl border-[6px] border-white bg-surface shadow-xl">
                <Image
                  src="/assets/images/Golden Threads on a Traditional Handloom.png"
                  alt="Golden and magenta threads being woven on a traditional wooden handloom"
                  fill
                  sizes="(max-width: 1024px) 100vw, 45vw"
                  className="object-cover object-center"
                />
              </div>

              <div className="absolute -bottom-7 -left-3 hidden h-36 w-36 flex-col items-center justify-center rounded-full border border-[#d8b88d]/40 bg-[#fdfaf5] p-5 text-center shadow-xl sm:flex md:-left-10 md:h-40 md:w-40">
                <Flower2 className="mb-3 h-6 w-6 text-[#b98d5d]" strokeWidth={1.5} />
                <span className="text-[8px] font-bold uppercase leading-loose tracking-[0.2em] text-ink">
                  Rooted in Craft
                  <br />
                  Chosen with Care
                  <br />
                  Made Meaningful
                </span>
              </div>
            </div>
          </div>
        </Container>
      </section>

      <section className="bg-[#f5eee5] py-16 md:py-24">
        <Container>
          <div className="mx-auto mb-10 max-w-2xl text-center md:mb-14">
            <span className="mb-4 block text-[10px] font-bold uppercase tracking-[0.24em] text-[#a27b53] sm:text-[11px]">
              Our Promise to You
            </span>
            <h2 className="font-display text-3xl font-bold text-ink sm:text-4xl md:text-[44px]">
              Chosen with care. Shared with honesty.
            </h2>
          </div>

          <div className="mx-auto grid max-w-7xl grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {promises.map(({ title, description, Icon }, index) => (
              <article
                key={title}
                className="group rounded-2xl border border-[#d8b88d]/20 bg-white p-7 text-center shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-md md:p-8"
              >
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-[#d8b88d]/30 bg-[#fcfaf7] text-[#a27b53] transition-colors group-hover:bg-[#a27b53] group-hover:text-white">
                  <Icon className="h-7 w-7" strokeWidth={1.5} />
                </div>
                <span className="mb-2 block font-display text-lg font-bold italic text-[#c39a68]">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="mb-3 font-display text-xl font-bold text-ink">{title}</h3>
                <p className="text-[13px] leading-relaxed text-muted md:text-[14px]">{description}</p>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <section className="py-14 md:py-24">
        <Container>
          <div className="relative mx-auto max-w-7xl overflow-hidden rounded-2xl bg-[#342019] px-6 py-14 text-center text-white shadow-xl sm:px-10 md:py-20">
            <div
              className="absolute inset-0 opacity-[0.08]"
              style={{
                backgroundImage:
                  "radial-gradient(circle at center, #e6c79e 1px, transparent 1px)",
                backgroundSize: "22px 22px",
              }}
            />

            <div className="relative mx-auto max-w-3xl">
              <Flower2 className="mx-auto mb-6 h-8 w-8 text-[#e6c79e]" strokeWidth={1.25} />
              <span className="mb-4 block text-[10px] font-bold uppercase tracking-[0.24em] text-[#e6c79e] sm:text-[11px]">
                More Than Fabric, It’s Our Heritage
              </span>
              <h2 className="mb-6 font-display text-3xl font-medium leading-tight sm:text-4xl md:text-5xl">
                Celebrating Indian Handloom,
                <br />
                <span className="font-serif italic text-[#e6c79e]">one weave at a time.</span>
              </h2>
              <p className="mx-auto mb-5 max-w-2xl text-sm leading-relaxed text-white/75 md:text-base">
                For us, handloom is more than a product. It represents tradition, creativity,
                craftsmanship, and the enduring beauty of Indian culture.
              </p>
              <p className="mx-auto mb-8 max-w-2xl text-sm leading-relaxed text-white/75 md:text-base">
                Our vision is to help you discover fabrics that make every occasion special and
                every purchase meaningful. Thank you for being a part of our journey.
              </p>
              <p className="mb-8 font-serif text-lg italic text-[#e6c79e]">
                With love, Team Khadeeja Empire
              </p>

              <Link
                href="/shop"
                className="group inline-flex items-center gap-3 rounded bg-[#b1875e] px-8 py-3.5 text-[12px] font-bold uppercase tracking-[0.15em] text-white shadow-md transition hover:bg-[#c69a6b] hover:shadow-lg active:scale-95 md:px-10 md:py-4 md:text-[13px]"
              >
                Explore Our Collections
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}
