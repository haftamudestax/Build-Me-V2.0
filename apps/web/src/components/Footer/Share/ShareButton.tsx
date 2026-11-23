import { useState } from "react";
import { ShareModal } from "./ShareModal";

export function ShareButton() {
  const [isOpen, setIsOpen] = useState(false);

  const pageUrl = typeof window !== "undefined" ? window.location.href : "";

  const pageTitle =
    typeof document !== "undefined" ? document.title : "Build Me";

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label="Share this page"
        className="group inline-flex items-center gap-3 rounded-xl px-3 py-3 text-center transition hover:bg-dark-yellow hover:text-black focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center transition-transform group-hover:scale-110">
          <svg
            viewBox="0 0 32 32"
            fill="currentColor"
            className="h-9 w-9"
            aria-hidden="true"
          >
            <path d="M28.8 3.4 3.9 13.1c-1.7.7-1.7 1.8-.3 2.2l6.4 2 2.5 7.8c.3.9.2 1.3 1.1 1.3.7 0 1-.3 1.4-.7l3.1-3 6.5 4.8c1.2.7 2.1.3 2.4-1.1l4.3-20.2c.4-1.7-.6-2.5-2.5-1.8ZM12 16.8 25.7 8.2c.7-.4 1.3-.2.8.3L15.2 19.1l-.5 5.1-2.7-7.4Z" />
          </svg>
        </span>
        <span className="flex flex-col gap-0.5">
          <span className="text-sm font-bold leading-tight text-light-yellow hover:text-black">
            Share This Page
          </span>

          <span className="text-xs leading-tight text-gray-700">
            Spread value. Inspire others.
          </span>
        </span>
      </button>

      <ShareModal
        isOpen={isOpen}
        url={pageUrl}
        title={pageTitle}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
}
