import type { z } from "zod";
import type { Locale } from "@/lib/i18n";
import { loadAgentPrompt } from "@/lib/pipeline/load-prompt";
import { getOpenAIClient, parseJsonFromModelResponse } from "@/lib/pipeline/openai-client";
import { localeInstruction, normalizeLocale } from "@/lib/pipeline/locale";
import {
  assembleMediationAgentInput,
  type MediationContext,
} from "@/lib/mediation/assemble-input";
import {
  type MediationAgentMode,
  mediationModeInstructions,
} from "@/lib/mediation/schemas";

type RunMediationAgentParams<T extends z.ZodType> = {
  mode: MediationAgentMode;
  context: MediationContext;
  schema: T;
  draftPrompt?: string;
  extraInstruction?: string;
  /** Participant-facing output language. Defaults to English when omitted. */
  targetLocale?: Locale;
};

export async function runMediationAgent<T extends z.ZodType>(params: RunMediationAgentParams<T>) {
  const targetLocale = normalizeLocale(params.targetLocale ?? "en");
  const systemPrompt = await loadAgentPrompt("mediation", params.draftPrompt);
  const client = await getOpenAIClient();
  const userMessage = [
    assembleMediationAgentInput(params.context, params.extraInstruction),
    "",
    mediationModeInstructions[params.mode],
    params.extraInstruction ? `\nContext: ${params.extraInstruction}` : "",
    "",
    localeInstruction(targetLocale),
  ]
    .filter(Boolean)
    .join("\n");

  const callModel = async (retryHint?: string) => {
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0,
      response_format: { type: "json_object" },
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

  const opening = await runMediationAgent({
    mode: "opening",
    context: params.context,
    schema: mediationOpeningSchema,
    draftPrompt: params.draftPrompt,
  });

  const dialogue = await runMediationAgent({
    mode: "dialogue_question",
    context: params.context,
    schema: mediationDialogueQuestionSchema,
    draftPrompt: params.draftPrompt,
    extraInstruction: 'Set addressee to "party_a" for a sample first question.',
  });

  const options = await runMediationAgent({
    mode: "options",
    context: params.context,
    schema: mediationOptionsSchema,
    draftPrompt: params.draftPrompt,
  });

  return { opening, dialogue, options };
}
