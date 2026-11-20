import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";

import About from "../../../apps/web/src/components/About/About";
import { openWorkWithMe } from "../../../apps/web/src/components/WorkWithMe/openWorkWithMe";

function LocationDisplay() {
  const location = useLocation();

  return (
    <output data-testid="current-location">
      {location.pathname}
      {location.hash}
    </output>
  );
}

function renderApplication(initialPath = "/about") {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <LocationDisplay />

      <Routes>
        <Route path="/about" element={<About />} />
        <Route path="/" element={<main>Home Page</main>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("About page integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  describe("real React Router navigation", () => {
    it("renders About on the /about route", () => {
      renderApplication();

      expect(
        screen.getByRole("heading", { name: "Turning Ideas into Impact" }),
      ).toBeInTheDocument();

      expect(screen.getByTestId("current-location")).toHaveTextContent(
        "/about",
      );
    });

    it("navigates to Home using the Back to Home link", async () => {
      const user = userEvent.setup();

      renderApplication();

      await user.click(screen.getByRole("link", { name: "Back to Home" }));

      expect(screen.getByText("Home Page")).toBeInTheDocument();
      expect(screen.getByTestId("current-location")).toHaveTextContent("/");
    });

    it("navigates to the work section using View My Work", async () => {
      const user = userEvent.setup();

      renderApplication();

      await user.click(screen.getByRole("link", { name: "View My Work" }));

      expect(screen.getByTestId("current-location")).toHaveTextContent(
        "/#main-works",
      );
    });

    it("keeps the About page rendered when opening the resume in a new tab", () => {
      renderApplication();

      const resumeLink = screen.getByRole("link", {
        name: "View Resume",
      });

      expect(resumeLink).toHaveAttribute("href", "/pdf/Resume.pdf");
      expect(resumeLink).toHaveAttribute("target", "_blank");

      expect(
        screen.getByRole("heading", { name: "Turning Ideas into Impact" }),
      ).toBeInTheDocument();
    });
  });

  describe("Work With Me custom events", () => {
    it("dispatches the Coffee With Me action from Get in Touch", () => {
      const dispatchSpy = vi.spyOn(window, "dispatchEvent");

      renderApplication();

      fireEvent.click(screen.getByRole("button", { name: "Get in Touch" }));

      const customEvent = dispatchSpy.mock.calls
        .map(([event]) => event)
        .find((event) => event instanceof CustomEvent);

      expect(customEvent).toBeInstanceOf(CustomEvent);
      expect(customEvent?.detail).toEqual(
        expect.objectContaining({ path: "coffee" }),
      );
    });

    it("dispatches the Delivery Project action from Work With Me", () => {
      const dispatchSpy = vi.spyOn(window, "dispatchEvent");

      renderApplication();

      fireEvent.click(screen.getByRole("button", { name: "Work With Me" }));

      const customEvent = dispatchSpy.mock.calls
        .map(([event]) => event)
        .find((event) => event instanceof CustomEvent);

      expect(customEvent).toBeInstanceOf(CustomEvent);
      expect(customEvent?.detail).toEqual(
        expect.objectContaining({ path: "delivery" }),
      );
    });
  });

  describe("content integration", () => {
    it("renders the story, principles, and professional timeline together", () => {
      renderApplication();

      expect(
        screen.getByRole("heading", { name: "My Story" }),
      ).toBeInTheDocument();

      expect(
        screen.getByRole("heading", { name: "Principles That Drive Me" }),
      ).toBeInTheDocument();

      expect(
        screen.getByRole("heading", { name: "My Journey" }),
      ).toBeInTheDocument();

      expect(
        screen.getByRole("heading", {
          name: "Ready to Create Something Great?",
        }),
      ).toBeInTheDocument();
    });
  });
});
