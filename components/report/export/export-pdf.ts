export async function requestPdfExport(reportId: string, filters: Record<string, any>): Promise<Blob> {
  const res = await fetch(`/api/reports/${reportId}/export/pdf`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filters }),
  });
  if (!res.ok) throw new Error(`PDF export failed: ${res.status}`);
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
