"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const acceptedTypes = ".mp3,.wav,.m4a,.ogg,.flac,.wma";

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) setFile(dropped);
  }

  async function handleUpload() {
    if (!file) return;
    setUploading(true);
    setError("");

    const formData = new FormData();
    formData.append("audio", file);

    try {
      const res = await fetch("/api/jobs", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Upload failed");
        setUploading(false);
        return;
      }

      router.push("/dashboard");
    } catch {
      setError("Upload failed. Please try again.");
      setUploading(false);
    }
  }

  return (
    <div>
      <h1 className="mb-8 text-2xl font-bold text-zinc-900">
        Upload Dictation
      </h1>

      <div className="mx-auto max-w-xl">
        <div
          className={`rounded-xl border-2 border-dashed p-12 text-center transition-colors ${
            dragging
              ? "border-blue-400 bg-blue-50"
              : "border-zinc-300 bg-white"
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
        >
          {file ? (
            <div className="space-y-4">
              <div className="text-4xl">🎙️</div>
              <p className="text-sm font-medium text-zinc-900">{file.name}</p>
              <p className="text-xs text-zinc-500">
                {(file.size / 1024 / 1024).toFixed(1)} MB
              </p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => setFile(null)}
                  className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                >
                  Remove
                </button>
                <button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 disabled:opacity-50"
                >
                  {uploading ? "Uploading..." : "Start Transcription"}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-4xl">📁</div>
              <p className="text-sm text-zinc-600">
                Drag and drop your audio file here, or
              </p>
              <button
                onClick={() => inputRef.current?.click()}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
              >
                Browse Files
              </button>
              <p className="text-xs text-zinc-400">
                Accepted formats: MP3, WAV, M4A, OGG, FLAC
              </p>
            </div>
          )}

          <input
            ref={inputRef}
            type="file"
            accept={acceptedTypes}
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
        </div>

        {error && (
          <p className="mt-4 text-center text-sm text-red-600">{error}</p>
        )}
      </div>
    </div>
  );
}
