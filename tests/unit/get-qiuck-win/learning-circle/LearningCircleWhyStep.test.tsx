// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";

import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { LearningCircleWhyStep } from "../../../../apps/web/src/components/GetQuickWins/learningCircle/LearningCircleWhyStep";

describe("LearningCircleWhyStep", () => {
  it("renders the Learning Circle explanation and learning topics", () => {
    render(
      <LearningCircleWhyStep
        onBack={vi.fn()}
        onJoin={vi.fn()}
        telegramAvailable
      />,
    );

    expect(
      screen.getByRole("heading", {
        name: "Technology Ownership Learning Circle",
      }),
    ).toBeInTheDocument();

    expect(screen.getByText("What you can learn")).toBeInTheDocument();

    expect(screen.getByText("Understand what you own")).toBeInTheDocument();
    expect(screen.getByText("Stay in control")).toBeInTheDocument();
    expect(screen.getByText("Build long-term confidence")).toBeInTheDocument();
  });

  it("calls onJoin when the visitor selects Join", async () => {
    const user = userEvent.setup();
    const onJoin = vi.fn();

    render(
      <LearningCircleWhyStep
        onBack={vi.fn()}
        onJoin={onJoin}
        telegramAvailable
      />,
    );

    await user.click(
      screen.getByRole("button", {
        name: "Join the Learning Circle",
      }),
    );

    expect(onJoin).toHaveBeenCalledOnce();
  });

  it("calls onBack when the visitor selects Back to options", async () => {
    const user = userEvent.setup();
    const onBack = vi.fn();

    render(
      <LearningCircleWhyStep
        onBack={onBack}
        onJoin={vi.fn()}
        telegramAvailable
      />,
    );

    await user.click(screen.getByRole("button", { name: "Back to options" }));

    expect(onBack).toHaveBeenCalledOnce();
  });

  it("disables joining when the Telegram invitation is unavailable", () => {
    render(
      <LearningCircleWhyStep
        onBack={vi.fn()}
        onJoin={vi.fn()}
        telegramAvailable={false}
      />,
    );

    expect(screen.getByRole("button", { name: "Coming soon" })).toBeDisabled();

    expect(screen.getByRole("status")).toHaveTextContent(
      "The Telegram community invitation is being prepared.",
    );
  });
});
