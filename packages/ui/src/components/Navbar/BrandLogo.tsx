import type { MouseEvent, ReactNode } from "react";
import type { RouterLinkComponent } from "./types";

export interface BrandLogoProps {
  as: RouterLinkComponent;
  href: string;
  ariaLabel: string;
  mark: ReactNode;
  wordmark?: ReactNode;
  taglineLines?: ReactNode[];
  className?: string;
  onLogoClick?: (event: MouseEvent<Element>) => void;
}

const DEFAULT_CLASS =
  "inline-flex shrink-0 items-center gap-3 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-blue-900";

export function BrandLogo({
  as: LinkComponent,
  href,
  ariaLabel,
  mark,
  wordmark,
  taglineLines,
  className,
  onLogoClick,
}: BrandLogoProps) {
  const hasTagline = Boolean(taglineLines?.length);
  const hasTextContent = Boolean(wordmark || hasTagline);

  return (
    <LinkComponent
      to={href}
      aria-label={ariaLabel}
      className={className ?? DEFAULT_CLASS}
      onClick={onLogoClick}
    >
      {mark}

      {hasTextContent && (
        <span className="flex flex-col">
          {wordmark && (
            <span className="flex h-8 items-center leading-none">
              {wordmark}
            </span>
          )}

          {hasTagline && (
            <span
              data-testid="brand-logo-tagline"
              className="mb-2 flex h-12 flex-col items-start justify-center text-xs leading-none"
            >
              {taglineLines!.map((line, index) => (
                <span key={index}>{line}</span>
              ))}
            </span>
          )}
        </span>
      )}
    </LinkComponent>
  );
}
