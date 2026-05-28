import type { LucideIcon } from "lucide-react";

export type DocRole = "ADMIN" | "MANAGER" | "USER";

export const ROLE_LABELS: Record<DocRole, string> = {
  ADMIN: "Administrador",
  MANAGER: "Supervisor",
  USER: "Agente",
};

export type RolePermission = "full" | "partial" | "none";

export interface RoleMatrix {
  ADMIN: { level: RolePermission; note?: string };
  MANAGER: { level: RolePermission; note?: string };
  USER: { level: RolePermission; note?: string };
}

export type CalloutVariant = "tip" | "info" | "warning" | "danger" | "success";

export interface DocStepCallout {
  variant: CalloutVariant;
  title?: string;
  text: string;
}

export interface DocStep {
  id: string;
  title: string;
  body: string;
  bullets?: string[];
  callout?: DocStepCallout;
  screenshot?: {
    src: string;
    alt: string;
    caption?: string;
  };
}

export interface DocAction {
  slug: string;
  title: string;
  summary: string;
  roles: RoleMatrix;
  steps: DocStep[];
  related?: { moduleSlug: string; actionSlug: string }[];
}

export interface DocModule {
  slug: string;
  title: string;
  summary: string;
  icon: LucideIcon;
  visibleTo: DocRole[];
  actions: DocAction[];
}
