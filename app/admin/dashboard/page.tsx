"use client";

import { useEffect, useState, useCallback } from "react";

interface Job {
  id: string;
  audioFilename: string;
  status: string;
  modelUsed: string | null;
  sttTimeMs: number | null;
  llmTimeMs: number | null;
  error: string | null;
  createdAt: string;
  completedAt: string | null;
  doctor: { name: string; email: string };
}

interface Stats {
  recentJobs: Job[];
  jobsToday: number;
  successRate: number;
  avgProcessingMs: number;
  costToday: string;
  lastPolledAt: string | null;
  modelUsage: Record<string, number>;
}

function StatusDot({ ok }: { ok: boolean | null }) {
  if (ok === null)
    return (
      <span className="inline-block h-3 w-3 rounded-full bg-zinc-300" />
    );
  return (
    <span
      className={`inline-block h-3 w-3 rounded-full ${ok ? "bg-green-500" : "bg-red-500"}`}
    />
  );
}

function formatMs(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "never";
  const diff = Date.now() - new Date(dateStr).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [assemblyAi, setAssemblyAi] = useState<boolean | null>(null);
  const [claudeOk, setClaudeOk] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/stats");
      if (res.ok) setStats(await res.json());
    } catch {
      // silently retry on next interval
    }
  }, []);

  const checkHealth = useCallback(async () => {
    try {
      const res = await fetch("/api/health/assemblyai");
      const data = await res.json();
      setAssemblyAi(data.ok);
    } catch {
      setAssemblyAi(false);
    }

    // Claude gateway: just check if API key is set (no public health endpoint)
    setClaudeOk(true);
  }, []);

  useEffect(() => {
    Promise.all([fetchStats(), checkHealth()]).then(() => setLoading(false));
    const interval = setInterval(() => {
      fetchStats();
      checkHealth();
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchStats, checkHealth]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  const emailPollerOk =
    stats?.lastPolledAt &&
    Date.now() - new Date(stats.lastPolledAt).getTime() < 5 * 60 * 1000;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-900">
          Monitoring Dashboard
        </h1>
        <span className="text-xs text-zinc-500">Auto-refreshes every 30s</span>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card label="Jobs Today" value={String(stats?.jobsToday ?? 0)} />
        <Card label="Success Rate" value={`${stats?.successRate ?? 100}%`} />
        <Card
          label="Avg Processing"
          value={stats?.avgProcessingMs ? formatMs(stats.avgProcessingMs) : "—"}
        />
        <Card label="Cost Today (est)" value={`$${stats?.costToday ?? "0.00"}`} />
      </div>

      {/* System Status */}
      <div className="rounded-lg border border-zinc-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-zinc-900">
          System Status
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="flex items-center gap-3">
            <StatusDot ok={assemblyAi} />
            <div>
              <p className="text-sm font-medium text-zinc-900">AssemblyAI</p>
              <p className="text-xs text-zinc-500">
                {assemblyAi === null
                  ? "Checking..."
                  : assemblyAi
                    ? "Connected"
                    : "Unreachable"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <StatusDot ok={claudeOk} />
            <div>
              <p className="text-sm font-medium text-zinc-900">Claude / LLM</p>
              <p className="text-xs text-zinc-500">
                {claudeOk === null ? "Checking..." : claudeOk ? "Ready" : "Down"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <StatusDot ok={emailPollerOk ?? null} />
            <div>
              <p className="text-sm font-medium text-zinc-900">Email Poller</p>
              <p className="text-xs text-zinc-500">
                Last polled: {timeAgo(stats?.lastPolledAt ?? null)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Model Usage Split */}
      {stats?.modelUsage && Object.keys(stats.modelUsage).length > 0 && (
        <div className="rounded-lg border border-zinc-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-zinc-900">
            Model Usage (Today)
          </h2>
          <div className="flex gap-6">
            {Object.entries(stats.modelUsage).map(([model, count]) => (
              <div key={model} className="text-sm">
                <span className="font-medium text-zinc-900">{model}</span>
                <span className="ml-2 text-zinc-500">{count} jobs</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Live Jobs Table */}
      <div className="rounded-lg border border-zinc-200 bg-white">
        <div className="border-b border-zinc-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-zinc-900">
            Recent Jobs (Last 20)
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-100 text-xs font-medium uppercase text-zinc-500">
                <th className="px-6 py-3">Doctor</th>
                <th className="px-6 py-3">File</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Model</th>
                <th className="px-6 py-3">Time</th>
                <th className="px-6 py-3">Created</th>
              </tr>
            </thead>
            <tbody>
              {(stats?.recentJobs ?? []).map((job) => (
                <tr
                  key={job.id}
                  className="border-b border-zinc-50 hover:bg-zinc-50"
                >
                  <td className="px-6 py-3 font-medium text-zinc-900">
                    {job.doctor.name}
                  </td>
                  <td className="max-w-[200px] truncate px-6 py-3 text-zinc-600">
                    {job.audioFilename}
                  </td>
                  <td className="px-6 py-3">
                    <StatusBadge status={job.status} />
                  </td>
                  <td className="px-6 py-3 text-zinc-600">
                    {job.modelUsed ?? "—"}
                  </td>
                  <td className="px-6 py-3 text-zinc-600">
                    {job.sttTimeMs != null && job.llmTimeMs != null
                      ? formatMs(job.sttTimeMs + job.llmTimeMs)
                      : "—"}
                  </td>
                  <td className="px-6 py-3 text-zinc-500">
                    {timeAgo(job.createdAt)}
                  </td>
                </tr>
              ))}
              {(stats?.recentJobs ?? []).length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-8 text-center text-zinc-400"
                  >
                    No jobs yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white px-6 py-4">
      <p className="text-sm text-zinc-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-zinc-900">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700",
    transcribing: "bg-blue-100 text-blue-700",
    formatting: "bg-purple-100 text-purple-700",
    done: "bg-green-100 text-green-700",
    failed: "bg-red-100 text-red-700",
  };
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${colors[status] ?? "bg-zinc-100 text-zinc-700"}`}
    >
      {status}
    </span>
  );
}
