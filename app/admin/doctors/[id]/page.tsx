"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";

interface DoctorDetail {
  id: string;
  name: string;
  email: string;
  practiceName: string | null;
  preferredModel: string;
  active: boolean;
  createdAt: string;
  jobs: Array<{
    id: string;
    audioFilename: string;
    status: string;
    modelUsed: string | null;
    createdAt: string;
    completedAt: string | null;
  }>;
}

export default function AdminDoctorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [doctor, setDoctor] = useState<DoctorDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/admin/doctors/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setDoctor(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

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

  if (!doctor) return <p className="text-zinc-600">Doctor not found.</p>;

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/admin/doctors"
          className="text-sm text-blue-600 hover:underline"
        >
          &larr; All Doctors
        </Link>
      </div>

      <div className="mb-8 rounded-xl border border-zinc-200 bg-white p-6">
        <h1 className="text-2xl font-bold text-zinc-900">{doctor.name}</h1>
        <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <dt className="text-zinc-500">Email</dt>
            <dd className="font-medium text-zinc-900">{doctor.email}</dd>
          </div>
          <div>
            <dt className="text-zinc-500">Practice</dt>
            <dd className="font-medium text-zinc-900">
              {doctor.practiceName || "-"}
            </dd>
          </div>
          <div>
            <dt className="text-zinc-500">Model</dt>
            <dd className="font-medium text-zinc-900">
              {doctor.preferredModel}
            </dd>
          </div>
          <div>
            <dt className="text-zinc-500">Status</dt>
            <dd className="font-medium text-zinc-900">
              {doctor.active ? "Active" : "Inactive"}
            </dd>
          </div>
        </dl>
      </div>

      <h2 className="mb-4 text-lg font-semibold text-zinc-900">
        Letter History ({doctor.jobs.length})
      </h2>

      {doctor.jobs.length === 0 ? (
        <p className="text-sm text-zinc-500">No transcriptions yet.</p>
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
              {doctor.jobs.map((job) => (
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
                    {new Date(job.createdAt).toLocaleDateString("en-AU")}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm">
                    {job.status === "done" && (
                      <a
                        href={`/api/letters/${job.id}/download`}
                        className="text-blue-600 hover:underline"
                      >
                        Download
                      </a>
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
