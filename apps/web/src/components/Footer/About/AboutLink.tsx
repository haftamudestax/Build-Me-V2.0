import { Link } from "react-router-dom";

export function AboutLink() {
  return (
    <Link
      to="/about"
      className="flex w-full items-center gap-3 border-b border-gray-200 py-2 transition hover:text-blue-700 lg:w-auto lg:border-b-0 lg:px-5 lg:py-0"
      aria-label="About Build Me"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-dark-yellow text-white">
        <span className="text-xl font-bold">i</span>
      </span>

      <span className="flex flex-col">
        <span className="text-sm font-bold text-light-yellow">About Me</span>
        <span className="text-xs text-gray-600">Who am I and what I do.</span>
      </span>
    </Link>
  );
}
