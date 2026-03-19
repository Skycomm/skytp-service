"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface DoctorRow {
  id: string;
  name: string;
  email: string;
  practiceName: string | null;
  preferredModel: string;
  active: boolean;
  _count: { jobs: number };
}

export default function AdminDoctorsPage() {
  const [doctors, setDoctors] = useState<DoctorRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPractice, setNewPractice] = useState("");

  useEffect(() => {
    fetchDoctors();
  }, []);

  function fetchDoctors() {
    fetch("/api/admin/doctors")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setDoctors(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/admin/doctors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newName,
        email: newEmail,
        practiceName: newPractice || null,
      }),
    });
    setNewName("");
    setNewEmail("");
    setNewPractice("");
    setShowAdd(false);
    fetchDoctors();
  }

  async function toggleActive(id: string, active: boolean) {
    await fetch(`/api/admin/doctors/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !active }),
    });
    fetchDoctors();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-900">Doctors</h1>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
        >
          {showAdd ? "Cancel" : "Add Doctor"}
        </button>
      </div>

      {showAdd && (
        <form
          onSubmit={handleAdd}
          className="mb-8 rounded-xl border border-zinc-200 bg-white p-6"
        >
          <div className="grid gap-4 sm:grid-cols-3">
            <input
              type="text"
              placeholder="Doctor name"
              required
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
            />
            <input
              type="email"
              placeholder="Email"
              required
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
            />
            <input
              type="text"
              placeholder="Practice name (optional)"
              value={newPractice}
              onChange={(e) => setNewPractice(e.target.value)}
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
            />
          </div>
          <button
            type="submit"
            className="mt-4 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-500"
          >
            Add Doctor
          </button>
        </form>
      )}

      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
        <table className="min-w-full divide-y divide-zinc-200">
          <thead className="bg-zinc-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                Practice
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                Model
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                Jobs
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200">
            {doctors.map((doc) => (
              <tr key={doc.id} className="hover:bg-zinc-50">
                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-zinc-900">
                  {doc.name}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-zinc-600">
                  {doc.email}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-zinc-600">
                  {doc.practiceName || "-"}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-zinc-600">
                  {doc.preferredModel}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-zinc-600">
                  {doc._count.jobs}
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <span
                    className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                      doc.active
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {doc.active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm">
                  <div className="flex gap-2">
                    <Link
                      href={`/admin/doctors/${doc.id}`}
                      className="text-blue-600 hover:underline"
                    >
                      View
                    </Link>
                    <button
                      onClick={() => toggleActive(doc.id, doc.active)}
                      className={`hover:underline ${
                        doc.active ? "text-red-600" : "text-green-600"
                      }`}
                    >
                      {doc.active ? "Deactivate" : "Activate"}
                    </button>
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
