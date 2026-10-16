import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { NavLinkItem } from "@build-me/ui/navbar";
import type { RouterNavLinkProps } from "@build-me/ui/navbar";

function makeStubNavLink(isActive: boolean) {
  return function StubNavLink({
    to,
    end,
    children,
    className,
    onClick,
  }: RouterNavLinkProps) {
    const resolvedClassName =
      typeof className === "function" ? className({ isActive }) : className;

    return (
      <a
        href={to}
        data-end={end === undefined ? undefined : String(end)}
        className={resolvedClassName}
        onClick={(event) => {
          event.preventDefault();
          onClick?.(event);
        }}
      >
        {children}
      </a>
    );
  };
}

describe("NavLinkItem", () => {
  it("renders its children as a link with the correct destination", () => {
    render(
      <NavLinkItem as={makeStubNavLink(false)} to="/about">
        About
      </NavLinkItem>,
    );

    expect(screen.getByRole("link", { name: "About" })).toHaveAttribute(
      "href",
      "/about",
    );
  });

  it("applies active styling when isActive is true", () => {
    render(
      <NavLinkItem as={makeStubNavLink(true)} to="/">
        Home
      </NavLinkItem>,
    );

    expect(screen.getByRole("link", { name: "Home" })).toHaveClass(
      "text-white",
    );
  });

  it("applies inactive styling when isActive is false", () => {
    render(
      <NavLinkItem as={makeStubNavLink(false)} to="/about">
        About
      </NavLinkItem>,
    );

    const link = screen.getByRole("link", { name: "About" });

    expect(link).toHaveClass("text-blue-200");
    expect(link).toHaveClass("hover:text-white");
  });

  it("uses the default styling when className is omitted", () => {
    render(
      <NavLinkItem as={makeStubNavLink(true)} to="/">
        Home
      </NavLinkItem>,
    );

    const link = screen.getByRole("link", { name: "Home" });

    expect(link).toHaveClass("relative");
    expect(link).toHaveClass("font-medium");
    expect(link).toHaveClass("text-white");
    expect(link).toHaveClass("focus-visible:ring-2");
  });

  it("supports a custom className function for an active link", () => {
    render(
      <NavLinkItem
        as={makeStubNavLink(true)}
        to="/"
        className={({ isActive }) =>
          isActive ? "custom-active" : "custom-inactive"
        }
      >
        Home
      </NavLinkItem>,
    );

    const link = screen.getByRole("link", { name: "Home" });

    expect(link).toHaveClass("custom-active");
    expect(link).not.toHaveClass("text-white");
  });

  it("supports a custom className function for an inactive link", () => {
    render(
      <NavLinkItem
        as={makeStubNavLink(false)}
        to="/about"
        className={({ isActive }) =>
          isActive ? "custom-active" : "custom-inactive"
        }
      >
        About
      </NavLinkItem>,
    );

    expect(screen.getByRole("link", { name: "About" })).toHaveClass(
      "custom-inactive",
    );
  });

  it("forwards the end prop to the router link", () => {
    render(
      <NavLinkItem as={makeStubNavLink(true)} to="/" end>
        Home
      </NavLinkItem>,
    );

    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute(
      "data-end",
      "true",
    );
  });

  it("forwards the click handler without triggering browser navigation", async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(
      <NavLinkItem as={makeStubNavLink(true)} to="/about" onClick={handleClick}>
        About
      </NavLinkItem>,
    );

    await user.click(screen.getByRole("link", { name: "About" }));

    expect(handleClick).toHaveBeenCalledTimes(1);
    expect(handleClick).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "click",
        defaultPrevented: true,
      }),
    );
  });
});
