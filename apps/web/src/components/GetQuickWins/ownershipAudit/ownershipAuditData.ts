import type { WorkWithMePath } from "../../WorkWithMe/openWorkWithMe";

export type AuditQuestion = {
  id: string;
  question: string;
  help: string;
  answers: { label: string; points: number }[];
};

export type AuditSection = {
  title: string;
  questions: AuditQuestion[];
};

export type AuditAnswers = Record<string, number>;

export type ResultCategory = "strong" | "developing" | "high_risk";

export const auditSections: AuditSection[] = [
  {
    title: "Technology ownership",
    questions: [
      {
        id: "domain",
        question: "Who controls your domain name?",
        help: "Consider who owns the registrar account and can change its settings.",
        answers: [
          { label: "I control the account and renewal", points: 2 },
          { label: "A provider manages it, but I have access", points: 1 },
          { label: "A provider controls it entirely", points: 0 },
        ],
      },
      {
        id: "hosting",
        question: "Who controls your hosting or cloud account?",
        help: "You should know where your application runs and who can administer it.",
        answers: [
          {
            label: "I own the account and have administrator access",
            points: 2,
          },
          { label: "I have limited access or shared control", points: 1 },
          { label: "Only my developer or provider has access", points: 0 },
        ],
      },
      {
        id: "source_code",
        question: "Can you access and retain your application's source code?",
        help: "For example, through a repository that you own or control.",
        answers: [
          { label: "Yes, I control the repository", points: 2 },
          { label: "I can request a copy from my provider", points: 1 },
          { label: "I cannot access or obtain it reliably", points: 0 },
        ],
      },
    ],
  },
  {
    title: "Access and independence",
    questions: [
      {
        id: "credentials",
        question:
          "Do you control the critical accounts your business depends on?",
        help: "Think about email, analytics, payment services, and other essential accounts.",
        answers: [
          { label: "Yes, with appropriate administrator access", points: 2 },
          { label: "I control some, but not all", points: 1 },
          { label: "Most are controlled by someone else", points: 0 },
        ],
      },
      {
        id: "documentation",
        question: "Could another qualified developer understand your setup?",
        help: "Documentation, configuration instructions, and clear ownership help with handover.",
        answers: [
          {
            label: "Yes, documentation and handover information are available",
            points: 2,
          },
          {
            label: "Some information exists, but important gaps remain",
            points: 1,
          },
          {
            label: "Essential knowledge exists only with one person",
            points: 0,
          },
        ],
      },
      {
        id: "providers",
        question: "Could you change technology providers if needed?",
        help: "Consider whether you have access, exports, and a practical migration path.",
        answers: [
          {
            label:
              "Yes, I understand the process and have the necessary access",
            points: 2,
          },
          {
            label: "Possibly, but it would require significant help",
            points: 1,
          },
          { label: "No, I would struggle to move away", points: 0 },
        ],
      },
    ],
  },
  {
    title: "Continuity and risk",
    questions: [
      {
        id: "backups",
        question: "Are your important data and systems backed up?",
        help: "A backup is most useful when you know how to restore it.",
        answers: [
          { label: "Yes, and recovery has been tested", points: 2 },
          {
            label: "Backups exist, but recovery is untested or uncertain",
            points: 1,
          },
          { label: "I do not know or have no reliable backups", points: 0 },
        ],
      },
      {
        id: "renewals",
        question: "Can you identify and manage critical renewals and costs?",
        help: "Include domains, hosting, subscriptions, certificates, and third-party services.",
        answers: [
          {
            label: "Yes, ownership, costs, and renewals are documented",
            points: 2,
          },
          { label: "I know some, but the picture is incomplete", points: 1 },
          { label: "I do not have a reliable inventory", points: 0 },
        ],
      },
      {
        id: "maintenance",
        question: "Do you have a plan for maintenance and incidents?",
        help: "Consider updates, security issues, downtime, and who responds when something fails.",
        answers: [
          {
            label: "Yes, responsibilities and recovery steps are clear",
            points: 2,
          },
          {
            label: "Support is available, but the plan is informal",
            points: 1,
          },
          { label: "I rely on reacting when something goes wrong", points: 0 },
        ],
      },
    ],
  },
];

export const TOTAL_QUESTIONS = auditSections.reduce(
  (total, section) => total + section.questions.length,
  0,
);

const MAX_POINTS_PER_QUESTION = 2;

export function calculateScore(answers: AuditAnswers): number {
  const points = Object.values(answers).reduce(
    (total, value) => total + value,
    0,
  );

  return Math.round(
    (points / (TOTAL_QUESTIONS * MAX_POINTS_PER_QUESTION)) * 100,
  );
}

export function getResultCategory(score: number): ResultCategory {
  if (score >= 85) return "strong";
  if (score >= 55) return "developing";
  return "high_risk";
}

export interface ResultDetails {
  title: string;
  description: string;
  nextStepsIntro: string;
}

export const resultDetails: Record<ResultCategory, ResultDetails> = {
  strong: {
    title: "Strong ownership foundations",
    description:
      "You appear to have good control over your technology. Review the remaining gaps and keep your recovery and handover plans current.",
    nextStepsIntro:
      "you are in a strong position. The goal now is to stay there: keep access, documentation and recovery plans current, and keep building your skills and options.",
  },
  developing: {
    title: "Ownership gaps to address",
    description:
      "You have some important controls in place, but gaps could make changes or recovery difficult. Prioritize accounts, documentation, and backups.",
    nextStepsIntro:
      "you have important controls in place, but a few gaps could make changes or recovery difficult. Closing them is the quickest way to reduce your risk.",
  },
  high_risk: {
    title: "High dependency risk",
    description:
      "Your current setup may leave you dependent on particular people or providers. Start by securing critical accounts, source code, and recoverable backups.",
    nextStepsIntro:
      "your setup may leave you dependent on particular people or providers. A few focused actions, starting with access, source code and backups, will make a big difference quickly.",
  },
};

export function getRecommendedActions(score: number): string[] {
  const actions: string[] = [];

  if (score < 85) {
    actions.push(
      "Review ownership and administrator access for critical accounts.",
    );
  }

  if (score < 100) {
    actions.push(
      "Document your technology setup and provider handover process.",
    );
  }

  if (score < 85) {
    actions.push("Verify backups and document how to restore your systems.");
  }

  actions.push("Review these controls regularly as your technology changes.");

  return actions;
}

export interface PathRecommendation {
  path: WorkWithMePath;
  title: string;
  reason: string;
  recommended: boolean;
}

const pathTitles: Record<WorkWithMePath, string> = {
  delivery: "Deliver My Project",
  mentor: "Mentor Me",
  coffee: "Coffee With Me",
};

// Placeholder mapping: adjust which path is recommended for each result.
const recommendedPath: Record<ResultCategory, WorkWithMePath> = {
  strong: "mentor",
  developing: "delivery",
  high_risk: "coffee",
};

const pathReasons: Record<ResultCategory, Record<WorkWithMePath, string>> = {
  strong: {
    delivery: "Turn your next idea into a well-built, well-owned project.",
    mentor: "Keep building skills and sharpen your technology decisions.",
    coffee: "Talk through your plans and what to improve next.",
  },
  developing: {
    delivery: "Get hands-on help closing the gaps in access, documentation and backups.",
    mentor: "Learn how to take control of the gaps yourself.",
    coffee: "Talk through which gaps to tackle first.",
  },
  high_risk: {
    delivery:
      "Secure critical accounts, source code and backups with hands-on help.",
    mentor: "Build the knowledge to take back control of your technology.",
    coffee:
      "Start with a 30-minute conversation to agree your priorities.",
  },
};

/** All three paths, with the recommended one first. */
export function getPathRecommendations(
  category: ResultCategory,
): PathRecommendation[] {
  const order: WorkWithMePath[] = ["delivery", "mentor", "coffee"];

  return order
    .map((path) => ({
      path,
      title: pathTitles[path],
      reason: pathReasons[category][path],
      recommended: recommendedPath[category] === path,
    }))
    .sort((a, b) => Number(b.recommended) - Number(a.recommended));
}
