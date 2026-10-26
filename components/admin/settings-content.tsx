"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  loadOpenAIChatModels,
  saveApiCredentials,
  saveTestLinks,
} from "@/app/admin/settings/actions";
import { AgentPromptsSettingsContent } from "@/components/admin/agent-prompts-settings-content";
import { HelpSettingsContent } from "@/components/admin/help-settings-content";
import { RagSettingsContent } from "@/components/admin/rag-settings-content";
import { Spinner } from "@/components/ui/spinner";
import { useLocale } from "@/components/locale-provider";
import type { LegalDocumentRow } from "@/lib/rag/types";
import type { AgentKey } from "@/lib/pipeline/agent-keys";
import type { HelpDocument } from "@/lib/help/types";
import {
  FALLBACK_OPENAI_CHAT_MODEL,
  OPENAI_CHAT_MODEL_SLOTS,
  RECOMMENDED_OPENAI_CHAT_MODEL,
  type OpenAIModelSlot,
} from "@/lib/pipeline/openai-models";

export type PlatformSettingsRow = {
  id: string;
  openaiApiKey: string;
  openaiModel: string;
  openaiModelDialogue: string;
  openaiModelArtifacts: string;
  openaiModelFast: string;
  openaiModelPipeline: string;
  openaiModelRagChat: string;
  openaiModelHelp: string;
  openaiEmbeddingModel: string;
  airtableApiKey: string;
  testPersonalityTypeUrl: string;
  testFaceFearUrl: string;
  testCharacterTraitsUrl: string;
  testPersonalityConflictsUrl: string;
  updatedAt: Date;
};

const inputClass =
  "w-full rounded-md border border-ink/25 bg-surface-variant px-3 py-2 text-ink focus:border-law focus:outline-none focus:ring-1 focus:ring-law";

const secretInputClass = `${inputClass} pr-12`;

const tabs = ["credentials", "tests", "prompts", "rag", "help"] as const;
type SettingsTab = (typeof tabs)[number];

const SLOT_FORM_NAMES: Record<OpenAIModelSlot, keyof PlatformSettingsRow> = {
  dialogue: "openaiModelDialogue",
  artifacts: "openaiModelArtifacts",
  fast: "openaiModelFast",
  pipeline: "openaiModelPipeline",
  ragChat: "openaiModelRagChat",
  help: "openaiModelHelp",
};

function resolveSlotInitial(settings: PlatformSettingsRow, slot: OpenAIModelSlot) {
  const slotValue = String(settings[SLOT_FORM_NAMES[slot]] ?? "").trim();
  return slotValue || settings.openaiModel || FALLBACK_OPENAI_CHAT_MODEL;
}

function slotModelsFromSettings(settings: PlatformSettingsRow): Record<OpenAIModelSlot, string> {
  return Object.fromEntries(
    OPENAI_CHAT_MODEL_SLOTS.map((slot) => [slot, resolveSlotInitial(settings, slot)]),
  ) as Record<OpenAIModelSlot, string>;
}

function settingsModelsKey(settings: PlatformSettingsRow) {
  return OPENAI_CHAT_MODEL_SLOTS.map((slot) => resolveSlotInitial(settings, slot)).join("|");
}

type SettingsContentProps = {
  settings: PlatformSettingsRow;
  documents: LegalDocumentRow[];
  prompts: { agentKey: AgentKey; systemPrompt: string }[];
  helpDocuments: HelpDocument[];
};

export function SettingsContent({ settings, documents, prompts, helpDocuments }: SettingsContentProps) {
  const { admin } = useLocale();
  const [activeTab, setActiveTab] = useState<SettingsTab>("credentials");
  const [showOpenaiKey, setShowOpenaiKey] = useState(false);
  const [showAirtableKey, setShowAirtableKey] = useState(false);
  const [slotModels, setSlotModels] = useState<Record<OpenAIModelSlot, string>>(() =>
    slotModelsFromSettings(settings),
  );
  const slotModelsRef = useRef(slotModels);
  slotModelsRef.current = slotModels;
  const [modelOptions, setModelOptions] = useState<string[]>(() => {
    const seeded = new Set<string>();
    for (const slot of OPENAI_CHAT_MODEL_SLOTS) {
      seeded.add(resolveSlotInitial(settings, slot));
    }
    if (settings.openaiModel) seeded.add(settings.openaiModel);
    return [...seeded];
  });
  const [modelsLoading, setModelsLoading] = useState(false);
  const [modelsError, setModelsError] = useState(false);
  const [credentialsPending, startCredentialsTransition] = useTransition();
  const [testsPending, startTestsTransition] = useTransition();

  const slotCopy: Record<
    OpenAIModelSlot,
    { label: string; hint: string; name: string; id: string }
  > = {
    dialogue: {
      label: admin.openaiModelDialogueLabel,
      hint: admin.openaiModelDialogueHint,
      name: "openaiModelDialogue",
      id: "openai-model-dialogue",
    },
    artifacts: {
      label: admin.openaiModelArtifactsLabel,
      hint: admin.openaiModelArtifactsHint,
      name: "openaiModelArtifacts",
      id: "openai-model-artifacts",
    },
    fast: {
      label: admin.openaiModelFastLabel,
      hint: admin.openaiModelFastHint,
      name: "openaiModelFast",
      id: "openai-model-fast",
    },
    pipeline: {
      label: admin.openaiModelPipelineLabel,
      hint: admin.openaiModelPipelineHint,
      name: "openaiModelPipeline",
      id: "openai-model-pipeline",
    },
    ragChat: {
      label: admin.openaiModelRagChatLabel,
      hint: admin.openaiModelRagChatHint,
      name: "openaiModelRagChat",
      id: "openai-model-rag-chat",
    },
    help: {
      label: admin.openaiModelHelpLabel,
      hint: admin.openaiModelHelpHint,
      name: "openaiModelHelp",
      id: "openai-model-help",
    },
  };

  const refreshModels = (apiKeyOverride?: string) => {
    setModelsLoading(true);
    setModelsError(false);
    void loadOpenAIChatModels(apiKeyOverride)
      .then((ids) => {
        // Only refresh the dropdown options — never overwrite the user's slot selections.
        const selected = Object.values(slotModelsRef.current).filter(Boolean);
        const merged = [...new Set([...selected.filter((id) => !ids.includes(id)), ...ids])];
        setModelOptions(merged.length > 0 ? merged : [FALLBACK_OPENAI_CHAT_MODEL]);
      })
      .catch(() => {
        setModelsError(true);
      })
      .finally(() => {
        setModelsLoading(false);
      });
  };

  useEffect(() => {
    if (!settings.openaiApiKey) return;
    refreshModels();
    // Load once when a saved key is present.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount / key presence only
  }, [settings.openaiApiKey]);

  // After save + revalidate, keep selects aligned with persisted settings.
  const savedModelsKey = settingsModelsKey(settings);
  useEffect(() => {
    setSlotModels(slotModelsFromSettings(settings));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sync when saved model values change
  }, [savedModelsKey]);

  const onSaveCredentials = (formData: FormData) => {
    startCredentialsTransition(async () => {
      await saveApiCredentials(formData);
      const next = Object.fromEntries(
        OPENAI_CHAT_MODEL_SLOTS.map((slot) => {
          const value = String(formData.get(slotCopy[slot].name) ?? "").trim();
          return [slot, value || FALLBACK_OPENAI_CHAT_MODEL];
        }),
      ) as Record<OpenAIModelSlot, string>;
      setSlotModels(next);
      toast.success(admin.settingsSaved);
    });
  };

  const onSaveTests = (formData: FormData) => {
    startTestsTransition(async () => {
      await saveTestLinks(formData);
      toast.success(admin.settingsSaved);
    });
  };

  const testFields = [
    { name: "testPersonalityTypeUrl", label: admin.testPersonalityType, value: settings.testPersonalityTypeUrl },
    { name: "testFaceFearUrl", label: admin.testFaceFear, value: settings.testFaceFearUrl },
    { name: "testCharacterTraitsUrl", label: admin.testCharacterTraits, value: settings.testCharacterTraitsUrl },
    {
      name: "testPersonalityConflictsUrl",
      label: admin.testPersonalityConflicts,
      value: settings.testPersonalityConflictsUrl,
    },
  ] as const;

  const tabLabel = (tab: SettingsTab) => {
    if (tab === "credentials") return admin.tabCredentials;
    if (tab === "tests") return admin.tabTests;
    if (tab === "prompts") return admin.tabPrompts;
    if (tab === "help") return admin.tabHelp;
    return admin.tabRag;
  };

  return (
    <section className="space-y-stack-lg">
      <div>
        <h3 className="mb-2 font-display text-display-lg text-on-surface">{admin.settingsTitle}</h3>
        <p className="text-body-md text-on-surface-variant">{admin.settingsSubtitle}</p>
      </div>

      <div className="glass-card rounded-xl p-6 md:p-8">
        <div className="mb-8 flex flex-wrap gap-2 border-b border-outline-variant/20">
          {tabs.map((tab) => (
            <button
              className={
                activeTab === tab
                  ? "border-b-2 border-law px-4 py-3 font-display text-body-md font-semibold text-ink"
                  : "px-4 py-3 font-display text-body-md text-on-surface-variant transition-colors hover:text-on-surface"
              }
              key={tab}
              onClick={() => setActiveTab(tab)}
              type="button"
            >
              {tabLabel(tab)}
            </button>
          ))}
        </div>

        {activeTab === "credentials" ? (
          <form action={onSaveCredentials} className="space-y-6">
            <p className="text-body-sm text-on-surface-variant">{admin.credentialsSubtitle}</p>
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-body-sm text-on-surface-variant">{admin.openaiApiKeyLabel}</label>
                <div className="relative">
                  <input
                    autoComplete="off"
                    className={secretInputClass}
                    defaultValue={settings.openaiApiKey}
                    id="openai-api-key"
                    name="openaiApiKey"
                    placeholder="sk-..."
                    type={showOpenaiKey ? "text" : "password"}
                  />
                  <button
                    aria-label={showOpenaiKey ? admin.hideApiKey : admin.showApiKey}
                    className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-paper hover:text-ink"
                    onClick={() => setShowOpenaiKey((visible) => !visible)}
                    type="button"
                  >
                    <span className="material-symbols-outlined text-xl">
                      {showOpenaiKey ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-body-sm text-on-surface-variant">{admin.airtableApiKeyLabel}</label>
                <div className="relative">
                  <input
                    autoComplete="off"
                    className={secretInputClass}
                    defaultValue={settings.airtableApiKey}
                    name="airtableApiKey"
                    placeholder="pat..."
                    type={showAirtableKey ? "text" : "password"}
                  />
                  <button
                    aria-label={showAirtableKey ? admin.hideApiKey : admin.showApiKey}
                    className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-paper hover:text-ink"
                    onClick={() => setShowAirtableKey((visible) => !visible)}
                    type="button"
                  >
                    <span className="material-symbols-outlined text-xl">
                      {showAirtableKey ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-4 border-t border-outline-variant/20 pt-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h4 className="font-display text-headline-md text-on-surface">
                    {admin.openaiModelsSectionLabel}
                  </h4>
                  <p className="mt-1 max-w-2xl text-body-sm text-on-surface-variant">
                    {admin.openaiModelsSectionHint}
                  </p>
                </div>
                <button
                  className="rounded-md border border-hair bg-paper px-3 py-2 text-body-sm text-ink transition-colors hover:border-law disabled:opacity-60"
                  disabled={modelsLoading}
                  onClick={() => {
                    const keyInput = document.getElementById("openai-api-key") as HTMLInputElement | null;
                    refreshModels(keyInput?.value);
                  }}
                  type="button"
                >
                  {modelsLoading ? admin.openaiModelLoading : admin.openaiModelRefresh}
                </button>
              </div>
              {modelsError ? (
                <p className="text-body-sm text-error">{admin.openaiModelLoadError}</p>
              ) : null}
              <div className="grid gap-5 md:grid-cols-2">
                {OPENAI_CHAT_MODEL_SLOTS.map((slot) => {
                  const copy = slotCopy[slot];
                  return (
                    <div key={slot}>
                      <label className="mb-1 block text-body-sm text-on-surface-variant" htmlFor={copy.id}>
                        {copy.label}
                      </label>
                      <select
                        className={inputClass}
                        disabled={modelsLoading || modelOptions.length === 0}
                        id={copy.id}
                        name={copy.name}
                        onChange={(event) =>
                          setSlotModels((prev) => ({ ...prev, [slot]: event.target.value }))
                        }
                        value={slotModels[slot]}
                      >
                        {modelOptions.map((id) => (
                          <option key={id} value={id}>
                            {id === RECOMMENDED_OPENAI_CHAT_MODEL ? `${id} ★` : id}
                          </option>
                        ))}
                      </select>
                      <p className="mt-1 text-body-sm text-on-surface-variant">{copy.hint}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            <button
              className="btn-primary flex items-center gap-1.5 px-6 py-2.5 text-body-sm disabled:opacity-60"
              disabled={credentialsPending}
              type="submit"
            >
              {credentialsPending ? <Spinner size="sm" className="text-white" /> : null}
              {admin.save}
            </button>
          </form>
        ) : activeTab === "tests" ? (
          <form action={onSaveTests} className="space-y-6">
            <p className="text-body-sm text-on-surface-variant">{admin.testsSubtitle}</p>
            <div className="grid gap-5">
              {testFields.map((field) => (
                <div className="glass-panel rounded-xl p-5" key={field.name}>
                  <label className="mb-2 block font-display text-headline-md text-on-surface">{field.label}</label>
                  <label className="mb-1 block text-body-sm text-on-surface-variant">{admin.testUrlLabel}</label>
                  <input
                    className={inputClass}
                    defaultValue={field.value}
                    name={field.name}
                    placeholder="https://"
                    type="url"
                  />
                </div>
              ))}
            </div>
            <button
              className="btn-primary flex items-center gap-1.5 px-6 py-2.5 text-body-sm disabled:opacity-60"
              disabled={testsPending}
              type="submit"
            >
              {testsPending ? <Spinner size="sm" className="text-white" /> : null}
              {admin.save}
            </button>
          </form>
        ) : activeTab === "prompts" ? (
          <AgentPromptsSettingsContent prompts={prompts} />
        ) : activeTab === "help" ? (
          <HelpSettingsContent documents={helpDocuments} />
        ) : (
          <RagSettingsContent documents={documents} />
        )}
      </div>
    </section>
  );
}
