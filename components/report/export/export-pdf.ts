import { getSession } from 'next-auth/react';
import type { ColumnDef } from '@/lib/report/types';

// Same-origin proxy path (rewritten by Next.js to the backend, see next.config.js).
// Avoids mixed-content issues when the frontend is served over HTTPS but the
// backend listens on HTTP.
const API_PROXY = process.env.NEXT_PUBLIC_API_PROXY ?? '/backend-api';

async function getToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  const session = await getSession();
  return (session?.user as any)?.session ?? null;
}

export interface PdfExportPayload<TRow> {
  filters: Record<string, any>;
  columns: ColumnDef<TRow>[];
  title: string;
  subtitle?: string;
  code?: string;
}

export async function requestPdfExport<TRow>(
  reportId: string,
  payload: PdfExportPayload<TRow>,
): Promise<Blob> {
  const token = await getToken();
  // Strip non-serializable fields (render functions) from columns before sending.
  const columns = payload.columns.map((c) => ({
    key: c.key,
    label: c.label,
    align: c.align,
    missingInDb: c.missingInDb,
  }));

  const res = await fetch(`${API_PROXY}/reports/${reportId}/export/pdf`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      filters: payload.filters,
      columns,
      title: payload.title,
      subtitle: payload.subtitle,
      code: payload.code,
    }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`PDF export failed: ${res.status}${text ? ` — ${text.slice(0, 200)}` : ''}`);
  }
  return res.blob();
}

export function triggerBlobDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
