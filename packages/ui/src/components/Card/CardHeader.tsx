import type { HTMLAttributes } from "react";

export function CardHeader({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`px-4 py-3 border-b border-gray-100 font-medium ${className ?? ""}`}
      {...props}
    >
      {children}
    </div>
  );
}
