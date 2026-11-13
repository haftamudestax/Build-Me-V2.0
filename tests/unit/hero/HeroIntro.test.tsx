import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HeroIntro } from "../../../apps/web/src/components/Hero/HeroIntro";

describe("HeroIntro", () => {
  it("renders the complete H1 heading", () => {
    render(<HeroIntro />);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Build Better Digital Experiences",
      }),
    ).toBeInTheDocument();
  });

  it("highlights Digital Experiences with the dark-yellow theme variable", () => {
    render(<HeroIntro />);

    const heading = screen.getByRole("heading", { level: 1 });
    const highlightedText = within(heading).getByText("Digital Experiences");

    expect(highlightedText.tagName).toBe("SPAN");
    expect(highlightedText).toHaveStyle({ color: "var(--color-dark-yellow)" });
  });

  it("renders the exact subheading", () => {
    render(<HeroIntro />);

    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "Simple, fast, and beautiful platforms that win and get real results",
      }),
    ).toBeInTheDocument();
  });

  it("renders the freelancer value proposition paragraph", () => {
    render(<HeroIntro />);

    const paragraph = screen.getByText((content) =>
      content.includes("Get a dedicated developer who turns your ideas"),
    );

    expect(paragraph).toBeInTheDocument();
    expect(paragraph).toHaveTextContent(
      "Get a dedicated developer who turns your ideas into polished, high-speed websites and apps. Designed for simplicity and built to convert, so you can focus on growing your business without technical headaches.",
    );
  });

  it("renders both primary CTA buttons", () => {
    render(<HeroIntro />);

    expect(
      screen.getByRole("button", { name: /work with me/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /get quick wins/i }),
    ).toBeInTheDocument();
  });

  it("renders the Hero-Bottom heading and all four key facts", () => {
    render(<HeroIntro />);

    expect(
      screen.getByRole("heading", {
        level: 3,
        name: "Reliable solutions that help you grow.",
      }),
    ).toBeInTheDocument();

    const expectedFacts = [
      "No Stress",
      "No Confusion",
      "No Jargons",
      "Just Simple",
    ];

    for (const fact of expectedFacts) {
      expect(screen.getByText(fact)).toBeInTheDocument();
    }
  });

  it("uses a semantic H1, H2, and H3 hierarchy", () => {
    render(<HeroIntro />);

    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2 })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3 })).toBeInTheDocument();
  });
});
