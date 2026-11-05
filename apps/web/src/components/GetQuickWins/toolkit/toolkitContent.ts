/**
 * Technology Ownership Toolkit: the one source of content.
 *
 * Both the online view (ToolkitContentStep) and the PDF generator
 * (apps/web/scripts/generate-toolkit-pdf.ts) read this file, so they cannot
 * drift apart. Keep it free of React and browser code: the PDF script runs it
 * in Node. After changing any text here, regenerate the PDF:
 *
 *   pnpm --filter @build-me/web generate:toolkit-pdf
 *
 * Keep the text plain (no curly quotes, long dashes or symbols): the PDF uses
 * a standard font that only covers basic Latin characters.
 */

export const TOOLKIT_TITLE = "Technology Ownership Toolkit";

export const TOOLKIT_TAGLINE =
  "Nine practical checklists and templates to find, record and secure the technology your business depends on.";

/** Where the generated PDF is served from (apps/web/public/downloads). */
export const TOOLKIT_PDF_PATH = "/downloads/technology-ownership-toolkit.pdf";
export const TOOLKIT_PDF_FILE_NAME = "Technology-Ownership-Toolkit.pdf";

export const TOOLKIT_VERSION = "1.0";

export interface ToolkitTemplate {
  /** Name of the fill-in template. */
  title: string;
  /** What to record, one column per detail. */
  columns: string[];
  /** Blank rows to leave in the PDF. */
  rows: number;
}

export interface ToolkitTool {
  /** Lowercase slug used in analytics. Never reuse or rename an id. */
  id: string;
  title: string;
  /** One line: what the tool is for. */
  purpose: string;
  checklist: string[];
  template: ToolkitTemplate;
  /** The test that tells the visitor they are finished. */
  doneWhen: string;
}

export interface ToolkitPart {
  id: string;
  title: string;
  summary: string;
  tools: ToolkitTool[];
}

export const toolkitIntro = {
  what: "A short pack of nine one-page tools. Each one is a checklist to work through and a template to fill in. Together they help you find out what technology your business owns, record who controls it, and close the gaps.",
  why: "Many businesses only learn who really controls their website or systems when something goes wrong: a provider leaves, a renewal lapses or a backup fails. Writing it down now turns those surprises into a plan.",
  who: "Business owners, founders and operations leads who rely on a website, app or system that someone else built or runs for them. No technical background is needed.",
  format:
    "Read it online here, or download the PDF to print, fill in and share with your team.",
};

export const toolkitHowToUse = [
  "Start with Part 1 and work through the parts in order.",
  "Spend about 20 minutes on each tool. Tick each item you can confirm, and fill in the template as you go.",
  "Treat any item you cannot confirm as a gap, and give it an owner and a date.",
  "Never write passwords in the templates. Record where things are kept, not the secrets themselves.",
  "Review the whole toolkit every six months, or after a change of provider or developer.",
];

export const toolkitParts: ToolkitPart[] = [
  {
    id: "know",
    title: "Know what you own",
    summary: "Find out what you have and who controls it.",
    tools: [
      {
        id: "domain",
        title: "Domain and DNS checklist",
        purpose:
          "Make sure your business, not a provider, controls your domain name.",
        checklist: [
          "Find out which registrar holds each domain you use.",
          "Confirm the registrant and account owner are your business, using an email address you control.",
          "Check that auto-renew is on and the payment card is current.",
          "Turn on the registrar lock and two-factor sign-in.",
          "Record where your DNS records are managed.",
          "Save a copy of your current DNS records.",
        ],
        template: {
          title: "Domain register",
          columns: [
            "Domain",
            "Registrar",
            "Account email",
            "Renewal date",
            "Auto-renew",
            "DNS managed at",
          ],
          rows: 5,
        },
        doneWhen:
          "You can name the registrar, the account owner and the renewal date for every domain.",
      },
      {
        id: "hosting",
        title: "Hosting and cloud checklist",
        purpose: "Know where your application runs and who can administer it.",
        checklist: [
          "List every hosting, cloud and platform account your site or app uses.",
          "Confirm each account is registered to your business, not to a personal or provider email.",
          "Make sure at least two trusted people have administrator access.",
          "Check who receives the billing emails and who pays.",
          "Note the plan and region of each service.",
          "Turn on two-factor sign-in for every administrator.",
        ],
        template: {
          title: "Hosting accounts",
          columns: [
            "Service",
            "Used for",
            "Account owner",
            "Administrators",
            "Billing contact",
            "Monthly cost",
          ],
          rows: 5,
        },
        doneWhen:
          "Every account is held by your business and has at least two administrators.",
      },
      {
        id: "source_code",
        title: "Source code checklist",
        purpose: "Keep your application's code in a repository you own.",
        checklist: [
          "Find out where the code lives (the repository host and the organisation name).",
          "Confirm the repository belongs to your organisation account, not a developer's personal one.",
          "Check that you have owner-level access and know who else has it.",
          "Make sure the main branch is protected and changes are reviewed.",
          "Keep a copy of the code outside your provider's control, such as a mirror or archive.",
          "Confirm you hold the licence or a written assignment for the code.",
        ],
        template: {
          title: "Code repositories",
          columns: [
            "Repository",
            "Host",
            "Owner account",
            "Who has access",
            "Latest copy",
            "Licence",
          ],
          rows: 5,
        },
        doneWhen:
          "You own the repository and hold a recent copy that you can open yourself.",
      },
    ],
  },
  {
    id: "control",
    title: "Stay in control of access and providers",
    summary: "Make sure no one person or supplier can lock you out.",
    tools: [
      {
        id: "credentials",
        title: "Critical accounts register",
        purpose:
          "Know every account your business depends on and who can get in.",
        checklist: [
          "List your email, analytics, payment, marketing, domain and hosting accounts.",
          "Record the owner and at least one backup administrator for each.",
          "Turn on two-factor sign-in for every critical account.",
          "Keep recovery codes in a shared, secured place, never in this register.",
          "Remove access for people and tools that no longer need it.",
          "Review the list every quarter.",
        ],
        template: {
          title: "Critical accounts",
          columns: [
            "Account",
            "Used for",
            "Owner",
            "Backup administrator",
            "Two-factor on",
            "Last reviewed",
          ],
          rows: 6,
        },
        doneWhen:
          "No critical account depends on a single person or an unknown login.",
      },
      {
        id: "documentation",
        title: "Handover pack template",
        purpose:
          "Make sure another qualified developer could pick up your setup.",
        checklist: [
          "Draw a one-page diagram of the main parts and how they connect.",
          "Write down how to build, run and deploy the application.",
          "List the environments (live and test) and their addresses.",
          "Record where configuration and secrets are kept, but not the secrets themselves.",
          "List the third-party services you use and what each one does.",
          "Name who to contact for each part of the system.",
        ],
        template: {
          title: "Handover details",
          columns: ["Area", "Where it is documented", "Owner", "Last updated"],
          rows: 6,
        },
        doneWhen:
          "A new developer could set the project up using only your handover pack.",
      },
      {
        id: "providers",
        title: "Provider exit plan",
        purpose:
          "Be able to change provider without losing data, code or time.",
        checklist: [
          "Check each contract for notice periods and exit terms.",
          "Confirm you can export your data, and in what format.",
          "Confirm you can transfer your domain and DNS without the provider's help.",
          "List everything that must move: code, data, files, email and certificates.",
          "Agree the order of the move and a safe switch-over date.",
          "Ask your current provider for a written handover commitment.",
        ],
        template: {
          title: "Exit plan",
          columns: [
            "Provider",
            "Service",
            "Notice period",
            "What can be exported",
            "Who does the move",
          ],
          rows: 5,
        },
        doneWhen:
          "You know what it would take to move each service, and how long it would take.",
      },
    ],
  },
  {
    id: "recover",
    title: "Keep running and recover",
    summary: "Be ready for the day something fails or expires.",
    tools: [
      {
        id: "backups",
        title: "Backup and recovery checklist",
        purpose: "Know your data is backed up and that you can restore it.",
        checklist: [
          "List the data and systems that must never be lost.",
          "Check how often each one is backed up and where the copies are kept.",
          "Make sure at least one copy is stored away from the live system.",
          "Run a test restore and note how long it took.",
          "Write down who can restore, and the steps they follow.",
          "Repeat the restore test at least twice a year.",
        ],
        template: {
          title: "Backups",
          columns: [
            "System",
            "What is backed up",
            "How often",
            "Stored where",
            "Last restore test",
            "Owner",
          ],
          rows: 5,
        },
        doneWhen:
          "You have a recent, successful restore test for every critical system.",
      },
      {
        id: "renewals",
        title: "Renewals and costs calendar",
        purpose: "Never lose a service to a missed renewal, and know what you pay.",
        checklist: [
          "List your domains, hosting, subscriptions, certificates and licences.",
          "Record the renewal date, cost and payment method for each.",
          "Set reminders for 60 and 14 days before each renewal.",
          "Make sure the billing email goes to an inbox someone monitors.",
          "Cancel anything you no longer use.",
          "Review the total yearly cost once a year.",
        ],
        template: {
          title: "Renewals",
          columns: [
            "Item",
            "Provider",
            "Renewal date",
            "Cost",
            "Paid by",
            "Reminder set",
          ],
          rows: 6,
        },
        doneWhen: "Every renewal has an owner, a date and a reminder.",
      },
      {
        id: "maintenance",
        title: "Maintenance and incident plan",
        purpose:
          "Know who does what when something needs updating or goes wrong.",
        checklist: [
          "Decide who applies updates and security patches, and how often.",
          "Write down who to call first when the site or app is down.",
          "Agree how quickly each kind of problem should be handled.",
          "Keep a short contact list: provider, developer and hosting support.",
          "Note how you will tell customers when there is a problem.",
          "After any incident, write down what happened and what will change.",
        ],
        template: {
          title: "Contacts and responsibilities",
          columns: ["Role", "Name", "How to reach them", "Responsible for"],
          rows: 6,
        },
        doneWhen:
          "Anyone on your team can follow the plan the next time something fails.",
      },
    ],
  },
];

export const allTools: ToolkitTool[] = toolkitParts.flatMap(
  (part) => part.tools,
);

export const TOOL_COUNT = allTools.length;

export function findPartOfTool(toolId: string): ToolkitPart | undefined {
  return toolkitParts.find((part) =>
    part.tools.some((tool) => tool.id === toolId),
  );
}
