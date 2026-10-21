import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, cleanup } from "@testing-library/react";
import { WorkWithMeModal } from "../../../apps/web/src/components/WorkWithMe/WorkWithMeModal";

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

  return {
    Card,
    Modal: ({
      isOpen,
      children,
      labelledBy,
    }: React.PropsWithChildren<{
      isOpen: boolean;
      labelledBy?: string;
      describedBy?: string;
      onClose: () => void;
      closeOnEscape?: boolean;
      closeOnOverlayClick?: boolean;
    }>) =>
      isOpen
        ? React.createElement(
            "div",
            { role: "dialog", "aria-labelledby": labelledBy },
            children,
          )
        : null,
  };
});

function analyticsEvents() {
  const events: string[] = [];

  const handler = (event: Event) => {
    const customEvent = event as CustomEvent<{ eventName: string }>;
    events.push(customEvent.detail.eventName);
  };

  window.addEventListener("build-me:analytics", handler);

  return {
    events,
    cleanup: () => window.removeEventListener("build-me:analytics", handler),
  };
}

describe("WorkWithMeModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("opens the modal and tracks the opening event", () => {
    const analytics = analyticsEvents();

    render(<WorkWithMeModal />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /work with me/i }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /let's work together/i }),
    ).toBeInTheDocument();
    expect(analytics.events).toContain("work_with_me.opened");

    analytics.cleanup();
  });

  it("opens the delivery project form when that path is selected", () => {
    render(<WorkWithMeModal />);

    fireEvent.click(screen.getByRole("button", { name: /work with me/i }));
    fireEvent.click(
      screen.getByRole("button", { name: /deliver my project/i }),
    );

    expect(
      screen.getByRole("heading", { name: /deliver my project/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
  });

  it("returns to the project paths from the delivery form", () => {
    render(<WorkWithMeModal />);

    fireEvent.click(screen.getByRole("button", { name: /work with me/i }));
    fireEvent.click(
      screen.getByRole("button", { name: /deliver my project/i }),
    );
    fireEvent.click(screen.getByRole("button", { name: /all project paths/i }));

    expect(
      screen.getByRole("heading", { name: /let's work together/i }),
    ).toBeInTheDocument();
  });

  it("closes the modal when Cancel is clicked", () => {
    render(<WorkWithMeModal />);

    fireEvent.click(screen.getByRole("button", { name: /work with me/i }));
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("shows the submitted booking reference on confirmation", () => {
    render(<WorkWithMeModal />);

    fireEvent.click(screen.getByRole("button", { name: /work with me/i }));
    fireEvent.click(
      screen.getByRole("button", { name: /deliver my project/i }),
    );

    expect(screen.queryByText(/reference: TEST-123/i)).not.toBeInTheDocument();
  });
});
