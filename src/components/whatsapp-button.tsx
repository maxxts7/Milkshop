import { WhatsAppIcon } from "./icons";

export function WhatsAppButton({
  number,
  message = "Hello Khanams Grassfed, I'd like to ask about your products.",
}: {
  number: string;
  message?: string;
}) {
  return (
    <a
      href={`https://wa.me/${number}?text=${encodeURIComponent(message)}`}
      target="_blank"
      rel="noopener noreferrer"
      className="no-print fixed bottom-5 right-5 z-30 h-14 w-14 rounded-full bg-[#25D366] text-white shadow-lg shadow-black/15 grid place-items-center transition-transform hover:scale-105 active:scale-95"
      aria-label="Chat with us on WhatsApp"
    >
      <WhatsAppIcon className="h-7 w-7" />
    </a>
  );
}
