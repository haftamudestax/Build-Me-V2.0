import { Link } from "react-router-dom";

export function LegalLinks() {
  return (
    <nav
      aria-label="Legal information"
      className="flex w-full flex-col lg:w-auto lg:flex-row lg:items-center"
    >
      <Link
        to="/terms"
        className="w-full border-b border-gray-200 py-2 text-sm text-gray-700 transition hover:text-blue-700 lg:w-auto lg:border-b-0 lg:border-r lg:px-5 lg:py-0"
      >
        Terms & Conditions
      </Link>

      <Link
        to="/privacy"
        className="w-full border-b border-gray-200 py-2 text-sm text-gray-700 transition hover:text-blue-700 lg:w-auto lg:border-b-0 lg:border-r lg:px-5 lg:py-0"
      >
        Privacy Policy
      </Link>

      <Link
        to="/cookie-policy"
        className="w-full py-2 text-sm text-gray-700 transition hover:text-blue-700 lg:w-auto lg:px-5 lg:py-0"
      >
        Cookie Policy
      </Link>
    </nav>
  );
}
