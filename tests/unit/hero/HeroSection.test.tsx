import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HeroSection } from "../../../apps/web/src/components/Hero/HeroSection";

describe("HeroSection", () => {
  const heroRegionName = /Build Better\s*Digital Experiences/i;

  it("renders a named hero region", () => {
    render(<HeroSection />);

    expect(
      screen.getByRole("region", { name: heroRegionName }),
    ).toBeInTheDocument();
  });

  it("uses the correct section ID and accessible heading reference", () => {
    render(<HeroSection />);

    const hero = screen.getByRole("region", {
      name: heroRegionName,
    });

    expect(hero).toHaveAttribute("id", "hero");
    expect(hero).toHaveAttribute("aria-labelledby", "hero-title");

    const heading = within(hero).getByRole("heading", { level: 1 });

    expect(heading).toHaveAttribute("id", "hero-title");
    expect(heading).toHaveTextContent(/Build Better\s*Digital Experiences/i);
  });

  it("renders the complete Hero-Top, Hero-Left, and Hero-Right content inside the section", () => {
    render(<HeroSection />);

    const hero = screen.getByRole("region", {
      name: heroRegionName,
    });

    expect(within(hero).getByText("TECHNOLOGY OWNERSHIP")).toBeInTheDocument();

    const heading = within(hero).getByRole("heading", { level: 1 });

    expect(heading).toHaveTextContent(/Build Better\s*Digital Experiences/i);
    expect(
      within(heading).getByText("Digital Experiences"),
    ).toBeInTheDocument();

    expect(
      within(hero).getByRole("heading", {
        level: 2,
        name: "Simple, fast, and beautiful platforms that win and get real results",
      }),
    ).toBeInTheDocument();

    const description = within(hero).getByText((content) =>
      content.includes("Get a dedicated developer who turns your ideas"),
    );

    expect(description).toBeDefined();
    expect(description).toHaveTextContent(
      "Get a dedicated developer who turns your ideas into polished, high-speed websites and apps. Designed for simplicity and built to convert, so you can focus on growing your business without technical headaches.",
    );
  });

  it("contains exactly one H1 heading", () => {
    render(<HeroSection />);

    const hero = screen.getByRole("region", {
      name: heroRegionName,
    });

    expect(within(hero).getAllByRole("heading", { level: 1 })).toHaveLength(1);
  });
});
