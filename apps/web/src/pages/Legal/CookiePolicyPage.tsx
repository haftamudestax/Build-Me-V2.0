import { LegalPageLayout } from "./LegalPageLayout";
import { Box, Typography } from "@mui/material";
import { ShieldCheck, Cookie, Sliders, RefreshCw, Mail } from "lucide-react";

export default function CookiePolicyPage() {
  return (
    <LegalPageLayout
      title="Cookie Policy"
      description="Transparent details on how cookies and browser storage are utilized across my personal engineering and development portfolio."
    >
      <Box className="space-y-8">
        {/* Top Highlight Banner */}
        <Box
          className="p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center gap-4"
          sx={{
            backgroundColor: "var(--color-dark-yellow)",
            border: "1.5px solid var(--color-black)",
            borderRadius: 0,
            boxShadow: "4px 4px 0px 0px var(--color-black)",
          }}
        >
          <div className="p-3 bg-black text-white shrink-0">
            <Cookie size={28} />
          </div>
          <div>
            <Typography variant="h6" className="font-bold text-black mb-1">
              Minimal & Purposeful Tracking
            </Typography>
            <Typography
              variant="body2"
              className="text-black font-medium leading-relaxed"
            >
              Operating from Addis Ababa, Ethiopia, my freelance portfolio is
              built for performance and security. I keep tracking strictly
              limited to essential functionality and session integrity.
            </Typography>
          </div>
        </Box>

        {/* Main Content Card Container */}
        <Box
          className="space-y-8 p-6 md:p-10"
          sx={{
            backgroundColor: "#FFFFFF",
            border: "1.5px solid var(--color-black)",
            borderRadius: 0,
            boxShadow: "4px 4px 0px 0px var(--color-black)",
          }}
        >
          <section className="space-y-3 pb-6 border-b border-stone-200">
            <h2
              className="text-xl font-bold flex items-center gap-2"
              style={{ color: "var(--color-black)" }}
            >
              <ShieldCheck size={22} className="text-amber-600" />
              1. Introduction & Scope
            </h2>
            <p className="leading-7 text-stone-800">
              Welcome to my digital platform. As an independent electrical
              engineer and full-stack software developer, I value transparency.
              This Cookie Policy outlines how and why cookies and similar
              technologies are stored on your device when you browse this
              website.
            </p>
          </section>

          <section className="space-y-3 pb-6 border-b border-stone-200">
            <h2
              className="text-xl font-bold"
              style={{ color: "var(--color-black)" }}
            >
              2. What Are Cookies?
            </h2>
            <p className="leading-7 text-stone-800">
              Cookies are lightweight text files downloaded to your browser.
              They allow the site to remember your actions and preferences (such
              as interface configurations or dark/light mode choices) over time,
              ensuring a smooth and responsive browsing experience.
            </p>
          </section>

          <section className="space-y-3 pb-6 border-b border-stone-200">
            <h2
              className="text-xl font-bold"
              style={{ color: "var(--color-black)" }}
            >
              3. Categories of Cookies I Use
            </h2>
            <p className="leading-7 text-stone-800">
              I deploy only what is necessary to maintain a reliable
              architecture:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-stone-800">
              <li>
                <strong>Strictly Necessary Cookies:</strong> Essential for
                website navigation, security validation, and maintaining secure
                session states.
              </li>
              <li>
                <strong>Functional Cookies:</strong> Remember your user
                selections, layout options, and preferences for subsequent
                visits.
              </li>
            </ul>
          </section>

          <section className="space-y-3 pb-6 border-b border-stone-200">
            <h2
              className="text-xl font-bold flex items-center gap-2"
              style={{ color: "var(--color-black)" }}
            >
              <Sliders size={20} className="text-amber-600" />
              4. Local Storage & Analytics
            </h2>
            <p className="leading-7 text-stone-800">
              Alongside standard cookies, secure browser local storage or
              session tokens may be used to retain temporary workflow states or
              authentication credentials. Any performance metrics or visitor
              analytics tracked are completely anonymized.
            </p>
          </section>

          <section className="space-y-3 pb-6 border-b border-stone-200">
            <h2
              className="text-xl font-bold"
              style={{ color: "var(--color-black)" }}
            >
              5. Managing Your Cookie Preferences
            </h2>
            <p className="leading-7 text-stone-800">
              You maintain total control over your device settings. Most modern
              browsers allow you to block or delete cookies entirely. Please
              note that disabling core operational cookies may affect certain
              interactive features across the portfolio.
            </p>
          </section>

          <section className="space-y-3 pb-6 border-b border-stone-200">
            <h2
              className="text-xl font-bold"
              style={{ color: "var(--color-black)" }}
            >
              6. Third-Party Tools & Embeds
            </h2>
            <p className="leading-7 text-stone-800">
              This site may occasionally integrate trusted external developer
              widgets, code preview frames, or repository links. These
              third-party services operate under their own independent privacy
              and cookie policies.
            </p>
          </section>

          <section className="space-y-3 pb-6 border-b border-stone-200">
            <h2
              className="text-xl font-bold flex items-center gap-2"
              style={{ color: "var(--color-black)" }}
            >
              <RefreshCw size={20} className="text-amber-600" />
              7. Policy Updates
            </h2>
            <p className="leading-7 text-stone-800">
              This policy may be updated periodically to align with evolving
              freelance projects, technical upgrades, or regulatory
              requirements. Any modifications will be posted directly to this
              page with an updated revision marker.
            </p>
          </section>

          <section className="space-y-3">
            <h2
              className="text-xl font-bold flex items-center gap-2"
              style={{ color: "var(--color-black)" }}
            >
              <Mail size={20} className="text-amber-600" />
              8. Direct Contact
            </h2>
            <p className="leading-7 text-stone-800">
              If you have any questions regarding data handling or this Cookie
              Policy, feel free to reach out directly through my portfolio's
              contact or booking section.
            </p>
          </section>
        </Box>
      </Box>
    </LegalPageLayout>
  );
}
