"use client";

import * as React from "react";
import { useSession } from "next-auth/react";
import { ModuleNav } from "./module-nav";
import { DocsSearch } from "./docs-search";
import type { DocRole } from "@/lib/docs/types";

export interface DocsLayoutProps {
  children: React.ReactNode;
  tocSlot?: React.ReactNode;
}

export function DocsLayout({ children, tocSlot }: DocsLayoutProps) {
  const { data: session } = useSession() as {
    data?: { user?: { role?: string } };
  };
  const role = session?.user?.role as DocRole | undefined;

  return (
    <div className="-mt-4">
      <div className="grid grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)] xl:grid-cols-[260px_minmax(0,1fr)_220px] gap-6">
        <aside className="hidden lg:block">
          <div className="sticky top-20 max-h-[calc(100vh-6rem)] rounded-xl border border-border bg-card overflow-hidden">
            <div className="px-3 pt-3 pb-2 border-b border-border">
              <DocsSearch role={role} />
            </div>
            <div className="h-[calc(100vh-12rem)]">
              <ModuleNav role={role} />
            </div>
          </div>
        </aside>

        <main className="min-w-0">
          <div className="lg:hidden mb-4">
            <DocsSearch role={role} />
          </div>
          {children}
        </main>

        {tocSlot && (
          <aside className="hidden xl:block">
            <div className="sticky top-20">{tocSlot}</div>
          </aside>
        )}
      </div>
    </div>
  );
}
