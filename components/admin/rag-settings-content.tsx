"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  deleteDocument,
  reprocessDocument,
  testInquiry,
  updateDocument,
  uploadDocument,
} from "@/app/admin/settings/rag-actions";
import { useLocale } from "@/components/locale-provider";
import { ModalOverlay } from "@/components/ui/modal";
import { Spinner } from "@/components/ui/spinner";
import { LEGAL_DOCUMENT_CATEGORIES, getCategoryLabel } from "@/lib/rag/categories";
import type { LegalDocumentCategory, LegalDocumentRow, RoomJurisdiction } from "@/lib/rag/types";
import type { RagInquiryResult } from "@/lib/rag/types";
import {
  USA_SUB_JURISDICTIONS_SORTED,
  documentMatchesUsaSubJurisdiction,
  getUsaSubJurisdictionLabel,
  type UsaSubJurisdiction,
} from "@/lib/rag/usa-jurisdictions";

const inputClass =
  "w-full rounded-md border border-hair bg-paper px-3 py-2 text-ink focus:border-law focus:outline-none focus:ring-1 focus:ring-law";

type RagSettingsContentProps = {
  documents: LegalDocumentRow[];
};

type ModalState =
  | { type: "upload" }
  | { type: "edit"; document: LegalDocumentRow }
  | { type: "delete"; document: LegalDocumentRow }
  | null;

type JurisdictionTab = RoomJurisdiction;

const RAG_JURISDICTION_TAB_KEY = "rag.activeJurisdictionTab";

function readStoredJurisdictionTab(): JurisdictionTab {
  if (typeof window === "undefined") return "ukraine";
  const stored = window.localStorage.getItem(RAG_JURISDICTION_TAB_KEY);
  return stored === "usa" || stored === "ukraine" ? stored : "ukraine";
}

function statusLabel(
  status: LegalDocumentRow["status"],
  admin: ReturnType<typeof useLocale>["admin"],
) {
  if (status === "pending") return admin.ragStatusPending;
  if (status === "processing") return admin.ragStatusProcessing;
  if (status === "ready") return admin.ragStatusReady;
  return admin.ragStatusFailed;
}

function statusClass(status: LegalDocumentRow["status"]) {
  if (status === "ready") return "bg-law-fill text-on-tertiary";
  if (status === "failed") return "bg-error/15 text-error";
  if (status === "processing") return "bg-primary/15 text-primary";
  return "bg-on-surface-variant/10 text-on-surface-variant";
}

export function RagSettingsContent({ documents }: RagSettingsContentProps) {
  const { admin, locale } = useLocale();
  const [modal, setModal] = useState<ModalState>(null);
  const [selectedUploadFileName, setSelectedUploadFileName] = useState("");
  const [uploadJurisdiction, setUploadJurisdiction] = useState<"" | RoomJurisdiction>("");
  const [editJurisdiction, setEditJurisdiction] = useState<RoomJurisdiction>("ukraine");
  const [activeJurisdictionTab, setActiveJurisdictionTab] = useState<JurisdictionTab>("ukraine");
  const [ukraineCategoryFilter, setUkraineCategoryFilter] = useState<"" | LegalDocumentCategory>("");
  const [usaCategoryFilter, setUsaCategoryFilter] = useState<"" | LegalDocumentCategory>("");
  const [usaSubJurisdictionFilter, setUsaSubJurisdictionFilter] = useState<"" | UsaSubJurisdiction>("");
  const [testJurisdiction, setTestJurisdiction] = useState<RoomJurisdiction>("ukraine");
  const [testCategory, setTestCategory] = useState<"" | LegalDocumentCategory>("");
  const [testUsaSubJurisdiction, setTestUsaSubJurisdiction] = useState<"" | UsaSubJurisdiction>("");
  const [testDocumentId, setTestDocumentId] = useState("");
  const [testQuestion, setTestQuestion] = useState("");
  const [testResult, setTestResult] = useState<RagInquiryResult | null>(null);
  const [pending, startTransition] = useTransition();
  const uploadFileInputRef = useRef<HTMLInputElement | null>(null);
  const jurisdictionTabHydrated = useRef(false);

  const ukraineDocuments = useMemo(
    () =>
      documents.filter(
        (doc) =>
          doc.jurisdiction === "ukraine" && (!ukraineCategoryFilter || doc.category === ukraineCategoryFilter),
      ),
    [documents, ukraineCategoryFilter],
  );

  const usaDocuments = useMemo(
    () =>
      documents.filter(
        (doc) =>
          doc.jurisdiction === "usa" &&
          (!usaCategoryFilter || doc.category === usaCategoryFilter) &&
          (!usaSubJurisdictionFilter || doc.usaSubJurisdiction === usaSubJurisdictionFilter),
      ),
    [documents, usaCategoryFilter, usaSubJurisdictionFilter],
  );

  const readyDocuments = documents.filter((doc) => doc.status === "ready");
  const testSelectableDocuments = useMemo(
    () =>
      readyDocuments.filter(
        (doc) =>
          doc.jurisdiction === testJurisdiction &&
          (!testCategory || doc.category === testCategory) &&
          (testJurisdiction !== "usa" ||
            !testUsaSubJurisdiction ||
            documentMatchesUsaSubJurisdiction(testUsaSubJurisdiction, doc.usaSubJurisdiction)),
      ),
    [readyDocuments, testJurisdiction, testCategory, testUsaSubJurisdiction],
  );
  const isUploading = pending && modal?.type === "upload";

  const activeCategoryFilter =
    activeJurisdictionTab === "ukraine" ? ukraineCategoryFilter : usaCategoryFilter;
  const setActiveCategoryFilter =
    activeJurisdictionTab === "ukraine" ? setUkraineCategoryFilter : setUsaCategoryFilter;
  const activeDocuments = activeJurisdictionTab === "ukraine" ? ukraineDocuments : usaDocuments;

  useEffect(() => {
    if (testDocumentId && !testSelectableDocuments.some((doc) => doc.id === testDocumentId)) {
      setTestDocumentId("");
    }
  }, [testDocumentId, testSelectableDocuments]);

  useEffect(() => {
    if (modal?.type !== "upload") {
      setSelectedUploadFileName("");
      setUploadJurisdiction("");
    }
  }, [modal]);

  useEffect(() => {
    if (modal?.type === "edit") {
      setEditJurisdiction(modal.document.jurisdiction);
    }
  }, [modal]);

  const resetTestInquiryForJurisdiction = (next: RoomJurisdiction) => {
    setTestJurisdiction(next);
    setTestQuestion("");
    setTestResult(null);
    setTestDocumentId("");
    setTestCategory("");
    if (next !== "usa") setTestUsaSubJurisdiction("");
  };

  const selectJurisdictionTab = (tab: JurisdictionTab) => {
    setActiveJurisdictionTab(tab);
    window.localStorage.setItem(RAG_JURISDICTION_TAB_KEY, tab);
    resetTestInquiryForJurisdiction(tab);
  };

  useEffect(() => {
    if (jurisdictionTabHydrated.current) return;
    jurisdictionTabHydrated.current = true;
    const stored = readStoredJurisdictionTab();
    setActiveJurisdictionTab(stored);
    setTestJurisdiction(stored);
  }, []);

  const runMutation = (action: () => Promise<void>, successMessage: string) => {
    startTransition(async () => {
      try {
        await action();
        toast.success(successMessage);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Request failed");
      }
    });
  };

  const onUpload = (formData: FormData) => {
    if (modal?.type !== "upload") return;
    const jurisdiction = String(formData.get("jurisdiction") ?? "");
    if (jurisdiction !== "ukraine" && jurisdiction !== "usa") return;
    runMutation(async () => {
      await uploadDocument(formData);
      setModal(null);
      selectJurisdictionTab(jurisdiction);
    }, admin.ragDocumentUploaded);
  };

  const onUpdate = (formData: FormData) => {
    if (modal?.type !== "edit") return;
    formData.set("id", modal.document.id);
    const jurisdiction = String(formData.get("jurisdiction") ?? "");
    runMutation(async () => {
      await updateDocument(formData);
      setModal(null);
      if (jurisdiction === "ukraine" || jurisdiction === "usa") {
        selectJurisdictionTab(jurisdiction);
      }
    }, admin.ragDocumentUpdated);
  };

  const onDelete = () => {
    if (modal?.type !== "delete") return;
    const { id } = modal.document;
    runMutation(async () => {
      await deleteDocument(id);
      setModal(null);
    }, admin.ragDocumentDeleted);
  };

  const onReprocess = (documentId: string) => {
    runMutation(() => reprocessDocument(documentId), admin.ragDocumentUploaded);
  };

  const onTestInquiry = () => {
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.set("jurisdiction", testJurisdiction);
        formData.set("question", testQuestion);
        formData.set("locale", locale);
        if (testDocumentId) formData.set("documentId", testDocumentId);
        if (testCategory) formData.set("category", testCategory);
        if (testJurisdiction === "usa" && testUsaSubJurisdiction) {
          formData.set("usaSubJurisdiction", testUsaSubJurisdiction);
        }
        const result = await testInquiry(formData);
        setTestResult(result);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Inquiry failed");
      }
    });
  };

  const categoryOptions = (
    <option value="">{admin.ragAllCategories}</option>
  );

  const renderCategoryFilter = (
    value: "" | LegalDocumentCategory,
    onChange: (value: "" | LegalDocumentCategory) => void,
  ) => (
    <select
      className={inputClass}
      onChange={(event) => onChange(event.target.value as "" | LegalDocumentCategory)}
      value={value}
    >
      {categoryOptions}
      {LEGAL_DOCUMENT_CATEGORIES.map((category) => (
        <option key={category} value={category}>
          {getCategoryLabel(category, locale)}
        </option>
      ))}
    </select>
  );

  const renderUsaSubJurisdictionFilter = (
    value: "" | UsaSubJurisdiction,
    onChange: (value: "" | UsaSubJurisdiction) => void,
  ) => (
    <select
      className={inputClass}
      onChange={(event) => onChange(event.target.value as "" | UsaSubJurisdiction)}
      value={value}
    >
      <option value="">{admin.ragAllUsaSubJurisdictions}</option>
      {USA_SUB_JURISDICTIONS_SORTED.map((code) => (
        <option key={code} value={code}>
          {getUsaSubJurisdictionLabel(code, locale)}
        </option>
      ))}
    </select>
  );

  const renderDocumentTable = (
    rows: LegalDocumentRow[],
    categoryFilter: "" | LegalDocumentCategory,
    onCategoryFilterChange: (value: "" | LegalDocumentCategory) => void,
    jurisdiction: RoomJurisdiction,
    usaSubJurisdictionFilterValue: "" | UsaSubJurisdiction,
    onUsaSubJurisdictionFilterChange: (value: "" | UsaSubJurisdiction) => void,
  ) => (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-end gap-3">
        <button
          className="btn-primary px-4 py-2 text-body-sm"
          onClick={() => setModal({ type: "upload" })}
          type="button"
        >
          {admin.ragUploadDocument}
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {jurisdiction === "usa" ? (
          <div>
            <label className="mb-1 block text-body-sm text-on-surface-variant">
              {admin.ragUsaSubJurisdictionFilter}
            </label>
            {renderUsaSubJurisdictionFilter(usaSubJurisdictionFilterValue, onUsaSubJurisdictionFilterChange)}
            <p className="mt-1 text-body-sm text-on-surface-variant">{admin.ragUsaSubJurisdictionHint}</p>
          </div>
        ) : null}
        <div className={jurisdiction === "usa" ? "" : "md:col-span-2"}>
          <label className="mb-1 block text-body-sm text-on-surface-variant">{admin.ragCategoryFilter}</label>
          {renderCategoryFilter(categoryFilter, onCategoryFilterChange)}
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="text-body-md text-on-surface-variant">{admin.ragNoDocuments}</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-outline-variant/15">
          <table className="min-w-full text-left text-body-sm">
            <thead className="bg-surface-container-low text-on-surface-variant">
              <tr>
                <th className="px-4 py-3">{admin.ragDocumentName}</th>
                {jurisdiction === "usa" ? (
                  <th className="px-4 py-3">{admin.ragUsaSubJurisdiction}</th>
                ) : null}
                <th className="px-4 py-3">{admin.ragCategory}</th>
                <th className="px-4 py-3">{admin.ragSourceUrl}</th>
                <th className="px-4 py-3">{admin.tableStatus}</th>
                  <th className="w-0 whitespace-nowrap px-4 py-3">
                    <span className="sr-only">{admin.tableActions}</span>
                  </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((doc) => (
                <tr className="border-t border-outline-variant/10" key={doc.id}>
                  <td className="px-4 py-3 font-medium text-on-surface">{doc.name}</td>
                  {jurisdiction === "usa" ? (
                    <td className="px-4 py-3 text-on-surface-variant">
                      {doc.usaSubJurisdiction
                        ? getUsaSubJurisdictionLabel(doc.usaSubJurisdiction, locale)
                        : "—"}
                    </td>
                  ) : null}
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-primary/10 px-2 py-1 text-label-md text-primary">
                      {getCategoryLabel(doc.category, locale)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <a className="text-tertiary underline" href={doc.sourceUrl} rel="noreferrer" target="_blank">
                      {doc.sourceUrl}
                    </a>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-1 text-label-md ${statusClass(doc.status)}`}>
                      {statusLabel(doc.status, admin)}
                    </span>
                    {doc.status === "failed" && doc.errorMessage ? (
                      <p className="mt-1 text-body-sm text-error">{doc.errorMessage}</p>
                    ) : null}
                  </td>
                  <td className="w-0 whitespace-nowrap px-4 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        className="flex items-center justify-center rounded-lg border border-outline-variant/30 p-2 text-on-surface transition-colors hover:border-[#c9ced6] hover:text-ink"
                        onClick={() => setModal({ type: "edit", document: doc })}
                        title={admin.ragEditDocument}
                        type="button"
                      >
                        <span className="material-symbols-outlined text-[20px]">edit</span>
                        <span className="sr-only">{admin.ragEditDocument}</span>
                      </button>
                      {doc.status === "failed" ? (
                        <button
                          className="flex items-center justify-center rounded-lg border border-outline-variant/30 p-2 text-on-surface transition-colors hover:border-primary hover:text-primary"
                          onClick={() => onReprocess(doc.id)}
                          title={admin.ragReprocess}
                          type="button"
                        >
                          <span className="material-symbols-outlined text-[20px]">sync</span>
                          <span className="sr-only">{admin.ragReprocess}</span>
                        </button>
                      ) : null}
                      <button
                        className="flex items-center justify-center rounded-lg border border-error/40 bg-error/10 p-2 text-error transition-colors hover:border-error hover:bg-error/20"
                        onClick={() => setModal({ type: "delete", document: doc })}
                        title={admin.ragDeleteDocument}
                        type="button"
                      >
                        <span className="material-symbols-outlined text-[20px]">delete</span>
                        <span className="sr-only">{admin.ragDeleteDocument}</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-10">
      <p className="text-body-sm text-on-surface-variant">{admin.ragSubtitle}</p>

      <div className="space-y-6">
        <div className="flex gap-2 border-b border-outline-variant/20">
          {(["ukraine", "usa"] as const).map((tab) => (
            <button
              className={
                activeJurisdictionTab === tab
                  ? "border-b-2 border-law px-4 py-3 font-display text-body-md font-semibold text-ink"
                  : "px-4 py-3 font-display text-body-md text-on-surface-variant transition-colors hover:text-on-surface"
              }
              key={tab}
              onClick={() => selectJurisdictionTab(tab)}
              type="button"
            >
              {tab === "ukraine" ? admin.ragJurisdictionUkraine : admin.ragJurisdictionUsa}
            </button>
          ))}
        </div>

        {activeJurisdictionTab === "ukraine"
          ? renderDocumentTable(
              activeDocuments,
              activeCategoryFilter,
              setActiveCategoryFilter,
              activeJurisdictionTab,
              "",
              () => {},
            )
          : renderDocumentTable(
              activeDocuments,
              activeCategoryFilter,
              setActiveCategoryFilter,
              activeJurisdictionTab,
              usaSubJurisdictionFilter,
              setUsaSubJurisdictionFilter,
            )}
      </div>

      <div className="glass-panel space-y-4 rounded-xl p-6">
        <h4 className="font-display text-headline-md text-on-surface">{admin.ragTestInquiry}</h4>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-body-sm text-on-surface-variant">{admin.jurisdictionLabel}</label>
            <select
              className={inputClass}
              onChange={(event) => {
                resetTestInquiryForJurisdiction(event.target.value as RoomJurisdiction);
              }}
              value={testJurisdiction}
            >
              <option value="ukraine">{admin.ragJurisdictionUkraine}</option>
              <option value="usa">{admin.ragJurisdictionUsa}</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-body-sm text-on-surface-variant">{admin.ragCategoryFilter}</label>
            {renderCategoryFilter(testCategory, (value) => {
              setTestCategory(value);
              setTestDocumentId("");
            })}
          </div>
          {testJurisdiction === "usa" ? (
            <div className="md:col-span-2">
              <label className="mb-1 block text-body-sm text-on-surface-variant">
                {admin.ragUsaSubJurisdictionFilter}
              </label>
              {renderUsaSubJurisdictionFilter(testUsaSubJurisdiction, (value) => {
                setTestUsaSubJurisdiction(value);
                setTestDocumentId("");
              })}
              <p className="mt-1 text-body-sm text-on-surface-variant">{admin.ragUsaSubJurisdictionHint}</p>
            </div>
          ) : null}
          <div className="md:col-span-2">
            <label className="mb-1 block text-body-sm text-on-surface-variant">{admin.ragTestSelectDocument}</label>
            <select
              className={inputClass}
              onChange={(event) => setTestDocumentId(event.target.value)}
              value={testDocumentId}
            >
              <option value="">{admin.ragTestAllDocuments}</option>
              {testSelectableDocuments.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  {doc.name}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="mb-1 block text-body-sm text-on-surface-variant">{admin.ragTestQuestion}</label>
            <textarea
              className={`${inputClass} min-h-28`}
              onChange={(event) => setTestQuestion(event.target.value)}
              value={testQuestion}
            />
          </div>
        </div>
        <button
          className="btn-primary flex items-center gap-1.5 px-6 py-2.5 text-body-sm disabled:opacity-60"
          disabled={pending || !testQuestion.trim()}
          onClick={onTestInquiry}
          type="button"
        >
          {pending ? <Spinner size="sm" className="text-white" /> : null}
          {admin.ragTestSubmit}
        </button>

        {testResult ? (
          <div className="space-y-4 rounded-lg border border-outline-variant/15 p-4">
            {testResult.preparedQueries && testResult.preparedQueries.length > 0 ? (
              <div className="rounded-lg bg-surface-container-low p-3 text-body-sm">
                <p className="mb-2 font-semibold text-on-surface">{admin.ragTestPreparedQueries}</p>
                <ul className="list-inside list-disc space-y-1 text-on-surface-variant">
                  {testResult.preparedQueries.map((query) => (
                    <li key={query}>{query}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            <p className="whitespace-pre-wrap text-body-md text-on-surface">{testResult.answer}</p>
            {testResult.citations.length > 0 ? (
              <div className="space-y-3">
                {testResult.citations.map((citation, index) => (
                  <div className="rounded-lg bg-surface-container-low p-3 text-body-sm" key={`${citation.sourceUrl}-${index}`}>
                    <p className="font-semibold text-on-surface">{citation.documentName}</p>
                    <a className="text-tertiary underline" href={citation.sourceUrl} rel="noreferrer" target="_blank">
                      {citation.sourceUrl}
                    </a>
                    <p className="mt-2 text-on-surface-variant">{citation.excerpt}</p>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      <ModalOverlay
        onClose={() => {
          if (!isUploading) setModal(null);
        }}
        open={modal?.type === "upload"}
        panelClassName="max-w-lg"
      >
          <form
            className="relative space-y-4 rounded-xl bg-surface-container p-6 shadow-xl"
            onSubmit={(event) => {
              event.preventDefault();
              onUpload(new FormData(event.currentTarget));
            }}
          >
            {isUploading ? (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-xl bg-surface-container/90 p-6 text-center backdrop-blur-[1px]">
                <Spinner size="xl" />
                <p className="font-display text-body-md font-semibold text-on-surface">{admin.ragUploading}</p>
                <p className="text-body-sm text-on-surface-variant">{admin.ragUploadingHint}</p>
              </div>
            ) : null}
            <h4 className="font-display text-headline-md text-on-surface">{admin.ragUploadDocument}</h4>
            <div>
              <label className="mb-1 block text-body-sm text-on-surface-variant">{admin.ragDocumentName}</label>
              <input className={inputClass} disabled={isUploading} name="name" required type="text" />
            </div>
            <div>
              <label className="mb-1 block text-body-sm text-on-surface-variant">{admin.ragSourceUrl}</label>
              <input className={inputClass} disabled={isUploading} name="sourceUrl" required type="url" />
            </div>
            <div>
              <label className="mb-1 block text-body-sm text-on-surface-variant">{admin.jurisdictionLabel}</label>
              <select
                className={inputClass}
                disabled={isUploading}
                name="jurisdiction"
                onChange={(event) =>
                  setUploadJurisdiction(event.target.value as "" | RoomJurisdiction)
                }
                required
                value={uploadJurisdiction}
              >
                <option disabled value="">
                  —
                </option>
                <option value="ukraine">{admin.ragJurisdictionUkraine}</option>
                <option value="usa">{admin.ragJurisdictionUsa}</option>
              </select>
            </div>
            {uploadJurisdiction === "usa" ? (
              <div>
                <label className="mb-1 block text-body-sm text-on-surface-variant">{admin.ragUsaSubJurisdiction}</label>
                <select
                  className={inputClass}
                  defaultValue=""
                  disabled={isUploading}
                  name="usaSubJurisdiction"
                  required
                >
                  <option disabled value="">
                    —
                  </option>
                  {USA_SUB_JURISDICTIONS_SORTED.map((code) => (
                    <option key={code} value={code}>
                      {getUsaSubJurisdictionLabel(code, locale)}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}
            <div>
              <label className="mb-1 block text-body-sm text-on-surface-variant">{admin.ragCategory}</label>
              <select className={inputClass} disabled={isUploading} name="category" required defaultValue="">
                <option disabled value="">
                  —
                </option>
                {LEGAL_DOCUMENT_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {getCategoryLabel(category, locale)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-body-sm text-on-surface-variant">{admin.ragFileLabel}</label>
              <input
                accept=".txt,.pdf,.docx"
                aria-label={admin.ragFileInputAriaLabel}
                className="sr-only"
                disabled={isUploading}
                name="file"
                onChange={(event) => {
                  const file = event.currentTarget.files?.[0];
                  setSelectedUploadFileName(file?.name ?? "");
                }}
                ref={uploadFileInputRef}
                required
                type="file"
              />
              <div className="flex items-center gap-3">
                <button
                  className="rounded-md border border-hair bg-paper px-3 py-2 text-ink transition-colors hover:border-law disabled:opacity-60"
                  disabled={isUploading}
                  onClick={() => uploadFileInputRef.current?.click()}
                  type="button"
                >
                  {admin.ragChooseFile}
                </button>
                <span className="text-body-sm text-on-surface-variant">
                  {selectedUploadFileName || admin.ragNoFileChosen}
                </span>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button
                className="px-4 py-2 text-on-surface-variant disabled:opacity-50"
                disabled={isUploading}
                onClick={() => setModal(null)}
                type="button"
              >
                {admin.cancel}
              </button>
              <button
                className="btn-primary flex items-center gap-2 px-4 py-2 disabled:opacity-60"
                disabled={isUploading || !uploadJurisdiction}
                type="submit"
              >
                {isUploading ? (
                  <>
                    <Spinner size="sm" className="text-white" />
                    {admin.ragUploading}
                  </>
                ) : (
                  admin.ragUpload
                )}
              </button>
            </div>
          </form>
      </ModalOverlay>

      <ModalOverlay onClose={() => setModal(null)} open={modal?.type === "edit"} panelClassName="max-w-lg">
        {modal?.type === "edit" ? (
          <form
            className="space-y-4 rounded-xl bg-surface-container p-6 shadow-xl"
            onSubmit={(event) => {
              event.preventDefault();
              onUpdate(new FormData(event.currentTarget));
            }}
          >
            <h4 className="font-display text-headline-md text-on-surface">{admin.ragEditDocument}</h4>
            <div>
              <label className="mb-1 block text-body-sm text-on-surface-variant">{admin.ragDocumentName}</label>
              <input className={inputClass} defaultValue={modal.document.name} name="name" required type="text" />
            </div>
            <div>
              <label className="mb-1 block text-body-sm text-on-surface-variant">{admin.ragSourceUrl}</label>
              <input
                className={inputClass}
                defaultValue={modal.document.sourceUrl}
                name="sourceUrl"
                required
                type="url"
              />
            </div>
            <div>
              <label className="mb-1 block text-body-sm text-on-surface-variant">{admin.jurisdictionLabel}</label>
              <select
                className={inputClass}
                name="jurisdiction"
                onChange={(event) => setEditJurisdiction(event.target.value as RoomJurisdiction)}
                required
                value={editJurisdiction}
              >
                <option value="ukraine">{admin.ragJurisdictionUkraine}</option>
                <option value="usa">{admin.ragJurisdictionUsa}</option>
              </select>
            </div>
            {editJurisdiction === "usa" ? (
              <div>
                <label className="mb-1 block text-body-sm text-on-surface-variant">{admin.ragUsaSubJurisdiction}</label>
                <select
                  className={inputClass}
                  defaultValue={
                    modal.document.jurisdiction === "usa"
                      ? (modal.document.usaSubJurisdiction ?? "")
                      : ""
                  }
                  key={`${modal.document.id}-${editJurisdiction}`}
                  name="usaSubJurisdiction"
                  required
                >
                  <option disabled value="">
                    —
                  </option>
                  {USA_SUB_JURISDICTIONS_SORTED.map((code) => (
                    <option key={code} value={code}>
                      {getUsaSubJurisdictionLabel(code, locale)}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}
            <div>
              <label className="mb-1 block text-body-sm text-on-surface-variant">{admin.ragCategory}</label>
              <select className={inputClass} defaultValue={modal.document.category} name="category" required>
                {LEGAL_DOCUMENT_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {getCategoryLabel(category, locale)}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-3">
              <button className="px-4 py-2 text-on-surface-variant" onClick={() => setModal(null)} type="button">
                {admin.cancel}
              </button>
              <button
                className="btn-primary px-4 py-2 disabled:opacity-60"
                disabled={pending}
                type="submit"
              >
                {admin.save}
              </button>
            </div>
          </form>
        ) : null}
      </ModalOverlay>

      <ModalOverlay
        onClose={() => setModal(null)}
        open={modal?.type === "delete"}
        panelClassName="max-w-md"
      >
        {modal?.type === "delete" ? (
          <div
            className="space-y-5 rounded-xl border border-error/25 bg-surface-container p-6 shadow-xl"
            role="dialog"
            aria-labelledby="rag-delete-title"
            aria-modal="true"
          >
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined shrink-0 text-[28px] text-error">warning</span>
              <div className="space-y-2">
                <p className="text-body-md text-on-surface" id="rag-delete-title">
                  {admin.ragDeleteConfirm}
                </p>
                <p className="font-semibold text-on-surface">{modal.document.name}</p>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button
                className="rounded-lg border border-outline-variant/30 px-4 py-2 text-on-surface-variant hover:bg-surface-container-high"
                onClick={() => setModal(null)}
                type="button"
              >
                {admin.cancel}
              </button>
              <button
                className="flex items-center gap-1.5 rounded-lg bg-error px-4 py-2 font-bold text-white disabled:opacity-60"
                disabled={pending}
                onClick={onDelete}
                type="button"
              >
                {pending ? <Spinner size="sm" className="text-white" /> : null}
                {admin.ragDeleteDocument}
              </button>
            </div>
          </div>
        ) : null}
      </ModalOverlay>

    </div>
  );
}
