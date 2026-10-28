import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { WorkWithMeModal } from "../../../apps/web/src/components/WorkWithMe/WorkWithMeModal";

afterEach(() => {
  cleanup();
});

describe("Work With Me — Mentor Me flow integration", () => {
  it("opens the Work With Me modal and displays project paths", async () => {
    const user = userEvent.setup();

    render(<WorkWithMeModal />);

    await user.click(screen.getByRole("button", { name: "Work With Me" }));

    const dialog = await screen.findByRole("dialog");

    expect(
      within(dialog).getByRole("heading", {
        name: "Work With Me",
      }),
    ).toBeInTheDocument();

    expect(
      within(dialog).getByRole("button", {
        name: /Mentor Me:/,
      }),
    ).toBeInTheDocument();
  });

  it("opens the Mentor Me form when the user selects that path", async () => {
    const user = userEvent.setup();

    render(<WorkWithMeModal />);

    await user.click(screen.getByRole("button", { name: "Work With Me" }));

    const dialog = await screen.findByRole("dialog");

    await user.click(
      within(dialog).getByRole("button", {
        name: /Mentor Me:/,
      }),
    );

    expect(
      await within(dialog).findByRole("heading", {
        name: "Mentor Me",
      }),
    ).toBeInTheDocument();

    expect(
      within(dialog).getByRole("textbox", {
        name: /Full name/i,
      }),
    ).toBeInTheDocument();
  });

  it("returns to project path selection when All project paths is clicked", async () => {
    const user = userEvent.setup();

    render(<WorkWithMeModal />);

    await user.click(screen.getByRole("button", { name: "Work With Me" }));

    const dialog = await screen.findByRole("dialog");

    await user.click(
      within(dialog).getByRole("button", {
        name: /Mentor Me:/,
      }),
    );

    expect(
      await within(dialog).findByRole("heading", {
        name: "Mentor Me",
      }),
    ).toBeInTheDocument();

    await user.click(
      within(dialog).getByRole("button", {
        name: "All project paths",
      }),
    );

    expect(
      await within(dialog).findByRole("heading", {
        name: "Work With Me",
      }),
    ).toBeInTheDocument();

    expect(
      within(dialog).getByRole("button", {
        name: /Mentor Me:/,
      }),
    ).toBeInTheDocument();
  });

  it("closes the modal when the close button is clicked", async () => {
    const user = userEvent.setup();

    render(<WorkWithMeModal />);

    await user.click(screen.getByRole("button", { name: "Work With Me" }));

    expect(await screen.findByRole("dialog")).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", {
        name: "Close Work With Me modal",
      }),
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders the actual Mentor Me form with its required fields", async () => {
    const user = userEvent.setup();

    render(<WorkWithMeModal />);

    await user.click(screen.getByRole("button", { name: "Work With Me" }));

    const dialog = await screen.findByRole("dialog");

    await user.click(
      within(dialog).getByRole("button", {
        name: /Mentor Me:/,
      }),
    );

    expect(
      await within(dialog).findByRole("heading", {
        name: "Mentor Me",
      }),
    ).toBeInTheDocument();

    expect(
      within(dialog).getByRole("textbox", {
        name: /Full name/i,
      }),
    ).toBeRequired();

    expect(
      within(dialog).getByRole("textbox", {
        name: /Email/i,
      }),
    ).toBeRequired();

    expect(
      within(dialog).getByRole("button", {
        name: /submit|send|request|book/i,
      }),
    ).toBeInTheDocument();
  });

  it("allows the user to navigate back to project paths from the Mentor Me form", async () => {
    const user = userEvent.setup();

    render(<WorkWithMeModal />);

    await user.click(screen.getByRole("button", { name: "Work With Me" }));

    const dialog = await screen.findByRole("dialog");

    await user.click(
      within(dialog).getByRole("button", {
        name: /Mentor Me:/,
      }),
    );

    expect(
      await within(dialog).findByRole("heading", {
        name: "Mentor Me",
      }),
    ).toBeInTheDocument();

    await user.click(
      within(dialog).getByRole("button", {
        name: "All project paths",
      }),
    );

    expect(
      await within(dialog).findByRole("heading", {
        name: "Work With Me",
      }),
    ).toBeInTheDocument();
  });
});
