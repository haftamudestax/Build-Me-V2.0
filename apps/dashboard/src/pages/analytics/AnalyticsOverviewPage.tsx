import { Link } from "react-router-dom";

const analyticsSections = [
  {
    title: "Navbar Analytics",
    description:
      "Review navigation interactions, logo clicks, and navbar activity.",
    to: "/dashboard/analytics/navbar",
  },
  {
    title: "Hero Analytics",
    description: "Review hero section views and engagement events.",
    to: "/dashboard/analytics/hero",
  },
  {
    title: "Delivery Project Analytics",
    description:
      "Review delivery project activity and submission-related events.",
    to: "/dashboard/analytics/delivery-project",
  },
];

export function AnalyticsOverviewPage() {
  return (
    <main className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">
          Analytics Overview
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Monitor activity across your Build Me website.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {analyticsSections.map((section) => (
          <article
            key={section.to}
            className="rounded-lg border border-slate-200 bg-white p-5"
          >
            <h2 className="text-lg font-semibold text-slate-900">
              {section.title}
            </h2>
            <p className="mt-2 text-sm text-slate-600">{section.description}</p>
            <Link
              to={section.to}
              className="mt-4 inline-flex text-sm font-semibold text-blue-700 hover:text-blue-900"
            >
              View analytics →
            </Link>
          </article>
        ))}
      </section>
    </main>
  );
}
