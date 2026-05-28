"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, ChevronLeft, Lock } from "lucide-react";
import toast from "react-hot-toast";
import { Breadcrumbs, BreadcrumbItem } from "@/components/ui/breadcrumbs";
import { cn } from "@/lib/utils";
import { getModuleBySlug, canSeeModule } from "@/lib/docs/registry";
import type { DocRole } from "@/lib/docs/types";

const EASE_OUT = [0.23, 1, 0.32, 1] as const;

export default function ModuleIndexPage() {
  const params = useParams() as { modulo: string };
  const router = useRouter();
  const { data: session, status } = useSession() as {
    data?: { user?: { role?: string } };
    status: "loading" | "authenticated" | "unauthenticated";
  };
  const role = session?.user?.role as DocRole | undefined;
  const reduced = useReducedMotion();

  const mod = getModuleBySlug(params.modulo);

  React.useEffect(() => {
    if (status === "loading") return;
    if (!mod) return;
    if (!canSeeModule(role, params.modulo)) {
      toast.error("Esta sección no está disponible para tu rol");
      router.replace("/dashboard/ayuda");
    }
  }, [mod, role, status, params.modulo, router]);

  if (!mod) {
    return (
      <div className="py-16 text-center">
        <h1 className="text-2xl font-bold text-foreground mb-2">Módulo no encontrado</h1>
        <p className="text-muted-foreground mb-6">
          La guía que buscas no existe o fue movida.
        </p>
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

  const Icon = mod.icon;

  return (
    <div>
      <Breadcrumbs>
        <BreadcrumbItem>
          <Link href="/dashboard/ayuda">Centro de Ayuda</Link>
        </BreadcrumbItem>
        <BreadcrumbItem className="text-primary">{mod.title}</BreadcrumbItem>
      </Breadcrumbs>

      <motion.header
        initial={reduced ? { opacity: 0 } : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: EASE_OUT }}
        className="mt-5 mb-8 flex items-start gap-4"
      >
        <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
          <Icon className="h-6 w-6" />
        </div>
        <div className="min-w-0">
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-foreground">
            {mod.title}
          </h1>
          <p className="mt-1.5 text-sm md:text-base text-muted-foreground max-w-2xl">
            {mod.summary}
          </p>
        </div>
      </motion.header>

      {mod.actions.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-default-50/50 p-8 text-center">
          <p className="text-base font-medium text-foreground">
            Estamos preparando las guías de este módulo
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Vuelve pronto o usa la búsqueda para explorar otros módulos.
          </p>
        </div>
      ) : (
        <motion.ul
          initial="hidden"
          animate="show"
          variants={{
            hidden: { opacity: 0 },
            show: { opacity: 1, transition: { staggerChildren: 0.04, delayChildren: 0.1 } },
          }}
          className="space-y-3"
        >
          {mod.actions.map((action, idx) => (
            <motion.li
              key={action.slug}
              variants={{
                hidden: { opacity: 0, y: 6 },
                show: { opacity: 1, y: 0, transition: { duration: 0.28, ease: EASE_OUT } },
              }}
            >
              <Link
                href={`/dashboard/ayuda/${mod.slug}/${action.slug}`}
                className={cn(
                  "group flex items-start gap-4 rounded-xl border border-border bg-card p-4 md:p-5",
                  "transition-all duration-200",
                  "hover:border-primary/30 hover:shadow-md",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                )}
              >
                <span className="shrink-0 h-9 w-9 rounded-lg bg-default-100 text-default-700 font-semibold flex items-center justify-center text-sm tabular-nums">
                  {String(idx + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-foreground text-base">
                    {action.title}
                  </p>
                  <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">
                    {action.summary}
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground/60 group-hover:text-primary group-hover:translate-x-0.5 transition-all duration-200 mt-2.5" />
              </Link>
            </motion.li>
          ))}
        </motion.ul>
      )}
    </div>
  );
}
