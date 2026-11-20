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
    expect(highlightedText).toHaveStyle({
      color: "var(--color-dark-yellow)",
    });
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

  it("renders the current freelancer value proposition paragraph", () => {
    render(<HeroIntro />);

    const paragraph = screen.getByText(
      (_, element) =>
        element?.tagName === "P" &&
        (element.textContent ?? "").replace(/\s+/g, " ").trim() ===
          "Get more customers with ease with websites and apps that are easy to use, look great, and work fast.",
    );

    expect(paragraph).toBeInTheDocument();
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

  it("uses a semantic H1 and H2 hierarchy", () => {
    render(<HeroIntro />);

    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
    expect(screen.getAllByRole("heading", { level: 2 })).toHaveLength(1);
  });
});
