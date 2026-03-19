"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";

interface DoctorSettings {
  id: string;
  name: string;
  email: string;
  practiceName: string | null;
  preferredModel: string;
  letterheadUrl: string | null;
}

export default function SettingsPage() {
  const { data: session } = useSession();
  const [settings, setSettings] = useState<DoctorSettings | null>(null);
  const [model, setModel] = useState("gpt-4.1");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        setSettings(data);
        setModel(data.preferredModel);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    setSaved(false);

    await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ preferredModel: model }),
    });

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
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
      <h1 className="mb-8 text-2xl font-bold text-zinc-900">Settings</h1>

      <div className="mx-auto max-w-xl space-y-8">
        {/* Account info */}
        <div className="rounded-xl border border-zinc-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-zinc-900">Account</h2>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-zinc-500">Name</dt>
              <dd className="font-medium text-zinc-900">
                {settings?.name || session?.user?.name}
              </dd>
            </div>
            <div>
              <dt className="text-zinc-500">Email</dt>
              <dd className="font-medium text-zinc-900">
                {settings?.email || session?.user?.email}
              </dd>
            </div>
            {settings?.practiceName && (
              <div>
                <dt className="text-zinc-500">Practice</dt>
                <dd className="font-medium text-zinc-900">
                  {settings.practiceName}
                </dd>
              </div>
            )}
          </dl>
        </div>

        {/* Model selection */}
        <div className="rounded-xl border border-zinc-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-zinc-900">
            Formatting Model
          </h2>
          <div className="space-y-3">
            <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-zinc-200 p-4 transition-colors hover:bg-zinc-50">
              <input
                type="radio"
                name="model"
                value="gpt-4.1"
                checked={model === "gpt-4.1"}
                onChange={() => setModel("gpt-4.1")}
                className="mt-0.5"
              />
              <div>
                <p className="text-sm font-medium text-zinc-900">
                  GPT-4.1
                </p>
                <p className="text-xs text-zinc-500">
                  Faster processing, lower cost
                </p>
              </div>
            </label>
            <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-zinc-200 p-4 transition-colors hover:bg-zinc-50">
              <input
                type="radio"
                name="model"
                value="claude-sonnet-4-6"
                checked={model === "claude-sonnet-4-6"}
                onChange={() => setModel("claude-sonnet-4-6")}
                className="mt-0.5"
              />
              <div>
                <p className="text-sm font-medium text-zinc-900">
                  Claude Sonnet 4.6
                </p>
                <p className="text-xs text-zinc-500">
                  Highest accuracy (37.7/40 tested)
                </p>
              </div>
            </label>
          </div>

          <div className="mt-6 flex items-center gap-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Settings"}
            </button>
            {saved && (
              <span className="text-sm text-green-600">Settings saved</span>
            )}
          </div>
        </div>

        {/* Letterhead upload placeholder */}
        <div className="rounded-xl border border-zinc-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-zinc-900">
            Letterhead
          </h2>
          <p className="text-sm text-zinc-500">
            Letterhead upload is coming in Phase 2. Your uploaded letterhead
            will be applied to formatted letters automatically.
          </p>
        </div>
      </div>
    </div>
  );
}
