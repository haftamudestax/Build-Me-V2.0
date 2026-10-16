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

  it("renders the complete HeroIntro inside the section", () => {
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

    const paragraphs = within(hero).getAllByText(
      (_, element) => element?.tagName.toLowerCase() === "p",
    );

    const description = paragraphs.find((paragraph) =>
      paragraph.textContent?.includes("Websites and apps that are easy to use"),
    );

    expect(description).toBeDefined();
    expect(description).toHaveTextContent(
      "Websites and apps that are easy to use",
    );
    expect(description).toHaveTextContent("look great, and work fast.");
    expect(description).toHaveTextContent("Get more customers with ease.");
    expect(description).toHaveTextContent("No stress, no confusion");
    expect(description).toHaveTextContent(
      "reliable solutions that help you grow.",
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
