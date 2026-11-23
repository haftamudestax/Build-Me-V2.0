import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ShareButton } from "../../../apps/web/src/components/Footer/Share/ShareButton";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("ShareButton", () => {
  it("renders the share button with its title and tagline", () => {
    render(<ShareButton />);

    const button = screen.getByRole("button", { name: /share this page/i });

    expect(button).toBeInTheDocument();
    expect(screen.getByText(/share this page/i)).toBeInTheDocument();
    expect(
      screen.getByText(/spread value\. inspire others\./i),
    ).toBeInTheDocument();
  });

  it("opens the share modal when clicked", async () => {
    const user = userEvent.setup();

    render(<ShareButton />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /share this page/i }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("passes the current page URL and document title to the modal", async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);

    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });

    window.history.pushState({}, "", "/share-test");
    document.title = "Build Me | Digital Experiences";

    render(<ShareButton />);

    await user.click(screen.getByRole("button", { name: /share this page/i }));

    const xLink = screen.getByRole("link", { name: /share on x/i });
    expect(xLink).toHaveAttribute(
      "href",
      expect.stringContaining(encodeURIComponent(window.location.href)),
    );
    expect(xLink).toHaveAttribute(
      "href",
      expect.stringContaining(encodeURIComponent(document.title)),
    );

    await user.click(screen.getByRole("button", { name: /^copy$/i }));

    expect(writeText).toHaveBeenCalledWith("https://haftamu-desta.vercel.app/");
  });
});
