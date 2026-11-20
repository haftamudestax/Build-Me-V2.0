import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HeroSection } from "../../../apps/web/src/components/Hero/HeroSection";

describe("Hero Section integration", () => {
  it("renders all hero content within the same section", () => {
    render(<HeroSection />);

    const hero = screen.getByRole("region", {
      name: "Build Better Digital Experiences",
    });

    // Hero top
    expect(within(hero).getByText("TECHNOLOGY OWNERSHIP")).toBeInTheDocument();

    // Hero left
    const mainHeading = within(hero).getByRole("heading", {
      level: 1,
      name: "Build Better Digital Experiences",
    });

    expect(mainHeading).toBeInTheDocument();

    expect(
      within(hero).getByRole("heading", {
        level: 2,
        name: "Simple, fast, and beautiful platforms that win and get real results",
      }),
    ).toBeInTheDocument();

    expect(
      within(hero).getByText((content) =>
        content.includes(
          "Get more customers with ease with websites and apps that are",
        ),
      ),
    ).toBeInTheDocument();

    // Hero right: profile image
    const heroImages = within(hero).getAllByRole("img", {
      name: "Haftamu Desta",
    });

    expect(heroImages).toHaveLength(1);

    heroImages.forEach((image) => {
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute("src");
      expect(image.getAttribute("src")).not.toBe("");
    });

    // Hero right: desktop and compact impact card variants
    expect(within(hero).getAllByText("My Impact in Action")).toHaveLength(2);

    // Verify all four metrics appear in both variants
    for (const metric of ["99.9%", "Faster", "Lower", "Stronger"]) {
      expect(within(hero).getAllByText(metric)).toHaveLength(2);
    }

    // Hero bottom
    const valueStrip = within(hero).getByRole("region", {
      name: "Key value propositions",
    });

    expect(
      within(valueStrip).getByRole("heading", {
        level: 2,
        name: "Reliable solutions that help you grow.",
      }),
    ).toBeInTheDocument();

    // Verify value strip key facts
    for (const fact of [
      "No Stress",
      "No Confusion",
      "No Jargons",
      "Just Simple",
    ]) {
      expect(within(valueStrip).getByText(fact)).toBeInTheDocument();
    }
  });

  it("preserves the heading's visual emphasis", () => {
    render(<HeroSection />);

    const heading = screen.getByRole("heading", { level: 1 });
    const emphasizedText = within(heading).getByText("Digital Experiences");

    expect(emphasizedText.tagName).toBe("SPAN");
    expect(emphasizedText).toHaveStyle({
      color: "var(--color-dark-yellow)",
    });
  });

  it("maintains an accessible heading hierarchy", () => {
    render(<HeroSection />);

    const hero = screen.getByRole("region", {
      name: "Build Better Digital Experiences",
    });

    expect(within(hero).getAllByRole("heading", { level: 1 })).toHaveLength(1);

    expect(within(hero).getAllByRole("heading", { level: 2 })).toHaveLength(2);

    expect(within(hero).queryAllByRole("heading", { level: 3 })).toHaveLength(
      0,
    );
  });

  it("maintains the hero section's accessible identity", () => {
    render(<HeroSection />);

    const hero = screen.getByRole("region", {
      name: "Build Better Digital Experiences",
    });

    expect(hero).toHaveAttribute("id", "hero");
    expect(hero).toHaveAttribute("aria-labelledby", "hero-title");

    expect(
      within(hero).getByRole("heading", {
        level: 1,
        name: "Build Better Digital Experiences",
      }),
    ).toHaveAttribute("id", "hero-title");
  });

  it("renders the hero background as a decorative element", () => {
    render(<HeroSection />);

    const hero = screen.getByRole("region", {
      name: "Build Better Digital Experiences",
    });

    const background = hero.querySelector('[aria-hidden="true"]');

    expect(background).toBeInTheDocument();
    expect(background).toHaveStyle({
      position: "absolute",
      backgroundRepeat: "no-repeat",
      pointerEvents: "none",
    });
  });
});
