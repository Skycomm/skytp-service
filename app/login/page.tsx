"use client";

import { signIn } from "next-auth/react";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const error = searchParams.get("error");

  return (
    <div className="w-full max-w-md space-y-8 rounded-xl bg-white p-8 shadow-lg">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-zinc-900">SkyTP</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Medical Transcription Service
        </p>
      </div>

      {error && (
        <p className="text-center text-sm text-red-600">
          {error === "AccessDenied"
            ? "Access denied. Only registered doctors can sign in."
            : "An error occurred during sign in. Please try again."}
        </p>
      )}

      <button
        onClick={() =>
          signIn("microsoft-entra-id", { callbackUrl })
        }
        className="flex w-full items-center justify-center gap-3 rounded-lg bg-[#0078d4] px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#106ebe] focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
      >
        <svg className="h-5 w-5" viewBox="0 0 21 21" fill="none">
          <rect x="1" y="1" width="9" height="9" fill="#f25022" />
          <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
          <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
          <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
        </svg>
        Sign in with Microsoft
      </button>

      <p className="text-center text-xs text-zinc-500">
        Only registered doctors can access this service.
        <br />
        Contact{" "}
        <a
          href="mailto:help@skycomm.com.au"
          className="text-blue-600 hover:underline"
        >
          help@skycomm.com.au
        </a>{" "}
        for access.
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50">
      <Suspense
        fallback={
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}
