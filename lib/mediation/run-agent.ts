import type { z } from "zod";
import type { Locale } from "@/lib/i18n";
import { loadAgentPrompt } from "@/lib/pipeline/load-prompt";
import {
  createChatCompletion,
  getOpenAIChatModel,
  mediationModeToModelSlot,
  parseJsonFromModelResponse,
} from "@/lib/pipeline/openai-client";
import {
  localeInstruction,
  normalizeLocale,
  partyAdaptationLocaleInstruction,
} from "@/lib/pipeline/locale";
import {
  assembleMediationAgentInput,
  type MediationContext,
} from "@/lib/mediation/assemble-input";
import {
  type MediationAgentMode,
  mediationModeInstructions,
} from "@/lib/mediation/schemas";
import type { PartyAdaptationLocales } from "@/lib/mediation/party-locales";

type RunMediationAgentParams<T extends z.ZodType> = {
  mode: MediationAgentMode;
  context: MediationContext;
  schema: T;
  draftPrompt?: string;
  extraInstruction?: string;
  /** Participant-facing output language. Defaults to English when omitted. */
  targetLocale?: Locale;
  /**
   * When set, instruct per-party adaptation languages and skip blanket targetLocale
   * (canonicalContent stays English). Use for Mode A opening/questions/summaries.
   */
  partyAdaptationLocales?: PartyAdaptationLocales;
};

export async function runMediationAgent<T extends z.ZodType>(params: RunMediationAgentParams<T>) {
  const targetLocale = normalizeLocale(params.targetLocale ?? "en");
  const systemPrompt = await loadAgentPrompt("mediation", params.draftPrompt);
  const model = await getOpenAIChatModel(mediationModeToModelSlot(params.mode));
  const languageInstruction = params.partyAdaptationLocales
    ? partyAdaptationLocaleInstruction(
        params.partyAdaptationLocales.partyA,
        params.partyAdaptationLocales.partyB,
      )
    : localeInstruction(targetLocale);
  const userMessage = [
    assembleMediationAgentInput(params.context, params.extraInstruction),
    "",
    mediationModeInstructions[params.mode],
    params.extraInstruction ? `\nContext: ${params.extraInstruction}` : "",
    "",
    languageInstruction,
  ]
    .filter(Boolean)
    .join("\n");

  const callModel = async (retryHint?: string) => {
    const completion = await createChatCompletion({
      model,
      temperature: 0,
      responseFormat: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [userMessage, retryHint ?? ""].filter(Boolean).join("\n\n"),
        },
      ],
    });
    return completion.choices[0]?.message?.content?.trim() ?? "";
  };

  let raw = await callModel();
  try {
    return params.schema.parse(parseJsonFromModelResponse(raw));
  } catch (firstError) {
    const shapeHint =
      params.mode === "question_candidates"
        ? 'Required JSON shape: {"partyA":{"candidates":[{id,canonicalContent,partyA,partyB} x3]},"partyB":{"candidates":[{id,canonicalContent,partyA,partyB} x3]}}. partyA and partyB must be objects with a candidates array, not arrays themselves.'
        : "Respond with valid JSON only matching the required schema.";
    raw = await callModel(shapeHint);
    try {
      return params.schema.parse(parseJsonFromModelResponse(raw));
    } catch {
      throw firstError instanceof Error ? firstError : new Error("Mediation agent returned invalid JSON.");
    }
  }
}

export async function runMediationSimulation(params: {
  context: MediationContext;
  draftPrompt?: string;
}) {
  const { mediationOpeningSchema, mediationDialogueQuestionSchema, mediationOptionsSchema } =
    await import("@/lib/mediation/schemas");

  const partyAdaptationLocales = {
    partyA: normalizeLocale(params.context.partyA.preferredLocale),
    partyB: normalizeLocale(params.context.partyB.preferredLocale),
  };

  const opening = await runMediationAgent({
    mode: "opening",
    context: params.context,
    schema: mediationOpeningSchema,
    draftPrompt: params.draftPrompt,
    partyAdaptationLocales,
  });

  const dialogue = await runMediationAgent({
    mode: "dialogue_question",
    context: params.context,
    schema: mediationDialogueQuestionSchema,
    draftPrompt: params.draftPrompt,
    extraInstruction: 'Set addressee to "party_a" for a sample first question.',
    partyAdaptationLocales,
  });

  const options = await runMediationAgent({
    mode: "options",
    context: params.context,
    schema: mediationOptionsSchema,
    draftPrompt: params.draftPrompt,
  });

  return { opening, dialogue, options };
}
