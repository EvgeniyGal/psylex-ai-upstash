import { NextResponse } from "next/server";
import { z } from "zod";
import { answerHelpChat } from "@/lib/help/chat";
import { getHelpViewer, resolveHelpLocale } from "@/lib/help/viewer";

const bodySchema = z.object({
  locale: z.enum(["en", "uk"]).optional(),
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(8000),
      }),
    )
    .min(1)
    .max(20),
});

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { role, preferredLocale } = await getHelpViewer();
  const locale = resolveHelpLocale(parsed.data.locale ?? null, preferredLocale);

  try {
    const reply = await answerHelpChat({
      locale,
      role,
      messages: parsed.data.messages,
    });
    return NextResponse.json({ reply, locale });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Help chat failed";
    const status = message.includes("OpenAI API key") ? 503 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
