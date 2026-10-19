import { describe, it, expect, vi } from "vitest";
import type { MouseEvent as ReactMouseEvent, ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { BrandLogo } from "@build-me/ui/navbar";
import type { RouterLinkProps } from "@build-me/ui/navbar";

interface StubLinkProps extends RouterLinkProps {
  children?: ReactNode;
}

function StubLink({
  to,
  children,
  className,
  "aria-label": ariaLabel,
  onClick,
}: StubLinkProps) {
  return (
    <a href={to} className={className} aria-label={ariaLabel} onClick={onClick}>
      {children}
    </a>
  );
}

describe("BrandLogo", () => {
  it("renders the mark, wordmark, and tagline lines", () => {
    render(
      <BrandLogo
        as={StubLink}
        href="/"
        ariaLabel="Home"
        mark={<span data-testid="brand-logo-mark">M</span>}
        wordmark={<span data-testid="brand-logo-wordmark">Brand</span>}
        taglineLines={[
          <span key="a">Line A</span>,
          <span key="b">Line B</span>,
        ]}
      />,
    );

    expect(screen.getByTestId("brand-logo-mark")).toBeInTheDocument();
    expect(screen.getByTestId("brand-logo-wordmark")).toBeInTheDocument();
    expect(screen.getByTestId("brand-logo-tagline")).toBeInTheDocument();
    expect(screen.getByText("Line A")).toBeInTheDocument();
    expect(screen.getByText("Line B")).toBeInTheDocument();
  });

  it("uses the injected link component with the correct href and accessible name", () => {
    render(
      <BrandLogo
        as={StubLink}
        href="/"
        ariaLabel="Home"
        mark={<span>M</span>}
      />,
    );

    const link = screen.getByRole("link", { name: "Home" });

    expect(link).toHaveAttribute("href", "/");
    expect(link).toHaveAttribute("aria-label", "Home");
  });

  it("calls onLogoClick when clicked", async () => {
    const user = userEvent.setup();
    const onLogoClick = vi.fn();

    render(
      <BrandLogo
        as={StubLink}
        href="/"
        ariaLabel="Home"
        mark={<span>M</span>}
        onLogoClick={onLogoClick}
      />,
    );

    await user.click(screen.getByRole("link", { name: "Home" }));

    expect(onLogoClick).toHaveBeenCalledTimes(1);
  });

  it("passes the click event to onLogoClick so the consumer can preventDefault (AC-06 guard)", async () => {
    const user = userEvent.setup();

    const onLogoClick = vi.fn((event: ReactMouseEvent<Element>) => {
      event.preventDefault();
    });

    render(
      <BrandLogo
        as={StubLink}
        href="/"
        ariaLabel="Home"
        mark={<span>M</span>}
        onLogoClick={onLogoClick}
      />,
    );

    await user.click(screen.getByRole("link", { name: "Home" }));

    expect(onLogoClick).toHaveBeenCalledTimes(1);

    const event = onLogoClick.mock.calls[0][0];

    expect(event).toBeDefined();
    expect(event.defaultPrevented).toBe(true);
  });

  it("does not render a tagline wrapper when taglineLines is omitted", () => {
    render(
      <BrandLogo
        as={StubLink}
        href="/"
        ariaLabel="Home"
        mark={<span>M</span>}
        wordmark={<span>Brand</span>}
      />,
    );

    expect(screen.queryByTestId("brand-logo-tagline")).not.toBeInTheDocument();
  });

  it("does not render a tagline wrapper when taglineLines is empty", () => {
    render(
      <BrandLogo
        as={StubLink}
        href="/"
        ariaLabel="Home"
        mark={<span>M</span>}
        wordmark={<span>Brand</span>}
        taglineLines={[]}
      />,
    );

    expect(screen.queryByTestId("brand-logo-tagline")).not.toBeInTheDocument();
  });

  it("renders the mark without a text-content wrapper when wordmark and tagline are omitted", () => {
    render(
      <BrandLogo
        as={StubLink}
        href="/"
        ariaLabel="Home"
        mark={<span data-testid="brand-logo-mark">M</span>}
      />,
    );

    expect(screen.getByTestId("brand-logo-mark")).toBeInTheDocument();
    expect(screen.queryByTestId("brand-logo-tagline")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Home" })).toBeInTheDocument();
  });
});
