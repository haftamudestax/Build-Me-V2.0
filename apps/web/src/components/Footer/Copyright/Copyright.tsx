import { Handshake } from "lucide-react";

export function Copyright() {
  return (
    <div className="flex w-full flex-1 items-center gap-3 py-3 lg:py-0 lg:pl-4">
      <div className="text-right whitespace-nowrap text-[9px] leading-4 text-gray-800">
        <p className="font-semibold">
          © {new Date().getFullYear()} Haftamu Desta. All rights reserved.
        </p>
        <p className="font-bold text-black">
          Innovate. Collaborate. Grow Together.
        </p>
      </div>

      <Handshake
        size={32}
        strokeWidth={1.5}
        className="shrink-0 text-amber-600"
        aria-hidden="true"
      />
    </div>
  );
}
