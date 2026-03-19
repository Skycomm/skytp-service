import { Client } from "@microsoft/microsoft-graph-client";
import { ClientSecretCredential } from "@azure/identity";
import { prisma } from "./db";
import { put } from "@vercel/blob";
import { processJob } from "./pipeline";
import { sendUnknownSenderReply } from "./email";

function getGraphClient(): Client | null {
  const clientId = process.env.AZURE_CLIENT_ID;
  const clientSecret = process.env.AZURE_CLIENT_SECRET;
  const tenantId = process.env.AZURE_TENANT_ID;

  if (!clientId || !clientSecret || !tenantId) {
    console.warn("Azure M365 credentials not configured");
    return null;
  }

  const credential = new ClientSecretCredential(
    tenantId,
    clientId,
    clientSecret
  );

  return Client.initWithMiddleware({
    authProvider: {
      getAccessToken: async () => {
        const token = await credential.getToken(
          "https://graph.microsoft.com/.default"
        );
        return token.token;
      },
    },
  });
}

const AUDIO_EXTENSIONS = [".mp3", ".wav", ".m4a", ".ogg", ".flac", ".wma", ".ds2", ".dss", ".webm"];

export async function pollEmailInbox(): Promise<{
  processed: number;
  errors: string[];
}> {
  const client = getGraphClient();
  if (!client) {
    return { processed: 0, errors: ["M365 not configured"] };
  }

  const userEmail = process.env.TRANSCRIPTION_EMAIL;
  let processed = 0;
  const errors: string[] = [];

  try {
    // Get unread messages with attachments
    const messages = await client
      .api(`/users/${userEmail}/messages`)
      .filter("isRead eq false and hasAttachments eq true")
      .select("id,from,subject,hasAttachments")
      .top(10)
      .get();

    for (const message of messages.value || []) {
      try {
        const senderEmail =
          message.from?.emailAddress?.address?.toLowerCase() || "";

        // Look up doctor
        const doctor = await prisma.doctor.findUnique({
          where: { email: senderEmail },
        });

        if (!doctor || !doctor.active) {
          await sendUnknownSenderReply(senderEmail);
          // Mark as read
          await client
            .api(`/users/${userEmail}/messages/${message.id}`)
            .update({ isRead: true });
          continue;
        }

        // Get attachments
        const attachments = await client
          .api(`/users/${userEmail}/messages/${message.id}/attachments`)
          .get();

        for (const attachment of attachments.value || []) {
          const filename = (attachment.name || "").toLowerCase();
          const isAudio = AUDIO_EXTENSIONS.some((ext) =>
            filename.endsWith(ext)
          );

          if (!isAudio || !attachment.contentBytes) continue;

          // Upload to Vercel Blob
          const audioBuffer = Buffer.from(attachment.contentBytes, "base64");
          let audioUrl = "";
          try {
            const blob = await put(
              `audio/${doctor.id}/${attachment.name}`,
              audioBuffer,
              { access: "public" }
            );
            audioUrl = blob.url;
          } catch {
            console.warn("Vercel Blob not configured for audio upload");
            continue;
          }

          // Create job
          const job = await prisma.job.create({
            data: {
              doctorId: doctor.id,
              audioFilename: attachment.name || "audio.mp3",
              audioUrl,
              status: "pending",
            },
          });

          // Process async
          processJob(job.id).catch((err) =>
            console.error(`Job ${job.id} failed:`, err)
          );
          processed++;
        }

        // Mark as read
        await client
          .api(`/users/${userEmail}/messages/${message.id}`)
          .update({ isRead: true });
      } catch (msgErr) {
        const errMsg =
          msgErr instanceof Error ? msgErr.message : "Unknown error";
        errors.push(`Message ${message.id}: ${errMsg}`);
      }
    }
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : "Unknown error";
    errors.push(`Poll error: ${errMsg}`);
  }

  // Update system status with last polled time
  await prisma.systemStatus.upsert({
    where: { id: "singleton" },
    update: { lastPolledAt: new Date() },
    create: { id: "singleton", lastPolledAt: new Date() },
  });

  return { processed, errors };
}
