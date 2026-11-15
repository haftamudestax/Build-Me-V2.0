import { LegalPageLayout } from "./LegalPageLayout";
import { Box, Typography } from "@mui/material";
import {
  FileText,
  CheckCircle2,
  Briefcase,
  Cpu,
  ShieldAlert,
  RefreshCw,
  Mail,
} from "lucide-react";

export default function TermsPage() {
  return (
    <LegalPageLayout
      title="Terms & Conditions"
      description="Review the terms and conditions governing access to and use of my personal website, digital platform, and professional freelance engineering services."
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
            <FileText size={28} />
          </div>
          <div>
            <Typography variant="h6" className="font-bold text-black mb-1">
              Professional Service Agreement
            </Typography>
            <Typography
              variant="body2"
              className="text-black font-medium leading-relaxed"
            >
              Operating independently from Addis Ababa, Ethiopia, these terms
              outline the framework for navigating my digital portfolio and
              engaging in professional freelance engineering or software
              development services.
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
              <CheckCircle2 size={20} className="text-amber-600" />
              1. Introduction & Acceptance
            </h2>
            <p className="leading-7 text-stone-800">
              Welcome to my personal website and professional portfolio. By
              accessing this website or engaging my engineering and software
              development services, you agree to be bound by these Terms &
              Conditions. If you do not agree with any part of these terms,
              please refrain from using the platform.
            </p>
          </section>

          <section className="space-y-3 pb-6 border-b border-stone-200">
            <h2
              className="text-xl font-bold"
              style={{ color: "var(--color-black)" }}
            >
              2. Use of the Website
            </h2>
            <p className="leading-7 text-stone-800">
              Visitors are permitted to view portfolio projects, read technical
              insights, and submit legitimate project inquiries. Prohibited
              activities include attempting unauthorized access to backend
              systems, deploying malicious scripts, scraping content for abusive
              purposes, or interfering with website performance and security
              architecture.
            </p>
          </section>

          <section className="space-y-3 pb-6 border-b border-stone-200">
            <h2
              className="text-xl font-bold flex items-center gap-2"
              style={{ color: "var(--color-black)" }}
            >
              <Briefcase size={20} className="text-amber-600" />
              3. Services and Project Requests
            </h2>
            <p className="leading-7 text-stone-800">
              Submitting an inquiry, booking request, or message through this
              website constitutes an initial consultation request rather than a
              binding service contract. Formal project scopes, timelines,
              deliverables, and payment terms (denominated in agreed currencies
              such as ETB or international equivalents) are established through
              separate, mutually executed written project agreements or
              contracts.
            </p>
          </section>

          <section className="space-y-3 pb-6 border-b border-stone-200">
            <h2
              className="text-xl font-bold flex items-center gap-2"
              style={{ color: "var(--color-black)" }}
            >
              <Cpu size={20} className="text-amber-600" />
              4. Intellectual Property Rights
            </h2>
            <p className="leading-7 text-stone-800">
              All website design, source code structures, branding, written
              content, and visual assets displayed on this portfolio are the
              exclusive property of Haftamu Desta unless otherwise specified.
              Client ownership of custom-developed software or engineering work
              is explicitly transferred or licensed upon full project completion
              and payment as outlined in individual project contracts.
            </p>
          </section>

          <section className="space-y-3 pb-6 border-b border-stone-200">
            <h2
              className="text-xl font-bold"
              style={{ color: "var(--color-black)" }}
            >
              5. Third-Party Services & Links
            </h2>
            <p className="leading-7 text-stone-800">
              This portfolio may reference or link to external developer
              platforms, repositories (such as GitHub), or tools. These
              third-party services operate independently under their own terms
              and policies, and I assume no liability or responsibility for
              their external content or operational availability.
            </p>
          </section>

          <section className="space-y-3 pb-6 border-b border-stone-200">
            <h2
              className="text-xl font-bold flex items-center gap-2"
              style={{ color: "var(--color-black)" }}
            >
              <ShieldAlert size={20} className="text-amber-600" />
              6. Limitation of Liability
            </h2>
            <p className="leading-7 text-stone-800">
              The website and portfolio materials are provided on an "as is"
              basis without warranties of any kind. In no event shall I be held
              liable for any direct, indirect, incidental, or consequential
              damages arising out of your use of this website or reliance on
              portfolio case studies, code samples, or technical demonstrations.
            </p>
          </section>

          <section className="space-y-3 pb-6 border-b border-stone-200">
            <h2
              className="text-xl font-bold flex items-center gap-2"
              style={{ color: "var(--color-black)" }}
            >
              <RefreshCw size={20} className="text-amber-600" />
              7. Changes to These Terms
            </h2>
            <p className="leading-7 text-stone-800">
              These Terms & Conditions may be updated periodically to reflect
              evolving professional standards, technical scopes, or legal
              requirements. Continued use of the website following any
              modifications constitutes your formal acceptance of the updated
              terms.
            </p>
          </section>

          <section className="space-y-3">
            <h2
              className="text-xl font-bold flex items-center gap-2"
              style={{ color: "var(--color-black)" }}
            >
              <Mail size={20} className="text-amber-600" />
              8. Contact Information
            </h2>
            <p className="leading-7 text-stone-800">
              If you have any questions, legal inquiries, or collaboration
              proposals regarding these Terms & Conditions, please get in touch
              directly through my portfolio's contact or booking section.
            </p>
          </section>
        </Box>
      </Box>
    </LegalPageLayout>
  );
}
