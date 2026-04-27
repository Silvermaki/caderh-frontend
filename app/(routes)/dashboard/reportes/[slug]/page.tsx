'use client';

import '@/lib/report/definitions';
import { notFound, useParams } from 'next/navigation';
import { getReport, REPORT_CATEGORIES } from '@/lib/report/registry';
import { ReportTableShell } from '@/components/report/shell/report-table-shell';
import { ReportTemplateShell } from '@/components/report/shell/report-template-shell';
import { buildReportFilters } from '@/components/report/filters/filter-renderer';

export default function ReportSlugPage() {
  const { slug } = useParams<{ slug: string }>();
  const def = getReport(slug);
  if (!def) return notFound();

  const catMeta = REPORT_CATEGORIES.find((c) => c.key === def.category);
  const crumbs = [
    { label: 'Plataforma' },
    { label: 'Reportes', href: '/dashboard/reportes' },
    { label: catMeta?.label ?? def.category },
    { label: `${def.code} · ${def.title}` },
  ];

  if ((def as any).variants?.template) {
    return (
      <ReportTemplateShell
        reportId={def.id}
        code={def.code}
        title={def.title}
        subtitle={def.subtitle}
        breadcrumbs={crumbs}
        renderForm={() => (
          <div className="rounded-md border border-primary/20 bg-primary/5 p-6 text-sm text-muted-foreground">
            Formulario pendiente — plantilla AC-R-022 en desarrollo.
          </div>
        )}
        onGenerate={async () => {
          throw new Error('Generación pixel-perfect pendiente de implementación');
        }}
      />
    );
  }

  return (
    <ReportTableShell
      definition={def as any}
      breadcrumbs={crumbs}
      renderFilters={buildReportFilters(def)}
    />
  );
}
