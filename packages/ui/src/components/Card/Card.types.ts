import type { HTMLAttributes } from "react";

export type CardState = "default" | "loading" | "empty" | "error" | "disabled";
export type CardSize = "sm" | "md" | "lg";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  state?: CardState;
  size?: CardSize;
  onRetry?: () => void;
  emptyMessage?: string;
  errorMessage?: string;
}

export const sizeStyles: Record<CardSize, string> = {
  sm: "max-w-xs text-sm",
  md: "max-w-md text-base",
  lg: "max-w-2xl text-base",
};