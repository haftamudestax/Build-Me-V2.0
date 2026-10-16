import type { HTMLAttributes } from "react";

export function CardBody({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`px-4 py-3 ${className ?? ""}`} {...props}>
      {children}
    </div>
  );
}
