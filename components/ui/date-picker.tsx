'use client';

import * as React from 'react';
import { CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigation, type CaptionProps } from 'react-day-picker';
import { es } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

// Fechas como 'YYYY-MM-DD' ↔ Date LOCAL. `new Date('2026-01-01')` es
// medianoche UTC = 31/12/2025 18:00 en Honduras (UTC-6): parsear a mano evita
// que el calendario muestre el día anterior.
export function isoToLocalDate(iso?: string | null): Date | undefined {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso ?? '');
  if (!m) return undefined;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

export function localDateToIso(d?: Date | null): string | undefined {
  if (!d || isNaN(d.getTime())) return undefined;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function formatDmy(iso?: string | null): string {
  const d = isoToLocalDate(iso);
  return d ? `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}` : '';
}

// Encabezado del calendario con mes y año elegibles (Select del proyecto, no
// controles nativos): saltar a 2019 no exige pasar mes por mes.
function makeCaption(fromYear: number, toYear: number) {
  return function CaptionMesAnio({ displayMonth }: CaptionProps) {
    const { goToMonth, nextMonth, previousMonth } = useNavigation();
    const years: number[] = [];
    for (let y = toYear; y >= fromYear; y--) years.push(y);
    return (
      <div className="flex items-center justify-between gap-1 pb-2">
        <Button
          type="button" variant="outline" size="icon" className="h-8 w-8 shrink-0"
          disabled={!previousMonth} onClick={() => previousMonth && goToMonth(previousMonth)}
          aria-label="Mes anterior"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="flex gap-1">
          <Select
            value={String(displayMonth.getMonth())}
            onValueChange={(v) => goToMonth(new Date(displayMonth.getFullYear(), Number(v), 1))}
          >
            <SelectTrigger size="sm" className="h-8 w-[118px]" aria-label="Mes"><SelectValue /></SelectTrigger>
            <SelectContent>
              {MESES.map((m, i) => <SelectItem key={m} value={String(i)}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select
            value={String(displayMonth.getFullYear())}
            onValueChange={(v) => goToMonth(new Date(Number(v), displayMonth.getMonth(), 1))}
          >
            <SelectTrigger size="sm" className="h-8 w-[84px]" aria-label="Año"><SelectValue /></SelectTrigger>
            <SelectContent>
              {years.map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <Button
          type="button" variant="outline" size="icon" className="h-8 w-8 shrink-0"
          disabled={!nextMonth} onClick={() => nextMonth && goToMonth(nextMonth)}
          aria-label="Mes siguiente"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    );
  };
}

export interface DatePickerProps {
  /** Fecha 'YYYY-MM-DD'. */
  value?: string | null;
  onChange: (value: string | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  /** Límites 'YYYY-MM-DD' (inclusive). */
  minDate?: string;
  maxDate?: string;
  fromYear?: number;
  toYear?: number;
  /** Permite dejar la fecha vacía (botón "Quitar fecha"). */
  clearable?: boolean;
  className?: string;
  id?: string;
}

export function DatePicker({
  value, onChange, placeholder = 'Seleccionar fecha', disabled, minDate, maxDate,
  fromYear = 2015, toYear = new Date().getFullYear() + 2, clearable = false, className, id,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const selected = isoToLocalDate(value);
  const min = isoToLocalDate(minDate);
  const max = isoToLocalDate(maxDate);
  const Caption = React.useMemo(() => makeCaption(fromYear, toYear), [fromYear, toYear]);
  const disabledDays = [
    ...(min ? [{ before: min }] : []),
    ...(max ? [{ after: max }] : []),
  ];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          ref={triggerRef}
          id={id}
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            'h-9 w-full justify-start px-3 text-left font-normal bg-background border-default-300 text-default-600 hover:bg-transparent hover:text-default-600',
            !selected && 'text-muted-foreground hover:text-muted-foreground',
            className,
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 shrink-0 opacity-60" />
          <span className="truncate">{selected ? formatDmy(value) : placeholder}</span>
        </Button>
      </PopoverTrigger>
      {/* z por encima de Dialog (z-[9999]) y Sheet: el selector se usa dentro de formularios modales. */}
      <PopoverContent
        className="w-auto p-3 z-[99999]"
        align="start"
        // Al cerrar, el foco vuelve explícitamente al botón. Si queda en <body>
        // dentro de un Dialog, el siguiente Select (Radix 1.x, con su propia
        // copia de focus-scope) entra en un bucle de foco ("Maximum call stack").
        onCloseAutoFocus={(e) => {
          e.preventDefault();
          triggerRef.current?.focus({ preventScroll: true });
        }}
      >
        <Calendar
          mode="single"
          locale={es}
          selected={selected}
          defaultMonth={selected ?? max ?? undefined}
          onSelect={(d) => {
            onChange(localDateToIso(d));
            if (d) setOpen(false);
          }}
          disabled={disabledDays}
          fromYear={fromYear}
          toYear={toYear}
          components={{ Caption }}
          initialFocus
        />
        {clearable && selected && (
          <div className="flex justify-end border-t pt-2 mt-1">
            <Button type="button" variant="ghost" size="sm" onClick={() => { onChange(undefined); setOpen(false); }}>
              Quitar fecha
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
