import { useState } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Checkbox,
  Chip,
  FormControlLabel,
  FormGroup,
  Stack,
  Typography,
} from "@mui/material";
import { ChevronDown, Download } from "lucide-react";

import { StepFooter, StepHeader } from "../ownershipAudit/StepParts";
import { trackToolkit } from "./toolkitAnalytics";
import {
  TOOLKIT_PDF_FILE_NAME,
  TOOLKIT_PDF_PATH,
  TOOLKIT_VERSION,
  toolkitHowToUse,
  toolkitParts,
  type ToolkitTool,
} from "./toolkitContent";

interface ToolkitContentStepProps {
  name: string;
  onPrevious: () => void;
  onClose: () => void;
}

interface ToolPanelProps {
  tool: ToolkitTool;
}

function ToolPanel({ tool }: ToolPanelProps) {
  return (
    <Stack spacing={2}>
      <Typography variant="body2" color="text.secondary">
        {tool.purpose}
      </Typography>

      <Box>
        <Typography variant="subtitle2" component="h4" gutterBottom>
          Checklist
        </Typography>

        <FormGroup>
          {tool.checklist.map((item) => (
            <FormControlLabel
              key={item}
              control={<Checkbox size="small" />}
              label={<Typography variant="body2">{item}</Typography>}
              sx={{ alignItems: "flex-start", mb: 0.5 }}
            />
          ))}
        </FormGroup>
      </Box>

      <Box>
        <Typography variant="subtitle2" component="h4" gutterBottom>
          Template: {tool.template.title}
        </Typography>

        <Typography variant="caption" color="text.secondary" component="p">
          Record these details. The PDF has a blank table to fill in.
        </Typography>

        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 1 }}>
          {tool.template.columns.map((column) => (
            <Chip key={column} label={column} size="small" variant="outlined" />
          ))}
        </Box>
      </Box>

      <Typography variant="body2">
        <strong>Done when:</strong> {tool.doneWhen}
      </Typography>
    </Stack>
  );
}

export function ToolkitContentStep({
  name,
  onPrevious,
  onClose,
}: ToolkitContentStepProps) {
  const [openTools, setOpenTools] = useState<Record<string, boolean>>({});

  function handleToggle(toolId: string, part: number, expanded: boolean): void {
    setOpenTools((current) => ({ ...current, [toolId]: expanded }));

    if (expanded) {
      trackToolkit("ownership_toolkit.tool_opened", { toolId, part });
    }
  }

  function handleDownload(): void {
    trackToolkit("ownership_toolkit.pdf_downloaded");
  }

  return (
    <Stack spacing={2.5} sx={{ minWidth: 0 }}>
      <StepHeader
        eyebrow="Step 3 of 3"
        title="Your Technology Ownership Toolkit"
        description={`Prepared for ${name} · Version ${TOOLKIT_VERSION}`}
      />

      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          alignItems: { xs: "stretch", sm: "center" },
          justifyContent: "space-between",
          gap: 1.5,
          p: 2,
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 2,
        }}
      >
        <Typography variant="body2" color="text.secondary">
          Read the nine tools below, or take them with you as a PDF to print and
          fill in.
        </Typography>

        <Button
          component="a"
          href={TOOLKIT_PDF_PATH}
          download={TOOLKIT_PDF_FILE_NAME}
          variant="contained"
          startIcon={<Download size={18} aria-hidden="true" />}
          onClick={handleDownload}
          sx={{
            flexShrink: 0,
            bgcolor: "var(--color-dark-yellow)",
          }}
        >
          Download PDF
        </Button>
      </Box>

      <Box component="section">
        <Typography variant="subtitle1" component="h3" gutterBottom>
          How to use this toolkit
        </Typography>

        <Box component="ol" sx={{ m: 0, pl: 3 }}>
          {toolkitHowToUse.map((item) => (
            <li key={item}>
              <Typography variant="body2" color="text.secondary">
                {item}
              </Typography>
            </li>
          ))}
        </Box>
      </Box>

      {toolkitParts.map((part, partIndex) => (
        <Box component="section" key={part.id}>
          <Typography variant="subtitle1" component="h3">
            Part {partIndex + 1}: {part.title}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {part.summary}
          </Typography>

          {part.tools.map((tool) => {
            const isOpen = Boolean(openTools[tool.id]);

            return (
              <Accordion
                key={tool.id}
                disableGutters
                expanded={isOpen}
                onChange={(_event, expanded) =>
                  handleToggle(tool.id, partIndex + 1, expanded)
                }
              >
                <AccordionSummary
                  id={`toolkit-${tool.id}-header`}
                  aria-controls={`toolkit-${tool.id}-panel`}
                  expandIcon={<ChevronDown size={20} aria-hidden="true" />}
                >
                  <Typography sx={{ fontWeight: 600 }}>{tool.title}</Typography>
                </AccordionSummary>

                <AccordionDetails id={`toolkit-${tool.id}-panel`}>
                  {isOpen && <ToolPanel tool={tool} />}
                </AccordionDetails>
              </Accordion>
            );
          })}
        </Box>
      ))}

      <StepFooter
        previous={{ label: "Previous", onClick: onPrevious }}
        next={{ label: "Close", onClick: onClose }}
      />
    </Stack>
  );
}
