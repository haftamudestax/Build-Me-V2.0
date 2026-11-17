import { LegalPageLayout } from "./LegalPageLayout";
import { Box, Typography } from "@mui/material";
import {
  Shield,
  Lock,
  Eye,
  Server,
  UserCheck,
  RefreshCw,
  Mail,
} from "lucide-react";

export default function PrivacyPage() {
  return (
    <LegalPageLayout
      title="Privacy Policy"
      description="Learn how personal information is handled, protected, and respected when you visit my personal website and engineering platform."
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
            <Shield size={28} />
          </div>
          <div>
            <Typography variant="h6" className="font-bold text-black mb-1">
              Data Privacy & Commitment
            </Typography>
            <Typography
              variant="body2"
              className="text-black font-medium leading-relaxed"
            >
              Operating from Addis Ababa, Ethiopia, I am committed to
              safeguarding your personal data with transparency, secure
              development practices, and strict confidentiality.
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
              <Eye size={20} className="text-amber-600" />
              1. Introduction
            </h2>
            <p className="leading-7 text-stone-800">
              Welcome to my personal portfolio and professional platform. This
              Privacy Policy outlines how personal information is collected,
              used, stored, and protected when visitors interact with my
              website, project booking flows, or communication channels.
            </p>
          </section>

          <section className="space-y-3 pb-6 border-b border-stone-200">
            <h2
              className="text-xl font-bold"
              style={{ color: "var(--color-black)" }}
            >
              2. Information I Collect
            </h2>
            <p className="leading-7 text-stone-800">
              To provide a smooth collaboration and inquiry workflow, I may
              collect the following types of information:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-stone-800">
              <li>
                <strong>Direct Submissions:</strong> Information you provide
                when submitting project requests, consultation bookings, or
                contact forms (such as your name, email address, company
                details, and project specifications).
              </li>
              <li>
                <strong>Automated Analytics Data:</strong> Technical data
                collected automatically via integrated web analytics to measure
                portfolio performance, traffic sources, and visitor interactions
                (including anonymized IP addresses, browser types, and device
                information).
              </li>
            </ul>
          </section>

          <section className="space-y-3 pb-6 border-b border-stone-200">
            <h2
              className="text-xl font-bold"
              style={{ color: "var(--color-black)" }}
            >
              3. How I Use Information
            </h2>
            <p className="leading-7 text-stone-800">
              Your information is processed exclusively for professional and
              operational purposes, including:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-stone-800">
              <li>
                Responding to project inquiries and engineering consultation
                requests.
              </li>
              <li>
                Managing freelance project workflows, deliverables, and
                communications.
              </li>
              <li>
                Analyzing website traffic and performance metrics to optimize
                user experience.
              </li>
              <li>
                Maintaining the security and technical integrity of the
                platform.
              </li>
            </ul>
          </section>

          <section className="space-y-3 pb-6 border-b border-stone-200">
            <h2
              className="text-xl font-bold flex items-center gap-2"
              style={{ color: "var(--color-black)" }}
            >
              <Server size={20} className="text-amber-600" />
              4. Information Sharing & Third Parties
            </h2>
            <p className="leading-7 text-stone-800">
              I do not sell, trade, or rent your personal information. Data is
              only shared under strict operational necessities, such as trusted
              hosting providers, database infrastructures, secure email
              dispatchers, and analytics services required to run this website.
              All third-party providers adhere to industry-standard data
              protection guidelines.
            </p>
          </section>

          <section className="space-y-3 pb-6 border-b border-stone-200">
            <h2
              className="text-xl font-bold flex items-center gap-2"
              style={{ color: "var(--color-black)" }}
            >
              <Lock size={20} className="text-amber-600" />
              5. Data Storage & Security
            </h2>
            <p className="leading-7 text-stone-800">
              Personal data is stored securely using encrypted cloud databases
              and hosting services. While I implement robust security measures
              (including secure environment variables, HTTPS encryption, and
              token authentication) to protect your data, no method of
              electronic transmission is 100% secure. Data is retained only as
              long as necessary for business and communication purposes.
            </p>
          </section>

          <section className="space-y-3 pb-6 border-b border-stone-200">
            <h2
              className="text-xl font-bold flex items-center gap-2"
              style={{ color: "var(--color-black)" }}
            >
              <UserCheck size={20} className="text-amber-600" />
              6. Your Privacy Rights
            </h2>
            <p className="leading-7 text-stone-800">
              Depending on your location, you have the right to request access
              to the personal data I hold about you, ask for corrections, or
              request complete deletion of your information from my records.
            </p>
          </section>

          <section className="space-y-3 pb-6 border-b border-stone-200">
            <h2
              className="text-xl font-bold"
              style={{ color: "var(--color-black)" }}
            >
              7. External Links & Services
            </h2>
            <p className="leading-7 text-stone-800">
              This platform may contain links to external developer
              repositories, professional profiles (such as GitHub), or tools.
              These third-party sites maintain independent privacy policies, and
              I assume no responsibility for their content or data practices.
            </p>
          </section>

          <section className="space-y-3 pb-6 border-b border-stone-200">
            <h2
              className="text-xl font-bold flex items-center gap-2"
              style={{ color: "var(--color-black)" }}
            >
              <RefreshCw size={20} className="text-amber-600" />
              8. Changes to This Policy
            </h2>
            <p className="leading-7 text-stone-800">
              This Privacy Policy may be updated periodically to reflect changes
              in technical scope or operational requirements. Any revisions will
              take effect immediately upon publication on this page.
            </p>
          </section>

          <section className="space-y-3">
            <h2
              className="text-xl font-bold flex items-center gap-2"
              style={{ color: "var(--color-black)" }}
            >
              <Mail size={20} className="text-amber-600" />
              9. Contact Information
            </h2>
            <p className="leading-7 text-stone-800">
              If you have any questions, concerns, or requests regarding this
              Privacy Policy or your personal data, please reach out directly
              through my portfolio's contact or booking section.
            </p>
          </section>
        </Box>
      </Box>
    </LegalPageLayout>
  );
}
