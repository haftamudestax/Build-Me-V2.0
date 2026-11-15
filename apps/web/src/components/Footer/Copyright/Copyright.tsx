import { Handshake } from "lucide-react";

export function Copyright() {
  return (
    <div className="flex flex-1 items-center justify-between gap-3 py-3 lg:pl-4 lg:py-0">
      <div className="whitespace-nowrap text-[9px] leading-4 text-gray-800">
        <p>© {new Date().getFullYear()} Haftamu Desta. All rights reserved.</p>
        <p className="font-medium">Innovate. Collaborate. Grow Together.</p>
      </div>

      <Handshake
        size={32}
        strokeWidth={1.5}
        className="shrink-0 text-blue-900"
        aria-hidden="true"
      />
    </div>
  );
}
