import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  Header,
  HeadingLevel,
  ImageRun,
  Packer,
  PageNumber,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";
import { parseHelpMarkdown, type HelpInline } from "@/lib/help/parse-markdown";
import type { HelpDocument } from "@/lib/help/types";

const GOLD = "9A7B2F";
const INK = "1A1A18";
const MUTED = "5C5C58";
const HAIR = "D8D4CC";
const QUOTE_BG = "FBF3E2";
const HEADER_BG = "F6F3EC";

function runsFromInlines(inlines: HelpInline[], size = 22): TextRun[] {
  return inlines
    .filter((part): part is Extract<HelpInline, { type: "text" }> => part.type === "text")
    .map(
      (part) =>
        new TextRun({
          text: part.text,
          bold: part.bold,
          italics: part.italic,
          font: part.code ? "Consolas" : "Calibri",
          size: part.code ? Math.max(size - 2, 16) : size,
          color: INK,
        }),
    );
}

function paragraphFromInlines(inlines: HelpInline[]) {
  return new Paragraph({
    spacing: { after: 160, line: 276 },
    children: runsFromInlines(inlines),
  });
}

function thinBorder() {
  return { style: BorderStyle.SINGLE, size: 4, color: HAIR };
}

function logoImage(): ImageRun | null {
  const file = path.join(process.cwd(), "assets", "logo.png");
  if (!existsSync(file)) return null;
  return new ImageRun({
    type: "png",
    data: readFileSync(file),
    transformation: { width: 36, height: 36 },
  });
}

export async function generateHelpDocx(docContent: HelpDocument): Promise<Buffer> {
  const blocks = parseHelpMarkdown(docContent.body);
  const label = docContent.locale === "uk" ? "Інструкція користувача" : "User guide";
  const logo = logoImage();

  const children: (Paragraph | Table)[] = [
    new Paragraph({
      spacing: { after: 80 },
      children: [
        new TextRun({ text: "PsyLex", bold: true, size: 40, font: "Georgia", color: INK }),
        new TextRun({ text: `  ·  ${label}`, size: 20, color: MUTED, font: "Calibri" }),
      ],
    }),
    new Paragraph({
      border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: GOLD, space: 8 } },
      spacing: { after: 280 },
      children: [new TextRun({ text: docContent.title, bold: true, size: 36, font: "Georgia", color: INK })],
    }),
  ];

  for (const block of blocks) {
    if (block.type === "h1") continue;
    if (block.type === "h2") {
      children.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 280, after: 120 },
          border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: GOLD, space: 4 } },
          children: [new TextRun({ text: block.text, bold: true, size: 28, font: "Georgia", color: INK })],
        }),
      );
      continue;
    }
    if (block.type === "h3") {
      children.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 200, after: 80 },
          children: [new TextRun({ text: block.text, bold: true, size: 24, font: "Calibri", color: INK })],
        }),
      );
      continue;
    }
    if (block.type === "hr") {
      children.push(
        new Paragraph({
          border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: HAIR, space: 1 } },
          spacing: { before: 120, after: 120 },
          children: [new TextRun("")],
        }),
      );
      continue;
    }
    if (block.type === "p") {
      children.push(paragraphFromInlines(block.inlines));
      continue;
    }
    if (block.type === "blockquote") {
      children.push(
        new Paragraph({
          shading: { type: ShadingType.CLEAR, fill: QUOTE_BG },
          border: { left: { style: BorderStyle.SINGLE, size: 16, color: GOLD, space: 8 } },
          spacing: { before: 80, after: 160 },
          indent: { left: 200, right: 120 },
          children: runsFromInlines(block.inlines),
        }),
      );
      continue;
    }
    if (block.type === "ul" || block.type === "ol") {
      block.items.forEach((item, index) => {
        children.push(
          new Paragraph({
            numbering:
              block.type === "ol"
                ? { reference: "help-numbered", level: 0 }
                : undefined,
            bullet: block.type === "ul" ? { level: 0 } : undefined,
            spacing: { after: 80 },
            children: runsFromInlines(item).length
              ? runsFromInlines(item)
              : [new TextRun({ text: `${index + 1}.`, color: INK })],
          }),
        );
      });
      continue;
    }
    if (block.type === "code") {
      children.push(
        new Paragraph({
          shading: { type: ShadingType.CLEAR, fill: HEADER_BG },
          spacing: { before: 80, after: 160 },
          children: [new TextRun({ text: block.text, font: "Consolas", size: 18, color: INK })],
        }),
      );
      continue;
    }
    if (block.type === "table") {
      const colCount = Math.max(block.headers.length, 1);
      const cellBorders = {
        top: thinBorder(),
        bottom: thinBorder(),
        left: thinBorder(),
        right: thinBorder(),
      };
      const makeCell = (inlines: HelpInline[], header: boolean) => {
        const styled = header
          ? inlines.map((part) => (part.type === "text" ? { ...part, bold: true } : part))
          : inlines;
        const runs = runsFromInlines(styled, 18);
        return new TableCell({
          borders: cellBorders,
          width: { size: Math.round(9000 / colCount), type: WidthType.DXA },
          shading: header ? { type: ShadingType.CLEAR, fill: HEADER_BG } : undefined,
          children: [
            new Paragraph({
              children: runs.length ? runs : [new TextRun({ text: "", size: 18, font: "Calibri", color: INK })],
            }),
          ],
        });
      };
      children.push(
        new Table({
          width: { size: 9000, type: WidthType.DXA },
          rows: [
            new TableRow({ children: block.headers.map((cell) => makeCell(cell, true)) }),
            ...block.rows.map((row) => new TableRow({ children: row.map((cell) => makeCell(cell, false)) })),
          ],
        }),
      );
      children.push(new Paragraph({ spacing: { after: 160 }, children: [new TextRun("")] }));
    }
  }

  const headerChildren: (TextRun | ImageRun)[] = [];
  if (logo) headerChildren.push(logo);
  headerChildren.push(new TextRun({ text: "  PsyLex", bold: true, font: "Georgia", size: 22, color: INK }));

  const document = new Document({
    numbering: {
      config: [
        {
          reference: "help-numbered",
          levels: [
            {
              level: 0,
              format: "decimal",
              text: "%1.",
              alignment: AlignmentType.LEFT,
            },
          ],
        },
      ],
    },
    sections: [
      {
        properties: {
          page: { margin: { top: 720, bottom: 720, left: 720, right: 720 } },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: GOLD, space: 6 } },
                children: headerChildren,
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                border: { top: { style: BorderStyle.SINGLE, size: 6, color: HAIR, space: 8 } },
                tabStops: [{ type: "right", position: 9360 }],
                children: [
                  new TextRun({ text: "PsyLex", size: 16, color: MUTED, font: "Calibri" }),
                  new TextRun({ text: "\t", size: 16 }),
                  new TextRun({ children: [PageNumber.CURRENT], size: 16, color: MUTED }),
                ],
              }),
            ],
          }),
        },
        children,
      },
    ],
  });

  return Buffer.from(await Packer.toBuffer(document));
}
