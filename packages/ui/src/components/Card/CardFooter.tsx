import type { HTMLAttributes } from "react";

export function CardFooter({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`px-4 py-3 border-t border-gray-100 text-sm text-gray-500 ${className ?? ""}`}
      {...props}
    >
      {children}
    </div>
  );
}
