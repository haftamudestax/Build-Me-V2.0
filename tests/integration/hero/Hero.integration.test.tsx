import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HeroSection } from "../../../apps/web/src/components/Hero/HeroSection";

describe("Hero Left Section integration", () => {
  it("renders all hero content within the same section", () => {
    render(<HeroSection />);

    const hero = screen.getByRole("region", {
      name: "Build Better Digital Experiences",
    });

    expect(within(hero).getByText("TECHNOLOGY OWNERSHIP")).toBeInTheDocument();

    expect(
      within(hero).getByRole("heading", {
        level: 1,
        name: "Build Better Digital Experiences",
      }),
    ).toBeInTheDocument();

    expect(
      within(hero).getByRole("heading", {
        level: 2,
        name: "Simple, fast, and beautiful platforms that win and get real results",
      }),
    ).toBeInTheDocument();

    expect(
      within(hero).getByText((content) =>
        content.includes("Get a dedicated developer who turns your ideas"),
      ),
    ).toBeInTheDocument();
  });

  it("preserves the heading's visual emphasis", () => {
    render(<HeroSection />);

    const heading = screen.getByRole("heading", { level: 1 });
    const emphasizedText = within(heading).getByText("Digital Experiences");

    expect(emphasizedText.tagName).toBe("SPAN");
    expect(emphasizedText).toHaveStyle({ color: "var(--color-dark-yellow)" });
  });

  it("maintains an accessible heading hierarchy", () => {
    render(<HeroSection />);

    const hero = screen.getByRole("region", {
      name: "Build Better Digital Experiences",
    });

    expect(within(hero).getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(within(hero).getAllByRole("heading", { level: 2 })).toHaveLength(1);
    expect(within(hero).getAllByRole("heading", { level: 3 })).toHaveLength(1);
  });
});
