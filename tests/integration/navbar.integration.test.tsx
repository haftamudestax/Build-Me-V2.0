import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";

import { Navbar } from "../../apps/web/src/components/Navbar/Navbar";

vi.mock("@build-me/ui/navbar", async () => {
  const actual = await vi.importActual<typeof import("@build-me/ui/navbar")>(
    "@build-me/ui/navbar",
  );

  return {
    ...actual,
    trackNavigationEvent: vi.fn(),
    configureNavAnalytics: vi.fn(),
  };
});

import { trackNavigationEvent } from "@build-me/ui/navbar";

function renderAtRoute(initialPath: string) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route
          path="/"
          element={
            <>
              <Navbar />
              <main>Home Page</main>
            </>
          }
        />

        <Route
          path="/test"
          element={
            <>
              <Navbar />
              <main>Test Page</main>
            </>
          }
        />
      </Routes>
    </MemoryRouter>,
  );
}

function getLogoLink() {
  return screen.getByRole("link", { name: "Home" });
}

describe("Navbar integration (real router)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the logo link without a separate Home navigation link", () => {
    renderAtRoute("/");

    expect(getLogoLink()).toBeInTheDocument();

    expect(screen.getAllByRole("link", { name: "Home" })).toHaveLength(1);

    expect(screen.getByText("Home Page")).toBeInTheDocument();
  });

  it("fires the logo_view analytics event when the Navbar mounts", () => {
    renderAtRoute("/");

    expect(trackNavigationEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventName: "navbar.logo_view",
        eventType: "view",
        sourceRoute: "/",
        destinationRoute: "/",
      }),
    );
  });

  it("tracks the logo click with the correct source and destination routes", async () => {
    const user = userEvent.setup();

    renderAtRoute("/test");

    await user.click(getLogoLink());

    expect(trackNavigationEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventName: "navbar.logo_click",
        eventType: "click",
        sourceRoute: "/test",
        destinationRoute: "/",
      }),
    );
  });

  it("navigates from the test route to Home using SPA navigation", async () => {
    const user = userEvent.setup();

    renderAtRoute("/test");

    expect(screen.getByText("Test Page")).toBeInTheDocument();
    expect(screen.queryByText("Home Page")).not.toBeInTheDocument();

    await user.click(getLogoLink());

    expect(screen.getByText("Home Page")).toBeInTheDocument();
    expect(screen.queryByText("Test Page")).not.toBeInTheDocument();
  });

  it("does not throw when clicking the logo while already on Home", async () => {
    const user = userEvent.setup();

    renderAtRoute("/");

    await expect(user.click(getLogoLink())).resolves.toBeUndefined();

    expect(screen.getByText("Home Page")).toBeInTheDocument();

    expect(trackNavigationEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventName: "navbar.logo_click",
        eventType: "click",
        sourceRoute: "/",
        destinationRoute: "/",
      }),
    );
  });
});
