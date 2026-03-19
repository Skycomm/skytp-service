import { NextResponse } from "next/server";

export async function GET() {
  try {
    const res = await fetch("https://api.assemblyai.com/v2/transcript", {
      method: "GET",
      headers: {
        authorization: process.env.ASSEMBLYAI_API_KEY || "",
      },
      signal: AbortSignal.timeout(5000),
    });
    return NextResponse.json({ ok: res.ok, status: res.status });
  } catch {
    return NextResponse.json({ ok: false, status: 0 });
  }
}
