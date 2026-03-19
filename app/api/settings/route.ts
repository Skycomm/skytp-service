import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

// GET /api/settings — get current doctor settings
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const doctor = await prisma.doctor.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      practiceName: true,
      preferredModel: true,
      letterheadUrl: true,
    },
  });

  if (!doctor) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(doctor);
}

// PUT /api/settings — update settings
export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { preferredModel } = body;

  const validModels = ["gpt-4.1", "claude-sonnet-4-6"];
  if (preferredModel && !validModels.includes(preferredModel)) {
    return NextResponse.json({ error: "Invalid model" }, { status: 400 });
  }

  const updated = await prisma.doctor.update({
    where: { id: session.user.id },
    data: { preferredModel },
    select: {
      id: true,
      name: true,
      email: true,
      practiceName: true,
      preferredModel: true,
    },
  });

  return NextResponse.json(updated);
}
