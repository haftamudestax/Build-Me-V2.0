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

  it("renders the complete Hero-Top, Hero-Left, Hero-Right, and Hero-Bottom content inside the section", () => {
    render(<HeroSection />);

    const hero = screen.getByRole("region", {
      name: heroRegionName,
    });

    // Hero-Top
    expect(within(hero).getByText("TECHNOLOGY OWNERSHIP")).toBeInTheDocument();

    // Hero-Left
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

    const description = within(hero).getByText(
      (_, element) =>
        element?.tagName === "P" &&
        (element.textContent ?? "").replace(/\s+/g, " ").trim() ===
          "Get more customers with ease with websites and apps that are easy to use, look great, and work fast.",
    );

    expect(description).toBeInTheDocument();

    // Hero-Right
    const heroImages = within(hero).getAllByRole("img", {
      name: "Haftamu Desta",
    });

    expect(heroImages).toHaveLength(2);

    const impactLabels = within(hero).getAllByText("My Impact in Action");

    expect(impactLabels).toHaveLength(2);

    // Hero-Bottom (HeroValueStrip)
    const valueStrip = within(hero).getByRole("region", {
      name: "Key value propositions",
    });

    expect(
      within(valueStrip).getByRole("heading", {
        level: 2,
        name: "Reliable solutions that help you grow.",
      }),
    ).toBeInTheDocument();

    for (const fact of [
      "No Stress",
      "No Confusion",
      "No Jargons",
      "Just Simple",
    ]) {
      expect(within(valueStrip).getByText(fact)).toBeInTheDocument();
    }
  });

  it("renders the hero background image as a decorative element", () => {
    render(<HeroSection />);

    const hero = screen.getByRole("region", {
      name: heroRegionName,
    });

    const background = hero.querySelector('[aria-hidden="true"]');

    expect(background).toBeInTheDocument();
    expect(background).toHaveStyle({
      position: "absolute",
      backgroundRepeat: "no-repeat",
      pointerEvents: "none",
    });
  });

  it("maintains the expected H1 and H2 heading counts", () => {
    render(<HeroSection />);

    const hero = screen.getByRole("region", {
      name: heroRegionName,
    });

    expect(within(hero).getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(within(hero).getAllByRole("heading", { level: 2 })).toHaveLength(2);
  });
});
