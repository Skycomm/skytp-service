"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";

interface Job {
  id: string;
  audioFilename: string;
  status: string;
  modelUsed: string | null;
  createdAt: string;
  completedAt: string | null;
  sttTimeMs: number | null;
  llmTimeMs: number | null;
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/jobs")
      .then((r) => r.json())
      .then((data) => {
        setJobs(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Poll for in-progress jobs
  useEffect(() => {
    const hasActive = jobs.some((j) =>
      ["pending", "transcribing", "formatting"].includes(j.status)
    );
    if (!hasActive) return;

    const interval = setInterval(() => {
      fetch("/api/jobs")
        .then((r) => r.json())
        .then(setJobs)
        .catch(() => {});
    }, 3000);

    return () => clearInterval(interval);
  }, [jobs]);

  const statusColor: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    transcribing: "bg-blue-100 text-blue-800",
    formatting: "bg-purple-100 text-purple-800",
    done: "bg-green-100 text-green-800",
    failed: "bg-red-100 text-red-800",
  };

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Dashboard</h1>
          <p className="text-sm text-zinc-600">
            Welcome back, {session?.user?.name}
          </p>
        </div>
        <Link
          href="/upload"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
        >
          Upload Dictation
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        </div>
      ) : jobs.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-12 text-center">
          <p className="text-zinc-600">No transcriptions yet.</p>
          <Link
            href="/upload"
            className="mt-4 inline-block text-sm font-medium text-blue-600 hover:underline"
          >
            Upload your first dictation
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
          <table className="min-w-full divide-y divide-zinc-200">
            <thead className="bg-zinc-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                  File
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Model
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {jobs.map((job) => (
                <tr key={job.id} className="hover:bg-zinc-50">
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-zinc-900">
                    {job.audioFilename}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                        statusColor[job.status] || "bg-zinc-100 text-zinc-800"
                      }`}
                    >
                      {job.status}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-zinc-600">
                    {job.modelUsed || "-"}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-zinc-600">
                    {new Date(job.createdAt).toLocaleDateString("en-AU", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm">
                    {job.status === "done" ? (
                      <div className="flex gap-2">
                        <Link
                          href={`/letters/${job.id}`}
                          className="text-blue-600 hover:underline"
                        >
                          View
                        </Link>
                        <a
                          href={`/api/letters/${job.id}/download`}
                          className="text-blue-600 hover:underline"
                        >
                          Download
                        </a>
                      </div>
                    ) : job.status === "failed" ? (
                      <span className="text-red-600">Failed</span>
                    ) : (
                      <span className="text-zinc-400">Processing...</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
