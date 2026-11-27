import type { ReactNode } from "react";

import RocketLaunchOutlinedIcon from "@mui/icons-material/RocketLaunchOutlined";
import SchoolOutlinedIcon from "@mui/icons-material/SchoolOutlined";
import CoffeeOutlinedIcon from "@mui/icons-material/CoffeeOutlined";

export interface CaseStudySection {
  heading: string;
  body: string;
}

export interface CaseStudyResult {
  value: string;
  label: string;
}

export interface CaseStudy {
  id: string;
  title: string;
  badge?: string;
  icon: ReactNode;
  name: string;
  meta: string;
  tags: string[];
  summary: string;
  highlight?: string;
  sections: CaseStudySection[];
  results?: CaseStudyResult[];
  ctaLabel: string;
  ctaHref: string;
}

export const caseStudies: CaseStudy[] = [
  {
    id: "deliver-project",
    title: "Deliver My Project",
    icon: <RocketLaunchOutlinedIcon />,
    name: "Work With Me",
    meta: "Project delivery",
    tags: ["Websites", "Web apps", "Full-stack"],
    summary:
      "Turn your idea into a reliable, well-engineered digital product. I'll work with you from requirements all the way to delivery.",
    sections: [
      {
        heading: "What you get",
        body: "Whether you need a business website, a custom web application, a frontend experience, or a complete full-stack solution, the focus is on building software that is functional, scalable, maintainable, and aligned with your goals.",
      },
      {
        heading: "How we work",
        body: "From understanding your requirements and defining the right technical approach to designing, developing, testing, and delivering the solution, I'll work with you throughout the process. Every project receives thoughtful attention to architecture, usability, performance, and code quality, with clear communication throughout delivery.",
      },
    ],
    ctaLabel: "Start a Project",
    ctaHref: "#work-with-me",
  },
  {
    id: "mentor-me",
    title: "Mentor Me",
    icon: <SchoolOutlinedIcon />,
    name: "Work With Me",
    meta: "Mentorship",
    tags: ["Mentorship", "Code review", "Growth"],
    summary:
      "Develop your technical skills with practical, personalized guidance grounded in real software development experience.",
    sections: [
      {
        heading: "What we cover",
        body: "Whether you're learning frontend development, exploring backend technologies, strengthening your full-stack capabilities, improving your problem-solving approach, or navigating complex technical challenges, we'll focus on the areas that matter most to your growth.",
      },
      {
        heading: "How sessions work",
        body: "Sessions are centered on understanding concepts, reviewing code, discussing development practices, and working through practical problems.",
      },
      {
        heading: "What you gain",
        body: "The goal is to help you build confidence, think more independently, write better software, and develop the skills needed to progress in your engineering journey.",
      },
    ],
    ctaLabel: "Explore Mentorship",
    ctaHref: "#mentorship",
  },
  {
    id: "coffee-with-me",
    title: "Coffee With Me",
    icon: <CoffeeOutlinedIcon />,
    name: "Work With Me",
    meta: "Open conversation",
    tags: ["Conversation", "Ideas", "Collaboration"],
    summary:
      "Sometimes the best opportunities begin with a conversation. Connect, exchange ideas, and see where it leads.",
    sections: [
      {
        heading: "What it is",
        body: "Coffee With Me is an opportunity to connect, exchange ideas, and have an open discussion about technology, software engineering, or potential collaborations.",
      },
      {
        heading: "Who it's for",
        body: "Whether you're exploring a new product idea, looking for another technical perspective, interested in sharing experiences, or simply want to connect with someone who enjoys building digital solutions, you're welcome to start a conversation.",
      },
      {
        heading: "No pressure",
        body: "There's no pressure to have a defined project or agenda. Just bring your curiosity, questions, or ideas, and let's see where the conversation leads.",
      },
    ],
    ctaLabel: "Let's Connect",
    ctaHref: "#contact",
  },
];
