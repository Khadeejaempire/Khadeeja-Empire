import { MessageCircle, Phone } from "lucide-react";
import { siteConfig } from "@/content/site";
import { whatsappLink } from "@/lib/utils";

export function FloatingContact() {
  const phone = siteConfig.phone?.trim();
  const whatsapp = siteConfig.whatsapp?.trim() || phone;
  if (!phone && !whatsapp) return null;

  return (
    <div className="fixed bottom-[72px] right-4 z-40 flex flex-col items-center gap-3 md:bottom-6 md:right-6">
      {phone ? (
        <a
          href={`tel:${phone.replace(/\s+/g, "")}`}
          aria-label={`Call ${siteConfig.name}`}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-[#b89565] text-white shadow-lg transition-transform duration-200 hover:scale-105 active:scale-95"
        >
          <Phone size={20} strokeWidth={2} aria-hidden="true" />
        </a>
      ) : null}
      {whatsapp ? (
        <a
          href={whatsappLink(whatsapp, `Hello ${siteConfig.name}, I would like to know more.`)}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Chat with ${siteConfig.name} on WhatsApp`}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-xl transition-transform duration-200 hover:scale-105 active:scale-95"
        >
          <MessageCircle size={26} strokeWidth={2} aria-hidden="true" />
        </a>
      ) : null}
    </div>
  );
}
