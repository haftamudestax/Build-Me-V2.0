export type Rating = 1 | 2 | 3 | 4 | 5;

export interface Testimonial {
  id: string;
  author: string;
  role: string;
  quote: string;
  rating?: Rating;
  date?: string;
  isSample?: boolean;
}

export interface CategoryMetric {
  key: string;
  label: string;
  score: number;
}

export const TESTIMONIALS_PER_PAGE = 4;

export const RATING_VALUES: readonly Rating[] = [5, 4, 3, 2, 1];

/** Only genuine, approved testimonials belong here. */
export const testimonials: Testimonial[] = [
  {
    id: "microverse-peer-001",
    author: "MPATCHIE Henschel",
    role: "Former Microverse peer",
    quote:
      "Desta is an excellent software developer, and it has always been a pleasure to work with him. We pair-programmed extensively together while enrolled at a software development program, Microverse, and in that time his professionalism and technical skills blew me away. He writes clean, DRY code, and he gives attention to details. He's so approachable and easy to talk to. Collaborating with him left me with the feeling that we've known each other for years. He's the perfect match if you need a full-stack developer.",
  },
];

export interface ReviewSummaryData {
  count: number;
  ratedCount: number;
  average: number;
  distribution: Record<Rating, number>;
  categories: CategoryMetric[];
  displayReviewText?: string;
  displayCustomerText?: string;
}

export const DEFAULT_CATEGORIES: CategoryMetric[] = [
  { key: "technicalExpertise", label: "Technical Expertise", score: 0 },
  { key: "reliability", label: "Reliability", score: 0 },
  { key: "collaboration", label: "Collaboration", score: 0 },
  { key: "qualityOfWork", label: "Quality of Work", score: 0 },
];

export function summarizeReviews(items: Testimonial[]): ReviewSummaryData {
  const distribution: Record<Rating, number> = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  };

  let ratedCount = 0;
  let totalRating = 0;

  for (const item of items) {
    if (item.rating === undefined) continue;

    distribution[item.rating] += 1;
    totalRating += item.rating;
    ratedCount += 1;
  }

  const average =
    ratedCount === 0 ? 0 : Math.round((totalRating / ratedCount) * 10) / 10;

  return {
    count: items.length,
    ratedCount,
    average,
    distribution,
    categories: DEFAULT_CATEGORIES,
    displayReviewText: `${ratedCount.toFixed(1)} Reviews`,
    displayCustomerText: "100+ Customers",
  };
}

export function getPageCount(
  total: number,
  pageSize: number = TESTIMONIALS_PER_PAGE,
): number {
  if (total <= 0 || pageSize <= 0) return 0;
  return Math.ceil(total / pageSize);
}

export function clampPage(page: number, pageCount: number): number {
  const whole = Number.isFinite(page) ? Math.trunc(page) : 1;
  return Math.min(Math.max(1, whole), Math.max(1, pageCount));
}

export function getPageItems<T>(
  items: T[],
  page: number,
  pageSize: number = TESTIMONIALS_PER_PAGE,
): T[] {
  if (items.length === 0 || pageSize <= 0) return [];

  const current = clampPage(page, getPageCount(items.length, pageSize));
  const start = (current - 1) * pageSize;

  return items.slice(start, start + pageSize);
}

export function getPageRange(
  total: number,
  page: number,
  pageSize: number = TESTIMONIALS_PER_PAGE,
): { from: number; to: number } {
  if (total <= 0 || pageSize <= 0) return { from: 0, to: 0 };

  const current = clampPage(page, getPageCount(total, pageSize));

  return {
    from: (current - 1) * pageSize + 1,
    to: Math.min(current * pageSize, total),
  };
}

export function getInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);

  if (words.length === 0) return "?";

  const first = words[0][0];
  const last = words.length > 1 ? words[words.length - 1][0] : "";

  return `${first}${last}`.toUpperCase();
}

export function formatTestimonialDate(date?: string): string | null {
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;

  const parsed = new Date(`${date}T00:00:00Z`);

  if (
    Number.isNaN(parsed.getTime()) ||
    parsed.toISOString().slice(0, 10) !== date
  ) {
    return null;
  }

  return parsed.toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function formatReviewCount(count: number): string {
  return `${count} ${count === 1 ? "review" : "reviews"}`;
}