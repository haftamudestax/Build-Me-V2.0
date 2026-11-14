import { act, type ReactNode } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { GetQuickWinsModal } from "../../../apps/web/src/components/GetQuickWins";
import { OPEN_GET_QUICK_WINS_EVENT } from "../../../apps/web/src/components/GetQuickWins";

const { mockTrackEvent, mockTrackToolkit, mockOpenWorkWithMe } = vi.hoisted(
  () => ({
    mockTrackEvent: vi.fn(),
    mockTrackToolkit: vi.fn(),
    mockOpenWorkWithMe: vi.fn(),
  }),
);

vi.mock("@build-me/ui", () => ({
  Modal: ({ isOpen, children }: { isOpen: boolean; children: ReactNode }) =>
    isOpen ? (
      <div role="dialog" aria-modal="true">
        {children}
      </div>
    ) : null,
}));

vi.mock(
  "../../../apps/web/src/components/GetQuickWins/ownershipAudit/analytics",
  () => ({
    trackEvent: mockTrackEvent,
  }),
);

vi.mock("../../../apps/web/src/components/WorkWithMe/openWorkWithMe", () => ({
  openWorkWithMe: mockOpenWorkWithMe,
}));

vi.mock(
  "../../../apps/web/src/components/GetQuickWins/toolkit/toolkitAnalytics",
  () => ({
    trackToolkit: mockTrackToolkit,
  }),
);

vi.mock(
  "../../../apps/web/src/components/GetQuickWins/ownershipAudit/OwnershipAuditIntro",
  () => ({
    OwnershipAuditIntro: ({
      onBack,
      onNext,
    }: {
      onBack: () => void;
      onNext: () => void;
    }) => (
      <section>
        <h2>Technology Ownership Audit Intro</h2>

        <button type="button" onClick={onBack}>
          Back to options
        </button>

        <button type="button" onClick={onNext}>
          Continue to registration
        </button>
      </section>
    ),
  }),
);

vi.mock(
  "../../../apps/web/src/components/GetQuickWins/ownershipAudit/OwnershipAuditQuestions",
  () => ({
    OwnershipAuditQuestions: ({
      onAnswer,
      onFinish,
    }: {
      onAnswer: (questionId: string, points: number) => void;
      onFinish: () => void;
    }) => (
      <section>
        <h2>Ownership Audit Questions</h2>

        <button type="button" onClick={() => onAnswer("question-1", 3)}>
          Select answer
        </button>

        <button type="button" onClick={onFinish}>
          Finish questions
        </button>
      </section>
    ),
  }),
);

vi.mock(
  "../../../apps/web/src/components/GetQuickWins/ownershipAudit/OwnershipAuditScore",
  () => ({
    OwnershipAuditScore: ({
      onPrevious,
      onNext,
    }: {
      onPrevious: () => void;
      onNext: () => void;
    }) => (
      <section>
        <h2>Ownership Audit Score</h2>

        <button type="button" onClick={onPrevious}>
          Back to questions
        </button>

        <button type="button" onClick={onNext}>
          View next steps
        </button>
      </section>
    ),
  }),
);

vi.mock(
  "../../../apps/web/src/components/GetQuickWins/ownershipAudit/OwnershipAuditNextSteps",
  () => ({
    OwnershipAuditNextSteps: ({
      onPrevious,
      onClose,
      onSelectPath,
    }: {
      onPrevious: () => void;
      onClose: () => void;
      onSelectPath: (path: "delivery" | "mentor" | "coffee") => void;
    }) => (
      <section>
        <h2>Ownership Audit Next Steps</h2>

        <button type="button" onClick={onPrevious}>
          Back to score
        </button>

        <button type="button" onClick={onClose}>
          Close next steps
        </button>

        <button type="button" onClick={() => onSelectPath("delivery")}>
          Select delivery project
        </button>

        <button type="button" onClick={() => onSelectPath("mentor")}>
          Select mentoring
        </button>

        <button type="button" onClick={() => onSelectPath("coffee")}>
          Select coffee meeting
        </button>
      </section>
    ),
  }),
);

vi.mock(
  "../../../apps/web/src/components/GetQuickWins/learningCircle/OwnershipLearningCircleFlow",
  () => ({
    OwnershipLearningCircleFlow: ({
      onBack,
      onClose,
      onStepChange,
    }: {
      onBack: () => void;
      onClose: () => void;
      onStepChange?: (step: "why" | "registration" | "join") => void;
    }) => (
      <section>
        <h2>Technology Ownership Learning Circle Flow</h2>

        <button type="button" onClick={onBack}>
          Back to options
        </button>

        <button type="button" onClick={() => onStepChange?.("registration")}>
          Go to learning circle registration
        </button>

        <button type="button" onClick={() => onStepChange?.("join")}>
          Go to learning circle join
        </button>

        <button type="button" onClick={onClose}>
          Close learning circle
        </button>
      </section>
    ),
  }),
);

function openGetQuickWinsModal(): void {
  act(() => {
    window.dispatchEvent(new Event(OPEN_GET_QUICK_WINS_EVENT));
  });
}

function renderGetQuickWinsModal() {
  return render(<GetQuickWinsModal />);
}

function selectAudit(): void {
  fireEvent.click(
    screen.getByRole("button", {
      name: /Technology Ownership Audit/i,
    }),
  );
}

function selectToolkit(): void {
  fireEvent.click(
    screen.getByRole("button", {
      name: /Technology Ownership Toolkit/i,
    }),
  );
}

function selectLearningCircle(): void {
  fireEvent.click(
    screen.getByRole("button", {
      name: /Technology Ownership Learning Circle/i,
    }),
  );
}

function continueFromAuditIntro(): void {
  fireEvent.click(
    screen.getByRole("button", {
      name: "Continue to registration",
    }),
  );
}

function completeAuditRegistration(): void {
  fireEvent.change(
    screen.getByRole("textbox", {
      name: "Full name",
    }),
    {
      target: { value: "Test User" },
    },
  );

  fireEvent.change(
    screen.getByRole("textbox", {
      name: "Email address",
    }),
    {
      target: { value: "test@example.com" },
    },
  );

  fireEvent.click(
    screen.getByRole("button", {
      name: "Next",
    }),
  );
}

function completeToolkitRegistration(): void {
  fireEvent.change(
    screen.getByRole("textbox", {
      name: "Full name",
    }),
    {
      target: { value: "Toolkit User" },
    },
  );

  fireEvent.change(
    screen.getByRole("textbox", {
      name: "Email address",
    }),
    {
      target: { value: "toolkit@example.com" },
    },
  );

  fireEvent.change(
    screen.getByRole("textbox", {
      name: "Organisation (optional)",
    }),
    {
      target: { value: "Example Organisation" },
    },
  );

  fireEvent.click(
    screen.getByRole("button", {
      name: "Open my toolkit",
    }),
  );
}

function completeAuditQuestions(): void {
  fireEvent.click(
    screen.getByRole("button", {
      name: "Select answer",
    }),
  );

  fireEvent.click(
    screen.getByRole("button", {
      name: "Finish questions",
    }),
  );
}

function reachAuditNextSteps(): void {
  selectAudit();
  continueFromAuditIntro();
  completeAuditRegistration();
  completeAuditQuestions();

  fireEvent.click(
    screen.getByRole("button", {
      name: "View next steps",
    }),
  );
}

describe("GetQuickWinsModal integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("does not display the modal before the open event is dispatched", () => {
    renderGetQuickWinsModal();

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    expect(
      screen.queryByRole("heading", {
        name: "Get Quick Wins",
      }),
    ).not.toBeInTheDocument();

    expect(mockTrackEvent).not.toHaveBeenCalled();
  });

  it("opens the modal and displays all three quick-win options", () => {
    renderGetQuickWinsModal();

    openGetQuickWinsModal();

    expect(screen.getByRole("dialog")).toBeInTheDocument();

    expect(
      screen.getByRole("heading", {
        name: "Get Quick Wins",
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: /Technology Ownership Audit/i,
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: /Technology Ownership Toolkit/i,
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: /Technology Ownership Learning Circle/i,
      }),
    ).toBeInTheDocument();

    expect(mockTrackEvent).toHaveBeenCalledWith(
      "get_quick_wins.opened",
      {},
      "get_quick_wins",
    );
  });

  it("registers the open event listener once", () => {
    const addEventListenerSpy = vi.spyOn(window, "addEventListener");

    renderGetQuickWinsModal();

    const registrations = addEventListenerSpy.mock.calls.filter(
      ([eventName]) => eventName === OPEN_GET_QUICK_WINS_EVENT,
    );

    expect(registrations).toHaveLength(1);

    addEventListenerSpy.mockRestore();
  });

  it("opens the Technology Ownership Audit when its option is selected", () => {
    renderGetQuickWinsModal();

    openGetQuickWinsModal();
    selectAudit();

    expect(
      screen.getByRole("heading", {
        name: "Technology Ownership Audit Intro",
      }),
    ).toBeInTheDocument();

    expect(mockTrackEvent).toHaveBeenCalledWith("ownership_audit.selected");

    expect(mockTrackEvent).toHaveBeenCalledWith("ownership_audit.started");
  });

  it("returns from the audit intro to the quick-win options", () => {
    renderGetQuickWinsModal();

    openGetQuickWinsModal();
    selectAudit();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Back to options",
      }),
    );

    expect(
      screen.getByRole("heading", {
        name: "Get Quick Wins",
      }),
    ).toBeInTheDocument();

    expect(
      screen.queryByRole("heading", {
        name: "Technology Ownership Audit Intro",
      }),
    ).not.toBeInTheDocument();

    expect(mockTrackEvent).toHaveBeenCalledWith(
      "ownership_audit.back_to_paths",
    );
  });

  it("moves from audit intro to the real registration form", () => {
    renderGetQuickWinsModal();

    openGetQuickWinsModal();
    selectAudit();
    continueFromAuditIntro();

    expect(
      screen.getByRole("heading", {
        name: "Register for your audit",
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("textbox", {
        name: "Full name",
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("textbox", {
        name: "Email address",
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("textbox", {
        name: "Organisation (optional)",
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: "Next",
      }),
    ).toBeInTheDocument();

    expect(mockTrackEvent).toHaveBeenCalledWith(
      "ownership_audit.step_completed",
      {
        completedStep: 1,
        nextStep: 2,
      },
    );
  });

  it("validates the audit registration before allowing progression", () => {
    renderGetQuickWinsModal();

    openGetQuickWinsModal();
    selectAudit();
    continueFromAuditIntro();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Next",
      }),
    );

    expect(
      screen.getByText("Please enter your name using at least 2 characters."),
    ).toBeInTheDocument();

    expect(
      screen.getByText("Please enter a valid email address."),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("heading", {
        name: "Register for your audit",
      }),
    ).toBeInTheDocument();

    expect(mockTrackEvent).toHaveBeenCalledWith(
      "ownership_audit.validation_failed",
      {
        step: 2,
        fields: ["name", "email"],
      },
    );
  });

  it("moves from audit registration to questions after valid registration", () => {
    renderGetQuickWinsModal();

    openGetQuickWinsModal();
    selectAudit();
    continueFromAuditIntro();
    completeAuditRegistration();

    expect(
      screen.getByRole("heading", {
        name: "Ownership Audit Questions",
      }),
    ).toBeInTheDocument();

    expect(mockTrackEvent).toHaveBeenCalledWith(
      "ownership_audit.registration_completed",
    );

    expect(mockTrackEvent).toHaveBeenCalledWith(
      "ownership_audit.step_completed",
      {
        completedStep: 2,
        nextStep: 3,
      },
    );
  });

  it("tracks audit answers and displays the score after finishing questions", () => {
    renderGetQuickWinsModal();

    openGetQuickWinsModal();
    selectAudit();
    continueFromAuditIntro();
    completeAuditRegistration();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Select answer",
      }),
    );

    expect(mockTrackEvent).toHaveBeenCalledWith(
      "ownership_audit.answer_selected",
      {
        questionId: "question-1",
        points: 3,
        step: 3,
        section: 1,
      },
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Finish questions",
      }),
    );

    expect(
      screen.getByRole("heading", {
        name: "Ownership Audit Score",
      }),
    ).toBeInTheDocument();

    expect(mockTrackEvent).toHaveBeenCalledWith(
      "ownership_audit.completed",
      expect.objectContaining({
        score: expect.any(Number),
        answeredQuestions: 1,
        resultCategory: expect.any(String),
      }),
    );

    expect(mockTrackEvent).toHaveBeenCalledWith(
      "ownership_audit.results_viewed",
      expect.objectContaining({
        score: expect.any(Number),
        resultCategory: expect.any(String),
      }),
    );
  });

  it("moves from the audit score to next steps", () => {
    renderGetQuickWinsModal();

    openGetQuickWinsModal();
    selectAudit();
    continueFromAuditIntro();
    completeAuditRegistration();
    completeAuditQuestions();

    fireEvent.click(
      screen.getByRole("button", {
        name: "View next steps",
      }),
    );

    expect(
      screen.getByRole("heading", {
        name: "Ownership Audit Next Steps",
      }),
    ).toBeInTheDocument();

    expect(mockTrackEvent).toHaveBeenCalledWith(
      "ownership_audit.step_completed",
      {
        completedStep: 4,
        nextStep: 5,
      },
    );

    expect(mockTrackEvent).toHaveBeenCalledWith(
      "ownership_audit.next_steps_viewed",
      expect.objectContaining({
        resultCategory: expect.any(String),
      }),
    );
  });

  it("opens the real Technology Ownership Toolkit flow", () => {
    renderGetQuickWinsModal();

    openGetQuickWinsModal();
    selectToolkit();

    expect(
      screen.getByRole("heading", {
        name: "Why the Technology Ownership Toolkit?",
      }),
    ).toBeInTheDocument();

    expect(screen.getByText("Step 1 of 3")).toBeInTheDocument();

    expect(mockTrackEvent).toHaveBeenCalledWith(
      "ownership_toolkit.selected",
      {},
      "ownership_toolkit",
    );

    expect(mockTrackEvent).toHaveBeenCalledWith(
      "ownership_toolkit.started",
      {},
      "ownership_toolkit",
    );
  });

  it("moves from the toolkit introduction to the real details form", () => {
    renderGetQuickWinsModal();

    openGetQuickWinsModal();
    selectToolkit();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Continue to your details",
      }),
    );

    expect(
      screen.getByRole("heading", {
        name: "Your details",
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("textbox", {
        name: "Full name",
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("textbox", {
        name: "Email address",
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("textbox", {
        name: "Organisation (optional)",
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: "Open my toolkit",
      }),
    ).toBeInTheDocument();

    expect(mockTrackToolkit).toHaveBeenCalledWith(
      "ownership_toolkit.step_completed",
      {
        completedStep: 1,
        nextStep: 2,
      },
    );
  });

  it("validates toolkit registration and keeps the user on the details step", () => {
    renderGetQuickWinsModal();

    openGetQuickWinsModal();
    selectToolkit();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Continue to your details",
      }),
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Open my toolkit",
      }),
    );

    expect(
      screen.getByRole("heading", {
        name: "Your details",
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByText("Please enter your name using at least 2 characters."),
    ).toBeInTheDocument();

    expect(
      screen.getByText("Please enter a valid email address."),
    ).toBeInTheDocument();

    expect(mockTrackToolkit).toHaveBeenCalledWith(
      "ownership_toolkit.validation_failed",
      {
        step: 2,
        fields: ["name", "email"],
      },
    );
  });

  it("opens toolkit content after valid registration", () => {
    renderGetQuickWinsModal();

    openGetQuickWinsModal();
    selectToolkit();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Continue to your details",
      }),
    );

    completeToolkitRegistration();

    expect(
      screen.getByRole("progressbar", {
        name: "Step 3 of 3",
      }),
    ).toBeInTheDocument();

    expect(screen.getByText(/Toolkit User/)).toBeInTheDocument();

    expect(mockTrackToolkit).toHaveBeenCalledWith(
      "ownership_toolkit.registration_completed",
    );

    expect(mockTrackToolkit).toHaveBeenCalledWith(
      "ownership_toolkit.step_completed",
      {
        completedStep: 2,
        nextStep: 3,
      },
    );

    expect(mockTrackToolkit).toHaveBeenCalledWith(
      "ownership_toolkit.content_viewed",
    );
  });

  it("returns from the toolkit flow to the quick-win options", () => {
    renderGetQuickWinsModal();

    openGetQuickWinsModal();
    selectToolkit();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Back",
      }),
    );

    expect(
      screen.getByRole("heading", {
        name: "Get Quick Wins",
      }),
    ).toBeInTheDocument();

    expect(
      screen.queryByRole("heading", {
        name: "Why the Technology Ownership Toolkit?",
      }),
    ).not.toBeInTheDocument();

    expect(mockTrackToolkit).toHaveBeenCalledWith(
      "ownership_toolkit.back_to_paths",
    );
  });

  it("tracks the current toolkit step when the toolkit closes", () => {
    renderGetQuickWinsModal();

    openGetQuickWinsModal();
    selectToolkit();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Continue to your details",
      }),
    );

    completeToolkitRegistration();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Close",
      }),
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    expect(mockTrackEvent).toHaveBeenCalledWith(
      "get_quick_wins.closed",
      {
        lastStep: "content",
      },
      "get_quick_wins",
    );
  });

  it("opens the Technology Ownership Learning Circle", () => {
    renderGetQuickWinsModal();

    openGetQuickWinsModal();
    selectLearningCircle();

    expect(
      screen.getByRole("heading", {
        name: "Technology Ownership Learning Circle Flow",
      }),
    ).toBeInTheDocument();

    expect(mockTrackEvent).toHaveBeenCalledWith(
      "ownership_learning_circle.selected",
    );

    expect(mockTrackEvent).toHaveBeenCalledWith(
      "ownership_learning_circle.started",
    );
  });

  it("returns from the learning circle to the quick-win options", () => {
    renderGetQuickWinsModal();

    openGetQuickWinsModal();
    selectLearningCircle();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Back to options",
      }),
    );

    expect(
      screen.getByRole("heading", {
        name: "Get Quick Wins",
      }),
    ).toBeInTheDocument();

    expect(
      screen.queryByRole("heading", {
        name: "Technology Ownership Learning Circle Flow",
      }),
    ).not.toBeInTheDocument();
  });

  it("tracks the current learning-circle step when the flow closes", () => {
    renderGetQuickWinsModal();

    openGetQuickWinsModal();
    selectLearningCircle();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Go to learning circle join",
      }),
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Close learning circle",
      }),
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    expect(mockTrackEvent).toHaveBeenCalledWith(
      "get_quick_wins.closed",
      {
        lastStep: "join",
      },
      "get_quick_wins",
    );
  });

  it("closes the modal using the close button and tracks the last step", () => {
    renderGetQuickWinsModal();

    openGetQuickWinsModal();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Close Get Quick Wins modal",
      }),
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    expect(mockTrackEvent).toHaveBeenCalledWith(
      "get_quick_wins.closed",
      {
        lastStep: "options",
      },
      "get_quick_wins",
    );
  });

  it("resets to the options screen when the modal is reopened", () => {
    renderGetQuickWinsModal();

    openGetQuickWinsModal();
    selectToolkit();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Back",
      }),
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Close Get Quick Wins modal",
      }),
    );

    openGetQuickWinsModal();

    expect(
      screen.getByRole("heading", {
        name: "Get Quick Wins",
      }),
    ).toBeInTheDocument();

    expect(
      screen.queryByRole("heading", {
        name: "Why the Technology Ownership Toolkit?",
      }),
    ).not.toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: /Technology Ownership Audit/i,
      }),
    ).toBeInTheDocument();
  });

  it.each([
    ["delivery", "Select delivery project"],
    ["mentor", "Select mentoring"],
    ["coffee", "Select coffee meeting"],
  ] as const)(
    "closes the modal and opens the Work With Me %s path",
    async (path, buttonName) => {
      vi.useFakeTimers();

      renderGetQuickWinsModal();

      openGetQuickWinsModal();
      reachAuditNextSteps();

      fireEvent.click(
        screen.getByRole("button", {
          name: buttonName,
        }),
      );

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

      expect(mockTrackEvent).toHaveBeenCalledWith(
        "ownership_audit.path_selected",
        { path },
      );

      expect(mockTrackEvent).toHaveBeenCalledWith(
        "get_quick_wins.closed",
        {
          lastStep: "next",
        },
        "get_quick_wins",
      );

      expect(mockOpenWorkWithMe).not.toHaveBeenCalled();

      await act(async () => {
        vi.runOnlyPendingTimers();
      });

      expect(mockOpenWorkWithMe).toHaveBeenCalledWith(path);
    },
  );
});
