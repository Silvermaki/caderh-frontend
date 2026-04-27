'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { ReportBreadcrumbs, type Crumb } from '../table/report-breadcrumbs';
import { ReportHeader } from '../table/report-header';

export interface ReportTemplateShellProps {
  reportId: string;
  code: string;
  title: string;
  subtitle: string;
  breadcrumbs: Crumb[];
  renderForm: () => React.ReactNode;
  onGenerate: () => Promise<{ url: string; name: string }>;
  recent?: Array<{ name: string; whenLabel: string; url: string }>;
}

export function ReportTemplateShell({
  code, title, subtitle, breadcrumbs, renderForm, onGenerate, recent = [],
}: ReportTemplateShellProps) {
  const [busy, setBusy] = useState(false);

  async function handleGenerate() {
    setBusy(true);
    const id = toast.loading('Generando reporte…');
    try {
      const { name, url } = await onGenerate();
      toast.success(`Listo: ${name}`, { id });
      const a = document.createElement('a');
      a.href = url; a.download = name; a.click();
    } catch {
      toast.error('Error generando reporte', { id });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mb-4">
      <ReportBreadcrumbs crumbs={breadcrumbs} />
      <ReportHeader title={`${code} · ${title}`} subtitle={subtitle} />

      <Card className="p-4 max-w-md">
        <CardContent className="p-0">
          <div className="flex flex-col gap-3">
            {renderForm()}
            <div className="pt-2 flex justify-end">
              <Button onClick={handleGenerate} disabled={busy}>
                {busy ? 'Generando…' : 'Generar reporte'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {recent.length > 0 && (
        <div className="mt-6 max-w-md">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
            Últimos generados
          </h4>
          <ul className="space-y-1 text-sm">
            {recent.map((r, i) => (
              <li key={i} className="flex items-center justify-between">
                <span>{r.name}</span>
                <a href={r.url} className="text-primary hover:underline text-xs">Descargar</a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
