import type { ComponentProps, MouseEvent, ReactNode } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { BrandLogo } from "./BrandLogo";

interface MockLinkProps {
  to: string;
  "aria-label"?: string;
  className?: string;
  onClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
  children?: ReactNode;
}

/**
 * Lightweight link mock that avoids requiring React Router
 * when testing the shared BrandLogo component.
 */
function MockLink({ to, children, ...props }: MockLinkProps) {
  return (
    <a href={to} {...props}>
      {children}
    </a>
  );
}

/**
 * Ensure every test starts with a clean DOM.
 */
afterEach(() => {
  cleanup();
});

function renderBrandLogo(
  props: Partial<ComponentProps<typeof BrandLogo>> = {},
) {
  return render(
    <BrandLogo
      as={MockLink}
      href="/"
      ariaLabel="Home"
      mark={<svg data-testid="brand-mark" aria-hidden="true" />}
      wordmark={<span>Haftamu Desta</span>}
      {...props}
    />,
  );
}

describe("BrandLogo", () => {
  it("renders an accessible link to the supplied destination", () => {
    renderBrandLogo({ href: "/home" });

    const logo = screen.getByRole("link", { name: "Home" });

    expect(logo).toBeInTheDocument();
    expect(logo).toHaveAttribute("href", "/home");
  });

  it("renders the brand mark and wordmark", () => {
    renderBrandLogo();

    expect(screen.getByTestId("brand-mark")).toBeInTheDocument();
    expect(screen.getByText("Haftamu Desta")).toBeInTheDocument();
  });

  it("renders all tagline lines when supplied", () => {
    renderBrandLogo({
      taglineLines: [
        <span key="role">Electrical Engineer</span>,
        <span key="specialty">Full Stack Developer</span>,
      ],
    });

    expect(screen.getByTestId("brand-logo-tagline")).toBeInTheDocument();
    expect(screen.getByText("Electrical Engineer")).toBeInTheDocument();
    expect(screen.getByText("Full Stack Developer")).toBeInTheDocument();
  });

  it("does not render the tagline container when no tagline is supplied", () => {
    renderBrandLogo();

    expect(screen.queryByTestId("brand-logo-tagline")).not.toBeInTheDocument();
  });

  it("calls onLogoClick when the logo is clicked", () => {
    const onLogoClick = vi.fn();

    renderBrandLogo({ onLogoClick });

    fireEvent.click(screen.getByRole("link", { name: "Home" }));

    expect(onLogoClick).toHaveBeenCalledTimes(1);
    expect(onLogoClick).toHaveBeenCalledWith(
      expect.objectContaining({ type: "click" }),
    );
  });

  it("uses the supplied class name", () => {
    renderBrandLogo({ className: "custom-brand-logo" });

    expect(screen.getByRole("link", { name: "Home" })).toHaveClass(
      "custom-brand-logo",
    );
  });
});
