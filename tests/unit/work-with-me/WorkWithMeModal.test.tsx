import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";

import { WorkWithMeModal } from "../../../apps/web/src/components/WorkWithMe/WorkWithMeModal";
import { OPEN_WORK_WITH_ME_EVENT } from "../../../apps/web/src/components/WorkWithMe/openWorkWithMe";

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
      describedBy,
      onClose,
    }: React.PropsWithChildren<{
      isOpen: boolean;
      labelledBy?: string;
      describedBy?: string;
      onClose: () => void;
      closeOnEscape?: boolean;
      closeOnOverlayClick?: boolean;
      size?: string;
    }>) =>
      isOpen
        ? React.createElement(
            "div",
            {
              role: "dialog",
              "aria-modal": true,
              "aria-labelledby": labelledBy,
              "aria-describedby": describedBy,
            },
            children,
          )
        : null,
  };
});

// Keep modal tests independent from the individual booking forms.
vi.mock(
  "../../../apps/web/src/components/WorkWithMe/DeliveryProjectForm",
  async () => {
    const React = await import("react");

    interface FormProps {
      onSubmitted: (reference: string) => void;
      onBack: () => void;
    }

    function MockDeliveryProjectForm({ onSubmitted, onBack }: FormProps) {
      return React.createElement(
        "div",
        { "data-testid": "delivery-project-form" },
        React.createElement("h3", null, "Delivery Project Form"),
        React.createElement(
          "button",
          { type: "button", onClick: onBack },
          "Back from delivery form",
        ),
        React.createElement(
          "button",
          {
            type: "button",
            onClick: () => onSubmitted("TEST-123"),
          },
          "Submit delivery request",
        ),
      );
    }

    return {
      DeliveryProjectForm: MockDeliveryProjectForm,
    };
  },
);

vi.mock(
  "../../../apps/web/src/components/WorkWithMe/MentorMeForm",
  async () => {
    const React = await import("react");

    interface FormProps {
      onSubmitted: (reference: string) => void;
      onBack: () => void;
    }

    function MockMentorMeForm({ onSubmitted, onBack }: FormProps) {
      return React.createElement(
        "div",
        { "data-testid": "mentor-me-form" },
        React.createElement("h3", null, "Mentor Me Form"),
        React.createElement(
          "button",
          { type: "button", onClick: onBack },
          "Back from mentor form",
        ),
        React.createElement(
          "button",
          {
            type: "button",
            onClick: () => onSubmitted("MENTOR-123"),
          },
          "Submit mentor request",
        ),
      );
    }

    return {
      MentorMeForm: MockMentorMeForm,
    };
  },
);

vi.mock(
  "../../../apps/web/src/components/WorkWithMe/CoffeeWithMeForm",
  async () => {
    const React = await import("react");

    interface FormProps {
      onSubmitted: (reference: string) => void;
      onBack: () => void;
    }

    function MockCoffeeWithMeForm({ onSubmitted, onBack }: FormProps) {
      return React.createElement(
        "div",
        { "data-testid": "coffee-with-me-form" },
        React.createElement("h3", null, "Coffee With Me Form"),
        React.createElement(
          "button",
          { type: "button", onClick: onBack },
          "Back from coffee form",
        ),
        React.createElement(
          "button",
          {
            type: "button",
            onClick: () => onSubmitted("COFFEE-123"),
          },
          "Submit coffee request",
        ),
      );
    }

    return {
      CoffeeWithMeForm: MockCoffeeWithMeForm,
    };
  },
);

function analyticsEvents() {
  const events: string[] = [];

  const handler = (event: Event) => {
    const customEvent = event as CustomEvent<{ eventName: string }>;
    events.push(customEvent.detail.eventName);
  };

  window.addEventListener("build-me:analytics", handler);

  return {
    events,
    cleanup: () => {
      window.removeEventListener("build-me:analytics", handler);
    },
  };
}

/**
 * Dispatch the modal-opening event inside act().
 *
 * WorkWithMeModal listens for this event in useEffect and updates
 * React state. Wrapping the dispatch ensures those updates are
 * committed before the test queries the DOM.
 */
function openWorkWithMe(path?: "delivery" | "mentor" | "coffee") {
  act(() => {
    window.dispatchEvent(
      new CustomEvent(OPEN_WORK_WITH_ME_EVENT, {
        detail: path ? { path } : undefined,
      }),
    );
  });
}

function selectDeliveryPath() {
  fireEvent.click(screen.getByRole("button", { name: /deliver my project/i }));
}

function selectMentorPath() {
  fireEvent.click(screen.getByRole("button", { name: /mentor me/i }));
}

function selectCoffeePath() {
  fireEvent.click(screen.getByRole("button", { name: /coffee with me/i }));
}

function selectPackage(packageName = "Starter MVP") {
  fireEvent.click(
    screen.getByRole("button", {
      name: new RegExp(packageName, "i"),
    }),
  );
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

    try {
      render(<WorkWithMeModal />);

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

      openWorkWithMe();

      expect(screen.getByRole("dialog")).toBeInTheDocument();

      expect(
        screen.getByRole("heading", { name: "Work With Me" }),
      ).toBeInTheDocument();

      expect(
        screen.getByText("Choose how you'd like to work together."),
      ).toBeInTheDocument();

      expect(analytics.events).toContain("work_with_me.opened");
    } finally {
      analytics.cleanup();
    }
  });

  it("opens directly at package selection when a delivery path is requested", () => {
    render(<WorkWithMeModal />);

    openWorkWithMe("delivery");

    expect(
      screen.getByRole("heading", { name: /choose your package/i }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: /starter mvp/i }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: /standard full-stack/i }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: /enterprise system/i }),
    ).toBeInTheDocument();
  });

  it("opens package selection when the delivery path is selected", () => {
    render(<WorkWithMeModal />);

    openWorkWithMe();

    selectDeliveryPath();

    expect(
      screen.getByRole("heading", { name: /choose your package/i }),
    ).toBeInTheDocument();

    expect(screen.getByText("Deliver My Project")).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: /starter mvp/i }),
    ).toBeInTheDocument();
  });

  it("opens package selection when the mentor path is selected", () => {
    render(<WorkWithMeModal />);

    openWorkWithMe();

    selectMentorPath();

    expect(
      screen.getByRole("heading", { name: /choose your package/i }),
    ).toBeInTheDocument();

    expect(screen.getByText("Mentor Me")).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: /code & architecture review/i }),
    ).toBeInTheDocument();
  });

  it("opens package selection when the coffee path is selected", () => {
    render(<WorkWithMeModal />);

    openWorkWithMe();

    selectCoffeePath();

    expect(
      screen.getByRole("heading", { name: /choose your package/i }),
    ).toBeInTheDocument();

    expect(screen.getByText("Coffee With Me")).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: /quick catch-up/i }),
    ).toBeInTheDocument();
  });

  it("opens the delivery form when a delivery package is selected", () => {
    render(<WorkWithMeModal />);

    openWorkWithMe();

    selectDeliveryPath();
    selectPackage("Starter MVP");

    expect(screen.getByTestId("delivery-project-form")).toBeInTheDocument();

    expect(
      screen.getByRole("heading", { name: "Delivery Project Form" }),
    ).toBeInTheDocument();
  });

  it("opens the mentor form when a mentor package is selected", () => {
    render(<WorkWithMeModal />);

    openWorkWithMe();

    selectMentorPath();
    selectPackage("Code & Architecture Review");

    expect(screen.getByTestId("mentor-me-form")).toBeInTheDocument();

    expect(
      screen.getByRole("heading", { name: "Mentor Me Form" }),
    ).toBeInTheDocument();
  });

  it("opens the coffee form when a coffee package is selected", () => {
    render(<WorkWithMeModal />);

    openWorkWithMe();

    selectCoffeePath();
    selectPackage("Quick Catch-up");

    expect(screen.getByTestId("coffee-with-me-form")).toBeInTheDocument();

    expect(
      screen.getByRole("heading", { name: "Coffee With Me Form" }),
    ).toBeInTheDocument();
  });

  it("returns to package selection from the delivery form", () => {
    render(<WorkWithMeModal />);

    openWorkWithMe();

    selectDeliveryPath();
    selectPackage();

    fireEvent.click(screen.getByRole("button", { name: /change package/i }));

    expect(
      screen.getByRole("heading", { name: /choose your package/i }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: /starter mvp/i }),
    ).toBeInTheDocument();
  });

  it("returns to all project paths from package selection", () => {
    render(<WorkWithMeModal />);

    openWorkWithMe();

    selectDeliveryPath();

    fireEvent.click(screen.getByRole("button", { name: /all project paths/i }));

    expect(
      screen.getByRole("heading", { name: "Work With Me" }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: /deliver my project/i }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: /mentor me/i }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: /coffee with me/i }),
    ).toBeInTheDocument();
  });

  it("closes the modal when the close button is clicked", () => {
    render(<WorkWithMeModal />);

    openWorkWithMe();

    expect(screen.getByRole("dialog")).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Close Work With Me modal",
      }),
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("does not show a booking reference before a request is submitted", () => {
    render(<WorkWithMeModal />);

    openWorkWithMe();

    selectDeliveryPath();
    selectPackage();

    expect(screen.queryByText("TEST-123")).not.toBeInTheDocument();

    expect(
      screen.queryByRole("heading", { name: /request submitted/i }),
    ).not.toBeInTheDocument();
  });

  it("shows the confirmation and booking reference after submission", () => {
    render(<WorkWithMeModal />);

    openWorkWithMe();

    selectDeliveryPath();
    selectPackage();

    fireEvent.click(
      screen.getByRole("button", { name: /submit delivery request/i }),
    );

    expect(
      screen.getByRole("heading", { name: /request submitted/i }),
    ).toBeInTheDocument();

    expect(screen.getByText("TEST-123")).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: /copy reference/i }),
    ).toBeInTheDocument();

    expect(screen.getByRole("button", { name: "Done" })).toBeInTheDocument();
  });

  it("tracks the confirmation event after a booking is submitted", () => {
    const analytics = analyticsEvents();

    try {
      render(<WorkWithMeModal />);

      openWorkWithMe();

      selectDeliveryPath();
      selectPackage();

      fireEvent.click(
        screen.getByRole("button", { name: /submit delivery request/i }),
      );

      expect(analytics.events).toContain(
        "delivery_project.confirmation_viewed",
      );
    } finally {
      analytics.cleanup();
    }
  });

  it("closes the modal when Done is clicked after confirmation", () => {
    render(<WorkWithMeModal />);

    openWorkWithMe();

    selectDeliveryPath();
    selectPackage();

    fireEvent.click(
      screen.getByRole("button", { name: /submit delivery request/i }),
    );

    fireEvent.click(screen.getByRole("button", { name: "Done" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
