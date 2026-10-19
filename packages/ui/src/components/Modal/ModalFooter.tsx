// ModalFooter.tsx
import type { HTMLAttributes } from "react";

export function ModalFooter({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`px-5 py-4 border-t border-gray-100 flex justify-end gap-2 ${className ?? ""}`}
      {...props}
    >
      {children}
    </div>
  );
}
