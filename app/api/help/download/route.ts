import { NextResponse } from "next/server";
import { z } from "zod";
import { canAccessHelpSlug } from "@/lib/help/access";
import { getHelpDocument } from "@/lib/help/documents";
import { generateHelpDocx } from "@/lib/help/generate-docx";
import { generateHelpPdf } from "@/lib/help/generate-pdf";
import { HELP_SLUGS } from "@/lib/help/types";
import { getHelpViewer, resolveHelpLocale } from "@/lib/help/viewer";

const querySchema = z.object({
  slug: z.enum(HELP_SLUGS),
  format: z.enum(["pdf", "docx"]),
  locale: z.enum(["en", "uk"]).optional(),
});

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = querySchema.safeParse({
    slug: url.searchParams.get("slug"),
    format: url.searchParams.get("format"),
    locale: url.searchParams.get("locale") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { role, preferredLocale } = await getHelpViewer();
  const locale = resolveHelpLocale(parsed.data.locale ?? null, preferredLocale);

  if (!canAccessHelpSlug(role, parsed.data.slug)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const document = await getHelpDocument(parsed.data.slug, locale);
  if (!document) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const filename = `psylex-${document.slug}-${locale}.${parsed.data.format}`;
  const body =
    parsed.data.format === "pdf" ? await generateHelpPdf(document) : await generateHelpDocx(document);
  const contentType =
    parsed.data.format === "pdf"
      ? "application/pdf"
      : "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

  return new NextResponse(new Uint8Array(body), {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
