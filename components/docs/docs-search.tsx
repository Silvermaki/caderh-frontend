"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { KeyCap } from "./key-cap";
import { getVisibleModules } from "@/lib/docs/registry";
import type { DocRole } from "@/lib/docs/types";

export interface DocsSearchProps {
  role: DocRole | undefined;
  className?: string;
}

interface SearchEntry {
  type: "module" | "action";
  moduleSlug: string;
  moduleTitle: string;
  actionSlug?: string;
  title: string;
  summary: string;
  href: string;
}

export function DocsSearch({ role, className }: DocsSearchProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);

  const entries = React.useMemo<SearchEntry[]>(() => {
    const modules = getVisibleModules(role);
    const out: SearchEntry[] = [];
    modules.forEach((mod) => {
      out.push({
        type: "module",
        moduleSlug: mod.slug,
        moduleTitle: mod.title,
        title: mod.title,
        summary: mod.summary,
        href: `/dashboard/ayuda/${mod.slug}`,
      });
      mod.actions.forEach((action) => {
        out.push({
          type: "action",
          moduleSlug: mod.slug,
          moduleTitle: mod.title,
          actionSlug: action.slug,
          title: action.title,
          summary: action.summary,
          href: `/dashboard/ayuda/${mod.slug}/${action.slug}`,
        });
      });
    });
    return out;
  }, [role]);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const go = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Buscar en la documentación"
        className={cn(
          "group inline-flex items-center gap-2 h-9 px-3 rounded-lg",
          "border border-border bg-card text-muted-foreground",
          "hover:bg-default-50 hover:border-primary/30 hover:text-foreground",
          "transition-colors duration-150 text-sm w-full max-w-sm",
          className
        )}
      >
        <Search className="h-4 w-4 shrink-0" />
        <span className="flex-1 text-left">Buscar guías…</span>
        <KeyCap combo="mod+K" />
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <Command className="rounded-lg" shouldFilter>
          <CommandInput placeholder="Busca por módulo o acción…" />
          <CommandList>
            <CommandEmpty>No encontramos guías para esa búsqueda.</CommandEmpty>
            <CommandGroup heading="Módulos">
              {entries
                .filter((e) => e.type === "module")
                .map((e) => (
                  <CommandItem
                    key={e.href}
                    value={`${e.title} ${e.summary}`}
                    onSelect={() => go(e.href)}
                    className="flex flex-col items-start gap-0.5 py-2"
                  >
                    <span className="font-medium text-foreground">{e.title}</span>
                    <span className="text-xs text-muted-foreground line-clamp-1">
                      {e.summary}
                    </span>
                  </CommandItem>
                ))}
            </CommandGroup>
            <CommandGroup heading="Guías">
              {entries
                .filter((e) => e.type === "action")
                .map((e) => (
                  <CommandItem
                    key={e.href}
                    value={`${e.title} ${e.moduleTitle} ${e.summary}`}
                    onSelect={() => go(e.href)}
                    className="flex flex-col items-start gap-0.5 py-2"
                  >
                    <span className="font-medium text-foreground">
                      {e.title}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {e.moduleTitle} · {e.summary}
                    </span>
                  </CommandItem>
                ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}
