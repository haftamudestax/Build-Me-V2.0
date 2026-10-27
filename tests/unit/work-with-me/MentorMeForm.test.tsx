import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { MentorMeForm } from "../../../apps/web/src/components/WorkWithMe/MentorMeForm";

const { getAnalyticsConfig } = vi.hoisted(() => ({
  getAnalyticsConfig: vi.fn(),
}));

vi.mock("@build-me/utils", () => ({
  getAnalyticsConfig,
}));

const VALID_VISITOR_ID = "11111111-1111-4111-8111-111111111111";
const VALID_SESSION_ID = "22222222-2222-4222-8222-222222222222";

type MentorMeFormProps = React.ComponentProps<typeof MentorMeForm>;

function renderMentorMeForm(props: Partial<MentorMeFormProps> = {}) {
  return render(
    <MentorMeForm
      onBack={props.onBack ?? vi.fn()}
      onSubmitted={props.onSubmitted ?? vi.fn()}
    />,
  );
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("MentorMeForm", () => {
  it("renders the form heading, fields, and Back button", () => {
    getAnalyticsConfig.mockReturnValue({
      baseUrl: "/api",
      visitorId: VALID_VISITOR_ID,
      sessionId: VALID_SESSION_ID,
    });

    renderMentorMeForm();

    expect(
      screen.getByRole("heading", { name: /mentor me/i }),
    ).toBeInTheDocument();

    expect(screen.getByRole("button", { name: /back/i })).toBeInTheDocument();

    expect(screen.getByRole("textbox", { name: /name/i })).toBeInTheDocument();

    expect(screen.getByRole("textbox", { name: /email/i })).toBeInTheDocument();
  });

  it("calls onBack when the Back button is clicked", async () => {
    const user = userEvent.setup();
    const onBack = vi.fn();

    getAnalyticsConfig.mockReturnValue({
      baseUrl: "/api",
      visitorId: VALID_VISITOR_ID,
      sessionId: VALID_SESSION_ID,
    });

    renderMentorMeForm({ onBack });

    await user.click(screen.getByRole("button", { name: /back/i }));

    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("shows a validation error for an invalid email", async () => {
    const user = userEvent.setup();

    getAnalyticsConfig.mockReturnValue({
      baseUrl: "/api",
      visitorId: VALID_VISITOR_ID,
      sessionId: VALID_SESSION_ID,
    });

    renderMentorMeForm();

    await user.type(
      screen.getByRole("textbox", { name: /name/i }),
      "Test User",
    );

    await user.type(
      screen.getByRole("textbox", { name: /email/i }),
      "invalid-email",
    );

    const form = screen
      .getByRole("heading", { name: /mentor me/i })
      .closest("form");

    expect(form).not.toBeNull();

    fireEvent.submit(form!);

    expect(await screen.findByText(/valid email/i)).toBeInTheDocument();
  });

  it("shows a validation error when the mentoring topic is too short", async () => {
    const user = userEvent.setup();

    getAnalyticsConfig.mockReturnValue({
      baseUrl: "/api",
      visitorId: VALID_VISITOR_ID,
      sessionId: VALID_SESSION_ID,
    });

    renderMentorMeForm();

    await user.type(
      screen.getByRole("textbox", { name: /name/i }),
      "Test User",
    );

    await user.type(
      screen.getByRole("textbox", { name: /email/i }),
      "valid@example.com",
    );

    const topicField = screen.queryByRole("textbox", {
      name: /mentoring topic|what would you like mentoring on/i,
    });

    if (topicField) {
      await user.type(topicField, "AB");
    }

    const form = screen
      .getByRole("heading", { name: /mentor me/i })
      .closest("form");

    expect(form).not.toBeNull();

    fireEvent.submit(form!);

    expect(await screen.findByText(/mentoring topic/i)).toBeInTheDocument();
  });

  it("dispatches a validation-failed analytics event", () => {
    getAnalyticsConfig.mockReturnValue({
      baseUrl: "/api",
      visitorId: VALID_VISITOR_ID,
      sessionId: VALID_SESSION_ID,
    });

    const dispatchSpy = vi.spyOn(window, "dispatchEvent");

    renderMentorMeForm();

    const form = screen
      .getByRole("heading", { name: /mentor me/i })
      .closest("form");

    expect(form).not.toBeNull();

    fireEvent.submit(form!);

    const analyticsEvents = dispatchSpy.mock.calls
      .map(([event]) => event)
      .filter(
        (event): event is CustomEvent =>
          event instanceof CustomEvent && event.type === "build-me:analytics",
      )
      .map((event) => event.detail);

    expect(
      analyticsEvents.some((event) =>
        String(event?.eventName ?? "").includes("validation_failed"),
      ),
    ).toBe(true);
  });
});
