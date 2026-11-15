import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import About from "../../../apps/web/src/components/About/About";
import { openWorkWithMe } from "../../../apps/web/src/components/WorkWithMe/openWorkWithMe";

vi.mock("../../../apps/web/src/components/WorkWithMe/openWorkWithMe", () => ({
  openWorkWithMe: vi.fn(),
}));

function renderAbout(initialPath = "/about") {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/about" element={<About />} />
        <Route path="/" element={<main>Home Page</main>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("About page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  describe("page rendering", () => {
    it("renders the main About heading and introduction", () => {
      renderAbout();

      expect(
        screen.getByRole("heading", { name: "Turning Ideas into Impact" }),
      ).toBeInTheDocument();

      expect(
        screen.getByText(/Full-Stack Developer and Electrical Engineer/),
      ).toBeInTheDocument();

      expect(screen.getByText("TECHNOLOGY OWNERSHIP")).toBeInTheDocument();
      expect(screen.getByText("ABOUT ME")).toBeInTheDocument();
    });

    it("renders the professional story section", () => {
      renderAbout();

      expect(
        screen.getByRole("heading", { name: "My Story" }),
      ).toBeInTheDocument();

      expect(
        screen.getByText("Mekele Institute of Technology"),
      ).toBeInTheDocument();
      expect(
        screen.getByText("Addis Ababa Institute of Technology"),
      ).toBeInTheDocument();
      expect(screen.getByText("Ethiopian Electric Power")).toBeInTheDocument();
      expect(screen.getByText("Microverse")).toBeInTheDocument();
      expect(screen.getByText("freeCodeCamp")).toBeInTheDocument();
    });

    it("renders the portrait with descriptive alternative text", () => {
      renderAbout();

      const portrait = screen.getByRole("img", {
        name: "Portrait of an electrical engineer and full-stack developer",
      });

      expect(portrait).toBeInTheDocument();
      expect(portrait).toHaveAttribute("src", "/images/haftamu_d.jpg");
    });

    it("renders the professional role labels", () => {
      renderAbout();

      expect(screen.getByText("Electrical Engineer")).toBeInTheDocument();
      expect(screen.getByText("Full-Stack Developer")).toBeInTheDocument();
    });
  });

  describe("professional principles", () => {
    it("renders the principles section heading", () => {
      renderAbout();

      expect(
        screen.getByRole("heading", { name: "Principles That Drive Me" }),
      ).toBeInTheDocument();
    });

    it.each([
      "User-Centered Approach",
      "Code Quality & Security",
      "Performance & Efficiency",
      "Attention to Detail",
      "Modern Technology",
      "Problem Solving",
    ])("renders the %s principle", (principle) => {
      renderAbout();

      expect(
        screen.getByRole("heading", { name: principle }),
      ).toBeInTheDocument();
    });
  });

  describe("professional journey", () => {
    it("renders the journey heading and description", () => {
      renderAbout();

      expect(
        screen.getByRole("heading", { name: "My Journey" }),
      ).toBeInTheDocument();

      expect(
        screen.getByText(
          "Key milestones in my academic, professional, and software engineering journey.",
        ),
      ).toBeInTheDocument();
    });

    it.each(["2012", "2013", "2015", "2022", "2023", "2024", "2026"])(
      "renders the %s career milestone",
      (year) => {
        renderAbout();

        expect(screen.getByText(year)).toBeInTheDocument();
      },
    );

    it("renders the milestone titles", () => {
      renderAbout();

      const expectedTitles = [
        "Bachelor's Degree — Electrical Engineering",
        "Master's Program — Railway Systems",
        "Master's Degree & Engineering Career",
        "Full-Stack Development — Microverse",
        "Microverse Alumni & Global Network",
        "Advanced Full-Stack — freeCodeCamp",
        "Resident Engineer — EEP",
      ];

      expectedTitles.forEach((title) => {
        expect(
          screen.getByRole("heading", { name: title }),
        ).toBeInTheDocument();
      });
    });
  });

  describe("navigation", () => {
    it("renders a Back to Home link pointing to the home route", () => {
      renderAbout();

      expect(
        screen.getByRole("link", { name: "Back to Home" }),
      ).toHaveAttribute("href", "/");
    });

    it("navigates to Home when Back to Home is clicked", () => {
      renderAbout();

      fireEvent.click(screen.getByRole("link", { name: "Back to Home" }));

      expect(screen.getByText("Home Page")).toBeInTheDocument();
    });

    it("renders the View My Work link pointing to the work section", () => {
      renderAbout();

      expect(
        screen.getByRole("link", { name: "View My Work" }),
      ).toHaveAttribute("href", "/#main-works");
    });

    it("renders the resume link with the correct destination and security attributes", () => {
      renderAbout();

      const resumeLink = screen.getByRole("link", {
        name: "View Resume",
      });

      expect(resumeLink).toHaveAttribute("href", "/pdf/Resume.pdf");
      expect(resumeLink).toHaveAttribute("target", "_blank");
      expect(resumeLink).toHaveAttribute("rel", "noopener noreferrer");
    });
  });

  describe("Work With Me actions", () => {
    it("opens the Coffee With Me flow from Get in Touch", () => {
      renderAbout();

      fireEvent.click(screen.getByRole("button", { name: "Get in Touch" }));

      expect(openWorkWithMe).toHaveBeenCalledTimes(1);
      expect(openWorkWithMe).toHaveBeenCalledWith("coffee");
    });

    it("opens the Delivery Project flow from Work With Me", () => {
      renderAbout();

      fireEvent.click(screen.getByRole("button", { name: "Work With Me" }));

      expect(openWorkWithMe).toHaveBeenCalledTimes(1);
      expect(openWorkWithMe).toHaveBeenCalledWith("delivery");
    });

    it("renders the final call-to-action heading", () => {
      renderAbout();

      expect(
        screen.getByRole("heading", {
          name: "Ready to Create Something Great?",
        }),
      ).toBeInTheDocument();
    });
  });
});
