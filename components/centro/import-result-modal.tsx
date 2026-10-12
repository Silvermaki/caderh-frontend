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
  /** Personas dadas de baja que el archivo trae de vuelta (mismo registro). */
  reactivated?: number;
  updated?: number;
  deleted?: number;
  errors?: ImportRowError[];
  warnings?: ImportRowWarning[];
}

// Corrección sugerida derivada del tipo de problema. Los mensajes del backend
// ya traen el dato inválido; aquí se agrega el "cómo arreglarlo" en lenguaje
// de usuario final (el que llena el Excel no es técnico).
const SUGGESTIONS: Array<{ re: RegExp; hint: string }> = [
  // Egresados y seguimiento (primero: los mensajes llevan el nombre del joven,
  // que podría coincidir con reglas genéricas como /vive/).
  { re: /registre primero su egreso|registre primero el egreso/i, hint: 'Solo los egresados tienen seguimiento: marque primero su egreso en la pestaña Cierre de cursos.' },
  { re: /fecha de corte .* anterior a su egreso|anterior al egreso/i, hint: 'La fecha de corte debe ser igual o posterior a la fecha en que egresó.' },
  { re: /tiene seguimiento o pasant[ií]a registrados/i, hint: 'Ya tiene seguimiento: para cambiar su resultado, borre antes sus registros de seguimiento y su pasantía (desde su panel en la pestaña Seguimiento).' },
  { re: /el curso termina el/i, hint: 'El curso aún no termina: indique la fecha real de egreso o registre el egreso cuando el curso finalice.' },
  { re: /anterior al inicio del curso/i, hint: 'La fecha del resultado no puede ser anterior al inicio del curso.' },
  { re: /fecha de deserci[oó]n es obligatoria|deserci[oó]n no puede ser futura/i, hint: 'Indique la fecha (pasada) en que el joven dejó el curso.' },
  { re: /motivo de deserci[oó]n/i, hint: 'Elija el motivo de la lista: Falta de interés o decisión personal, Falta de dinero, Migró o viajó, Cambio de domicilio u Otro.' },
  { re: /resultado inválido/i, hint: 'En la columna Resultado use Egresó, Desertó o Pendiente (Pendiente quita el resultado registrado).' },
  { re: /estatus .*incompleto|estatus inválido/i, hint: 'Use un estatus de la lista desplegable: Trabajo permanente, Trabajo temporal, Emprendiendo, Estudiando, Búsqueda de empleo, En pasantía, Otro o No aplica.' },
  { re: /rango de (salario|ingreso) inválido/i, hint: 'Elija el rango de la lista desplegable de la plantilla (hoja "Listas").' },
  { re: /sin ID de matrícula|no hay matrícula activa|varias matrículas/i, hint: 'Trabaje sobre la lista descargada del sistema (trae el ID de matrícula). Si agrega filas a mano, escriba el DNI y el código del proceso exactamente.' },
  { re: /avance de la pasant[ií]a/i, hint: 'Escriba el porcentaje de avance como un número de 0 a 100.' },
  { re: /pasant[ií]a termina antes/i, hint: 'Revise las fechas de la pasantía: el fin no puede ser anterior al inicio.' },
  { re: /use s[ií] o no/i, hint: 'Escriba Sí o No.' },
  { re: /fecha.*inválida/i, hint: 'Escriba la fecha como DD/MM/AAAA (ej. 21/07/2008) o dé formato de Fecha a la celda en Excel. El año va con 4 dígitos.' },
  { re: /fecha.*fuera de rango/i, hint: 'Revise el año: la fecha debe ser real y el estudiante debe tener al menos 10 años.' },
  { re: /identidad inválida/i, hint: 'El DNI debe tener 13 dígitos (formato 0000-0000-00000). Verifique que no falte ni sobre un dígito.' },
  { re: /duplicada en el excel/i, hint: 'Hay dos filas con el mismo DNI en el archivo: elimine o corrija la fila repetida.' },
  { re: /ya existe para otro/i, hint: 'Ese DNI ya pertenece a una persona registrada en otro centro. Verifique el número.' },
  { re: /sexo inválido/i, hint: 'Use M o F (también se acepta Masculino / Femenino).' },
  // Antes que la regla de catálogos: "El detalle de la discapacidad admite hasta…".
  { re: /admite hasta \d+ caracteres/i, hint: 'El texto es demasiado largo: acórtelo hasta el máximo indicado (detalle de la discapacidad: 300 caracteres; observaciones: 1000).' },
  { re: /tipo de contrato/i, hint: 'Elija una opción de la lista: Permanente, Temporal, Por eventos o Ninguno.' },
  { re: /[áa]rea t[ée]cnica/i, hint: 'Cada curso necesita su área técnica: elíjala de la lista desplegable de la plantilla (hoja "Areas Tecnicas"), escrita igual que allí.' },
  { re: /vive/i, hint: 'Valores válidos: Padres, Solo(a), Pareja, Familiares u Otros.' },
  { re: /municipio|departamento/i, hint: 'Escriba el departamento y el municipio por nombre, como en las listas desplegables de la plantilla (no el código). El municipio debe pertenecer al departamento indicado.' },
  { re: /duraci[oó]n/i, hint: 'La duración debe ser un número entero de horas mayor que 0 (ej. 120).' },
  { re: /fecha final|final.*inicial/i, hint: 'La fecha final debe ser igual o posterior a la fecha inicial.' },
  { re: /monto/i, hint: 'El monto debe ser un número mayor que 0, sin símbolos (ej. 25000).' },
  { re: /escolaridad|etnia|discapacidad/i, hint: 'Escriba el nombre tal como aparece en la lista desplegable de la plantilla (no el código), o deje la celda vacía si no aplica.' },
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
  title,
  errorIntro,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityLabel: string;
  result: ImportResult | null;
  /** Título propio (acciones masivas que no son una importación). */
  title?: string;
  /** Texto sobre la tabla de errores (por defecto, el de importación de Excel). */
  errorIntro?: React.ReactNode;
}) {
  const errors = result?.errors ?? [];
  const warnings = result?.warnings ?? [];
  const heading = title || `Resultado de la importación de ${entityLabel}`;

  const chips = useMemo(() => {
    if (!result) return [];
    const c: Array<{ label: string; className: string; icon: React.ElementType }> = [];
    if ((result.created ?? 0) > 0) c.push({ label: `${result.created} creados`, className: 'bg-success/10 text-success', icon: CheckCircle2 });
    if ((result.reactivated ?? 0) > 0) c.push({ label: `${result.reactivated} reactivados`, className: 'bg-success/10 text-success', icon: CheckCircle2 });
    if ((result.updated ?? 0) > 0) c.push({ label: `${result.updated} actualizados`, className: 'bg-info/10 text-info', icon: CheckCircle2 });
    if ((result.deleted ?? 0) > 0) c.push({ label: `${result.deleted} eliminados`, className: 'bg-muted/40 text-muted-foreground', icon: ShieldAlert });
    if (warnings.length > 0) c.push({ label: `${warnings.length} advertencias`, className: 'bg-warning/10 text-warning', icon: AlertTriangle });
    if (errors.length > 0) c.push({ label: `${errors.length} filas con error`, className: 'bg-destructive/10 text-destructive', icon: XCircle });
    return c;
  }, [result, errors.length, warnings.length]);

  const copyDetail = async () => {
    const lines = [
      `${heading}:`,
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
          <DialogTitle>{heading}</DialogTitle>
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
              {errorIntro ?? (
                <>
                  Las siguientes filas <b>no se importaron</b>. Corríjalas en el
                  Excel y vuelva a importar el archivo completo — los registros ya
                  cargados se actualizan, no se duplican.
                </>
              )}
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
