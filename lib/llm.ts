import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { getPromptForModel } from "./prompts";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function formatTranscript(
  transcript: string,
  model: string,
  doctorName: string
): Promise<{ text: string; durationMs: number }> {
  const start = Date.now();
  const systemPrompt = getPromptForModel(model);

  let formatted: string;

  if (model === "claude-sonnet-4-6") {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: "user", content: transcript }],
    });
    const block = response.content[0];
    formatted = block.type === "text" ? block.text : "";
  } else {
    const response = await openai.chat.completions.create({
      model: "gpt-4.1",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: transcript },
      ],
      temperature: 0.2,
    });
    formatted = response.choices[0]?.message?.content || "";
  }

  // Replace (TRANSCRIBING DOCTOR) with actual doctor name
  formatted = formatted.replace(/\(TRANSCRIBING DOCTOR\)/g, doctorName);

  const durationMs = Date.now() - start;
  return { text: formatted, durationMs };
}
