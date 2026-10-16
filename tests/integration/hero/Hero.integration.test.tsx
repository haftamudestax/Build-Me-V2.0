import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HeroSection } from "../../../apps/web/src/components/hero/HeroSection";

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
      within(hero).getByText(
        (_, element) =>
          element?.tagName.toLowerCase() === "p" &&
          element.textContent?.includes(
            "reliable solutions that help you grow.",
          ) === true,
      ),
    ).toBeInTheDocument();
  });

  it("preserves the heading's visual emphasis", () => {
    render(<HeroSection />);

    const heading = screen.getByRole("heading", { level: 1 });
    const blueText = within(heading).getByText("Digital Experiences");

    expect(blueText.tagName).toBe("SPAN");
    expect(blueText).toHaveStyle({ color: "#1746B5" });
  });

  it("maintains an accessible heading hierarchy", () => {
    render(<HeroSection />);

    const hero = screen.getByRole("region", {
      name: "Build Better Digital Experiences",
    });

    expect(within(hero).getAllByRole("heading", { level: 1 })).toHaveLength(1);

    expect(within(hero).getAllByRole("heading", { level: 2 })).toHaveLength(1);
  });
});
