"use client";

import * as React from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, BookOpen, HelpCircle } from "lucide-react";
import { Breadcrumbs, BreadcrumbItem } from "@/components/ui/breadcrumbs";
import { cn } from "@/lib/utils";
import { getVisibleModules } from "@/lib/docs/registry";
import type { DocRole } from "@/lib/docs/types";

const EASE_OUT = [0.23, 1, 0.32, 1] as const;

export default function AyudaIndexPage() {
  const { data: session } = useSession() as {
    data?: { user?: { name?: string; role?: string } };
  };
  const role = session?.user?.role as DocRole | undefined;
  const modules = getVisibleModules(role);
  const reduced = useReducedMotion();

  return (
    <div>
      <Breadcrumbs>
        <BreadcrumbItem>Plataforma</BreadcrumbItem>
        <BreadcrumbItem className="text-primary">Centro de Ayuda</BreadcrumbItem>
      </Breadcrumbs>

      <motion.header
        initial={reduced ? { opacity: 0 } : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: EASE_OUT }}
        className="mt-5 mb-8"
      >
        <div className="flex items-center gap-2 text-primary mb-2">
          <BookOpen className="h-5 w-5" />
          <span className="text-sm font-semibold uppercase tracking-wider">
            Centro de Ayuda
          </span>
        </div>
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-foreground">
          Guías paso a paso de CADERH
        </h1>
        <p className="mt-2 text-sm md:text-base text-muted-foreground max-w-2xl">
          {session?.user?.name ? (
            <>Hola, <span className="font-medium text-foreground">{session.user.name}</span>. </>
          ) : null}
          Encuentra cómo hacer cada tarea en la plataforma. Las guías están organizadas por módulo
          y muestran solo lo que tu rol puede ver.
        </p>
      </motion.header>

      <motion.div
        initial="hidden"
        animate="show"
        variants={{
          hidden: { opacity: 0 },
          show: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.1 } },
        }}
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4"
      >
        {modules.map((mod) => {
          const Icon = mod.icon;
          const actionCount = mod.actions.length;
          return (
            <motion.div
              key={mod.slug}
              variants={{
                hidden: { opacity: 0, y: 10 },
                show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: EASE_OUT } },
              }}
            >
              <Link
                href={`/dashboard/ayuda/${mod.slug}`}
                className={cn(
                  "group relative block h-full rounded-xl border border-border bg-card p-5",
                  "transition-all duration-200",
                  "hover:border-primary/30 hover:shadow-md",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                )}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-200">
                    <Icon className="h-5 w-5" />
                  </div>
                  <ArrowRight
                    className="h-4 w-4 text-muted-foreground/60 group-hover:text-primary group-hover:translate-x-0.5 transition-all duration-200"
                  />
                </div>
                <h3 className="font-semibold text-foreground text-base mb-1.5">
                  {mod.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                  {mod.summary}
                </p>
                <div className="mt-4 pt-3 border-t border-border text-xs text-muted-foreground">
                  {actionCount === 0
                    ? "Próximamente"
                    : actionCount === 1
                    ? "1 guía"
                    : `${actionCount} guías`}
                </div>
              </Link>
            </motion.div>
          );
        })}
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="mt-10 rounded-xl border border-dashed border-border bg-default-50/50 p-5 flex items-start gap-3"
      >
        <HelpCircle className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
        <div className="text-sm text-muted-foreground">
          <p className="font-medium text-foreground mb-1">¿No encuentras lo que buscas?</p>
          <p>
            Usa la búsqueda (parte superior izquierda) o contacta al administrador para que añadamos la guía que necesitas.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
