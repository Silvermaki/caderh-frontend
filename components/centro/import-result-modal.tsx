'use client';

import { useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle2, AlertTriangle, XCircle, Copy, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';

export interface ImportRowError {
  row?: number | null;
  message: string;
}

export interface ImportRowWarning {
  id?: number | string | null;
  message: string;
}

export interface ImportResult {
  created?: number;
  updated?: number;
  deleted?: number;
  errors?: ImportRowError[];
  warnings?: ImportRowWarning[];
}

// Corrección sugerida derivada del tipo de problema. Los mensajes del backend
// ya traen el dato inválido; aquí se agrega el "cómo arreglarlo" en lenguaje
// de usuario final (el que llena el Excel no es técnico).
const SUGGESTIONS: Array<{ re: RegExp; hint: string }> = [
  { re: /fecha.*inválida/i, hint: 'Escriba la fecha como DD/MM/AAAA (ej. 21/07/2008) o dé formato de Fecha a la celda en Excel. El año va con 4 dígitos.' },
  { re: /fecha.*fuera de rango/i, hint: 'Revise el año: la fecha debe ser real y el estudiante debe tener al menos 10 años.' },
  { re: /identidad inválida/i, hint: 'El DNI debe tener 13 dígitos (formato 0000-0000-00000). Verifique que no falte ni sobre un dígito.' },
  { re: /duplicada en el excel/i, hint: 'Hay dos filas con el mismo DNI en el archivo: elimine o corrija la fila repetida.' },
  { re: /ya existe para otro/i, hint: 'Ese DNI ya pertenece a una persona registrada en otro centro. Verifique el número.' },
  { re: /sexo inválido/i, hint: 'Use M o F (también se acepta Masculino / Femenino).' },
  { re: /vive/i, hint: 'Valores válidos: Padres, Solo(a), Pareja, Familiares u Otros.' },
  { re: /municipio|departamento/i, hint: 'Verifique que el municipio pertenezca al departamento indicado (use los códigos de la hoja de catálogos).' },
  { re: /duraci[oó]n/i, hint: 'La duración debe ser un número entero de horas mayor que 0 (ej. 120).' },
  { re: /fecha final|final.*inicial/i, hint: 'La fecha final debe ser igual o posterior a la fecha inicial.' },
  { re: /monto/i, hint: 'El monto debe ser un número mayor que 0, sin símbolos (ej. 25000).' },
  { re: /escolaridad|etnia|discapacidad/i, hint: 'Use el código numérico del catálogo (vea la hoja de catálogos de la plantilla).' },
];

function suggestionFor(message: string): string {
  return SUGGESTIONS.find((s) => s.re.test(message))?.hint
    ?? 'Corrija el dato en el Excel y vuelva a importar el archivo.';
}

export function ImportResultModal({
  open,
  onOpenChange,
  entityLabel,
  result,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityLabel: string;
  result: ImportResult | null;
}) {
  const errors = result?.errors ?? [];
  const warnings = result?.warnings ?? [];

  const chips = useMemo(() => {
    if (!result) return [];
    const c: Array<{ label: string; className: string; icon: React.ElementType }> = [];
    if ((result.created ?? 0) > 0) c.push({ label: `${result.created} creados`, className: 'bg-success/10 text-success', icon: CheckCircle2 });
    if ((result.updated ?? 0) > 0) c.push({ label: `${result.updated} actualizados`, className: 'bg-info/10 text-info', icon: CheckCircle2 });
    if ((result.deleted ?? 0) > 0) c.push({ label: `${result.deleted} eliminados`, className: 'bg-muted/40 text-muted-foreground', icon: ShieldAlert });
    if (warnings.length > 0) c.push({ label: `${warnings.length} advertencias`, className: 'bg-warning/10 text-warning', icon: AlertTriangle });
    if (errors.length > 0) c.push({ label: `${errors.length} filas con error`, className: 'bg-destructive/10 text-destructive', icon: XCircle });
    return c;
  }, [result, errors.length, warnings.length]);

  const copyDetail = async () => {
    const lines = [
      `Resultado de importación de ${entityLabel}:`,
      ...chips.map((c) => `- ${c.label}`),
      ...(errors.length ? ['', 'Errores:'] : []),
      ...errors.map((e) => `  ${e.row != null ? `Fila ${e.row}: ` : ''}${e.message}`),
      ...(warnings.length ? ['', 'Advertencias:'] : []),
      ...warnings.map((w) => `  ${w.message}`),
    ];
    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      toast.success('Detalle copiado al portapapeles');
    } catch {
      toast.error('No se pudo copiar');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="4xl">
        <DialogHeader>
          <DialogTitle>Resultado de la importación de {entityLabel}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-wrap items-center gap-2">
          {chips.map((c) => {
            const Icon = c.icon;
            return (
              <span key={c.label} className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${c.className}`}>
                <Icon className="h-3.5 w-3.5" />
                {c.label}
              </span>
            );
          })}
        </div>

        {errors.length > 0 && (
          <div className="mt-2">
            <p className="text-sm text-muted-foreground mb-2">
              Las siguientes filas <b>no se importaron</b>. Corríjalas en el
              Excel y vuelva a importar el archivo completo — los registros ya
              cargados se actualizan, no se duplican.
            </p>
            <div className="max-h-[55vh] overflow-y-auto rounded-md border border-border">
              <table className="w-full text-sm table-fixed">
                <thead className="sticky top-0 bg-card">
                  <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-3 py-2 text-left w-16">Fila</th>
                    <th className="px-3 py-2 text-left w-[45%]">Problema</th>
                    <th className="px-3 py-2 text-left">Corrección sugerida</th>
                  </tr>
                </thead>
                <tbody>
                  {errors.map((e, i) => (
                    <tr key={i} className="border-b border-border/60 align-top">
                      <td className="px-3 py-2 tabular-nums font-medium">
                        {e.row != null ? e.row : '—'}
                      </td>
                      <td className="px-3 py-2 text-foreground break-words">{e.message}</td>
                      <td className="px-3 py-2 text-muted-foreground break-words">{suggestionFor(e.message)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {warnings.length > 0 && (
          <div className="mt-2 rounded-md border border-warning/40 bg-warning/5 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-warning mb-1.5">
              Advertencias
            </p>
            <ul className="space-y-1 text-sm text-foreground">
              {warnings.map((w, i) => (
                <li key={i}>• {w.message}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-3 flex items-center justify-between">
          <Button variant="outline" size="sm" onClick={copyDetail}>
            <Copy className="h-4 w-4 mr-2" />
            Copiar detalle
          </Button>
          <Button size="sm" onClick={() => onOpenChange(false)}>Entendido</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
