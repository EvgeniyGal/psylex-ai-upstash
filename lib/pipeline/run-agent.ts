import type { z } from "zod";
import type { Locale } from "@/lib/i18n";
import type { PostIntakeAgentKey } from "@/lib/pipeline/agent-keys";
import { localeInstruction } from "@/lib/pipeline/locale";
import { loadAgentPrompt } from "@/lib/pipeline/load-prompt";
import {
  getOpenAIChatModel,
  getOpenAIClient,
  parseJsonFromModelResponse,
} from "@/lib/pipeline/openai-client";
import { agentOutputSchemas } from "@/lib/pipeline/schemas";

type RunAgentParams<T extends PostIntakeAgentKey> = {
  agentKey: T;
  userMessage: string;
  draftPrompt?: string;
  targetLocale: Locale;
};

export async function runAgent<T extends PostIntakeAgentKey>(params: RunAgentParams<T>) {
  type Output = z.infer<(typeof agentOutputSchemas)[T]>;
  const schema = agentOutputSchemas[params.agentKey];
  const systemPrompt = await loadAgentPrompt(params.agentKey, params.draftPrompt);
  const client = await getOpenAIClient();
  const model = await getOpenAIChatModel();
  const localeSuffix = `\n\n${localeInstruction(params.targetLocale)}`;

  const callModel = async (extraInstruction?: string) => {
    const completion = await client.chat.completions.create({
      model,
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            params.userMessage,
            localeSuffix,
            extraInstruction ?? "",
          ]
            .filter(Boolean)
            .join("\n\n"),
        },
      ],
    });
    return completion.choices[0]?.message?.content?.trim() ?? "";
  };

  let raw = await callModel();
  let parsed: Output;

  try {
    parsed = schema.parse(parseJsonFromModelResponse(raw)) as Output;
  } catch {
    raw = await callModel("Respond with valid JSON only matching the required schema.");
    parsed = schema.parse(parseJsonFromModelResponse(raw)) as Output;
  }

  return { result: parsed, systemPrompt };
}
