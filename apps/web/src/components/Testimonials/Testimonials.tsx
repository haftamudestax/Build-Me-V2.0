import { useState, type SyntheticEvent } from "react";
import { Box, Tab, Tabs, Typography } from "@mui/material";

import { ReviewSummary } from "./ReviewSummary";
import { TestimonialCard } from "./TestimonialCard";
import { CaseStudyCard } from "./CaseStudyCard";
import { caseStudies } from "./caseStudiesData";
import { ComingSoonCard } from "./ComingSoonCard";
import { CarouselNavigation } from "./CarouselNavigation";

import { summarizeReviews, testimonials } from "../../utils/testimonialsData";

type TabValue = "testimonials" | "case-studies";

const CARDS_PER_PAGE = 4;

type TestimonialItem =
  | {
      type: "testimonial";
      id: string;
      testimonial: (typeof testimonials)[number];
    }
  | {
      type: "coming-soon";
      id: string;
    };

function getPageCount(totalItems: number): number {
  return Math.max(1, Math.ceil(totalItems / CARDS_PER_PAGE));
}

function getPageItems<T>(items: T[], currentPage: number): T[] {
  const totalPages = getPageCount(items.length);
  const safePage = Math.max(0, Math.min(currentPage, totalPages - 1));

  const startIndex = safePage * CARDS_PER_PAGE;

  return items.slice(startIndex, startIndex + CARDS_PER_PAGE);
}

function getSafePage(page: number, totalItems: number): number {
  return Math.max(0, Math.min(page, getPageCount(totalItems) - 1));
}

export function Testimonials() {
  const [activeTab, setActiveTab] = useState<TabValue>("testimonials");

  const [testimonialPage, setTestimonialPage] = useState<number>(0);
  const [caseStudyPage, setCaseStudyPage] = useState<number>(0);

  const genuineTestimonials = testimonials.filter(
    (testimonial) => !testimonial.isSample,
  );

  const summary = summarizeReviews(genuineTestimonials);

  const testimonialCards: TestimonialItem[] = [
    ...genuineTestimonials.map((testimonial) => ({
      type: "testimonial" as const,
      id: testimonial.id,
      testimonial,
    })),
    {
      type: "coming-soon" as const,
      id: "coming-soon",
    },
  ];

  const testimonialPageCount = getPageCount(testimonialCards.length);
  const caseStudyPageCount = getPageCount(caseStudies.length);

  const safeTestimonialPage = getSafePage(
    testimonialPage,
    testimonialCards.length,
  );

  const safeCaseStudyPage = getSafePage(caseStudyPage, caseStudies.length);

  const visibleTestimonials: TestimonialItem[] = getPageItems(
    testimonialCards,
    safeTestimonialPage,
  );

  const visibleCaseStudies = getPageItems(caseStudies, safeCaseStudyPage);

  const handleTabChange = (
    _event: SyntheticEvent,
    newValue: TabValue,
  ): void => {
    setActiveTab(newValue);
  };

  const handleTestimonialPageChange = (page: number): void => {
    setTestimonialPage(getSafePage(page, testimonialCards.length));
  };

  const handleCaseStudyPageChange = (page: number): void => {
    setCaseStudyPage(getSafePage(page, caseStudies.length));
  };

  return (
    <Box
      component="section"
      id="testimonials"
      aria-labelledby="testimonials-title"
      sx={{
        width: "100%",
        maxWidth: 1200,
        mx: "auto",
        px: { xs: 2, sm: 3 },
        py: { xs: 6, md: 8 },
        boxSizing: "border-box",
      }}
    >
      <Box component="header" sx={{ mb: 4, textAlign: "center" }}>
        <Typography
          id="testimonials-title"
          component="h2"
          variant="h3"
          sx={{
            fontWeight: 900,
            letterSpacing: "-0.04em",
            color: "text.primary",
            mb: 1.5,
          }}
        >
          Trusted Words. Real Experiences.
        </Typography>

        <Typography
          variant="body1"
          color="text.secondary"
          sx={{
            maxWidth: 630,
            mx: "auto",
            lineHeight: 1.8,
            fontSize: "1.05rem",
            textAlign: "left",
          }}
        >
          Genuine feedback and experiences from the people and teams I've had
          the pleasure of working with.
        </Typography>
      </Box>

      <Box sx={{ mb: 3 }}>
        <ReviewSummary summary={summary} />
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          aria-label="Testimonials and case studies"
          variant="fullWidth"
          textColor="primary"
          indicatorColor="primary"
        >
          <Tab
            value="testimonials"
            label="Testimonials"
            id="testimonials-tab"
            aria-controls="testimonials-panel"
          />

          <Tab
            value="case-studies"
            label="Case Studies"
            id="case-studies-tab"
            aria-controls="case-studies-panel"
          />
        </Tabs>
      </Box>

      {/* Testimonials Tab */}
      <Box
        role="tabpanel"
        id="testimonials-panel"
        aria-labelledby="testimonials-tab"
        hidden={activeTab !== "testimonials"}
      >
        {activeTab === "testimonials" && (
          <>
            <Box
              data-testid="testimonials-list"
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "minmax(0, 1fr)",
                  sm: "repeat(2, minmax(0, 1fr))",
                  lg: "repeat(4, minmax(0, 1fr))",
                },
                gap: 2.5,
              }}
            >
              {visibleTestimonials.map((item) =>
                item.type === "testimonial" ? (
                  <TestimonialCard
                    key={item.id}
                    testimonial={item.testimonial}
                  />
                ) : (
                  <ComingSoonCard
                    key={item.id}
                    title="More testimonials coming soon"
                    description="More feedback and experiences from people I've worked with will be shared here."
                  />
                ),
              )}
            </Box>

            <CarouselNavigation
              currentPage={safeTestimonialPage}
              totalPages={testimonialPageCount}
              onPageChange={handleTestimonialPageChange}
            />
          </>
        )}
      </Box>

      {/* Case Studies Tab */}
      <Box
        role="tabpanel"
        id="case-studies-panel"
        aria-labelledby="case-studies-tab"
        hidden={activeTab !== "case-studies"}
      >
        {activeTab === "case-studies" && (
          <>
            <Box
              data-testid="case-studies-list"
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "minmax(0, 1fr)",
                  sm: "repeat(2, minmax(0, 1fr))",
                  lg: "repeat(4, minmax(0, 1fr))",
                },
                gap: 2.5,
              }}
            >
              <CaseStudyCard items={visibleCaseStudies} />
            </Box>

            <CarouselNavigation
              currentPage={safeCaseStudyPage}
              totalPages={caseStudyPageCount}
              onPageChange={handleCaseStudyPageChange}
            />
          </>
        )}
      </Box>
    </Box>
  );
}
