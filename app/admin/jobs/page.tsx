"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface JobRow {
  id: string;
  audioFilename: string;
  status: string;
  modelUsed: string | null;
  createdAt: string;
  completedAt: string | null;
  error: string | null;
  doctor: { name: string; email: string };
}

export default function AdminJobsPage() {
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJobs();
  }, []);

  function fetchJobs() {
    fetch("/api/jobs")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setJobs(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }

  async function retryJob(id: string) {
    await fetch(`/api/jobs/${id}`, { method: "POST" });
    fetchJobs();
  }

  const statusColor: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    transcribing: "bg-blue-100 text-blue-800",
    formatting: "bg-purple-100 text-purple-800",
    done: "bg-green-100 text-green-800",
    failed: "bg-red-100 text-red-800",
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-8 text-2xl font-bold text-zinc-900">All Jobs</h1>

      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
        <table className="min-w-full divide-y divide-zinc-200">
          <thead className="bg-zinc-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                Doctor
              </th>
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
                <td className="whitespace-nowrap px-6 py-4 text-sm text-zinc-900">
                  {job.doctor.name}
                </td>
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
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm">
                  <div className="flex gap-2">
                    <Link
                      href={`/letters/${job.id}`}
                      className="text-blue-600 hover:underline"
                    >
                      View
                    </Link>
                    {job.status === "done" && (
                      <a
                        href={`/api/letters/${job.id}/download`}
                        className="text-blue-600 hover:underline"
                      >
                        Download
                      </a>
                    )}
                    {job.status === "failed" && (
                      <button
                        onClick={() => retryJob(job.id)}
                        className="text-orange-600 hover:underline"
                      >
                        Retry
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
