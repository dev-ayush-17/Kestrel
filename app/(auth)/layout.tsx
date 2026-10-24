import * as React from "react";
import Link from "next/link";
import { Compass, ArrowLeft } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col justify-between bg-brand-bg px-4 py-8 sm:px-6 lg:px-8">
      {/* Top Header */}
      <div className="max-w-md w-full mx-auto flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2 group text-brand-muted hover:text-brand-ink transition-colors text-xs font-medium"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Kestrel Stays</span>
        </Link>
        <Link href="/" className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-md bg-pine flex items-center justify-center text-white">
            <Compass className="h-3.5 w-3.5" />
          </div>
          <span className="font-serif text-lg tracking-tight text-brand-ink font-normal">
            Kestrel Stays
          </span>
        </Link>
      </div>

      {/* Main Form Center Box */}
      <main id="main-content" className="max-w-md w-full mx-auto my-8">
        <div className="rounded-lg border border-brand-border bg-brand-surface p-6 sm:p-8 shadow-xs">
          {children}
        </div>
      </main>

      {/* Footer disclaimer */}
      <div className="max-w-md w-full mx-auto text-center text-xs text-brand-muted">
        <p>
          Protected by Kestrel Stays hospitality authentication standards. Cleanly decoupled Next.js & FastAPI frontend demonstration.
        </p>
      </div>
    </div>
  );
}
