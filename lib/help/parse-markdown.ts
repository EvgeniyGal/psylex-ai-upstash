export type HelpInline =
  | { type: "text"; text: string; bold?: boolean; italic?: boolean; code?: boolean }
  | { type: "break" };

export type HelpBlock =
  | { type: "h1" | "h2" | "h3"; text: string }
  | { type: "p"; inlines: HelpInline[] }
  | { type: "blockquote"; inlines: HelpInline[] }
  | { type: "ul" | "ol"; items: HelpInline[][] }
  | { type: "table"; headers: HelpInline[][]; rows: HelpInline[][][] }
  | { type: "code"; text: string }
  | { type: "hr" };

function stripLinkSyntax(text: string): string {
  return text.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/`([^`]+)`/g, "$1");
}

export function parseInlineMarkdown(text: string): HelpInline[] {
  const cleaned = stripLinkSyntax(text);
  const parts: HelpInline[] = [];
  const pattern = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(cleaned))) {
    if (match.index > last) {
      parts.push({ type: "text", text: cleaned.slice(last, match.index) });
    }
    const token = match[0];
    if (token.startsWith("**")) {
      parts.push({ type: "text", text: token.slice(2, -2), bold: true });
    } else if (token.startsWith("*")) {
      parts.push({ type: "text", text: token.slice(1, -1), italic: true });
    } else {
      parts.push({ type: "text", text: token.slice(1, -1), code: true });
    }
    last = match.index + token.length;
  }
  if (last < cleaned.length) {
    parts.push({ type: "text", text: cleaned.slice(last) });
  }
  return parts.length > 0 ? parts : [{ type: "text", text: cleaned }];
}

function inlinePlain(inlines: HelpInline[]): string {
  return inlines.map((part) => (part.type === "text" ? part.text : " ")).join("");
}

function splitTableRow(line: string): string[] {
  const trimmed = line.trim().replace(/^\|/, "").replace(/\|$/, "");
  return trimmed.split("|").map((cell) => cell.trim());
}

function isTableSeparator(line: string): boolean {
  return /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(line);
}

export function parseHelpMarkdown(markdown: string): HelpBlock[] {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const blocks: HelpBlock[] = [];
  let i = 0;

  const flushParagraph = (buffer: string[]) => {
    const text = buffer.join(" ").trim();
    if (text) blocks.push({ type: "p", inlines: parseInlineMarkdown(text) });
    buffer.length = 0;
  };

  while (i < lines.length) {
    const line = lines[i];

    if (line.trim() === "") {
      i += 1;
      continue;
    }

    if (line.startsWith("```")) {
      const code: string[] = [];
      i += 1;
      while (i < lines.length && !lines[i].startsWith("```")) {
        code.push(lines[i]);
        i += 1;
      }
      i += 1;
      blocks.push({ type: "code", text: code.join("\n") });
      continue;
    }

    if (/^\s*---+\s*$/.test(line) || /^\s*\*\*\*+\s*$/.test(line)) {
      blocks.push({ type: "hr" });
      i += 1;
      continue;
    }

    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      const level = heading[1].length;
      const type = level === 1 ? "h1" : level === 2 ? "h2" : "h3";
      blocks.push({ type, text: stripLinkSyntax(heading[2].trim()) });
      i += 1;
      continue;
    }

    if (line.trim().startsWith("|") && i + 1 < lines.length && isTableSeparator(lines[i + 1])) {
      const headers = splitTableRow(line).map((cell) => parseInlineMarkdown(cell));
      i += 2;
      const rows: HelpInline[][][] = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        rows.push(splitTableRow(lines[i]).map((cell) => parseInlineMarkdown(cell)));
        i += 1;
      }
      blocks.push({ type: "table", headers, rows });
      continue;
    }

    if (line.trim().startsWith(">")) {
      const quoted: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith(">")) {
        quoted.push(lines[i].replace(/^\s*>\s?/, ""));
        i += 1;
      }
      blocks.push({ type: "blockquote", inlines: parseInlineMarkdown(quoted.join(" ")) });
      continue;
    }

    const ulMatch = line.match(/^\s*[-*]\s+(.+)$/);
    if (ulMatch) {
      const items: HelpInline[][] = [];
      while (i < lines.length) {
        const item = lines[i].match(/^\s*[-*]\s+(.+)$/);
        if (!item) break;
        items.push(parseInlineMarkdown(item[1]));
        i += 1;
      }
      blocks.push({ type: "ul", items });
      continue;
    }

    const olMatch = line.match(/^\s*\d+\.\s+(.+)$/);
    if (olMatch) {
      const items: HelpInline[][] = [];
      while (i < lines.length) {
        const item = lines[i].match(/^\s*\d+\.\s+(.+)$/);
        if (!item) break;
        items.push(parseInlineMarkdown(item[1]));
        i += 1;
      }
      blocks.push({ type: "ol", items });
      continue;
    }

    const para: string[] = [line];
    i += 1;
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !lines[i].startsWith("#") &&
      !lines[i].startsWith("```") &&
      !lines[i].trim().startsWith(">") &&
      !lines[i].trim().startsWith("|") &&
      !/^\s*[-*]\s+/.test(lines[i]) &&
      !/^\s*\d+\.\s+/.test(lines[i]) &&
      !/^\s*---+\s*$/.test(lines[i])
    ) {
      para.push(lines[i]);
      i += 1;
    }
    flushParagraph(para);
  }

  return blocks;
}

export function helpInlinesToPlain(inlines: HelpInline[]): string {
  return inlinePlain(inlines);
}
