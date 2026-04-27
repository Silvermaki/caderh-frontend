import ExcelJS from 'exceljs';
import type { ColumnDef } from '@/lib/report/types';

// CADERH brand colors — darker teal palette for professional look + contrast
const CADERH_TEAL_DARK = '0F7A7A';   // primary brand: deep teal (banner + headers, white text reads well)
const CADERH_TEAL_MID  = '1A8B8B';   // mid-tone for emphasis
const CADERH_TEAL_SOFT = 'E6F4F4';   // very soft teal for footer subheadings
const CADERH_GREEN     = '04BB36';   // success / positive accent
const ZEBRA_GREY       = 'F7FAFA';   // very subtle zebra fill
const TEXT_DARK        = '1F2937';
const MUTED            = '6B7280';

const LOGO_PATH = '/resources/logo_caderh-1.png';

export interface BuildWorkbookArgs<TRow> {
  title: string;
  code?: string;
  subtitle?: string;
  columns: ColumnDef<TRow>[];
  rows: TRow[];
  filtersApplied: Record<string, any>;
  missingColumns: string[];
  /** Optional PNG dataURL of the chart to embed above the table. */
  chartImage?: string;
}

function isCurrencyColumn(c: ColumnDef<any>): boolean {
  const k = c.key.toLowerCase();
  return /(presupuesto|monto|desembols|donac|overhead|saldo|ejecutado|ingreso|gasto|kit|estipendio|total)/.test(k)
    && !/(pct|porcent|%|count|cantidad|hombres|mujeres|formacion)/.test(k);
}

function isPercentColumn(c: ColumnDef<any>): boolean {
  return /(pct|porcent|%)/i.test(c.key);
}

function isNumericValue(v: any): boolean {
  return typeof v === 'number' && Number.isFinite(v);
}

async function fetchLogoBuffer(): Promise<ArrayBuffer | null> {
  try {
    const res = await fetch(LOGO_PATH);
    if (!res.ok) return null;
    return await res.arrayBuffer();
  } catch {
    return null;
  }
}

export async function buildWorkbook<TRow>({
  title, code, subtitle, columns, rows, filtersApplied, missingColumns, chartImage,
}: BuildWorkbookArgs<TRow>): Promise<ExcelJS.Workbook> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'CADERH ERP';
  wb.created = new Date();

  const ws = wb.addWorksheet(title.slice(0, 31), {
    views: [{ state: 'frozen', ySplit: 6, xSplit: 0 }],
    properties: { defaultRowHeight: 18 },
  });

  const colCount = columns.length;
  const lastColLetter = numberToColumnLetter(colCount);

  // Reserve rows 1-3 for the banner with enough height for a non-squashed logo
  // Excel row height unit ≈ 0.75pt ≈ 1px, so 36 ≈ 36px each → 108px total banner
  ws.getRow(1).height = 36;
  ws.getRow(2).height = 36;
  ws.getRow(3).height = 36;
  ws.getRow(4).height = 8;
  // Column A is reserved for the wordmark logo. ExcelJS column width 50 ≈ 350px
  // with Calibri 11 — wide enough to fit the 314px-wide logo with margin so it
  // does not bleed into the banner cell starting at column B.
  ws.getColumn(1).width = 50;

  // ----- Logo -----
  const logoBuf = await fetchLogoBuffer();
  let imageId: number | null = null;
  if (logoBuf) {
    imageId = wb.addImage({ buffer: logoBuf as any, extension: 'png' });
    // Source PNG is 721×161 (CADERH wordmark, landscape — aspect ratio ≈ 4.48:1).
    // Forcing a non-matching ratio (e.g. 100×100) is what was making the logo look
    // squashed. Derive width from the real ratio so it stays in proportion.
    const logoHeight = 70;
    const logoWidth = Math.round(logoHeight * (721 / 161)); // ≈ 314px
    ws.addImage(imageId, {
      tl: { col: 0.08, row: 0.5 },
      ext: { width: logoWidth, height: logoHeight },
      editAs: 'oneCell',
    });
  }

  // ----- Banner row 1: brand strip -----
  ws.mergeCells(`B1:${lastColLetter}1`);
  const bandCell = ws.getCell('B1');
  bandCell.value = 'CADERH · Sistema Estadístico ERP';
  bandCell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
  bandCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
  bandCell.fill = {
    type: 'pattern', pattern: 'solid',
    fgColor: { argb: `FF${CADERH_TEAL_DARK}` },
  };

  // ----- Banner row 2: report title -----
  ws.mergeCells(`B2:${lastColLetter}2`);
  const titleCell = ws.getCell('B2');
  titleCell.value = code ? `${code} · ${title}` : title;
  titleCell.font = { name: 'Calibri', size: 16, bold: true, color: { argb: `FF${TEXT_DARK}` } };
  titleCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };

  // ----- Banner row 3: subtitle + generated date -----
  ws.mergeCells(`B3:${lastColLetter}3`);
  const subCell = ws.getCell('B3');
  const generatedDate = new Date().toLocaleDateString('es-HN', { year: 'numeric', month: 'long', day: 'numeric' });
  subCell.value = `${subtitle ? subtitle + '  ·  ' : ''}Generado: ${generatedDate}`;
  subCell.font = { name: 'Calibri', size: 10, italic: true, color: { argb: `FF${MUTED}` } };
  subCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };

  // ----- Header row 5 -----
  const headerRowIdx = 5;
  const headerRow = ws.getRow(headerRowIdx);
  headerRow.height = 26;
  columns.forEach((c, i) => {
    const cell = headerRow.getCell(i + 1);
    cell.value = c.label;
    cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.alignment = {
      vertical: 'middle',
      horizontal: c.align === 'right' ? 'right' : c.align === 'center' ? 'center' : 'left',
      wrapText: true,
    };
    cell.fill = {
      type: 'pattern', pattern: 'solid',
      fgColor: { argb: `FF${CADERH_TEAL_DARK}` },
    };
    cell.border = {
      top:    { style: 'thin', color: { argb: 'FFFFFFFF' } },
      bottom: { style: 'medium', color: { argb: `FF${CADERH_TEAL_DARK}` } },
      left:   { style: 'thin', color: { argb: 'FFFFFFFF' } },
      right:  { style: 'thin', color: { argb: 'FFFFFFFF' } },
    };
  });

  // ----- Data rows -----
  let cursor = headerRowIdx + 1;
  rows.forEach((row, rIdx) => {
    const dataRow = ws.getRow(cursor + rIdx);
    dataRow.height = 18;
    columns.forEach((c, cIdx) => {
      const cell = dataRow.getCell(cIdx + 1);
      const raw = c.missingInDb ? null : (row as any)[c.key];

      if (raw === null || raw === undefined || raw === '') {
        cell.value = c.missingInDb ? '—' : '';
      } else if (isNumericValue(raw)) {
        cell.value = raw;
        if (isCurrencyColumn(c)) {
          cell.numFmt = '"L "#,##0.00';
        } else if (isPercentColumn(c)) {
          // raw is already a percent value (e.g. 75.5), use a number format with %
          cell.numFmt = '0.0"%"';
        } else {
          cell.numFmt = '#,##0';
        }
      } else {
        cell.value = String(raw);
      }

      cell.font = { name: 'Calibri', size: 10, color: { argb: `FF${TEXT_DARK}` } };
      cell.alignment = {
        vertical: 'middle',
        horizontal: c.align === 'right' ? 'right' : c.align === 'center' ? 'center' : 'left',
      };
      cell.border = {
        bottom: { style: 'hair', color: { argb: 'FFE5E7EB' } },
      };
      // zebra
      if (rIdx % 2 === 1) {
        cell.fill = {
          type: 'pattern', pattern: 'solid',
          fgColor: { argb: `FF${ZEBRA_GREY}` },
        };
      }
    });
  });
  cursor += rows.length;

  // Auto-ish column widths (cap at 40)
  columns.forEach((c, i) => {
    const headerLen = (c.label || '').length;
    let maxLen = headerLen;
    for (const r of rows) {
      const v = (r as any)[c.key];
      if (v !== null && v !== undefined) {
        const s = String(v);
        if (s.length > maxLen) maxLen = s.length;
      }
    }
    const width = Math.min(Math.max(maxLen + 4, 12), 40);
    // Preserve the wider column A reserved for the logo banner (must match the
    // value set above so the logo does not overflow into column B).
    ws.getColumn(i + 1).width = i === 0 && !!logoBuf ? 50 : width;
  });

  // ----- Footer: filters + missing cols -----
  cursor += 1; // blank row
  if (Object.keys(filtersApplied ?? {}).length > 0) {
    const filtersHeader = ws.getRow(cursor);
    const cell = filtersHeader.getCell(1);
    cell.value = 'Filtros aplicados';
    cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: `FF${TEXT_DARK}` } };
    cell.fill = {
      type: 'pattern', pattern: 'solid',
      fgColor: { argb: `FF${CADERH_TEAL_SOFT}` },
    };
    ws.mergeCells(`A${cursor}:${lastColLetter}${cursor}`);
    cursor += 1;
    for (const [k, v] of Object.entries(filtersApplied)) {
      const r = ws.getRow(cursor);
      r.getCell(1).value = k;
      r.getCell(2).value = formatFilterValue(v);
      r.getCell(1).font = { name: 'Calibri', size: 10, bold: true, color: { argb: `FF${MUTED}` } };
      r.getCell(2).font = { name: 'Calibri', size: 10, color: { argb: `FF${TEXT_DARK}` } };
      cursor += 1;
    }
    cursor += 1;
  }

  if (missingColumns.length > 0) {
    const r = ws.getRow(cursor);
    const cell = r.getCell(1);
    cell.value = `Nota: ${missingColumns.length} columna(s) pendiente(s) de captura en el sistema`;
    cell.font = { name: 'Calibri', size: 10, bold: true, italic: true, color: { argb: 'FF92400E' } };
    cell.fill = {
      type: 'pattern', pattern: 'solid',
      fgColor: { argb: 'FFFEF3C7' },
    };
    ws.mergeCells(`A${cursor}:${lastColLetter}${cursor}`);
    cursor += 1;
    for (const k of missingColumns) {
      const dr = ws.getRow(cursor);
      dr.getCell(1).value = `· ${k}`;
      dr.getCell(1).font = { name: 'Calibri', size: 9, italic: true, color: { argb: `FF${MUTED}` } };
      cursor += 1;
    }
    cursor += 1;
  }

  // ----- Embed chart (Onda 3) -----
  if (chartImage) {
    try {
      const imageBuf = dataUrlToArrayBuffer(chartImage);
      if (imageBuf) {
        const chartId = wb.addImage({ buffer: imageBuf as any, extension: 'png' });
        cursor += 1;
        const chartHeader = ws.getRow(cursor);
        const cell = chartHeader.getCell(1);
        cell.value = 'Visualización';
        cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: `FF${TEXT_DARK}` } };
        cell.fill = {
          type: 'pattern', pattern: 'solid',
          fgColor: { argb: `FF${CADERH_TEAL_SOFT}` },
        };
        ws.mergeCells(`A${cursor}:${lastColLetter}${cursor}`);
        cursor += 1;
        ws.addImage(chartId, {
          tl: { col: 0, row: cursor - 1 },
          ext: { width: 720, height: 320 },
          editAs: 'oneCell',
        });
        // reserve space below
        for (let i = 0; i < 18; i++) {
          ws.getRow(cursor + i).height = 18;
        }
      }
    } catch {
      // silently skip chart embedding on failure
    }
  }

  return wb;
}

export async function downloadWorkbook(wb: ExcelJS.Workbook, filename: string): Promise<void> {
  const buf = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function numberToColumnLetter(n: number): string {
  let s = '';
  while (n > 0) {
    const m = (n - 1) % 26;
    s = String.fromCharCode(65 + m) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

function formatFilterValue(v: unknown): string {
  if (Array.isArray(v)) return v.join(', ');
  if (v && typeof v === 'object') return JSON.stringify(v);
  return String(v ?? '');
}

function dataUrlToArrayBuffer(dataUrl: string): ArrayBuffer | null {
  const m = /^data:image\/\w+;base64,(.+)$/.exec(dataUrl);
  if (!m) return null;
  const binary = atob(m[1]);
  const len = binary.length;
  const buf = new ArrayBuffer(len);
  const view = new Uint8Array(buf);
  for (let i = 0; i < len; i++) view[i] = binary.charCodeAt(i);
  return buf;
}
