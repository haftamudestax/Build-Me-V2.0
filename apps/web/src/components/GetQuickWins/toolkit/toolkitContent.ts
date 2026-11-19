export const TOOLKIT_TITLE = "Technology Ownership Toolkit";

export const TOOLKIT_TAGLINE =
  "Six simple TODO lists to help you know what your business owns online, and stay in control of it.";

export const TOOLKIT_PDF_PATH = "/downloads/technology-ownership-toolkit.pdf";
export const TOOLKIT_PDF_FILE_NAME = "Technology-Ownership-Toolkit.pdf";

export const TOOLKIT_VERSION = "1.1";

export interface ToolkitTemplate {
  title: string;
  columns: string[];
  rows: number;
}

export interface ToolkitTool {
  id: string;
  title: string;
  purpose: string;
  checklist: string[];
  /** A plain question the owner can send to their developer or provider. */
  askThem: string;
  template: ToolkitTemplate;
  doneWhen: string;
}

export interface ToolkitPart {
  id: string;
  title: string;
  summary: string;
  tools: ToolkitTool[];
}

export const toolkitIntro = {
    what: "Six short TODO lists, each with a simple table to fill in. Together they show you what your business owns online and where you depend on someone else.",
  why: "Many businesses only find out who really controls their website, app or accounts when something goes wrong. This toolkit helps you find out first.",
  who: "Business owners, founders and managers whose website, app or online accounts were built or are looked after by someone else. You do not need any technical knowledge.",
  format:
    "Read it online first. When you are done, you can download a copy to print and fill in.",
};

export const toolkitHowToUse = [
  "Read one tool at a time. Each one takes about 15 minutes.",
  "Tick off every TODO you can confirm. Fill in the table as you go.",
  "If you cannot tick off a TODO, that is a gap. Send the question in the tool to the person who looks after it for you.",
  "Never write passwords in the tables. Write down where things are kept, not the secrets themselves.",
  "Come back to the toolkit every six months, or whenever you change provider or developer.",
];

export const toolkitParts: ToolkitPart[] = [
  {
    id: "know",
    title: "Know what you own",
    summary: "Find out what you have and whose name it is in.",
    tools: [
      {
        id: "domain",
        title: "Your website address",
        purpose:
          "Make sure your business, not your web company, owns your website address (for example yourcompany.com).",
        checklist: [
          "Write down every website address your business uses.",
          "Find out which company each one is registered with. This is where the yearly fee is paid.",
          "Check the owner on the account is your business, and the email belongs to someone in your business.",
          "Check the address renews automatically and the payment card has not expired.",
          "Make sure you can sign in to that account yourself, or that you are listed as an owner.",
        ],
        askThem:
          "Who is listed as the owner of our website address, and can you add me as an owner?",
        template: {
          title: "Website addresses",
          columns: [
            "Website address",
            "Registered with",
            "Owner name",
            "Account email",
            "Renews on",
          ],
          rows: 5,
        },
        doneWhen:
          "For every website address, you can say who owns it, where it is registered and when it renews.",
      },
      {
        id: "hosting",
        title: "Your website and app",
        purpose:
          "Know where your website or app lives, and who holds the keys to it.",
        checklist: [
          "List the services that run your website or app, such as hosting, a website builder or an app store account.",
          "Check each one is in your business's name, not a developer's personal account.",
          "Make sure you are an owner, and that one other trusted person is too.",
          "Find out where the code is kept (the files your developer wrote) and that the account is yours.",
          "Check you have something in writing that says the website and its code belong to you.",
          "Find out who receives the bills and who pays them.",
        ],
        askThem:
          "Are all our accounts in our business's name, and can you give me owner access to each one?",
        template: {
          title: "Website and app accounts",
          columns: [
            "Service",
            "What it does",
            "Account owner",
            "Other owners",
            "Monthly cost",
          ],
          rows: 5,
        },
        doneWhen:
          "Every service is in your business's name, and you and one other person can get in.",
      },
    ],
  },
  {
    id: "control",
    title: "Stay in control",
    summary: "Make sure no one person or company can lock you out.",
    tools: [
      {
        id: "access",
        title: "Who can get in",
        purpose:
          "Know every online account your business depends on, and who can get into it.",
        checklist: [
          "List the accounts your business needs: email, website, payments, social media and advertising.",
          "Next to each one, write who owns it and who is the backup.",
          "Turn on the extra sign-in step (a code sent to a phone) for each account.",
          "Keep recovery codes in a safe, shared place, never in this list.",
          "Remove people who have left or no longer need access.",
          "Check the list again every three months.",
        ],
        askThem:
          "Who has access to our accounts today, and who can remove people who should no longer have it?",
        template: {
          title: "Important accounts",
          columns: [
            "Account",
            "What it is for",
            "Owner",
            "Backup person",
            "Extra sign-in on",
          ],
          rows: 5,
        },
        doneWhen:
          "No important account depends on one person or on a login nobody knows.",
      },
      {
        id: "exit",
        title: "If you change provider",
        purpose:
          "Be able to switch web company without losing your website, your data or weeks of time.",
        checklist: [
          "Check your contract for how much notice you must give.",
          "Ask what you would receive if you left: website files, data, customer lists and logins.",
          "Check you could move your website address and hosting without their help.",
          "List everything that would need to move.",
          "Ask for a one-page handover note: what your website is made of, how it is updated and who to call.",
          "Ask for a short written promise to hand everything over if you leave.",
        ],
        askThem:
          "If we ever moved to another company, what would you hand over, and how long would it take?",
        template: {
          title: "Providers",
          columns: [
            "Provider",
            "What they do for you",
            "Notice needed",
            "What you would receive",
            "Handover promised",
          ],
          rows: 5,
        },
        doneWhen:
          "You know what it would take to move each service, and roughly how long it would take.",
      },
    ],
  },
  {
    id: "recover",
    title: "Keep running",
    summary: "Be ready for the day something expires or breaks.",
    tools: [
      {
        id: "renewals",
        title: "Renewals and costs",
        purpose:
          "Never lose a service because a renewal was missed, and know what you pay each year.",
        checklist: [
          "List everything you pay for on a schedule: website address, hosting, subscriptions, the security padlock (certificate) and licences.",
          "Write down the renewal date, the cost and who pays for each one.",
          "Set a reminder 60 days and 14 days before each renewal.",
          "Make sure the bills go to an inbox that someone reads.",
          "Cancel anything you no longer use.",
          "Add up the yearly cost once a year.",
        ],
        askThem:
          "Can you send me a list of everything we pay for, with renewal dates and costs?",
        template: {
          title: "Renewals",
          columns: ["Item", "Provider", "Renews on", "Cost", "Reminder set"],
          rows: 5,
        },
        doneWhen: "Every renewal has an owner, a date and a reminder.",
      },
      {
        id: "backups",
        title: "Backups and when things go wrong",
        purpose:
          "Know your information is copied safely, and who to call when something breaks.",
        checklist: [
          "List what you could not afford to lose: customer details, orders, photos and documents.",
          "Ask how often each is copied and where the copy is kept. At least one copy should be somewhere else.",
          "Ask to see a copy being restored, to prove it works.",
          "Write down who to call first if your website goes down.",
          "Decide how you would tell your customers if there is a problem.",
          "After any problem, write down what happened and what will change.",
        ],
        askThem:
          "How often is our website backed up, and when did you last test restoring it?",
        template: {
          title: "Backups and contacts",
          columns: [
            "What to protect",
            "Copied how often",
            "Kept where",
            "Last restore test",
            "Who to call",
          ],
          rows: 5,
        },
        doneWhen:
          "You know your information is copied, the copy has been tested, and you know who to call.",
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