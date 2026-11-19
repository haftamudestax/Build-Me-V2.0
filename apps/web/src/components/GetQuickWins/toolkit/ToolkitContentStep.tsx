import { useState } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { ChevronDown, Download } from "lucide-react";

import { StepFooter, StepHeader } from "../ownershipAudit/StepParts";
import { trackToolkit } from "./toolkitAnalytics";
import {
  TOOL_COUNT,
  TOOLKIT_PDF_FILE_NAME,
  TOOLKIT_PDF_PATH,
  TOOLKIT_VERSION,
  toolkitHowToUse,
  toolkitParts,
  type ToolkitTool,
} from "./toolkitContent";

/** Blank rows shown online. The PDF has the full number to fill in. */
const ONLINE_TABLE_ROWS = 3;

interface ToolkitContentStepProps {
  name: string;
  onPrevious: () => void;
  onClose: () => void;
}

interface ToolPanelProps {
  tool: ToolkitTool;
}

function ToolTable({ tool }: ToolPanelProps) {
  const { title, columns, rows } = tool.template;
  const blankRows = Array.from({ length: Math.min(rows, ONLINE_TABLE_ROWS) });

  return (
    <TableContainer
      sx={{
        mt: 1,
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 1,
      }}
    >
      <Table size="small" aria-label={title} sx={{ minWidth: 520 }}>
        <TableHead>
          <TableRow
            sx={{
              bgcolor:
                "color-mix(in srgb, var(--color-light-yellow) 18%, var(--color-white))",
            }}
          >
            {columns.map((column) => (
              <TableCell
                key={column}
                sx={{ fontWeight: 700, whiteSpace: "nowrap" }}
              >
                {column}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>

        <TableBody>
          {blankRows.map((_, rowIndex) => (
            <TableRow key={rowIndex}>
              {columns.map((column) => (
                <TableCell
                  key={column}
                  sx={{
                    height: 40,
                    borderRight: "1px solid",
                    borderColor: "divider",
                    "&:last-child": { borderRight: 0 },
                  }}
                />
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

function ToolPanel({ tool }: ToolPanelProps) {
  return (
    <Stack spacing={2}>
      <Typography variant="body2" color="text.secondary">
        {tool.purpose}
      </Typography>

      <Box>
        <Typography variant="subtitle2" component="h4" gutterBottom>
          TODOs
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

      <Box
        sx={{
          p: 1.5,
          borderRadius: 2,
          bgcolor:
            "color-mix(in srgb, var(--color-light-yellow) 18%, var(--color-white))",
          border: "1px solid",
          borderColor: "divider",
        }}
      >
        <Typography variant="subtitle2" component="h4" gutterBottom>
          Question to ask your provider
        </Typography>
        <Typography variant="body2" sx={{ fontStyle: "italic" }}>
          {tool.askThem}
        </Typography>
      </Box>

      <Box>
        <Typography variant="subtitle2" component="h4">
          Write these down: {tool.template.title}
        </Typography>

        <Typography variant="caption" color="text.secondary" component="p">
          One row for each item. The PDF has the same table with more rows to
          print and fill in.
        </Typography>

        <ToolTable tool={tool} />
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
  // The first tool starts open so the reader lands straight on content.
  const [openTools, setOpenTools] = useState<Record<string, boolean>>({
    [toolkitParts[0].tools[0].id]: true,
  });

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

      {/* Download comes last: read first, keep a copy if you want one. */}
      <Box
        component="section"
        aria-labelledby="toolkit-download-title"
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
        <Box>
          <Typography
            id="toolkit-download-title"
            variant="subtitle1"
            component="h3"
          >
            Finished reading? Keep a copy.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Download all {TOOL_COUNT} tools as a PDF to print, fill in and share
            with your team.
          </Typography>
        </Box>

        <Button
          component="a"
          href={TOOLKIT_PDF_PATH}
          download={TOOLKIT_PDF_FILE_NAME}
          variant="contained"
          startIcon={<Download size={18} aria-hidden="true" />}
          onClick={handleDownload}
          className="shrink-0 rounded-lg bg-dark-yellow! font-bold normal-case text-black! hover:bg-light-yellow!"
        >
          Download PDF
        </Button>
      </Box>

      <StepFooter
        previous={{ label: "Previous", onClick: onPrevious }}
        next={{ label: "Close", onClick: onClose }}
      />
    </Stack>
  );
}
