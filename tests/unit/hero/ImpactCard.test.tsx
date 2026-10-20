import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

import { ImpactCard } from "../../../apps/web/src/components/Hero/ImpactCard";

describe("ImpactCard", () => {
  it("renders the impact heading", () => {
    render(<ImpactCard />);

    expect(screen.getByText("My Impact in Action ↘")).toBeInTheDocument();
  });

  it("renders all four impact metrics", () => {
    render(<ImpactCard />);

    expect(screen.getByText("99.9%")).toBeInTheDocument();
    expect(screen.getByText("Faster")).toBeInTheDocument();
    expect(screen.getByText("Lower")).toBeInTheDocument();
    expect(screen.getByText("Stronger")).toBeInTheDocument();
  });

  it("renders the correct label for each metric", () => {
    render(<ImpactCard />);

    expect(screen.getByText("System Reliability")).toBeInTheDocument();
    expect(screen.getByText("Time to Market")).toBeInTheDocument();
    expect(screen.getByText("Operational Costs")).toBeInTheDocument();
    expect(screen.getByText("Security & Trust")).toBeInTheDocument();
  });

  it("renders each metric exactly once", () => {
    render(<ImpactCard />);

    for (const value of ["99.9%", "Faster", "Lower", "Stronger"]) {
      expect(screen.getAllByText(value)).toHaveLength(1);
    }
  });
});
