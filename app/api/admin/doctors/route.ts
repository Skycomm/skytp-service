import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

// GET /api/admin/doctors — list all doctors
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isAdmin = (session.user as Record<string, unknown>).isAdmin;
  if (!isAdmin) {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const doctors = await prisma.doctor.findMany({
    include: { _count: { select: { jobs: true } } },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(doctors);
}

// POST /api/admin/doctors — add a new doctor
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isAdmin = (session.user as Record<string, unknown>).isAdmin;
  if (!isAdmin) {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const body = await request.json();
  const { name, email, practiceName, preferredModel } = body;

  if (!name || !email) {
    return NextResponse.json(
      { error: "Name and email are required" },
      { status: 400 }
    );
  }

  const doctor = await prisma.doctor.create({
    data: {
      name,
      email: email.toLowerCase(),
      practiceName: practiceName || null,
      preferredModel: preferredModel || "gpt-4.1",
    },
  });

  return NextResponse.json(doctor, { status: 201 });
}
