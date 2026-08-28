import { existsSync } from "node:fs";
import path from "node:path";
import PDFDocument from "pdfkit";
import { helpInlinesToPlain, parseHelpMarkdown, type HelpInline } from "@/lib/help/parse-markdown";
import type { HelpDocument } from "@/lib/help/types";

const COLORS = {
  ink: "#1A1A18",
  muted: "#5C5C58",
  hairline: "#D8D4CC",
  accent: "#9A7B2F",
  quoteBg: "#FBF3E2",
  tableHeader: "#F6F3EC",
} as const;

const PAGE = {
  margin: 56,
  headerBottom: 118,
  footerReserve: 40,
} as const;

function assetPath(...segments: string[]) {
  return path.join(process.cwd(), "assets", ...segments);
}

function fontPath(filename: string) {
  return assetPath("fonts", filename);
}

function logoPath() {
  return assetPath("logo.png");
}

function contentWidth(doc: PDFKit.PDFDocument) {
  return doc.page.width - PAGE.margin * 2;
}

function contentBottom(doc: PDFKit.PDFDocument) {
  return doc.page.height - PAGE.margin - PAGE.footerReserve;
}

function ensureMinSpace(doc: PDFKit.PDFDocument, minHeight: number) {
  if (doc.y + minHeight > contentBottom(doc)) {
    doc.addPage();
  }
}

function drawHeader(doc: PDFKit.PDFDocument, regularFont: string, boldFont: string, label: string) {
  const top = PAGE.margin - 8;
  const logoSize = 40;
  const textLeft = PAGE.margin + logoSize + 14;
  const logoFile = logoPath();

  if (existsSync(logoFile)) {
    doc.image(logoFile, PAGE.margin, top, { width: logoSize, height: logoSize });
  }

  doc.font(boldFont).fontSize(18).fillColor(COLORS.ink).text("PsyLex", textLeft, top + 2, {
    lineBreak: false,
  });
  doc.font(regularFont).fontSize(10).fillColor(COLORS.muted).text(label, textLeft, top + 26, {
    lineBreak: false,
  });

  const ruleY = top + logoSize + 12;
  doc
    .moveTo(PAGE.margin, ruleY)
    .lineTo(doc.page.width - PAGE.margin, ruleY)
    .lineWidth(1.25)
    .strokeColor(COLORS.accent)
    .stroke();
}

function drawFooters(doc: PDFKit.PDFDocument, regularFont: string) {
  const pageRange = doc.bufferedPageRange();
  const savedX = doc.x;
  const savedY = doc.y;

  for (let index = 0; index < pageRange.count; index += 1) {
    doc.switchToPage(pageRange.start + index);
    const margins = { ...doc.page.margins };
    doc.page.margins.top = 0;
    doc.page.margins.bottom = 0;
    doc.page.margins.left = 0;
    doc.page.margins.right = 0;

    const lineY = doc.page.height - PAGE.margin - 18;
    const textY = doc.page.height - PAGE.margin - 10;

    doc
      .moveTo(PAGE.margin, lineY)
      .lineTo(doc.page.width - PAGE.margin, lineY)
      .lineWidth(0.5)
      .strokeColor(COLORS.hairline)
      .stroke();

    doc.font(regularFont).fontSize(8).fillColor(COLORS.muted);
    doc.text("PsyLex", PAGE.margin, textY, { lineBreak: false });
    const pageLabel = `${index + 1} / ${pageRange.count}`;
    const pageLabelWidth = doc.widthOfString(pageLabel);
    doc.text(pageLabel, doc.page.width - PAGE.margin - pageLabelWidth, textY, { lineBreak: false });

    doc.page.margins.top = margins.top;
    doc.page.margins.bottom = margins.bottom;
    doc.page.margins.left = margins.left;
    doc.page.margins.right = margins.right;
  }

  doc.switchToPage(pageRange.start + pageRange.count - 1);
  doc.x = savedX;
  doc.y = Math.min(savedY, contentBottom(doc));
}

function writeInlines(
  doc: PDFKit.PDFDocument,
  regularFont: string,
  boldFont: string,
  inlines: HelpInline[],
  options: { width: number; x?: number; y?: number } = { width: 0 },
) {
  const width = options.width || contentWidth(doc);
  if (options.y !== undefined) doc.y = options.y;
  const parts = inlines.filter((part): part is Extract<HelpInline, { type: "text" }> => part.type === "text");
  if (parts.length === 0) {
    if (options.x !== undefined) {
      doc.text(" ", options.x, doc.y, { width });
    } else {
      doc.text(" ", { width });
    }
    return;
  }
  parts.forEach((part, index) => {
    doc.font(part.bold ? boldFont : regularFont).fillColor(COLORS.ink);
    const opts = {
      continued: index < parts.length - 1,
      lineGap: 2,
      width,
    };
    if (index === 0 && options.x !== undefined) {
      doc.text(part.text, options.x, doc.y, opts);
    } else {
      doc.text(part.text, opts);
    }
  });
}

export async function generateHelpPdf(docContent: HelpDocument): Promise<Buffer> {
  const blocks = parseHelpMarkdown(docContent.body);
  const label = docContent.locale === "uk" ? "Інструкція користувача" : "User guide";

  return new Promise((resolve, reject) => {
    const regularFont = fontPath("NotoSans-Regular.ttf");
    const boldFont = fontPath("NotoSans-Bold.ttf");

    const doc = new PDFDocument({
      size: "A4",
      margins: {
        top: PAGE.margin,
        bottom: PAGE.margin + PAGE.footerReserve,
        left: PAGE.margin,
        right: PAGE.margin,
      },
      bufferPages: true,
      info: {
        Title: docContent.title,
        Author: "PsyLex",
        Producer: "PsyLex",
      },
    });

    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.on("pageAdded", () => {
      doc.font(regularFont);
      drawHeader(doc, regularFont, boldFont, label);
      doc.x = PAGE.margin;
      doc.y = PAGE.headerBottom;
    });

    doc.font(regularFont);
    drawHeader(doc, regularFont, boldFont, label);
    doc.x = PAGE.margin;
    doc.y = PAGE.headerBottom;

    doc.font(boldFont).fontSize(18).fillColor(COLORS.ink).text(docContent.title, PAGE.margin, doc.y, {
      align: "center",
      lineGap: 4,
      width: contentWidth(doc),
    });
    doc.moveDown(0.7);

    for (const block of blocks) {
      if (block.type === "h1") continue;

      if (block.type === "h2") {
        ensureMinSpace(doc, 36);
        doc.moveDown(0.45);
        doc.font(boldFont).fontSize(13).fillColor(COLORS.ink).text(block.text, PAGE.margin, doc.y, {
          width: contentWidth(doc),
        });
        doc
          .moveTo(PAGE.margin, doc.y + 4)
          .lineTo(PAGE.margin + 72, doc.y + 4)
          .lineWidth(1)
          .strokeColor(COLORS.accent)
          .stroke();
        doc.moveDown(0.55);
        continue;
      }

      if (block.type === "h3") {
        ensureMinSpace(doc, 28);
        doc.moveDown(0.25);
        doc.font(boldFont).fontSize(11).fillColor(COLORS.ink).text(block.text, PAGE.margin, doc.y, {
          width: contentWidth(doc),
        });
        doc.moveDown(0.25);
        continue;
      }

      if (block.type === "hr") {
        ensureMinSpace(doc, 16);
        doc.moveDown(0.2);
        doc
          .moveTo(PAGE.margin, doc.y)
          .lineTo(doc.page.width - PAGE.margin, doc.y)
          .lineWidth(0.5)
          .strokeColor(COLORS.hairline)
          .stroke();
        doc.moveDown(0.5);
        continue;
      }

      if (block.type === "p") {
        ensureMinSpace(doc, 24);
        doc.font(regularFont).fontSize(10.5);
        writeInlines(doc, regularFont, boldFont, block.inlines, {
          width: contentWidth(doc),
          x: PAGE.margin,
        });
        doc.moveDown(0.45);
        continue;
      }

      if (block.type === "blockquote") {
        ensureMinSpace(doc, 40);
        const startY = doc.y;
        const pad = 10;
        const innerWidth = contentWidth(doc) - pad * 2 - 6;
        doc.x = PAGE.margin + pad + 6;
        doc.y = startY + pad;
        doc.font(regularFont).fontSize(10);
        writeInlines(doc, regularFont, boldFont, block.inlines, {
          width: innerWidth,
          x: PAGE.margin + pad + 6,
        });
        const boxHeight = Math.max(doc.y - startY + pad, 28);
        doc
          .save()
          .rect(PAGE.margin, startY, 4, boxHeight)
          .fill(COLORS.accent)
          .restore();
        doc
          .roundedRect(PAGE.margin, startY, contentWidth(doc), boxHeight, 4)
          .lineWidth(0.5)
          .strokeColor(COLORS.hairline)
          .stroke();
        doc.y = startY + boxHeight + 10;
        doc.x = PAGE.margin;
        continue;
      }

      if (block.type === "ul" || block.type === "ol") {
        block.items.forEach((item, index) => {
          ensureMinSpace(doc, 18);
          const marker = block.type === "ol" ? `${index + 1}.` : "•";
          doc.font(regularFont).fontSize(10.5).fillColor(COLORS.ink);
          doc.text(`${marker}  `, PAGE.margin, doc.y, { continued: true, width: contentWidth(doc) });
          writeInlines(doc, regularFont, boldFont, item, { width: contentWidth(doc) - 16, x: PAGE.margin });
          doc.moveDown(0.15);
        });
        doc.moveDown(0.3);
        continue;
      }

      if (block.type === "code") {
        ensureMinSpace(doc, 36);
        const startY = doc.y;
        doc.font(regularFont).fontSize(9).fillColor(COLORS.ink).text(block.text, PAGE.margin + 10, startY + 8, {
          width: contentWidth(doc) - 20,
          lineGap: 2,
        });
        const height = doc.y - startY + 8;
        doc.roundedRect(PAGE.margin, startY, contentWidth(doc), height, 4).lineWidth(0.5).strokeColor(COLORS.hairline).stroke();
        doc.y = startY + height + 10;
        continue;
      }

      if (block.type === "table") {
        const cols = Math.max(block.headers.length, 1);
        const colWidth = contentWidth(doc) / cols;
        const drawRow = (cells: HelpInline[][], header: boolean) => {
          const heights = cells.map((cell) => {
            doc.font(header ? boldFont : regularFont).fontSize(8.5);
            return doc.heightOfString(helpInlinesToPlain(cell), { width: colWidth - 10 }) + 12;
          });
          const rowHeight = Math.max(...heights, 22);
          ensureMinSpace(doc, rowHeight + 2);
          const y = doc.y;
          if (header) {
            doc.rect(PAGE.margin, y, contentWidth(doc), rowHeight).fill(COLORS.tableHeader);
          }
          cells.forEach((cell, col) => {
            const x = PAGE.margin + col * colWidth;
            doc.rect(x, y, colWidth, rowHeight).lineWidth(0.4).strokeColor(COLORS.hairline).stroke();
            const inlines = header
              ? cell.map((part) => (part.type === "text" ? { ...part, bold: true } : part))
              : cell;
            doc.font(header ? boldFont : regularFont).fontSize(8.5);
            writeInlines(doc, regularFont, boldFont, inlines, {
              width: colWidth - 10,
              x: x + 5,
              y: y + 5,
            });
          });
          doc.y = y + rowHeight;
          doc.x = PAGE.margin;
        };
        drawRow(block.headers, true);
        for (const row of block.rows) {
          drawRow(row, false);
        }
        doc.moveDown(0.5);
      }
    }

    drawFooters(doc, regularFont);
    doc.end();
  });
}
