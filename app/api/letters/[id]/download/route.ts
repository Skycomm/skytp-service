import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

// GET /api/letters/[id]/download — download RTF
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const job = await prisma.job.findUnique({ where: { id } });

  if (!job) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const isAdmin = (session.user as Record<string, unknown>).isAdmin;
  if (job.doctorId !== session.user.id && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!job.letterRtf) {
    return NextResponse.json(
      { error: "Letter not yet available" },
      { status: 404 }
    );
  }

  const filename = job.audioFilename.replace(/\.[^.]+$/, ".rtf");

  return new NextResponse(job.letterRtf, {
    headers: {
      "Content-Type": "application/rtf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
