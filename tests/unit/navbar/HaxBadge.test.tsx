import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";

import { HexBadge } from "@build-me/ui/navbar";

describe("HexBadge", () => {
  it("renders an SVG with the expected dimensions and accessibility attributes", () => {
    const { container } = render(
      <HexBadge>
        <circle data-testid="icon-content" />
      </HexBadge>,
    );

    const svg = container.querySelector("svg");

    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute("width", "51");
    expect(svg).toHaveAttribute("height", "58");
    expect(svg).toHaveAttribute("viewBox", "0 0 58 66");
    expect(svg).toHaveAttribute("aria-hidden", "true");
    expect(svg).toHaveAttribute("xmlns", "http://www.w3.org/2000/svg");
  });

  it("renders the three hexagon layers with the provided colors", () => {
    const { container } = render(
      <HexBadge outerColor="red" midColor="green" innerColor="blue">
        <circle data-testid="icon-content" />
      </HexBadge>,
    );

    const paths = container.querySelectorAll("svg > path");

    expect(paths).toHaveLength(3);
    expect(paths[0]).toHaveAttribute("fill", "red");
    expect(paths[1]).toHaveAttribute("fill", "green");
    expect(paths[2]).toHaveAttribute("fill", "blue");
  });

  it("uses the default brand colors when no colors are provided", () => {
    const { container } = render(
      <HexBadge>
        <circle />
      </HexBadge>,
    );

    const paths = container.querySelectorAll("svg > path");

    expect(paths[0]).toHaveAttribute("fill", "#FFFFFF");
    expect(paths[1]).toHaveAttribute("fill", "#F7B733");
    expect(paths[2]).toHaveAttribute("fill", "#0B1740");
  });

  it("renders children inside the clipped group", () => {
    const { container } = render(
      <HexBadge>
        <circle data-testid="icon-content" />
      </HexBadge>,
    );

    const svg = container.querySelector("svg");
    const clippedGroup = svg?.querySelector("g[clip-path]");

    expect(clippedGroup).toBeInTheDocument();
    expect(clippedGroup).toHaveAttribute("clip-path");

    expect(
      within(clippedGroup as HTMLElement).getByTestId("icon-content"),
    ).toBeInTheDocument();
  });

  it("references the generated clip-path ID from the clipped group", () => {
    const { container } = render(
      <HexBadge>
        <rect />
      </HexBadge>,
    );

    const clipPath = container.querySelector("clipPath");
    const clippedGroup = container.querySelector("g[clip-path]");

    expect(clipPath).toBeInTheDocument();
    expect(clipPath?.id).toBeTruthy();
    expect(clippedGroup).toHaveAttribute("clip-path", `url(#${clipPath?.id})`);
  });

  it("renders decorations outside the clipped group", () => {
    const { container } = render(
      <HexBadge decorations={<circle data-testid="decoration" />}>
        <rect data-testid="icon-content" />
      </HexBadge>,
    );

    const svg = container.querySelector("svg");
    const clippedGroup = svg?.querySelector("g[clip-path]");
    const decoration = screen.getByTestId("decoration");

    expect(decoration).toBeInTheDocument();
    expect(clippedGroup).not.toContainElement(decoration);
    expect(decoration.parentElement).toBe(svg);
  });

  it("generates a unique clip-path ID for each instance", () => {
    const { container } = render(
      <div>
        <HexBadge>
          <rect />
        </HexBadge>
        <HexBadge>
          <rect />
        </HexBadge>
      </div>,
    );

    const clipPaths = Array.from(container.querySelectorAll("clipPath"));
    const clipPathIds = clipPaths.map((element) => element.id);

    expect(clipPathIds).toHaveLength(2);
    expect(clipPathIds[0]).toBeTruthy();
    expect(clipPathIds[1]).toBeTruthy();
    expect(new Set(clipPathIds).size).toBe(2);

    const groups = container.querySelectorAll("g[clip-path]");

    expect(groups).toHaveLength(2);

    groups.forEach((group, index) => {
      expect(group).toHaveAttribute("clip-path", `url(#${clipPathIds[index]})`);
    });
  });

  it("scales width to preserve the hexagon aspect ratio when size changes", () => {
    const { container } = render(
      <HexBadge size={66}>
        <rect />
      </HexBadge>,
    );

    const svg = container.querySelector("svg");

    expect(svg).toHaveAttribute("height", "66");
    expect(svg).toHaveAttribute("width", "58");
  });

  it("supports a custom className", () => {
    const { container } = render(
      <HexBadge className="custom-badge">
        <rect />
      </HexBadge>,
    );

    expect(container.querySelector("svg")).toHaveClass("custom-badge");
  });

  it("uses the default shrink-0 class when className is omitted", () => {
    const { container } = render(
      <HexBadge>
        <rect />
      </HexBadge>,
    );

    expect(container.querySelector("svg")).toHaveClass("shrink-0");
  });
});
