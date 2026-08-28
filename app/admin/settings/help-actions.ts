"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { HELP_SLUGS } from "@/lib/help/types";
import { listAllHelpDocuments, resetHelpDocument, saveHelpDocument } from "@/lib/help/documents";
import { writePublicHelpExports } from "@/lib/help/write-public";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    throw new Error("Unauthorized");
  }
}

const slugSchema = z.enum(HELP_SLUGS);
const localeSchema = z.enum(["en", "uk"]);

export async function loadAllHelpDocumentsAction() {
  await requireAdmin();
  return listAllHelpDocuments();
}

export async function saveHelpDocumentAction(formData: FormData) {
  await requireAdmin();
  const slug = slugSchema.parse(formData.get("slug"));
  const locale = localeSchema.parse(formData.get("locale"));
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  if (!title || !body) throw new Error("Title and body are required.");

  await saveHelpDocument({ slug, locale, title, body });
  await writePublicHelpExports({ slug, locale, title, body }).catch(() => undefined);
  revalidatePath("/admin/settings");
}

export async function resetHelpDocumentAction(formData: FormData) {
  await requireAdmin();
  const slug = slugSchema.parse(formData.get("slug"));
  const locale = localeSchema.parse(formData.get("locale"));
  const doc = await resetHelpDocument(slug, locale);
  await writePublicHelpExports(doc).catch(() => undefined);
  revalidatePath("/admin/settings");
  return doc;
}
