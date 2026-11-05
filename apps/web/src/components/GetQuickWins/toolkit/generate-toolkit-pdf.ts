/**
 * Generates the Technology Ownership Toolkit PDF from toolkitContent.ts, the
 * same file the online view reads, so the two stay in step.
 *
 * Run from the repo root after changing the content:
 *
 *   pnpm --filter @build-me/web generate:toolkit-pdf
 *
 * Output: apps/web/public/downloads/technology-ownership-toolkit.pdf
 * Commit the generated file; the "Download PDF" button links to it.
 *
 * One-time setup: pnpm --filter @build-me/web add -D pdf-lib tsx
 * and add to apps/web/package.json scripts:
 *   "generate:toolkit-pdf": "tsx scripts/generate-toolkit-pdf.ts"
 */
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import {
  PDFDocument,
  StandardFonts,
  rgb,
  type PDFFont,
  type PDFPage,
} from "pdf-lib";

import {
  TOOLKIT_PDF_PATH,
  TOOLKIT_TAGLINE,
  TOOLKIT_TITLE,
  TOOLKIT_VERSION,
  toolkitHowToUse,
  toolkitIntro,
  toolkitParts,
  type ToolkitTool,
} from "../src/components/GetQuickWins/toolkit/toolkitContent";

const PAGE_WIDTH = 595.28; // A4
const PAGE_HEIGHT = 841.89;
const MARGIN = 50;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const BOTTOM_LIMIT = 64;

const COLORS = {
  text: rgb(0.07, 0.08, 0.1),
  muted: rgb(0.35, 0.37, 0.41),
  accent: rgb(0.09, 0.27, 0.71),
  line: rgb(0.74, 0.77, 0.82),
  tint: rgb(0.92, 0.95, 0.99),
  white: rgb(1, 1, 1),
};

interface Fonts {
  regular: PDFFont;
  bold: PDFFont;
  italic: PDFFont;
}

/** Standard PDF fonts cover basic Latin only, so keep the text plain. */
function sanitize(text: string): string {
  return text
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\u00A0/g, " ")
    .replace(/[^\x20-\x7E\u00A1-\u00FF]/g, "?");
}

function wrap(
  text: string,
  font: PDFFont,
  size: number,
  maxWidth: number,
): string[] {
  const words = sanitize(text).split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";

  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;

    if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
      line = candidate;
    } else {
      if (line) lines.push(line);
      line = word;
    }
  }

  if (line) lines.push(line);

  return lines;
}

interface TextOptions {
  font: PDFFont;
  size: number;
  color?: ReturnType<typeof rgb>;
  x?: number;
  maxWidth?: number;
  lineHeight?: number;
  gapAfter?: number;
}

/** Writes top-down on a page, adding pages when a block does not fit. */
class Writer {
  y: number;

  constructor(
    private readonly doc: PDFDocument,
    public page: PDFPage,
    startY = PAGE_HEIGHT - MARGIN,
  ) {
    this.y = startY;
  }

  newPage(): void {
    this.page = this.doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    this.y = PAGE_HEIGHT - MARGIN;
  }

  ensure(height: number): void {
    if (this.y - height < BOTTOM_LIMIT) this.newPage();
  }

  gap(height: number): void {
    this.y -= height;
  }

  text(content: string, options: TextOptions): number {
    const {
      font,
      size,
      color = COLORS.text,
      x = MARGIN,
      maxWidth = CONTENT_WIDTH,
      lineHeight = size * 1.4,
      gapAfter = 0,
    } = options;

    const lines = wrap(content, font, size, maxWidth);

    for (const line of lines) {
      this.ensure(lineHeight);
      this.page.drawText(line, {
        x,
        y: this.y - size,
        size,
        font,
        color,
      });
      this.y -= lineHeight;
    }

    this.y -= gapAfter;

    return lines.length;
  }
}

function drawFooters(doc: PDFDocument, fonts: Fonts): void {
  const pages = doc.getPages();
  const label = sanitize(`${TOOLKIT_TITLE} \u00B7 Version ${TOOLKIT_VERSION}`);

  pages.forEach((page, index) => {
    // The cover has no footer.
    if (index === 0) return;

    page.drawLine({
      start: { x: MARGIN, y: 44 },
      end: { x: PAGE_WIDTH - MARGIN, y: 44 },
      thickness: 0.5,
      color: COLORS.line,
    });

    page.drawText(label, {
      x: MARGIN,
      y: 30,
      size: 8,
      font: fonts.regular,
      color: COLORS.muted,
    });

    const pageLabel = `Page ${index + 1} of ${pages.length}`;

    page.drawText(pageLabel, {
      x: PAGE_WIDTH - MARGIN - fonts.regular.widthOfTextAtSize(pageLabel, 8),
      y: 30,
      size: 8,
      font: fonts.regular,
      color: COLORS.muted,
    });
  });
}

function drawCover(doc: PDFDocument, fonts: Fonts): PDFPage {
  const page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);

  page.drawRectangle({
    x: 0,
    y: PAGE_HEIGHT - 250,
    width: PAGE_WIDTH,
    height: 250,
    color: COLORS.accent,
  });

  const writer = new Writer(doc, page, PAGE_HEIGHT - 90);

  writer.text("TECHNOLOGY OWNERSHIP", {
    font: fonts.bold,
    size: 10,
    color: rgb(0.78, 0.86, 1),
    gapAfter: 6,
  });
  writer.text(TOOLKIT_TITLE, {
    font: fonts.bold,
    size: 32,
    color: COLORS.white,
    lineHeight: 38,
    gapAfter: 10,
  });
  writer.text(TOOLKIT_TAGLINE, {
    font: fonts.regular,
    size: 12,
    color: rgb(0.9, 0.94, 1),
    maxWidth: 420,
    lineHeight: 17,
  });

  writer.y = PAGE_HEIGHT - 290;

  const sections: Array<[string, string]> = [
    ["What is the Toolkit?", toolkitIntro.what],
    ["Why use it?", toolkitIntro.why],
    ["Who is it for?", toolkitIntro.who],
  ];

  for (const [heading, body] of sections) {
    writer.text(heading, {
      font: fonts.bold,
      size: 13,
      color: COLORS.accent,
      gapAfter: 4,
    });
    writer.text(body, {
      font: fonts.regular,
      size: 11,
      color: COLORS.text,
      lineHeight: 16,
      gapAfter: 16,
    });
  }

  writer.text(`Version ${TOOLKIT_VERSION}`, {
    font: fonts.italic,
    size: 9,
    color: COLORS.muted,
  });

  return page;
}

function drawContents(
  doc: PDFDocument,
  page: PDFPage,
  fonts: Fonts,
  pageByTool: Map<string, number>,
): void {
  const writer = new Writer(doc, page);

  writer.text("How to use this toolkit", {
    font: fonts.bold,
    size: 20,
    color: COLORS.accent,
    gapAfter: 10,
  });

  toolkitHowToUse.forEach((item, index) => {
    writer.text(`${index + 1}.`, {
      font: fonts.bold,
      size: 11,
      lineHeight: 0,
    });
    writer.text(item, {
      font: fonts.regular,
      size: 11,
      x: MARGIN + 20,
      maxWidth: CONTENT_WIDTH - 20,
      lineHeight: 16,
      gapAfter: 5,
    });
  });

  writer.gap(14);

  writer.text("What is inside", {
    font: fonts.bold,
    size: 20,
    color: COLORS.accent,
    gapAfter: 10,
  });

  toolkitParts.forEach((part, partIndex) => {
    writer.text(`Part ${partIndex + 1}: ${part.title}`, {
      font: fonts.bold,
      size: 12,
      gapAfter: 2,
    });
    writer.text(part.summary, {
      font: fonts.italic,
      size: 10,
      color: COLORS.muted,
      gapAfter: 5,
    });

    for (const tool of part.tools) {
      const startPage = String(pageByTool.get(tool.id) ?? "");
      const rowY = writer.y;

      writer.text(tool.title, {
        font: fonts.regular,
        size: 11,
        x: MARGIN + 14,
        maxWidth: CONTENT_WIDTH - 60,
        lineHeight: 16,
      });

      page.drawText(startPage, {
        x: PAGE_WIDTH - MARGIN - fonts.regular.widthOfTextAtSize(startPage, 11),
        y: rowY - 11,
        size: 11,
        font: fonts.regular,
        color: COLORS.muted,
      });
    }

    writer.gap(10);
  });
}

function drawTemplateTable(
  writer: Writer,
  fonts: Fonts,
  tool: ToolkitTool,
): void {
  const { columns, rows } = tool.template;
  const columnWidth = CONTENT_WIDTH / columns.length;
  const headerSize = 8;
  const headerLines = columns.map((column) =>
    wrap(column, fonts.bold, headerSize, columnWidth - 8),
  );
  const headerHeight = Math.max(...headerLines.map((l) => l.length)) * 11 + 10;
  const rowHeight = 26;

  writer.ensure(headerHeight + rowHeight * Math.min(rows, 2));

  const top = writer.y;

  columns.forEach((_, index) => {
    const x = MARGIN + index * columnWidth;

    writer.page.drawRectangle({
      x,
      y: top - headerHeight,
      width: columnWidth,
      height: headerHeight,
      color: COLORS.tint,
      borderColor: COLORS.line,
      borderWidth: 0.75,
    });

    headerLines[index].forEach((line, lineIndex) => {
      writer.page.drawText(line, {
        x: x + 4,
        y: top - 14 - lineIndex * 11,
        size: headerSize,
        font: fonts.bold,
        color: COLORS.text,
      });
    });
  });

  writer.y = top - headerHeight;

  for (let row = 0; row < rows; row += 1) {
    writer.ensure(rowHeight);

    columns.forEach((_, index) => {
      writer.page.drawRectangle({
        x: MARGIN + index * columnWidth,
        y: writer.y - rowHeight,
        width: columnWidth,
        height: rowHeight,
        borderColor: COLORS.line,
        borderWidth: 0.75,
      });
    });

    writer.y -= rowHeight;
  }

  writer.gap(14);
}

function drawTool(
  doc: PDFDocument,
  fonts: Fonts,
  tool: ToolkitTool,
  partNumber: number,
  partTitle: string,
): void {
  const writer = new Writer(doc, doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]));

  writer.text(`PART ${partNumber} OF ${toolkitParts.length}: ${partTitle}`, {
    font: fonts.bold,
    size: 8.5,
    color: COLORS.accent,
    gapAfter: 6,
  });
  writer.text(tool.title, {
    font: fonts.bold,
    size: 22,
    lineHeight: 27,
    gapAfter: 4,
  });
  writer.text(tool.purpose, {
    font: fonts.regular,
    size: 11.5,
    color: COLORS.muted,
    lineHeight: 16,
    gapAfter: 16,
  });

  writer.text("Checklist", {
    font: fonts.bold,
    size: 13,
    color: COLORS.accent,
    gapAfter: 6,
  });

  for (const item of tool.checklist) {
    const lines = wrap(item, fonts.regular, 10.5, CONTENT_WIDTH - 22);
    writer.ensure(lines.length * 15);

    // Empty box to tick once the item is confirmed.
    writer.page.drawRectangle({
      x: MARGIN,
      y: writer.y - 10.5,
      width: 9,
      height: 9,
      borderColor: COLORS.text,
      borderWidth: 0.9,
    });

    writer.text(item, {
      font: fonts.regular,
      size: 10.5,
      x: MARGIN + 20,
      maxWidth: CONTENT_WIDTH - 22,
      lineHeight: 15,
      gapAfter: 4,
    });
  }

  writer.gap(10);

  writer.text(`Template: ${tool.template.title}`, {
    font: fonts.bold,
    size: 13,
    color: COLORS.accent,
    gapAfter: 3,
  });
  writer.text(
    "One entry per row. Record where things are kept, never passwords.",
    {
      font: fonts.italic,
      size: 9,
      color: COLORS.muted,
      gapAfter: 8,
    },
  );

  drawTemplateTable(writer, fonts, tool);

  const doneLines = wrap(tool.doneWhen, fonts.regular, 10.5, CONTENT_WIDTH - 24);
  const boxHeight = doneLines.length * 15 + 30;

  writer.ensure(boxHeight);

  writer.page.drawRectangle({
    x: MARGIN,
    y: writer.y - boxHeight,
    width: CONTENT_WIDTH,
    height: boxHeight,
    color: COLORS.tint,
  });

  writer.page.drawText("Done when", {
    x: MARGIN + 12,
    y: writer.y - 18,
    size: 10,
    font: fonts.bold,
    color: COLORS.accent,
  });

  doneLines.forEach((line, index) => {
    writer.page.drawText(line, {
      x: MARGIN + 12,
      y: writer.y - 33 - index * 15,
      size: 10.5,
      font: fonts.regular,
      color: COLORS.text,
    });
  });

  writer.y -= boxHeight;
}

async function main(): Promise<void> {
  const doc = await PDFDocument.create();

  const fonts: Fonts = {
    regular: await doc.embedFont(StandardFonts.Helvetica),
    bold: await doc.embedFont(StandardFonts.HelveticaBold),
    italic: await doc.embedFont(StandardFonts.HelveticaOblique),
  };

  doc.setTitle(TOOLKIT_TITLE);
  doc.setSubject(TOOLKIT_TAGLINE);
  doc.setCreator("Build Me");
  doc.setProducer("Build Me toolkit generator");

  drawCover(doc, fonts);

  // Page 2 is filled in last, once the page of every tool is known.
  const contentsPage = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);

  const pageByTool = new Map<string, number>();

  toolkitParts.forEach((part, partIndex) => {
    for (const tool of part.tools) {
      pageByTool.set(tool.id, doc.getPageCount() + 1);
      drawTool(doc, fonts, tool, partIndex + 1, part.title);
    }
  });

  drawContents(doc, contentsPage, fonts, pageByTool);
  drawFooters(doc, fonts);

  const bytes = await doc.save();

  const outputPath = resolve(process.cwd(), "public", TOOLKIT_PDF_PATH.slice(1));
  await mkdir(resolve(outputPath, ".."), { recursive: true });
  await writeFile(outputPath, bytes);

  console.log(
    `Wrote ${outputPath} (${doc.getPageCount()} pages, ${Math.round(bytes.length / 1024)} KB)`,
  );
}

main().catch((error: unknown) => {
  console.error("Could not generate the toolkit PDF.", error);
  process.exit(1);
});
