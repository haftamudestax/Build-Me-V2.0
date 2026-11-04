import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

import { HeroRight } from "../../apps/web/src/components/Hero/HeroRight";

describe("HeroRight integration", () => {
  it("integrates the profile image with both impact card variants", () => {
    const { container } = render(<HeroRight />);

    expect(
      screen.getByRole("img", { name: "Haftamu Desta" }),
    ).toBeInTheDocument();

    const headings = screen.getAllByText("My Impact in Action ↘");

    expect(headings).toHaveLength(2);

    for (const heading of headings) {
      expect(heading).toBeInTheDocument();
    }

    expect(container.querySelectorAll("img")).toHaveLength(1);
  });

  it("renders the complete impact content in both variants", () => {
    const { container } = render(<HeroRight />);

    const cards = Array.from(container.querySelectorAll("p")).filter(
      (element) => element.textContent?.includes("My Impact in Action"),
    );

    expect(cards).toHaveLength(2);

    for (const heading of cards) {
      const cardContainer = heading.parentElement;

      expect(cardContainer).not.toBeNull();

      const content = within(cardContainer as HTMLElement);

      expect(content.getByText("99.9%")).toBeInTheDocument();
      expect(content.getByText("System Reliability")).toBeInTheDocument();
      expect(content.getByText("Faster")).toBeInTheDocument();
      expect(content.getByText("Time to Market")).toBeInTheDocument();
      expect(content.getByText("Lower")).toBeInTheDocument();
      expect(content.getByText("Operational Costs")).toBeInTheDocument();
      expect(content.getByText("Stronger")).toBeInTheDocument();
      expect(content.getByText("Security & Trust")).toBeInTheDocument();
    }
  });
});
