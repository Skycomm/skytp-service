import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { put } from "@vercel/blob";
import { processJob } from "@/lib/pipeline";
import { sendUnknownSenderReply } from "@/lib/email";

// POST /api/webhook/email — receive forwarded email attachments
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { senderEmail, audioBase64, filename } = body as {
    senderEmail: string;
    audioBase64: string;
    filename: string;
  };

  if (!senderEmail || !audioBase64 || !filename) {
    return NextResponse.json(
      { error: "Missing senderEmail, audioBase64, or filename" },
      { status: 400 }
    );
  }

  // Look up doctor
  const doctor = await prisma.doctor.findUnique({
    where: { email: senderEmail.toLowerCase() },
  });

  if (!doctor || !doctor.active) {
    try {
      await sendUnknownSenderReply(senderEmail);
    } catch {
      // best effort
    }
    return NextResponse.json(
      { error: "Unknown sender" },
      { status: 404 }
    );
  }

  // Upload audio
  const audioBuffer = Buffer.from(audioBase64, "base64");
  let audioUrl = "";
  try {
    const blob = await put(
      `audio/${doctor.id}/${Date.now()}-${filename}`,
      audioBuffer,
      { access: "public" }
    );
    audioUrl = blob.url;
  } catch {
    return NextResponse.json(
      { error: "Storage upload failed" },
      { status: 500 }
    );
  }

  // Create job
  const job = await prisma.job.create({
    data: {
      doctorId: doctor.id,
      audioFilename: filename,
      audioUrl,
      status: "pending",
    },
  });

  // Process
  processJob(job.id).catch((err) =>
    console.error(`Webhook job ${job.id} failed:`, err)
  );

  return NextResponse.json({ id: job.id, status: "pending" }, { status: 201 });
}
