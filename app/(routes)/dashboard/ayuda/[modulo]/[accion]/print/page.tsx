"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Printer, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getModuleBySlug,
  getActionBySlug,
} from "@/lib/docs/registry";
import { RoleBadge } from "@/components/docs/role-badge";

export default function PrintActionPage() {
  const params = useParams() as { modulo: string; accion: string };
  const mod = getModuleBySlug(params.modulo);
  const action = getActionBySlug(params.modulo, params.accion);

  React.useEffect(() => {
    document.body.classList.add("print-mode");
    return () => document.body.classList.remove("print-mode");
  }, []);

  if (!mod || !action) {
    return (
      <div className="p-10 text-center text-foreground">
        Guía no encontrada.
      </div>
    );
  }

  return (
    <>
      <style jsx global>{`
        @media print {
          /* Margin 0 on the page suppresses the browser-generated
             header (date/title) and footer (URL/page number); we
             restore visual breathing room via padding on the content. */
          @page {
            margin: 0;
          }
          body {
            background: #fff !important;
          }
          /* Hide every painted element by default ... */
          body * {
            visibility: hidden !important;
          }
          /* ... then show only the print container and its descendants. */
          #print-doc-content,
          #print-doc-content * {
            visibility: visible !important;
          }
          /* Anchor the print container at the top-left of the page so the
             hidden surrounding layout doesn't leave whitespace. */
          #print-doc-content {
            position: absolute !important;
            inset: 0 auto auto 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            /* 20mm top/bottom, 22mm sides — standard report-style margins
               (~0.79"/0.87") for comfortable reading and binding room. */
            padding: 20mm 22mm !important;
            margin: 0 !important;
            box-sizing: border-box !important;
            background: #fff !important;
          }
          .no-print {
            display: none !important;
          }
        }
        body.print-mode {
          background: #fff;
        }
      `}</style>

      <div id="print-doc-content" className="max-w-3xl mx-auto p-6 md:p-10 bg-white text-foreground">
        <header className="no-print flex items-center justify-between mb-6 pb-4 border-b border-border">
          <Link
            href={`/dashboard/ayuda/${mod.slug}/${action.slug}`}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary"
          >
            <ChevronLeft className="h-4 w-4" /> Volver a la guía
          </Link>
          <Button onClick={() => window.print()} size="sm">
            <Printer className="h-3.5 w-3.5 mr-1.5" />
            Imprimir
          </Button>
        </header>

        <div className="text-center mb-8 print:mb-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-2">
            CADERH · Centro de Ayuda
          </p>
          <p className="text-sm text-muted-foreground mb-2">{mod.title}</p>
          <h1 className="text-3xl font-bold text-foreground">{action.title}</h1>
          <p className="mt-3 text-sm text-muted-foreground max-w-xl mx-auto">
            {action.summary}
          </p>
        </div>

        <RoleBadge matrix={action.roles} className="mb-8" />

        {action.steps.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">
            Esta guía está en preparación.
          </p>
        ) : (
          <ol className="space-y-6">
            {action.steps.map((step, i) => (
              <li key={step.id} className="break-inside-avoid">
                <div className="flex items-start gap-3 mb-2">
                  <span className="h-7 w-7 rounded-full bg-primary text-primary-foreground font-semibold text-xs inline-flex items-center justify-center shrink-0 tabular-nums">
                    {i + 1}
                  </span>
                  <h2 className="text-lg font-semibold text-foreground pt-0.5">
                    {step.title}
                  </h2>
                </div>
                <div className="pl-10 text-sm leading-relaxed text-foreground/85 space-y-3">
                  <p>{step.body}</p>
                  {step.bullets && step.bullets.length > 0 && (
                    <ul className="list-disc pl-5 space-y-1">
                      {step.bullets.map((b, k) => (
                        <li key={k}>{b}</li>
                      ))}
                    </ul>
                  )}
                  {step.callout && (
                    <div className="rounded border border-border bg-default-50 px-3 py-2">
                      <p className="font-semibold text-foreground mb-0.5">
                        {step.callout.title ?? "Nota"}
                      </p>
                      <p>{step.callout.text}</p>
                    </div>
                  )}
                  {step.screenshot && (
                    <figure>
                      <img
                        src={step.screenshot.src}
                        alt={step.screenshot.alt}
                        className="w-full rounded border border-border"
                      />
                      {step.screenshot.caption && (
                        <figcaption className="mt-1.5 text-xs text-muted-foreground text-center">
                          {step.screenshot.caption}
                        </figcaption>
                      )}
                    </figure>
                  )}
                </div>
              </li>
            ))}
          </ol>
        )}

        <footer className="mt-12 pt-4 border-t border-border text-xs text-muted-foreground text-center">
          CADERH · Sistema Estadístico · {new Date().toLocaleDateString("es-HN")}
        </footer>
      </div>
    </>
  );
}
