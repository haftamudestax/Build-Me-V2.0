import { Alert, Box, Stack, Typography } from "@mui/material";

import { StepFooter, StepHeader } from "./StepParts";

interface OwnershipAuditIntroProps {
  onBack: () => void;
  onNext: () => void;
}

const benefits = [
  "A clear score out of 100 for how well you control your technology.",
  "Visibility of gaps in access, documentation and backups.",
  "Practical next steps matched to your result.",
  "A route to hands-on help if you want it.",
];

export function OwnershipAuditIntro({
  onBack,
  onNext,
}: OwnershipAuditIntroProps) {
  return (
    <Stack spacing={2.5} sx={{ minWidth: 0 }}>
      <StepHeader
        eyebrow="Step 1 of 5"
        title="About the Technology Ownership Audit"
        description="A short self-assessment of how much control you have over the technology your business depends on."
      />

      <Box component="section">
        <Typography variant="subtitle1" component="h3" gutterBottom>
          What is the Technology Ownership Audit?
        </Typography>
        <Typography variant="body2" color="text.secondary">
          It is a short self-assessment of nine questions, taking about three
          minutes. It looks at who controls your domain, hosting, source code
          and critical accounts, how well your setup is documented, and whether
          you could recover or change providers if you had to.
        </Typography>
      </Box>

      <Box component="section">
        <Typography variant="subtitle1" component="h3" gutterBottom>
          Why do a Technology Ownership Audit?
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Many businesses only find out who really controls their website or
          systems when something goes wrong: a provider leaves, a renewal lapses
          or a backup fails. Knowing where you stand first turns surprises into
          a plan.
        </Typography>
      </Box>

      <Box component="section">
        <Typography variant="subtitle1" component="h3" gutterBottom>
          What are the benefits?
        </Typography>
        <Box component="ul" sx={{ m: 0, pl: 3 }}>
          {benefits.map((benefit) => (
            <li key={benefit}>
              <Typography variant="body2" color="text.secondary">
                {benefit}
              </Typography>
            </li>
          ))}
        </Box>
      </Box>

      <Alert severity="info">
        This is a self-assessment based on your answers, not a security audit or
        certification.
      </Alert>

      <StepFooter
        previous={{ label: "Back", onClick: onBack }}
        next={{ label: "Continue to registration", onClick: onNext }}
      />
    </Stack>
  );
}
