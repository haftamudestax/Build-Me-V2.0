import { useId, useState, type ReactNode } from "react";

export interface MobileMenuProps {
  children: ReactNode;
  buttonClassName?: string;
  panelClassName?: string;
}

const DEFAULT_BUTTON_CLASS =
  "inline-flex items-center justify-center rounded-md p-2 text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-blue-900 md:hidden";

const DEFAULT_PANEL_CLASS =
  "absolute inset-x-0 top-16 flex flex-col gap-1 border-b border-white/10 bg-blue-900/95 px-4 py-4 backdrop-blur-md md:hidden";

export function MobileMenu({
  children,
  buttonClassName,
  panelClassName,
}: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const generatedId = useId();
  const panelId = `mobile-nav-panel-${generatedId}`;

  return (
    <>
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls={panelId}
        aria-label={isOpen ? "Close menu" : "Open menu"}
        onClick={() => setIsOpen((previous) => !previous)}
        className={buttonClassName ?? DEFAULT_BUTTON_CLASS}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          {isOpen ? (
            <path
              d="M6 6L18 18M18 6L6 18"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          ) : (
            <path
              d="M4 7H20M4 12H20M4 17H20"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          )}
        </svg>
      </button>

      {isOpen && (
        <nav
          id={panelId}
          aria-label="Mobile navigation"
          className={panelClassName ?? DEFAULT_PANEL_CLASS}
        >
          {children}
        </nav>
      )}
    </>
  );
}
