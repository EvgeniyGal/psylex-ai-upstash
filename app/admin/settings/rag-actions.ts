"use server";

import { eq } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { requireSessionUserId } from "@/lib/auth-session";
import { db } from "@/lib/db";
import { legalDocuments, platformSettings } from "@/drizzle/schema";
import { isOpenAIEmbeddingModel } from "@/lib/pipeline/openai-models";
import { getPlatformSettings } from "@/lib/platform-settings";
import { isLegalDocumentCategory } from "@/lib/rag/categories";
import { getAllLegalDocuments } from "@/lib/rag/documents";
import { validateUploadFile } from "@/lib/rag/extract";
import { processDocument } from "@/lib/rag/ingest";
import { runRagInquiry } from "@/lib/rag/inquiry";
import { isUsaSubJurisdiction, parseUsaSubJurisdiction } from "@/lib/rag/usa-jurisdictions";
import { isRoomJurisdiction } from "@/lib/room/jurisdiction";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    throw new Error("Unauthorized");
  }
  return session;
}

const uploadSchema = z
  .object({
    name: z.string().trim().min(1),
    sourceUrl: z.string().trim().url(),
    jurisdiction: z.string().refine(isRoomJurisdiction, "Invalid jurisdiction"),
    usaSubJurisdiction: z.string().optional(),
    category: z.string().refine(isLegalDocumentCategory, "Invalid category"),
  })
  .superRefine((value, ctx) => {
    if (value.jurisdiction === "usa") {
      if (!value.usaSubJurisdiction || !isUsaSubJurisdiction(value.usaSubJurisdiction)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "US jurisdiction is required.",
          path: ["usaSubJurisdiction"],
        });
      }
    } else if (value.usaSubJurisdiction) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "US jurisdiction is only valid for USA documents.",
        path: ["usaSubJurisdiction"],
      });
    }
  });

const updateSchema = z
  .object({
    id: z.string().uuid(),
    name: z.string().trim().min(1),
    sourceUrl: z.string().trim().url(),
    jurisdiction: z.string().refine(isRoomJurisdiction, "Invalid jurisdiction"),
    usaSubJurisdiction: z.string().optional(),
    category: z.string().refine(isLegalDocumentCategory, "Invalid category"),
  })
  .superRefine((value, ctx) => {
    if (value.jurisdiction === "usa") {
      if (!value.usaSubJurisdiction || !isUsaSubJurisdiction(value.usaSubJurisdiction)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "US jurisdiction is required.",
          path: ["usaSubJurisdiction"],
        });
      }
    } else if (value.usaSubJurisdiction) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "US jurisdiction is only valid for USA documents.",
        path: ["usaSubJurisdiction"],
      });
    }
  });

export async function uploadDocument(formData: FormData) {
  await requireAdmin();
  const userId = await requireSessionUserId();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    throw new Error("Document file is required.");
  }

  const usaSubJurisdictionValue = String(formData.get("usaSubJurisdiction") ?? "").trim();
  const parsed = uploadSchema.parse({
    name: formData.get("name"),
    sourceUrl: formData.get("sourceUrl"),
    jurisdiction: formData.get("jurisdiction"),
    usaSubJurisdiction: usaSubJurisdictionValue || undefined,
    category: formData.get("category"),
  });

  const buffer = Buffer.from(await file.arrayBuffer());
  const { mimeType } = validateUploadFile(file.name, buffer.length);

  const [created] = await db
    .insert(legalDocuments)
    .values({
      name: parsed.name,
      sourceUrl: parsed.sourceUrl,
      jurisdiction: parsed.jurisdiction,
      usaSubJurisdiction:
        parsed.jurisdiction === "usa" && parsed.usaSubJurisdiction ? parsed.usaSubJurisdiction : null,
      category: parsed.category,
      originalFilename: file.name,
      mimeType,
      fileData: buffer,
      status: "pending",
      uploadedByUserId: userId,
    })
    .returning({ id: legalDocuments.id });

  try {
    await processDocument(created.id);
  } catch {
    // Status is persisted as failed inside processDocument.
  }

  revalidatePath("/admin/settings");
}

export async function updateDocument(formData: FormData) {
  await requireAdmin();

  const usaSubJurisdictionValue = String(formData.get("usaSubJurisdiction") ?? "").trim();
  const parsed = updateSchema.parse({
    id: formData.get("id"),
    name: formData.get("name"),
    sourceUrl: formData.get("sourceUrl"),
    jurisdiction: formData.get("jurisdiction"),
    usaSubJurisdiction: usaSubJurisdictionValue || undefined,
    category: formData.get("category"),
  });

  const [existing] = await db
    .select({ id: legalDocuments.id })
    .from(legalDocuments)
    .where(eq(legalDocuments.id, parsed.id))
    .limit(1);

  if (!existing) throw new Error("Document not found.");

  await db
    .update(legalDocuments)
    .set({
      name: parsed.name,
      sourceUrl: parsed.sourceUrl,
      jurisdiction: parsed.jurisdiction,
      usaSubJurisdiction:
        parsed.jurisdiction === "usa" && parsed.usaSubJurisdiction ? parsed.usaSubJurisdiction : null,
      category: parsed.category,
      updatedAt: new Date(),
    })
    .where(eq(legalDocuments.id, parsed.id));

  revalidatePath("/admin/settings");
}

export async function deleteDocument(documentId: string) {
  await requireAdmin();

  if (!z.string().uuid().safeParse(documentId).success) {
    throw new Error("Invalid document id.");
  }

  await db.delete(legalDocuments).where(eq(legalDocuments.id, documentId));
  revalidatePath("/admin/settings");
}

/**
 * Switch embedding model and delete all RAG documents (chunks cascade).
 * Required because stored vectors are incompatible across embedding models.
 */
export async function changeEmbeddingModel(modelId: string) {
  await requireAdmin();

  const nextModel = modelId.trim();
  if (!isOpenAIEmbeddingModel(nextModel)) {
    throw new Error("Unsupported embedding model.");
  }

  const settings = await getPlatformSettings();
  if (settings.openaiEmbeddingModel === nextModel) {
    return { changed: false as const };
  }

  await db.delete(legalDocuments);
  await db
    .update(platformSettings)
    .set({
      openaiEmbeddingModel: nextModel,
      updatedAt: new Date(),
    })
    .where(eq(platformSettings.id, "default"));

  revalidatePath("/admin/settings");
  return { changed: true as const };
}

export async function reprocessDocument(documentId: string) {
  await requireAdmin();

  if (!z.string().uuid().safeParse(documentId).success) {
    throw new Error("Invalid document id.");
  }

  try {
    await processDocument(documentId);
  } catch {
    // Failed status is stored on the document.
  }

  revalidatePath("/admin/settings");
}

export async function testInquiry(formData: FormData) {
  await requireAdmin();

  const jurisdiction = String(formData.get("jurisdiction") ?? "");
  const question = String(formData.get("question") ?? "").trim();
  const documentId = String(formData.get("documentId") ?? "").trim();
  const categoryValue = String(formData.get("category") ?? "").trim();
  const usaSubJurisdictionValue = String(formData.get("usaSubJurisdiction") ?? "").trim();
  const localeValue = String(formData.get("locale") ?? "en");
  const locale = localeValue === "uk" ? "uk" : "en";

  if (!isRoomJurisdiction(jurisdiction)) throw new Error("Invalid jurisdiction.");
  if (!question) throw new Error("Question is required.");

  const category = categoryValue && isLegalDocumentCategory(categoryValue) ? categoryValue : undefined;
  const usaSubJurisdiction =
    usaSubJurisdictionValue && isUsaSubJurisdiction(usaSubJurisdictionValue)
      ? usaSubJurisdictionValue
      : undefined;

  if (documentId) {
    const [document] = await db.select().from(legalDocuments).where(eq(legalDocuments.id, documentId)).limit(1);
    if (!document) throw new Error("Document not found.");
    if (document.status !== "ready") throw new Error("Document processing is not complete.");

    return runRagInquiry({
      question,
      jurisdiction: document.jurisdiction,
      usaSubJurisdiction: parseUsaSubJurisdiction(document.usaSubJurisdiction) ?? undefined,
      category: document.category,
      documentId: document.id,
      locale,
    });
  }

  return runRagInquiry({
    question,
    jurisdiction,
    usaSubJurisdiction: jurisdiction === "usa" ? usaSubJurisdiction : undefined,
    category,
    locale,
  });
}

export async function loadRagDocuments() {
  await requireAdmin();
  return getAllLegalDocuments();
}
