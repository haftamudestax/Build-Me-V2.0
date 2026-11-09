// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ShareButton } from "../../../apps/web/src/components/Footer/Share/ShareButton";

afterEach(() => {
  cleanup();
});

describe("ShareButton", () => {
  it("renders the share button with its title and tagline", () => {
    render(<ShareButton />);

    expect(
      screen.getByRole("button", { name: /share this page/i }),
    ).toBeInTheDocument();

    expect(
      screen.getByText("Spread value. Inspire others."),
    ).toBeInTheDocument();
  });

  it("opens the share modal when clicked", async () => {
    const user = userEvent.setup();

    render(<ShareButton />);

    await user.click(screen.getByRole("button", { name: /share this page/i }));

    expect(
      screen.getByRole("dialog", { name: /share this page/i }),
    ).toBeInTheDocument();
  });

  it("passes the current page URL and document title to the modal", async () => {
    const user = userEvent.setup();

    window.history.pushState({}, "", "/share-test");
    document.title = "Build Me | Digital Experiences";

    render(<ShareButton />);

    await user.click(screen.getByRole("button", { name: /share this page/i }));

    expect(screen.getByLabelText(/copy page link/i)).toHaveValue(
      window.location.href,
    );

    window.history.replaceState({}, "", "/");
    document.title = "";
  });
});
