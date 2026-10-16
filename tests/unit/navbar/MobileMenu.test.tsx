import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { MobileMenu } from "@build-me/ui/navbar";

describe("MobileMenu", () => {
  it("starts closed with an accessible button and no navigation panel", () => {
    render(
      <MobileMenu>
        <a href="/">Home</a>
      </MobileMenu>,
    );

    const button = screen.getByRole("button", { name: "Open menu" });

    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute("type", "button");
    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(button).toHaveAttribute("aria-controls");
    expect(
      screen.queryByRole("navigation", { name: "Mobile navigation" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Home" }),
    ).not.toBeInTheDocument();
  });

  it("opens the navigation panel on click and reveals its children", async () => {
    const user = userEvent.setup();

    render(
      <MobileMenu>
        <a href="/">Home</a>
      </MobileMenu>,
    );

    await user.click(screen.getByRole("button", { name: "Open menu" }));

    const navigation = screen.getByRole("navigation", {
      name: "Mobile navigation",
    });

    expect(navigation).toBeInTheDocument();
    expect(
      within(navigation).getByRole("link", { name: "Home" }),
    ).toHaveAttribute("href", "/");
    expect(screen.getByRole("button", { name: "Close menu" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
  });

  it("closes the navigation panel when the button is clicked again", async () => {
    const user = userEvent.setup();

    render(
      <MobileMenu>
        <a href="/">Home</a>
      </MobileMenu>,
    );

    await user.click(screen.getByRole("button", { name: "Open menu" }));
    await user.click(screen.getByRole("button", { name: "Close menu" }));

    expect(
      screen.queryByRole("navigation", { name: "Mobile navigation" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Close menu" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Open menu" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });

  it("updates aria-expanded and aria-controls consistently", async () => {
    const user = userEvent.setup();

    render(
      <MobileMenu>
        <a href="/">Home</a>
      </MobileMenu>,
    );

    const button = screen.getByRole("button", { name: "Open menu" });
    const panelId = button.getAttribute("aria-controls");

    expect(panelId).toBeTruthy();
    expect(button).toHaveAttribute("aria-expanded", "false");

    await user.click(button);

    const navigation = screen.getByRole("navigation", {
      name: "Mobile navigation",
    });

    expect(button).toHaveAttribute("aria-expanded", "true");
    expect(navigation).toHaveAttribute("id", panelId);

    await user.click(screen.getByRole("button", { name: "Close menu" }));

    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
  });

  it("supports custom button and panel classes", async () => {
    const user = userEvent.setup();

    render(
      <MobileMenu
        buttonClassName="custom-menu-button"
        panelClassName="custom-menu-panel"
      >
        <a href="/">Home</a>
      </MobileMenu>,
    );

    const button = screen.getByRole("button", { name: "Open menu" });

    expect(button).toHaveClass("custom-menu-button");

    await user.click(button);

    expect(
      screen.getByRole("navigation", { name: "Mobile navigation" }),
    ).toHaveClass("custom-menu-panel");
  });

  it("generates unique panel IDs for multiple instances", () => {
    render(
      <>
        <MobileMenu>
          <a href="/one">First</a>
        </MobileMenu>
        <MobileMenu>
          <a href="/two">Second</a>
        </MobileMenu>
      </>,
    );

    const buttons = screen.getAllByRole("button", { name: "Open menu" });
    const panelIds = buttons.map((button) =>
      button.getAttribute("aria-controls"),
    );

    expect(panelIds).toHaveLength(2);
    expect(panelIds[0]).toBeTruthy();
    expect(panelIds[1]).toBeTruthy();
    expect(new Set(panelIds).size).toBe(2);
  });
});
