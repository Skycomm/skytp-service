import { NextRequest, NextResponse } from "next/server";
import { pollEmailInbox } from "@/lib/email-poller";

// GET /api/cron/email-poll — triggered by Vercel Cron every minute
export async function GET(request: NextRequest) {
  // Verify cron secret in production
  const authHeader = request.headers.get("authorization");
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await pollEmailInbox();

  return NextResponse.json({
    ok: true,
    processed: result.processed,
    errors: result.errors,
    timestamp: new Date().toISOString(),
  });
}
