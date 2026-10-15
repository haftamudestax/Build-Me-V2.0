import type { HTMLAttributes } from "react";

export function ModalBody({
  children,
  id,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement> & { id?: string }) {
  return (
    <div
      id={id}
      className={`px-5 py-4 text-sm text-gray-600 ${className ?? ""}`}
      {...props}
    >
      {children}
    </div>
  );
}
