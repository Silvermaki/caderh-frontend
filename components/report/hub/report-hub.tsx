import { REPORT_CATEGORIES, reportsByCategory, allReports } from '@/lib/report/registry';
import { ReportBreadcrumbs } from '../table/report-breadcrumbs';
import { ReportCategoryCard } from './report-category-card';
import { ReportSearch } from './report-search';

export function ReportHub() {
  const total = allReports().length;
  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      <ReportBreadcrumbs crumbs={[{ label: 'Reportes' }]} />
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-default-900">Centro de Reportes</h1>
        <p className="text-sm text-default-500 mt-0.5">
          {total} {total === 1 ? 'reporte disponible' : 'reportes disponibles'} · Click para generar
        </p>
      </div>
      <div className="mb-4 max-w-md">
        <ReportSearch />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {REPORT_CATEGORIES.map((meta) => (
          <ReportCategoryCard
            key={meta.key}
            meta={meta}
            reports={reportsByCategory(meta.key)}
          />
        ))}
      </div>
    </div>
  );
}
