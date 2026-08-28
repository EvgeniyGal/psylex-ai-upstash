import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { generateHelpDocx } from "@/lib/help/generate-docx";
import { generateHelpPdf } from "@/lib/help/generate-pdf";
import type { HelpDocument } from "@/lib/help/types";

export async function writePublicHelpExports(doc: HelpDocument) {
  const dir = path.join(process.cwd(), "public", "docs", doc.locale);
  await mkdir(dir, { recursive: true });
  const [pdf, docx] = await Promise.all([generateHelpPdf(doc), generateHelpDocx(doc)]);
  await writeFile(path.join(dir, `${doc.slug}.pdf`), pdf);
  await writeFile(path.join(dir, `${doc.slug}.docx`), docx);
}
