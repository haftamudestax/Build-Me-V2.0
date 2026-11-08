import { socialLinks } from "../../data/socialLinks";

type SocialIconName = "LinkedIn" | "X" | "Facebook" | "Instagram" | "YouTube";

interface SocialIconProps {
  name: SocialIconName;
}

function SocialIcon({ name }: SocialIconProps) {
  const commonProps = {
    width: 22,
    height: 22,
    viewBox: "0 0 24 24",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    "aria-hidden": true as const,
  };

  switch (name) {
    case "LinkedIn":
      return (
        <svg {...commonProps}>
          <path
            fill="currentColor"
            d="M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2ZM8.3 18H5.7V9.5h2.6V18ZM7 8.3a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3ZM18.3 18h-2.6v-4.1c0-1 0-2.2-1.4-2.2s-1.6 1-1.6 2.1V18h-2.6V9.5h2.5v1.2h.1c.4-.7 1.2-1.5 2.5-1.5 2.7 0 3.2 1.8 3.2 4.1V18Z"
          />
        </svg>
      );

    case "X":
      return (
        <svg {...commonProps}>
          <path
            fill="currentColor"
            d="M18.9 2H22l-6.8 7.8L23.2 22h-6.3L12 13.9 4.9 22H1.8l7.3-8.4L1.3 2h6.5l4.5 7.5L18.9 2Zm-1.1 18h1.7L6.8 3.9H5L17.8 20Z"
          />
        </svg>
      );

    case "Facebook":
      return (
        <svg {...commonProps}>
          <path
            fill="currentColor"
            d="M13.5 21v-8.2h2.8l.4-3.2h-3.2v-2c0-.9.3-1.5 1.6-1.5h1.7V3.2c-.3 0-1.4-.2-2.6-.2-2.6 0-4.4 1.6-4.4 4.5v2.1H7v3.2h2.8V21h3.7Z"
          />
        </svg>
      );

    case "Instagram":
      return (
        <svg {...commonProps}>
          <rect
            x="3"
            y="3"
            width="18"
            height="18"
            rx="5"
            stroke="currentColor"
            strokeWidth="2"
          />
          <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2" />
          <circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" />
        </svg>
      );

    case "YouTube":
      return (
        <svg {...commonProps}>
          <path
            fill="currentColor"
            d="M23 7.1a3 3 0 0 0-2.1-2.2C19 4.4 12 4.4 12 4.4s-7 0-8.9.5A3 3 0 0 0 1 7.1a31 31 0 0 0-.5 4.9 31 31 0 0 0 .5 4.9 3 3 0 0 0 2.1 2.2c1.9.5 8.9.5 8.9.5s7 0 8.9-.5a3 3 0 0 0 2.1-2.2 31 31 0 0 0 .5-4.9 31 31 0 0 0-.5-4.9ZM9.8 15.5v-7l6 3.5-6 3.5Z"
          />
        </svg>
      );
  }
}

const socialColors: Record<SocialIconName, string> = {
  LinkedIn: "bg-[#0A66C2]",
  X: "bg-black",
  Facebook: "bg-[#1877F2]",
  Instagram: "bg-gradient-to-tr from-[#FEDA75] via-[#DD2A7B] to-[#8134AF]",
  YouTube: "bg-[#FF0000]",
};

export function SocialConnections() {
  return (
    <section
      aria-labelledby="social-connections-heading"
      className="space-y-5 border-r border-gray-200 pr-8"
    >
      <h2
        id="social-connections-heading"
        className="text-base font-bold text-blue-900"
      >
        Follow Me
      </h2>

      <div className="flex flex-wrap items-center gap-3">
        {socialLinks.map((social) => {
          const name = social.name as SocialIconName;

          return (
            <a
              key={social.name}
              href={social.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={social.label}
              title={social.label}
              className={`flex h-10 w-10 items-center justify-center
                rounded-full text-white transition-all duration-200
                hover:-translate-y-1 hover:scale-110 hover:shadow-lg
                focus-visible:outline-none focus-visible:ring-2
                focus-visible:ring-blue-600 focus-visible:ring-offset-2
                ${socialColors[name]}`}
            >
              <SocialIcon name={name} />
            </a>
          );
        })}
      </div>
    </section>
  );
}
