import type { Metadata } from "next";
import { Cormorant_Garamond, DM_Sans } from "next/font/google";
import "@/styles/globals.css";
import { siteConfig } from "@/content/site";
import NextTopLoader from "nextjs-toploader";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-cormorant",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-dm-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: `${siteConfig.name} — ${siteConfig.tagline}`,
    template: `%s — ${siteConfig.name}`,
  },
  description:
    "Khadeeja Empire — elegant Indian womenswear rooted in craft. Short kurtis, co-ord sets, dresses, and resort wear designed for the way women dress now.",
  keywords: [
    "Khadeeja Empire",
    "Indian womenswear",
    "short kurtis",
    "co-ord sets",
    "dresses",
    "resort wear",
    "Banaras fashion",
    "ethnic wear",
    "Indo-Western",
  ],
  openGraph: {
    title: `${siteConfig.name} — ${siteConfig.tagline}`,
    description: "Elegant Indian womenswear rooted in craft.",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${cormorant.variable} ${dmSans.variable}`} suppressHydrationWarning>
      <body
        suppressHydrationWarning
        style={{
          fontFamily: "var(--font-dm-sans), var(--font-body)",
        }}
      >
        <NextTopLoader color="#000" showSpinner={false} />
        {children}
      </body>
    </html>
  );
}
