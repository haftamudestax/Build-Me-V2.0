import { Box, Stack, Typography } from "@mui/material";

import { StepFooter, StepHeader } from "../ownershipAudit/StepParts";
import { TOOLKIT_TAGLINE, toolkitIntro } from "./toolkitContent";

interface ToolkitWhyStepProps {
  onBack: () => void;
  onNext: () => void;
}

export function ToolkitWhyStep({ onBack, onNext }: ToolkitWhyStepProps) {
  return (
    <Stack spacing={2.5} sx={{ minWidth: 0 }}>
      <StepHeader
        eyebrow="Step 1 of 3"
        title="Why the Technology Ownership Toolkit?"
        description={TOOLKIT_TAGLINE}
      />

      <Box component="section">
        <Typography variant="subtitle1" component="h3" gutterBottom>
          What is the Toolkit?
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {toolkitIntro.what}
        </Typography>
      </Box>

      <Box component="section">
        <Typography variant="subtitle1" component="h3" gutterBottom>
          Why use it?
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {toolkitIntro.why}
        </Typography>
      </Box>

      <Box component="section">
        <Typography variant="subtitle1" component="h3" gutterBottom>
          Who is it for?
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {toolkitIntro.who}
        </Typography>
      </Box>

      <Typography variant="body2" color="text.secondary">
        {toolkitIntro.format}
      </Typography>

      <StepFooter
        previous={{ label: "Back", onClick: onBack }}
        next={{ label: "Continue to your details", onClick: onNext }}
      />
    </Stack>
  );
}
