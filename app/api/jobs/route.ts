import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { put } from "@vercel/blob";
import { processJob } from "@/lib/pipeline";

// POST /api/jobs — create job from web upload
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("audio") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No audio file provided" }, { status: 400 });
  }

  const allowedTypes = [
    "audio/mpeg",
    "audio/wav",
    "audio/x-wav",
    "audio/mp4",
    "audio/x-m4a",
    "audio/ogg",
    "audio/flac",
  ];
  const allowedExtensions = [".mp3", ".wav", ".m4a", ".ogg", ".flac", ".wma"];
  const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();

  if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(ext)) {
    return NextResponse.json(
      { error: "Invalid file type. Accepted: MP3, WAV, M4A, OGG, FLAC" },
      { status: 400 }
    );
  }

  // Upload to Vercel Blob
  let audioUrl = "";
  try {
    const blob = await put(
      `audio/${session.user.id}/${Date.now()}-${file.name}`,
      file,
      { access: "public" }
    );
    audioUrl = blob.url;
  } catch {
    return NextResponse.json(
      { error: "File upload failed. Storage not configured." },
      { status: 500 }
    );
  }

  // Create job record
  const job = await prisma.job.create({
    data: {
      doctorId: session.user.id,
      audioFilename: file.name,
      audioUrl,
      status: "pending",
    },
  });

  // Trigger processing (fire and forget)
  processJob(job.id).catch((err) =>
    console.error(`Job ${job.id} processing failed:`, err)
  );

  return NextResponse.json({ id: job.id, status: "pending" }, { status: 201 });
}

// GET /api/jobs — list jobs for authenticated doctor
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isAdmin = (session.user as Record<string, unknown>).isAdmin;

  const jobs = await prisma.job.findMany({
    where: isAdmin ? undefined : { doctorId: session.user.id },
    include: { doctor: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json(jobs);
}
