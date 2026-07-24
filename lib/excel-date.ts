/**
 * Normaliza un valor de celda de Excel a fecha ISO 'YYYY-MM-DD'.
 *
 * Acepta las cuatro formas en que una fecha puede llegar de un .xlsx:
 *  - Date (cuando el lector entrega fechas reales)
 *  - número serial de Excel (época 1899-12-30)
 *  - texto ISO 'YYYY-MM-DD'
 *  - texto D/M/AAAA o DD-MM-AAAA — SIEMPRE día primero (convención hondureña)
 *
 * Años de 2 dígitos y fechas imposibles devuelven null (mejor un error
 * visible que una fecha adivinada). Espejo de toDateOnly del backend.
 */
export function excelValueToIsoDate(value: unknown): string | null {
  if (value === null || value === undefined || value === '') return null;

  const pad2 = (n: number) => String(n).padStart(2, '0');

  if (value instanceof Date) {
    if (isNaN(value.getTime())) return null;
    // Ancla UTC-medianoche (Date.UTC) vs local-medianoche (lectores Excel):
    // usar los getters equivocados corre el día en UTC-6 (Honduras).
    if (value.getUTCHours() === 0 && value.getUTCMinutes() === 0) {
      return `${value.getUTCFullYear()}-${pad2(value.getUTCMonth() + 1)}-${pad2(value.getUTCDate())}`;
    }
    return `${value.getFullYear()}-${pad2(value.getMonth() + 1)}-${pad2(value.getDate())}`;
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    if (value < 367 || value > 73415) return null; // rango sano ≈ 1901..2100
    const d = new Date(Math.round((value - 25569) * 86400000));
    return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`;
  }

  const s = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
    const iso = s.slice(0, 10);
    const [y, m, d] = iso.split('-').map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d));
    if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) return null;
    return iso;
  }

  const dmy = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/);
  if (dmy) {
    const d = Number(dmy[1]);
    const m = Number(dmy[2]);
    const y = Number(dmy[3]);
    const dt = new Date(Date.UTC(y, m - 1, d));
    if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) return null;
    return `${y}-${pad2(m)}-${pad2(d)}`;
  }
  return null;
}
