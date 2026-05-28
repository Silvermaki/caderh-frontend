"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { DocModule, DocRole } from "@/lib/docs/types";
import { getVisibleModules } from "@/lib/docs/registry";

export interface ModuleNavProps {
  role: DocRole | undefined;
  className?: string;
}

export function ModuleNav({ role, className }: ModuleNavProps) {
  const pathname = usePathname();
  const modules = getVisibleModules(role);
  const segments = pathname.split("/").filter(Boolean);
  const currentModule = segments[2];
  const currentAction = segments[3];

  return (
    <nav
      aria-label="Módulos de la documentación"
      className={cn("h-full flex flex-col", className)}
    >
      <ScrollArea className="flex-1 px-3 py-4">
        <ul className="space-y-0.5">
          {modules.map((mod) => (
            <ModuleItem
              key={mod.slug}
              mod={mod}
              isActive={currentModule === mod.slug}
              currentAction={currentAction}
            />
          ))}
        </ul>
      </ScrollArea>
    </nav>
  );
}

function ModuleItem({
  mod,
  isActive,
  currentAction,
}: {
  mod: DocModule;
  isActive: boolean;
  currentAction: string | undefined;
}) {
  const [expanded, setExpanded] = React.useState(isActive);
  React.useEffect(() => {
    if (isActive) setExpanded(true);
  }, [isActive]);

  const Icon = mod.icon;
  const hasActions = mod.actions.length > 0;
  // Only highlight the parent when the user is on the module index itself,
  // not on a sub-action — the sub-action handles its own highlight.
  const isModuleIndexActive = isActive && !currentAction;

  return (
    <li>
      <div className="flex items-center">
        <Link
          href={`/dashboard/ayuda/${mod.slug}`}
          className={cn(
            "flex-1 flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm font-medium",
            "transition-colors duration-150",
            isModuleIndexActive
              ? "bg-primary/10 text-primary"
              : "text-foreground/80 hover:bg-default-100 hover:text-foreground"
          )}
        >
          <Icon
            className={cn(
              "h-4 w-4 shrink-0",
              isModuleIndexActive ? "text-primary" : "text-muted-foreground"
            )}
          />
          <span className="truncate">{mod.title}</span>
        </Link>
        {hasActions && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-label={expanded ? "Colapsar" : "Expandir"}
            aria-expanded={expanded}
            className={cn(
              "h-7 w-7 ml-1 inline-flex items-center justify-center rounded-md",
              "text-muted-foreground hover:text-foreground hover:bg-default-100",
              "transition-colors duration-150"
            )}
          >
            <ChevronRight
              className={cn(
                "h-3.5 w-3.5 transition-transform duration-200",
                expanded && "rotate-90"
              )}
            />
          </button>
        )}
      </div>

      {hasActions && expanded && (
        <ul className="mt-0.5 ml-3 pl-3 border-l border-border space-y-0.5">
          {mod.actions.map((action) => {
            const active = isActive && currentAction === action.slug;
            return (
              <li key={action.slug}>
                <Link
                  href={`/dashboard/ayuda/${mod.slug}/${action.slug}`}
                  className={cn(
                    "block px-2.5 py-1.5 rounded-md text-[13px]",
                    "transition-colors duration-150",
                    active
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:text-foreground hover:bg-default-100"
                  )}
                >
                  {action.title}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </li>
  );
}
