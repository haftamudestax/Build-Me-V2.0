import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

interface LegalPageLayoutProps {
  title: string;
  description: string;
  children: ReactNode;
}

export function LegalPageLayout({
  title,
  description,
  children,
}: LegalPageLayoutProps) {
  return (
    <main className="min-h-screen bg-white">
      {/* Header Banner Section */}
      <section
        className="border-b-[1.5px] border-black"
        style={{ backgroundColor: "var(--color-dark-yellow)" }}
      >
        <div className="mx-auto max-w-5xl px-5 py-14 sm:px-8 lg:px-10">
          <Link
            to="/"
            className="mb-6 inline-flex items-center gap-2 bg-black text-white px-4 py-2 text-sm font-bold transition hover:bg-stone-800"
            style={{
              borderRadius: 0,
              border: "1.5px solid var(--color-black)",
            }}
          >
            <ArrowLeft size={16} />
            Back to Home
          </Link>

          <p className="mb-3 text-xs font-bold uppercase tracking-wider text-black">
            Haftamu Desta · Legal & Compliance
          </p>

          <h1 className="text-3xl font-extrabold tracking-tight text-black sm:text-4xl">
            {title}
          </h1>

          <p className="mt-4 max-w-2xl text-base font-medium leading-7 text-stone-900">
            {description}
          </p>
        </div>
      </section>

      {/* Content Container Section */}
      <section className="mx-auto max-w-5xl px-5 py-10 sm:px-8 lg:px-10 lg:py-14">
        <article className="max-w-3xl space-y-8 text-stone-800">
          {children}
        </article>
      </section>
    </main>
  );
}
