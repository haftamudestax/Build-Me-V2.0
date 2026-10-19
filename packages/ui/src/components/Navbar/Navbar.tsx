import type { ReactNode } from "react";

export interface NavbarProps {
  logo: ReactNode;
  children?: ReactNode;
  className?: string;
}

const DEFAULT_HEADER_CLASS =
  "sticky top-0 z-50 w-full border-b border-white/10 bg-blue-900/95 shadow-sm backdrop-blur-md";

export function Navbar({ logo, children, className }: NavbarProps) {
  return (
    <header className={className ?? DEFAULT_HEADER_CLASS}>
      <nav
        className="relative mx-auto flex min-h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8"
        aria-label="Main navigation"
      >
        <div className="flex items-center">{logo}</div>

        {children}
      </nav>
    </header>
  );
}
