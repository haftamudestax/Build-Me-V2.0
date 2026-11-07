import type { ReactNode } from "react";

import RocketLaunchOutlinedIcon from "@mui/icons-material/RocketLaunchOutlined";
import SchoolOutlinedIcon from "@mui/icons-material/SchoolOutlined";
import CoffeeOutlinedIcon from "@mui/icons-material/CoffeeOutlined";

export interface CaseStudy {
  id: string;
  title: string;
  description: string;
  icon: ReactNode;
}

export const caseStudies: CaseStudy[] = [
  {
    id: "deliver-project",
    title: "Deliver My Project",
    description:
      "Turn your idea into a reliable, well-engineered digital product. From understanding your requirements and defining the right technical approach to designing, developing, testing, and delivering the solution, I'll work with you throughout the process. Whether you need a business website, a custom web application, a frontend experience, or a complete full-stack solution, the focus is on building software that is functional, scalable, maintainable, and aligned with your goals. Every project receives thoughtful attention to architecture, usability, performance, and code quality, with clear communication throughout delivery.",
    icon: <RocketLaunchOutlinedIcon />,
  },
  {
    id: "mentor-me",
    title: "Mentor Me",
    description:
      "Develop your technical skills with practical, personalized guidance grounded in real software development experience. Whether you're learning frontend development, exploring backend technologies, strengthening your full-stack capabilities, improving your problem-solving approach, or navigating complex technical challenges, we'll focus on the areas that matter most to your growth. Sessions are centered on understanding concepts, reviewing code, discussing development practices, and working through practical problems. The goal is to help you build confidence, think more independently, write better software, and develop the skills needed to progress in your engineering journey.",
    icon: <SchoolOutlinedIcon />,
  },
  {
    id: "coffee-with-me",
    title: "Coffee With Me",
    description:
      "Sometimes the best opportunities begin with a conversation. Coffee With Me is an opportunity to connect, exchange ideas, and have an open discussion about technology, software engineering, entrepreneurship, career development, or potential collaborations. Whether you're exploring a new product idea, looking for another technical perspective, interested in sharing experiences, or simply want to connect with someone who enjoys building digital solutions, you're welcome to start a conversation. There's no pressure to have a defined project or agenda. Just bring your curiosity, questions, or ideas, and let's see where the conversation leads.",
    icon: <CoffeeOutlinedIcon />,
  },
];
