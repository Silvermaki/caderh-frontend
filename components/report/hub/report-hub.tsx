import { REPORT_CATEGORIES, reportsByCategory, allReports } from '@/lib/report/registry';
import { ReportBreadcrumbs } from '../table/report-breadcrumbs';
import { ReportCategoryCard } from './report-category-card';
import { ReportSearch } from './report-search';

export function ReportHub() {
  const total = allReports().length;
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <ReportBreadcrumbs crumbs={[{ label: 'Reportes' }]} />
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Centro de Reportes</h1>
        <p className="text-sm text-muted-foreground">
          {total} {total === 1 ? 'reporte disponible' : 'reportes disponibles'}
        </p>
      </div>
      <div className="mb-6">
        <ReportSearch />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
