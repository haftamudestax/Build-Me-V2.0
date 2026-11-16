export const BOOKING_PRICING_TYPES = [
  "delivery_project",
  "mentor_me",
  "coffee_with_me",
] as const;

export type PricingBookingType =
  (typeof BOOKING_PRICING_TYPES)[number];

export const BOOKING_PACKAGE_TIERS = [
  "beginner",
  "intermediate",
  "advanced",
] as const;

export type BookingPackageTier =
  (typeof BOOKING_PACKAGE_TIERS)[number];

export type BookingPackageSnapshot = {
  tier: BookingPackageTier;
  name: string;
  price: number;
  currency: "USD";
};

type BookingPricing = Record<
  PricingBookingType,
  Record<BookingPackageTier, BookingPackageSnapshot>
>;
export const BOOKING_PRICING = {
  delivery_project: {
    beginner: {
      tier: "beginner",
      name: "Starter MVP",
      price: 1499,
      currency: "USD",
    },
    intermediate: {
      tier: "intermediate",
      name: "Standard Full-Stack",
      price: 3499,
      currency: "USD",
    },
    advanced: {
      tier: "advanced",
      name: "Enterprise System",
      price: 6999,
      currency: "USD",
    },
  },

  mentor_me: {
    beginner: {
      tier: "beginner",
      name: "Code & Architecture Review",
      price: 199,
      currency: "USD",
    },
    intermediate: {
      tier: "intermediate",
      name: "Monthly Growth Mentorship",
      price: 799,
      currency: "USD",
    },
    advanced: {
      tier: "advanced",
      name: "Engineering Leadership Intensive",
      price: 1499,
      currency: "USD",
    },
  },

  coffee_with_me: {
    beginner: {
      tier: "beginner",
      name: "Quick Catch-up",
      price: 50,
      currency: "USD",
    },
    intermediate: {
      tier: "intermediate",
      name: "Deep-Dive Coffee",
      price: 120,
      currency: "USD",
    },
    advanced: {
      tier: "advanced",
      name: "Strategic Brainstorming",
      price: 250,
      currency: "USD",
    },
  },
} as const satisfies BookingPricing;

export function getBookingPackage(
  bookingType: PricingBookingType,
  tier: BookingPackageTier,
): BookingPackageSnapshot | null {
  const packages = BOOKING_PRICING[bookingType];

  if (!packages) {
    return null;
  }

  const selectedPackage = packages[tier];

  if (!selectedPackage) {
    return null;
  }

  return { ...selectedPackage };
}
