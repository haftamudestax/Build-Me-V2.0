// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ShareButton } from "../../../apps/web/src/components/Footer/Share/ShareButton";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("Share feature integration", () => {
  it("allows a visitor to open the modal and access every sharing channel", async () => {
    const user = userEvent.setup();

    render(<ShareButton />);

    await user.click(screen.getByRole("button", { name: /share this page/i }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();

    const channels = ["X", "Facebook", "LinkedIn", "WhatsApp", "Telegram"];

    for (const channel of channels) {
      expect(
        screen.getByRole("link", {
          name: `Share on ${channel}`,
        }),
      ).toBeInTheDocument();
    }
  });

  it("allows a visitor to copy the current page URL", async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);

    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });

    render(<ShareButton />);

    await user.click(screen.getByRole("button", { name: /share this page/i }));

    const urlInput = screen.getByLabelText(/copy page link/i);
    const expectedUrl = window.location.href;

    expect(urlInput).toHaveValue(expectedUrl);

    await user.click(screen.getByRole("button", { name: /^copy$/i }));

    expect(writeText).toHaveBeenCalledWith(expectedUrl);
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Link copied to clipboard.",
    );
  });

  it("allows a visitor to close the modal and reopen it", async () => {
    const user = userEvent.setup();

    render(<ShareButton />);

    await user.click(screen.getByRole("button", { name: /share this page/i }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: /close share dialog/i }),
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /share this page/i }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});
