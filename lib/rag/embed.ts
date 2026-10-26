import {
  embeddingRequestDimensions,
  getOpenAIClient,
  getOpenAIEmbeddingModel,
} from "@/lib/pipeline/openai-client";
import { RAG_DEFAULTS } from "@/lib/rag/config";

async function getClient() {
  return getOpenAIClient();
}

function estimateEmbeddingInputTokens(text: string) {
  const cyrillicChars = (text.match(/[\u0400-\u04FF]/g) ?? []).length;
  const otherChars = text.length - cyrillicChars;
  // Cyrillic tokenizes denser than Latin in OpenAI models (~2 chars/token vs ~4).
  return Math.max(1, Math.ceil(cyrillicChars / 2 + otherChars / 4));
}

function batchTextsByTokenBudget(
  texts: string[],
  maxTokens: number,
  maxInputs: number,
): string[][] {
  const batches: string[][] = [];
  let currentBatch: string[] = [];
  let currentTokens = 0;

  for (const text of texts) {
    const tokens = estimateEmbeddingInputTokens(text);
    if (
      currentBatch.length > 0 &&
      (currentTokens + tokens > maxTokens || currentBatch.length >= maxInputs)
    ) {
      batches.push(currentBatch);
      currentBatch = [];
      currentTokens = 0;
    }
    currentBatch.push(text);
    currentTokens += tokens;
  }

  if (currentBatch.length > 0) {
    batches.push(currentBatch);
  }

  return batches;
}

export async function embedTexts(texts: string[], model?: string): Promise<number[][]> {
  if (texts.length === 0) return [];
  const resolvedModel = model ?? (await getOpenAIEmbeddingModel());
  const client = await getClient();
  const batches = batchTextsByTokenBudget(
    texts,
    RAG_DEFAULTS.maxEmbeddingTokensPerRequest,
    RAG_DEFAULTS.maxEmbeddingInputsPerRequest,
  );
  const embeddings: number[][] = [];
  const dimensions = embeddingRequestDimensions(resolvedModel);

  for (const batch of batches) {
    const response = await client.embeddings.create({
      model: resolvedModel,
      input: batch,
      ...(dimensions ? { dimensions } : {}),
    });
    embeddings.push(
      ...response.data
        .sort((left, right) => left.index - right.index)
        .map((item) => item.embedding),
    );
  }

  return embeddings;
}

export async function embedQuery(query: string, model?: string): Promise<number[]> {
  const [embedding] = await embedTexts([query], model);
  return embedding;
}

export function formatEmbeddingForPg(embedding: number[]) {
  return `[${embedding.join(",")}]`;
}
