"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";

interface JobDetail {
  id: string;
  audioFilename: string;
  status: string;
  transcript: string | null;
  letterRtf: string | null;
  modelUsed: string | null;
  sttTimeMs: number | null;
  llmTimeMs: number | null;
  createdAt: string;
  completedAt: string | null;
  error: string | null;
  doctor: { name: string; email: string };
}

export default function LetterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [job, setJob] = useState<JobDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/jobs/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setJob(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (!job) {
    return <p className="text-zinc-600">Letter not found.</p>;
  }

  // Extract plain text from RTF (strip RTF tags for preview)
  const letterPreview = job.letterRtf
    ? job.letterRtf
        .replace(/\{\\rtf1[^}]*\}/g, "")
        .replace(/\\[a-z]+\d*/g, " ")
        .replace(/[{}]/g, "")
        .replace(/\s+/g, " ")
        .trim()
    : null;

  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        <Link
          href="/dashboard"
          className="text-sm text-blue-600 hover:underline"
        >
          &larr; Dashboard
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Info panel */}
        <div className="rounded-xl border border-zinc-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-zinc-900">Details</h2>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-zinc-500">File</dt>
              <dd className="font-medium text-zinc-900">
                {job.audioFilename}
              </dd>
            </div>
            <div>
              <dt className="text-zinc-500">Status</dt>
              <dd className="font-medium text-zinc-900">{job.status}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">Model</dt>
              <dd className="font-medium text-zinc-900">
                {job.modelUsed || "-"}
              </dd>
            </div>
            <div>
              <dt className="text-zinc-500">Created</dt>
              <dd className="font-medium text-zinc-900">
                {new Date(job.createdAt).toLocaleString("en-AU")}
              </dd>
            </div>
            {job.completedAt && (
              <div>
                <dt className="text-zinc-500">Completed</dt>
                <dd className="font-medium text-zinc-900">
                  {new Date(job.completedAt).toLocaleString("en-AU")}
                </dd>
              </div>
            )}
            {job.sttTimeMs != null && (
              <div>
                <dt className="text-zinc-500">STT Time</dt>
                <dd className="font-medium text-zinc-900">
                  {(job.sttTimeMs / 1000).toFixed(1)}s
                </dd>
              </div>
            )}
            {job.llmTimeMs != null && (
              <div>
                <dt className="text-zinc-500">LLM Time</dt>
                <dd className="font-medium text-zinc-900">
                  {(job.llmTimeMs / 1000).toFixed(1)}s
                </dd>
              </div>
            )}
            {job.error && (
              <div>
                <dt className="text-zinc-500">Error</dt>
                <dd className="font-medium text-red-600">{job.error}</dd>
              </div>
            )}
          </dl>

          {job.status === "done" && (
            <a
              href={`/api/letters/${job.id}/download`}
              className="mt-6 block w-full rounded-lg bg-blue-600 px-4 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
            >
              Download RTF
            </a>
          )}
        </div>

        {/* Letter preview */}
        <div className="rounded-xl border border-zinc-200 bg-white p-6 lg:col-span-2">
          <h2 className="mb-4 text-lg font-semibold text-zinc-900">
            Letter Preview
          </h2>
          {job.status === "done" && letterPreview ? (
            <div className="whitespace-pre-wrap rounded-lg bg-zinc-50 p-6 font-mono text-sm text-zinc-800">
              {letterPreview}
            </div>
          ) : job.transcript ? (
            <div>
              <h3 className="mb-2 text-sm font-medium text-zinc-500">
                Raw Transcript
              </h3>
              <div className="whitespace-pre-wrap rounded-lg bg-zinc-50 p-6 text-sm text-zinc-800">
                {job.transcript}
              </div>
            </div>
          ) : (
            <p className="text-sm text-zinc-500">
              {job.status === "failed"
                ? "Processing failed."
                : "Processing in progress..."}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
