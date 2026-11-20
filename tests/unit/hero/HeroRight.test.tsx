import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { HeroRight } from "../../../apps/web/src/components/Hero/HeroRight";

describe("HeroRight", () => {
  it("renders the profile image with accessible alternative text", () => {
    render(<HeroRight />);

    const images = screen.getAllByRole("img", {
      name: "Haftamu Desta",
    });

    expect(images).toHaveLength(1);

    images.forEach((img) => {
      expect(img).toBeInTheDocument();
    });
  });

  it("renders both desktop and compact impact card variants", () => {
    render(<HeroRight />);

    const impactLabels = screen.getAllByText((content) =>
      content.includes("My Impact in Action"),
    );

    expect(impactLabels).toHaveLength(2);
  });

  it("includes all four metrics in both card variants", () => {
    render(<HeroRight />);

    for (const value of ["99.9%", "Faster", "Lower", "Stronger"]) {
      expect(screen.getAllByText(value)).toHaveLength(2);
    }
  });

  it("renders the profile image with a valid source", () => {
    render(<HeroRight />);

    const images = screen.getAllByRole("img", {
      name: "Haftamu Desta",
    });

    expect(images).toHaveLength(1);

    images.forEach((image) => {
      expect(image).toHaveAttribute("src");
      expect(image.getAttribute("src")).not.toBe("");
    });
  });
});
