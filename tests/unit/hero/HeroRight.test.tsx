import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

import { HeroRight } from "../../../apps/web/src/components/Hero/HeroRight";

describe("HeroRight", () => {
  it("renders the profile image with accessible alternative text", () => {
    render(<HeroRight />);

    expect(
      screen.getByRole("img", { name: "Haftamu Desta" }),
    ).toBeInTheDocument();
  });

  it("renders the desktop and compact impact card variants", () => {
    render(<HeroRight />);

    expect(screen.getAllByText("My Impact in Action ↘")).toHaveLength(2);
  });

  it("includes all four metrics in both card variants", () => {
    render(<HeroRight />);

    for (const value of ["99.9%", "Faster", "Lower", "Stronger"]) {
      expect(screen.getAllByText(value)).toHaveLength(2);
    }
  });

  it("renders the profile image with a source", () => {
    render(<HeroRight />);

    const image = screen.getByRole("img", { name: "Haftamu Desta" });

    expect(image).toHaveAttribute("src");
    expect(image.getAttribute("src")).not.toBe("");
  });
});
