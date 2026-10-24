import * as React from "react";
import { AdminSidebar } from "@/components/layout/AdminSidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-brand-surface-subtle/50">
      <AdminSidebar />
      <div className="flex-1 min-w-0 flex flex-col min-h-screen">
        <header className="h-16 border-b border-brand-border bg-brand-surface px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-success inline-block" />
            <span className="text-xs font-medium text-brand-muted uppercase tracking-wider">
              FastAPI Core Sync: Connected (Mock Mode)
            </span>
          </div>
          <div className="text-xs text-brand-muted">
            Administrator: <span className="font-semibold text-brand-ink">Alexander Vance</span>
          </div>
        </header>
        <main id="main-content" className="flex-1 p-6 md:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
