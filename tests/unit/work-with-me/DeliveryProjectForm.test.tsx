import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { DeliveryProjectForm } from "../../../apps/web/src/components/WorkWithMe/DeliveryProjectForm";

vi.mock("@build-me/utils", () => ({
  getAnalyticsConfig: vi.fn(),
}));

vi.mock("@build-me/ui", async () => {
  const React = await import("react");

  const Section = ({
    children,
    ...props
  }: React.PropsWithChildren<Record<string, unknown>>) =>
    React.createElement("div", props, children);

  const Card = Object.assign(Section, {
    Header: Section,
    Body: Section,
  });

  return { Card };
});

describe("DeliveryProjectForm", () => {
  const onBack = vi.fn();
  const onSubmitted = vi.fn();

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it("renders all required fields and the optional budget field", () => {
    render(<DeliveryProjectForm onBack={onBack} onSubmitted={onSubmitted} />);

    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/project title/i)).toBeInTheDocument();

    expect(
      screen.getByRole("combobox", { name: /project type/i }),
    ).toBeInTheDocument();

    expect(screen.getByLabelText(/project description/i)).toBeInTheDocument();

    expect(
      screen.getByRole("combobox", { name: /preferred timeline/i }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("combobox", { name: /estimated budget/i }),
    ).toBeInTheDocument();
  });

  it("shows validation errors and does not submit an invalid form", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn();

    vi.stubGlobal("fetch", fetchMock);

    render(<DeliveryProjectForm onBack={onBack} onSubmitted={onSubmitted} />);

    await user.click(
      screen.getByRole("button", {
        name: /submit project request/i,
      }),
    );

    expect(
      await screen.findByText("Enter your full name."),
    ).toBeInTheDocument();

    expect(
      screen.getByText("Enter a valid email address."),
    ).toBeInTheDocument();

    expect(screen.getByText("Enter a project title.")).toBeInTheDocument();

    expect(screen.getByText("Choose a project type.")).toBeInTheDocument();

    expect(
      screen.getByText("Describe your project in at least 20 characters."),
    ).toBeInTheDocument();

    expect(
      screen.getByText("Choose your preferred timeline."),
    ).toBeInTheDocument();

    expect(fetchMock).not.toHaveBeenCalled();
    expect(onSubmitted).not.toHaveBeenCalled();
  });

  it("calls onBack when Back to project paths is clicked", async () => {
    const user = userEvent.setup();

    render(<DeliveryProjectForm onBack={onBack} onSubmitted={onSubmitted} />);

    await user.click(
      screen.getByRole("button", {
        name: /back to project paths/i,
      }),
    );

    expect(onBack).toHaveBeenCalledOnce();
  });
});
