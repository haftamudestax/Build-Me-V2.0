import { useId, type ReactNode } from "react";

export interface HexBadgeProps {
  size?: number;
  outerColor?: string;
  midColor?: string;
  innerColor?: string;
  children?: ReactNode;
  decorations?: ReactNode;
  className?: string;
}

export function HexBadge({
  size = 58,
  outerColor = "#FFFFFF",
  midColor = "#F7B733",
  innerColor = "#0B1740",
  children,
  decorations,
  className,
}: HexBadgeProps) {
  const clipId = useId();
  const width = Math.round((size * 58) / 66);

  return (
    <svg
      width={width}
      height={size}
      viewBox="0 0 58 66"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className ?? "shrink-0"}
    >
      <path
        d="M29 2L54.5 16.5V49.5L29 64L3.5 49.5V16.5L29 2Z"
        fill={outerColor}
      />
      <path
        d="M29 6.5L50.5 18.75V45.25L29 57.5L7.5 45.25V18.75L29 6.5Z"
        fill={midColor}
      />
      <path
        d="M29 10.5L47 20.9V41.7L29 52.1L11 41.7V20.9L29 10.5Z"
        fill={innerColor}
      />

      <clipPath id={clipId}>
        <path d="M29 10.5L47 20.9V41.7L29 52.1L11 41.7V20.9L29 10.5Z" />
      </clipPath>

      <g clipPath={`url(#${clipId})`}>{children}</g>

      {decorations}
    </svg>
  );
}
