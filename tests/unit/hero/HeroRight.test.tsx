import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

import { HeroRight } from "../../../apps/web/src/components/Hero/HeroRight";

describe("HeroRight", () => {
  it("renders the profile images with accessible alternative text", () => {
    render(<HeroRight />);

    const images = screen.getAllByRole("img", { name: "Haftamu Desta" });
    expect(images.length).toBeGreaterThanOrEqual(1);
    images.forEach((img) => expect(img).toBeInTheDocument());
  });

  it("renders the desktop and compact impact card variants", () => {
    render(<HeroRight />);

    expect(
      screen.getAllByText((content) => content.includes("My Impact in Action")),
    ).toHaveLength(2);
  });

  it("includes all four metrics in both card variants", () => {
    render(<HeroRight />);

    for (const value of ["99.9%", "Faster", "Lower", "Stronger"]) {
      expect(screen.getAllByText(value)).toHaveLength(2);
    }
  });

  it("renders the profile images with sources", () => {
    render(<HeroRight />);

    const images = screen.getAllByRole("img", { name: "Haftamu Desta" });

    images.forEach((image) => {
      expect(image).toHaveAttribute("src");
      expect(image.getAttribute("src")).not.toBe("");
    });
  });
});
