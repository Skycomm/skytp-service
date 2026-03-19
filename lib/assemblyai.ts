import { AssemblyAI } from "assemblyai";

const client = new AssemblyAI({
  apiKey: "0f67d283c7c849a1b77449db1da6d394",
});

export async function transcribeAudio(
  audioUrl: string
): Promise<{ text: string; durationMs: number }> {
  const start = Date.now();

  const transcript = await client.transcripts.transcribe({
    audio_url: audioUrl,
    speech_model: "universal-3-pro" as unknown as undefined,
  });

  if (transcript.status === "error") {
    throw new Error(`Transcription failed: ${transcript.error}`);
  }

  const durationMs = Date.now() - start;
  return { text: transcript.text || "", durationMs };
}
