"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";

export function Nav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isAdmin = Boolean((session?.user as Record<string, unknown>)?.isAdmin);

  const links = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/upload", label: "Upload" },
    { href: "/settings", label: "Settings" },
  ];

  const adminLinks = [
    { href: "/admin/dashboard", label: "Monitor" },
    { href: "/admin/doctors", label: "Doctors" },
    { href: "/admin/jobs", label: "All Jobs" },
  ];

  return (
    <nav className="border-b border-zinc-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-8">
          <Link href="/dashboard" className="text-xl font-bold text-zinc-900">
            SkyTP
          </Link>
          <div className="flex gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  pathname === link.href
                    ? "bg-blue-50 text-blue-700"
                    : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
                }`}
              >
                {link.label}
              </Link>
            ))}
            {isAdmin && (
              <>
                <div className="mx-2 w-px bg-zinc-200" />
                {adminLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                      pathname.startsWith(link.href)
                        ? "bg-orange-50 text-orange-700"
                        : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-zinc-600">{session?.user?.name}</span>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="rounded-md px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
          >
            Sign Out
          </button>
        </div>
      </div>
    </nav>
  );
}
