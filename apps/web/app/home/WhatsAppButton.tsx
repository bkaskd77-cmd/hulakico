import { WHATSAPP_PATH } from "@/app/home/social-icons";
import { COMPANY_CONTACT } from "@/lib/data/info-pages";

/** Floating WhatsApp chat button for public pages. */
export function WhatsAppButton() {
  return (
    <a
      href={COMPANY_CONTACT.whatsappHref}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with Hulakico on WhatsApp"
      className="hub-enter fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg shadow-black/30 transition hover:scale-105"
    >
      <svg viewBox="0 0 24 24" className="h-7 w-7" fill="currentColor" aria-hidden>
        <path d={WHATSAPP_PATH} />
      </svg>
    </a>
  );
}
