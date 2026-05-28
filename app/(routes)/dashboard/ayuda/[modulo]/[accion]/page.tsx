"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, Printer, Lock } from "lucide-react";
import toast from "react-hot-toast";
import { Breadcrumbs, BreadcrumbItem } from "@/components/ui/breadcrumbs";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  getModuleBySlug,
  getActionBySlug,
  canSeeModule,
} from "@/lib/docs/registry";
import { RoleBadge } from "@/components/docs/role-badge";
import { Step } from "@/components/docs/step";
import { Callout } from "@/components/docs/callout";
import { TableOfContents } from "@/components/docs/table-of-contents";
import type { DocRole } from "@/lib/docs/types";

const EASE_OUT = [0.23, 1, 0.32, 1] as const;

export default function ActionPage() {
  const params = useParams() as { modulo: string; accion: string };
  const router = useRouter();
  const { data: session, status } = useSession() as {
    data?: { user?: { role?: string } };
    status: "loading" | "authenticated" | "unauthenticated";
  };
  const role = session?.user?.role as DocRole | undefined;
  const reduced = useReducedMotion();

  const mod = getModuleBySlug(params.modulo);
  const action = getActionBySlug(params.modulo, params.accion);

  React.useEffect(() => {
    if (status === "loading") return;
    if (!mod || !action) return;
    if (!canSeeModule(role, params.modulo)) {
      toast.error("Esta sección no está disponible para tu rol");
      router.replace("/dashboard/ayuda");
    }
  }, [mod, action, role, status, params.modulo, router]);

  if (!mod || !action) {
    return (
      <div className="py-16 text-center">
        <h1 className="text-2xl font-bold text-foreground mb-2">Guía no encontrada</h1>
        <Link
          href="/dashboard/ayuda"
          className="inline-flex items-center gap-2 text-primary hover:underline text-sm"
        >
          <ChevronLeft className="h-4 w-4" /> Volver al Centro de Ayuda
        </Link>
      </div>
    );
  }

  if (!canSeeModule(role, params.modulo)) {
    return (
      <div className="py-16 text-center">
        <Lock className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
        <h1 className="text-xl font-semibold text-foreground mb-1">
          Sección restringida
        </h1>
        <p className="text-muted-foreground text-sm">Redirigiendo…</p>
      </div>
    );
  }

  const tocItems = action.steps.map((s) => ({
    id: s.id,
    label: s.title,
  }));

  return (
    <div className="grid xl:grid-cols-[minmax(0,1fr)_200px] gap-8">
      <div className="min-w-0">
        <Breadcrumbs>
          <BreadcrumbItem>
            <Link href="/dashboard/ayuda">Centro de Ayuda</Link>
          </BreadcrumbItem>
          <BreadcrumbItem>
            <Link href={`/dashboard/ayuda/${mod.slug}`}>{mod.title}</Link>
          </BreadcrumbItem>
          <BreadcrumbItem className="text-primary">{action.title}</BreadcrumbItem>
        </Breadcrumbs>

        <motion.header
          initial={reduced ? { opacity: 0 } : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: EASE_OUT }}
          className="mt-5 mb-6 flex items-start justify-between gap-4"
        >
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-1.5">
              {mod.title}
            </p>
            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-foreground">
              {action.title}
            </h1>
            <p className="mt-2 text-sm md:text-base text-muted-foreground max-w-2xl">
              {action.summary}
            </p>
          </div>
          <Link
            href={`/dashboard/ayuda/${mod.slug}/${action.slug}/print`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="outline" size="sm" className="shrink-0">
              <Printer className="h-3.5 w-3.5 mr-1.5" />
              Imprimir / PDF
            </Button>
          </Link>
        </motion.header>

        <RoleBadge matrix={action.roles} className="mb-8" />

        {action.steps.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-default-50/50 p-8 text-center">
            <p className="text-base font-medium text-foreground">
              Esta guía está en preparación
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Pronto agregaremos los pasos detallados con capturas de pantalla.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {action.steps.map((step, i) => (
              <Step
                key={step.id}
                id={step.id}
                number={i + 1}
                title={step.title}
                screenshot={step.screenshot}
              >
                <p>{step.body}</p>
                {step.bullets && step.bullets.length > 0 && (
                  <ul className="list-disc pl-5 space-y-1 marker:text-muted-foreground">
                    {step.bullets.map((b, k) => (
                      <li key={k}>{b}</li>
                    ))}
                  </ul>
                )}
                {step.callout && (
                  <Callout
                    variant={step.callout.variant}
                    title={step.callout.title}
                    className="mt-3"
                  >
                    {step.callout.text}
                  </Callout>
                )}
              </Step>
            ))}
          </div>
        )}

        {action.related && action.related.length > 0 && (
          <section className="mt-12 mb-16 border-t border-border pt-6">
            <h2 className="text-sm font-semibold text-foreground mb-3">
              Guías relacionadas
            </h2>
            <ul className="grid sm:grid-cols-2 gap-2">
              {action.related.map((r) => {
                const m = getModuleBySlug(r.moduleSlug);
                const a = getActionBySlug(r.moduleSlug, r.actionSlug);
                if (!m || !a) return null;
                return (
                  <li key={`${r.moduleSlug}/${r.actionSlug}`}>
                    <Link
                      href={`/dashboard/ayuda/${r.moduleSlug}/${r.actionSlug}`}
                      className={cn(
                        "block px-3 py-2 rounded-lg border border-border bg-card text-sm",
                        "hover:border-primary/30 hover:bg-default-50 transition-colors"
                      )}
                    >
                      <span className="text-xs text-muted-foreground">
                        {m.title}
                      </span>
                      <span className="block font-medium text-foreground">
                        {a.title}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        )}
      </div>

      <div className="hidden xl:block">
        <div className="sticky top-20">
          <TableOfContents items={tocItems} />
        </div>
      </div>
    </div>
  );
}
