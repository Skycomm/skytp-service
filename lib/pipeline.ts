import { prisma } from "./db";
import { transcribeAudio } from "./assemblyai";
import { formatTranscript } from "./llm";
import { markdownToRtf } from "./rtf";
import { sendLetterEmail } from "./email";
import { put } from "@vercel/blob";
import { convertToWav } from "./audio-convert";

export async function processJob(jobId: string): Promise<void> {
  const job = await prisma.job.findUniqueOrThrow({
    where: { id: jobId },
    include: { doctor: true },
  });

  try {
    // Step 0: Convert DS2/DSS to WAV if needed
    let audioUrl = job.audioUrl!;
    const ext = job.audioFilename.toLowerCase().replace(/.*\./, ".");
    if (ext === ".ds2" || ext === ".dss") {
      const wavUrl = await convertToWav(audioUrl, jobId);
      if (wavUrl) {
        audioUrl = wavUrl;
      }
    }

    // Step 1: Transcribe
    await prisma.job.update({
      where: { id: jobId },
      data: { status: "transcribing" },
    });

    const { text: transcript, durationMs: sttTimeMs } = await transcribeAudio(
      audioUrl
    );

    await prisma.job.update({
      where: { id: jobId },
      data: { transcript, sttTimeMs },
    });

    // Step 2: Format with LLM
    await prisma.job.update({
      where: { id: jobId },
      data: { status: "formatting" },
    });

    const model = job.doctor.preferredModel;
    const { text: letterText, durationMs: llmTimeMs } = await formatTranscript(
      transcript,
      model,
      job.doctor.name
    );

    // Step 3: Convert to RTF
    const rtfContent = markdownToRtf(letterText);

    // Step 4: Upload RTF to Vercel Blob
    const rtfFilename = job.audioFilename.replace(/\.[^.]+$/, ".rtf");
    let letterUrl = "";
    try {
      const blob = await put(`letters/${jobId}/${rtfFilename}`, rtfContent, {
        access: "public",
        contentType: "application/rtf",
      });
      letterUrl = blob.url;
    } catch {
      // Blob storage might not be configured; continue without URL
      console.warn("Vercel Blob not configured, skipping letter upload");
    }

    // Step 5: Send email with RTF attachment
    try {
      await sendLetterEmail(
        job.doctor.email,
        job.doctor.name,
        rtfContent,
        rtfFilename
      );
    } catch (emailErr) {
      console.warn("Email sending failed:", emailErr);
    }

    // Step 6: Mark done
    await prisma.job.update({
      where: { id: jobId },
      data: {
        status: "done",
        letterRtf: rtfContent,
        letterUrl: letterUrl || null,
        modelUsed: model,
        llmTimeMs,
        completedAt: new Date(),
      },
    });
  } catch (err) {
    const errorMessage =
      err instanceof Error ? err.message : "Unknown error occurred";
    await prisma.job.update({
      where: { id: jobId },
      data: { status: "failed", error: errorMessage },
    });
    throw err;
  }
}
