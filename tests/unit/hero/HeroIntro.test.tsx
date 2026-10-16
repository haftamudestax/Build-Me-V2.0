import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HeroIntro } from "../../../apps/web/src/components/hero/HeroIntro";

describe("HeroIntro", () => {
  it("renders the Technology Ownership label", () => {
    render(<HeroIntro />);

    expect(screen.getByText("TECHNOLOGY OWNERSHIP")).toBeInTheDocument();
  });

  it("renders the complete H1 heading", () => {
    render(<HeroIntro />);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Build Better Digital Experiences",
      }),
    ).toBeInTheDocument();
  });

  it("highlights Digital Experiences in blue", () => {
    render(<HeroIntro />);

    const heading = screen.getByRole("heading", { level: 1 });
    const highlightedText = within(heading).getByText("Digital Experiences");

    expect(highlightedText.tagName).toBe("SPAN");
    expect(highlightedText).toHaveStyle({ color: "#1746B5" });
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

  it("renders all supporting statements", () => {
    render(<HeroIntro />);

    const paragraph = screen.getByText(
      (_, element) =>
        element?.tagName.toLowerCase() === "p" &&
        element.textContent?.includes(
          "Websites and apps that are easy to use,",
        ) === true,
    );

    const normalizedText = paragraph.textContent?.replace(/\s+/g, " ");

    expect(normalizedText).toContain("Websites and apps that are easy to use,");
    expect(normalizedText).toContain("look great, and work fast.");
    expect(normalizedText).toContain("Get more customers with ease.");
    expect(normalizedText).toContain("No stress, no confusion — just simple,");
    expect(normalizedText).toContain("reliable solutions that help you grow.");
  });

  it("uses a semantic H1 followed by an H2", () => {
    render(<HeroIntro />);

    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();

    expect(screen.getByRole("heading", { level: 2 })).toBeInTheDocument();
  });
});
