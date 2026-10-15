import type { HTMLAttributes } from "react";

export function ModalHeader({
  children,
  id,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement> & { id: string }) {
  return (
    <div
      id={id}
      className={`px-5 py-4 border-b border-gray-100 text-lg font-semibold ${className ?? ""}`}
      {...props}
    >
      {children}
    </div>
  );
}
