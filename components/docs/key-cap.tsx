"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useIsMac } from "@/hooks/use-platform";

export interface KeyCapProps extends React.HTMLAttributes<HTMLElement> {
  combo: string;
  size?: "sm" | "md";
}

const META_ALIAS = new Set(["mod", "meta", "cmd", "command", "ctrl-or-cmd"]);

function renderKey(key: string, isMac: boolean): string {
  const k = key.trim().toLowerCase();
  if (META_ALIAS.has(k)) return isMac ? "⌘" : "Ctrl";
  if (k === "ctrl" || k === "control") return isMac ? "⌃" : "Ctrl";
  if (k === "shift") return isMac ? "⇧" : "Shift";
  if (k === "alt" || k === "option") return isMac ? "⌥" : "Alt";
  if (k === "enter" || k === "return") return "↵";
  if (k === "esc" || k === "escape") return "Esc";
  if (k === "tab") return isMac ? "⇥" : "Tab";
  if (k === "up") return "↑";
  if (k === "down") return "↓";
  if (k === "left") return "←";
  if (k === "right") return "→";
  if (k === "space") return "␣";
  return key.length === 1 ? key.toUpperCase() : key;
}

export const KeyCap = React.forwardRef<HTMLElement, KeyCapProps>(
  ({ combo, size = "sm", className, ...props }, ref) => {
    const isMac = useIsMac();
    const parts = combo.split("+").map((p) => renderKey(p, isMac));

    return (
      <kbd
        ref={ref}
        className={cn(
          "inline-flex items-center gap-0.5 rounded-md border border-border bg-default-100 px-1.5 font-medium text-default-700 select-none",
          size === "sm" ? "h-5 text-[10.5px]" : "h-6 text-xs",
          className
        )}
        {...props}
      >
        {parts.map((p, i) => (
          <React.Fragment key={i}>
            {i > 0 && <span className="text-default-400 mx-0.5">+</span>}
            <span>{p}</span>
          </React.Fragment>
        ))}
      </kbd>
    );
  }
);
KeyCap.displayName = "KeyCap";
