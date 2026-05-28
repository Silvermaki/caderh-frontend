import * as React from "react";
import { cn } from "@/lib/utils";
import { Shield, Check, MinusCircle, X } from "lucide-react";
import type { DocRole, RoleMatrix, RolePermission } from "@/lib/docs/types";
import { ROLE_LABELS } from "@/lib/docs/types";

const ICON: Record<RolePermission, React.ComponentType<{ className?: string }>> = {
  full: Check,
  partial: MinusCircle,
  none: X,
};

const ROW_COLOR: Record<RolePermission, string> = {
  full: "text-success",
  partial: "text-warning",
  none: "text-destructive",
};

const ROW_BG: Record<RolePermission, string> = {
  full: "bg-success/10",
  partial: "bg-warning/10",
  none: "bg-destructive/10",
};

const LABEL: Record<RolePermission, string> = {
  full: "Sin restricciones",
  partial: "Acceso parcial",
  none: "No tiene permiso",
};

const ROLE_ORDER: DocRole[] = ["ADMIN", "MANAGER", "USER"];

export interface RoleBadgeProps {
  matrix: RoleMatrix;
  className?: string;
}

export function RoleBadge({ matrix, className }: RoleBadgeProps) {
  return (
    <section
      aria-label="Quién puede hacer esto"
      className={cn(
        "rounded-xl border border-border bg-card overflow-hidden",
        className
      )}
    >
      <header className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-default-50">
        <Shield className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Quién puede hacer esto</h3>
      </header>
      <ul className="divide-y divide-border">
        {ROLE_ORDER.map((role) => {
          const cell = matrix[role];
          const Icon = ICON[cell.level];
          return (
            <li
              key={role}
              className="flex items-center gap-3 px-4 py-2.5 text-sm"
            >
              <span
                className={cn(
                  "h-6 w-6 shrink-0 rounded-md flex items-center justify-center",
                  ROW_BG[cell.level]
                )}
              >
                <Icon className={cn("h-3.5 w-3.5", ROW_COLOR[cell.level])} />
              </span>
              <span className="w-32 font-medium text-foreground">
                {ROLE_LABELS[role]}
              </span>
              <span className={cn("font-medium", ROW_COLOR[cell.level])}>
                {LABEL[cell.level]}
              </span>
              {cell.note && (
                <span className="text-muted-foreground text-xs ml-1">
                  · {cell.note}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
