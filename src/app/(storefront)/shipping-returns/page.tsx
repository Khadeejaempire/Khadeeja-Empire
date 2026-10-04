import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { Accordion } from "@/components/ui/Accordion";
import { getDataProvider } from "@/lib/data";
import { formatPrice } from "@/lib/utils";
import { Flower2, PackageCheck, HeadphonesIcon } from "lucide-react";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Shipping & Returns",
};

export const dynamic = "force-dynamic";

export default async function ShippingReturnsPage() {
  const rates = await getDataProvider().listShippingRates({ active: true });
  const rate = rates[0];
  const shippingCopy = rate
    ? `${rate.name} costs ${formatPrice(rate.amount)}${rate.freeAbove != null ? `, with complimentary shipping on orders above ${formatPrice(rate.freeAbove)}` : ""}. ${rate.codAvailable ? "Cash on delivery is available." : "Cash on delivery is not currently available."}`
    : "Available delivery options and charges are shown securely during checkout.";

  return (
    <div className="bg-[#fcfaf7] min-h-screen pb-16 md:pb-24">
      {/* Elegant Header */}
      <section className="relative w-full h-[30vh] min-h-[250px] md:h-[40vh] md:min-h-[350px] overflow-hidden flex items-center justify-center">
        {/* Subtle background image blurred */}
        <Image
          src="/assets/images/3931104797681236517.jpg"
          alt="Shipping and Returns"
          fill
          sizes="100vw"
          className="object-cover object-center opacity-40 mix-blend-multiply blur-sm"
          priority
        />
        <div className="absolute inset-0 bg-[#fcfaf7]/85 backdrop-blur-[2px]" />

        <Container className="relative z-10 text-center flex flex-col items-center px-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-6 md:w-8 h-[2px] bg-[#d8b88d]" />
            <span className="text-[10px] md:text-[11px] font-bold uppercase tracking-[0.2em] text-[#d8b88d]">
              SUPPORT
            </span>
            <div className="w-6 md:w-8 h-[2px] bg-[#d8b88d]" />
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-display font-medium leading-[1.1] text-ink mb-4">
            Shipping &{" "}
            <span className="text-[#d8b88d] italic font-serif">Returns</span>
          </h1>

          <p className="text-[13px] sm:text-sm md:text-base text-muted max-w-md mx-auto">
            Current delivery guidance, return policies, and garment care
            information.
          </p>
        </Container>
      </section>

      {/* Main Content Area */}
      <section className="relative z-20 -mt-10 md:-mt-16 px-4">
        <Container className="px-0 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-[#d8b88d]/30 max-w-4xl mx-auto overflow-hidden">
            {/* Top Contact/Info Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-[#d8b88d]/20 border-b border-[#d8b88d]/20 bg-[#fcfaf7]/50">
              <div className="flex flex-col sm:flex-row items-center text-center sm:text-left gap-3 md:gap-4 py-5 px-6">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-[#fdf5e6] flex items-center justify-center text-[#d8b88d] shrink-0">
                  <PackageCheck
                    className="w-5 h-5 md:w-5 md:h-5"
                    strokeWidth={1.5}
                  />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-ink text-[14px]">
                    Fast & Reliable
                  </span>
                  <span className="text-[12px] text-muted mt-0.5">
                    Pan-India Delivery
                  </span>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-center text-center sm:text-left gap-3 md:gap-4 py-5 px-6">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-[#fdf5e6] flex items-center justify-center text-[#d8b88d] shrink-0">
                  <HeadphonesIcon
                    className="w-5 h-5 md:w-5 md:h-5"
                    strokeWidth={1.5}
                  />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-ink text-[14px]">
                    Need Help?
                  </span>
                  <span className="text-[12px] text-muted mt-0.5">
                    Contact our support team
                  </span>
                </div>
              </div>
            </div>

            {/* Accordion Content */}
            <div className="px-5 py-8 sm:px-8 md:p-12">


              <div className="w-full">
                <Accordion
                  items={[
                    {
                      title: "Shipping & Delivery",
                      content: (
                        <div className="pt-2 pb-4 text-[13px] md:text-[15px] leading-relaxed text-muted">
                          <p className="mb-3">{shippingCopy}</p>
                          <p>
                            All orders are processed and dispatched from our
                            studio in Banaras. You will receive a tracking link
                            via email once your order has been shipped.
                          </p>
                        </div>
                      ),
                      defaultOpen: true,
                    },
                    {
                      title: "Returns & Exchanges",
                      content: (
                        <div className="pt-2 pb-4 text-[13px] md:text-[15px] leading-relaxed text-muted">
                          <p className="mb-3">
                            We want you to love every piece from Khadeeja
                            Empire. If you are not completely satisfied, we
                            accept returns and exchanges within 7 days of
                            delivery.
                          </p>
                          <p>
                            To be eligible for a return, your item must be
                            unused, with tags attached, and in its original
                            packaging. Please reach out via our contact page to
                            initiate a return request.
                          </p>
                        </div>
                      ),
                    },
                    {
                      title: "Care Instructions",
                      content: (
                        <div className="pt-2 pb-4 text-[13px] md:text-[15px] leading-relaxed text-muted">
                          <p className="mb-3">
                            To preserve the exquisite quality of your garments,
                            we highly recommend gentle hand washing or
                            professional dry cleaning, especially for
                            embroidered pieces.
                          </p>
                          <p>
                            Avoid direct sunlight while drying to maintain the
                            vibrancy of the colors.
                          </p>
                        </div>
                      ),
                    },
                    {
                      title: "Sizing & Fit",
                      content: (
                        <div className="pt-2 pb-4 text-[13px] md:text-[15px] leading-relaxed text-muted">
                          <p className="mb-3">
                            Our sizes range from XS to XL, designed to flatter a
                            variety of body shapes.
                          </p>
                          <p>
                            For detailed measurements and personalized fit
                            guidance, please refer to the size chart on each
                            product page or contact us directly. We&apos;re happy to
                            help you find your perfect fit.
                          </p>
                        </div>
                      ),
                    },
                  ]}
                />
              </div>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}
