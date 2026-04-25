'use client';

import '@/lib/report/definitions';
import { REPORT_CATEGORIES, reportsByCategory, allReports } from '@/lib/report/registry';
import { ReportBreadcrumbs } from '../table/report-breadcrumbs';
import { ReportCategoryCard } from './report-category-card';
import { ReportSearch } from './report-search';

export function ReportHub() {
  const total = allReports().length;
  return (
    <div className="mb-4">
      <ReportBreadcrumbs crumbs={[{ label: 'Plataforma' }, { label: 'Reportes' }]} />

      <div className="mt-5">
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-primary">
          Centro de Reportes
        </h1>
        <p className="text-sm text-muted-foreground mt-2 leading-relaxed max-w-2xl">
          {total} {total === 1 ? 'reporte disponible' : 'reportes disponibles'} agrupados por categoría. Hacé click en cualquiera para abrir y aplicar filtros.
        </p>
      </div>

      <div className="mt-5 mb-6 max-w-md">
        <ReportSearch />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {REPORT_CATEGORIES.map((meta, i) => (
          <ReportCategoryCard
            key={meta.key}
            index={i}
            meta={meta}
            reports={reportsByCategory(meta.key)}
          />
        ))}
      </div>
    </div>
  );
}
