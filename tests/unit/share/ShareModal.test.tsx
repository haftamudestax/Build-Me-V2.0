// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ShareModal } from "../../../apps/web/src/components/Footer/Share/ShareModal";

const testUrl = "https://example.com/projects";
const testTitle = "Build Me | Digital Experiences";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("ShareModal", () => {
  it("does not render when closed", () => {
    render(
      <ShareModal
        isOpen={false}
        url={testUrl}
        title={testTitle}
        onClose={vi.fn()}
      />,
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders the sharing options when open", () => {
    render(
      <ShareModal isOpen url={testUrl} title={testTitle} onClose={vi.fn()} />,
    );

    expect(screen.getByRole("dialog")).toBeInTheDocument();

    expect(
      screen.getByRole("link", { name: /share on x/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /share on facebook/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /share on linkedin/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /share on whatsapp/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /share on telegram/i }),
    ).toBeInTheDocument();
  });

  it("builds the correct sharing URLs", () => {
    render(
      <ShareModal isOpen url={testUrl} title={testTitle} onClose={vi.fn()} />,
    );

    expect(screen.getByRole("link", { name: /share on x/i })).toHaveAttribute(
      "href",
      expect.stringContaining("twitter.com/intent/tweet"),
    );

    expect(
      screen.getByRole("link", { name: /share on facebook/i }),
    ).toHaveAttribute(
      "href",
      expect.stringContaining("facebook.com/sharer/sharer.php"),
    );

    expect(
      screen.getByRole("link", { name: /share on linkedin/i }),
    ).toHaveAttribute(
      "href",
      expect.stringContaining("linkedin.com/sharing/share-offsite"),
    );

    expect(
      screen.getByRole("link", { name: /share on whatsapp/i }),
    ).toHaveAttribute("href", expect.stringContaining("wa.me"));

    expect(
      screen.getByRole("link", { name: /share on telegram/i }),
    ).toHaveAttribute("href", expect.stringContaining("t.me/share/url"));
  });

  it("opens external sharing links in a new tab safely", () => {
    render(
      <ShareModal isOpen url={testUrl} title={testTitle} onClose={vi.fn()} />,
    );

    const whatsappLink = screen.getByRole("link", {
      name: /share on whatsapp/i,
    });

    expect(whatsappLink).toHaveAttribute("target", "_blank");
    expect(whatsappLink).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("closes when the close button is clicked", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(
      <ShareModal isOpen url={testUrl} title={testTitle} onClose={onClose} />,
    );

    await user.click(
      screen.getByRole("button", { name: /close share dialog/i }),
    );

    expect(onClose).toHaveBeenCalledOnce();
  });

  it("closes when Escape is pressed", () => {
    const onClose = vi.fn();

    render(
      <ShareModal isOpen url={testUrl} title={testTitle} onClose={onClose} />,
    );

    fireEvent.keyDown(document, { key: "Escape" });

    expect(onClose).toHaveBeenCalledOnce();
  });

  it("closes when the visitor clicks the overlay", () => {
    const onClose = vi.fn();

    render(
      <ShareModal isOpen url={testUrl} title={testTitle} onClose={onClose} />,
    );

    const dialog = screen.getByRole("dialog");

    fireEvent.mouseDown(dialog.parentElement!);

    expect(onClose).toHaveBeenCalledOnce();
  });

  it("copies the page URL to the clipboard", async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);

    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });

    render(
      <ShareModal isOpen url={testUrl} title={testTitle} onClose={vi.fn()} />,
    );

    await user.click(screen.getByRole("button", { name: /^copy$/i }));

    expect(writeText).toHaveBeenCalledWith(testUrl);
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Link copied to clipboard.",
    );
    expect(screen.getByRole("button", { name: /copied/i })).toBeInTheDocument();
  });

  it("displays an error when copying fails", async () => {
    const user = userEvent.setup();
    const writeText = vi
      .fn()
      .mockRejectedValue(new Error("Clipboard unavailable"));

    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });

    render(
      <ShareModal isOpen url={testUrl} title={testTitle} onClose={vi.fn()} />,
    );

    await user.click(screen.getByRole("button", { name: /^copy$/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Unable to copy the link. Please copy it manually.",
    );
  });

  it("uses the native sharing API when available", async () => {
    const user = userEvent.setup();
    const share = vi.fn().mockResolvedValue(undefined);

    Object.defineProperty(navigator, "share", {
      configurable: true,
      value: share,
    });

    render(
      <ShareModal isOpen url={testUrl} title={testTitle} onClose={vi.fn()} />,
    );

    await user.click(
      screen.getByRole("button", { name: /more sharing options/i }),
    );

    expect(share).toHaveBeenCalledWith({
      title: testTitle,
      url: testUrl,
    });
  });

  it("does not display a native share button when unsupported", () => {
    Object.defineProperty(navigator, "share", {
      configurable: true,
      value: undefined,
    });

    render(
      <ShareModal isOpen url={testUrl} title={testTitle} onClose={vi.fn()} />,
    );

    expect(
      screen.queryByRole("button", { name: /more sharing options/i }),
    ).not.toBeInTheDocument();
  });
});
