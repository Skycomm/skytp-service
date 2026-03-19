import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isAdmin = (session.user as Record<string, unknown>).isAdmin;
  if (!isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Recent jobs (last 20)
  const recentJobs = await prisma.job.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
    include: { doctor: { select: { name: true, email: true } } },
  });

  // Jobs today
  const jobsToday = await prisma.job.count({
    where: { createdAt: { gte: todayStart } },
  });

  // Success rate (today)
  const jobsTodayDone = await prisma.job.count({
    where: { createdAt: { gte: todayStart }, status: "done" },
  });
  const jobsTodayFailed = await prisma.job.count({
    where: { createdAt: { gte: todayStart }, status: "failed" },
  });
  const jobsTodayCompleted = jobsTodayDone + jobsTodayFailed;
  const successRate =
    jobsTodayCompleted > 0
      ? Math.round((jobsTodayDone / jobsTodayCompleted) * 100)
      : 100;

  // Average processing time (today, completed jobs)
  const completedToday = await prisma.job.findMany({
    where: {
      createdAt: { gte: todayStart },
      status: "done",
      sttTimeMs: { not: null },
      llmTimeMs: { not: null },
    },
    select: { sttTimeMs: true, llmTimeMs: true },
  });

  const avgProcessingMs =
    completedToday.length > 0
      ? Math.round(
          completedToday.reduce(
            (sum, j) => sum + (j.sttTimeMs || 0) + (j.llmTimeMs || 0),
            0
          ) / completedToday.length
        )
      : 0;

  // Cost estimate: $0.10 per job
  const costToday = (jobsToday * 0.1).toFixed(2);

  // System status
  let lastPolledAt: Date | null = null;
  try {
    const status = await prisma.systemStatus.findUnique({
      where: { id: "singleton" },
    });
    lastPolledAt = status?.lastPolledAt ?? null;
  } catch {
    // Table may not exist yet
  }

  // Model usage split
  const modelCounts = await prisma.job.groupBy({
    by: ["modelUsed"],
    where: { createdAt: { gte: todayStart }, modelUsed: { not: null } },
    _count: true,
  });

  const modelUsage: Record<string, number> = {};
  for (const m of modelCounts) {
    if (m.modelUsed) {
      modelUsage[m.modelUsed] = m._count;
    }
  }

  return NextResponse.json({
    recentJobs,
    jobsToday,
    successRate,
    avgProcessingMs,
    costToday,
    lastPolledAt,
    modelUsage,
  });
}
