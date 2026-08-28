import { mkdir } from "node:fs/promises";
import path from "node:path";
import { readAllBundledHelpDocuments } from "@/lib/help/bundled";
import { writePublicHelpExports } from "@/lib/help/write-public";

async function main() {
  const docs = readAllBundledHelpDocuments();
  for (const doc of docs) {
    await mkdir(path.join(process.cwd(), "public", "docs", doc.locale), { recursive: true });
    await writePublicHelpExports(doc);
    console.log(`Wrote public/docs/${doc.locale}/${doc.slug}.{pdf,docx}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
