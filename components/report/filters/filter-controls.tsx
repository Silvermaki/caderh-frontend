'use client';

import type { ReactNode } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { MultiSelect } from '@/components/ui/multi-select';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// ---------------------------------------------------------------------------
// FilterField (wrapper)
// ---------------------------------------------------------------------------

export function FilterField({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium">{label}</label>
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// SingleSelectField — value: string
// ---------------------------------------------------------------------------

// Opción "sin filtro" del Select (Radix no admite value=""): se traduce a ''.
const NONE = '__none__';

export function SingleSelectField({
  label,
  options,
  value,
  onChange,
  description,
  placeholder = 'Seleccionar…',
  clearLabel,
}: {
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
  description?: string;
  placeholder?: string;
  /** Si se da, agrega una primera opción que quita el filtro (p. ej. "Todos los años"). */
  clearLabel?: string;
}) {
  return (
    <FilterField label={label} description={description}>
      <Select
        value={value || (clearLabel ? NONE : undefined)}
        onValueChange={(v) => onChange(v === NONE ? '' : v)}
      >
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {clearLabel && <SelectItem value={NONE}>{clearLabel}</SelectItem>}
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FilterField>
  );
}

// ---------------------------------------------------------------------------
// MultiSelectField — value: string[]
// ---------------------------------------------------------------------------

export function MultiSelectField({
  label,
  options,
  value,
  onChange,
  description,
  placeholder = 'Todos',
}: {
  label: string;
  options: { value: string; label: string }[];
  value: string[];
  onChange: (v: string[]) => void;
  description?: string;
  placeholder?: string;
}) {
  return (
    <FilterField label={label} description={description}>
      <MultiSelect
        key={`${label}-${options.length}`}
        options={options}
        defaultValue={value}
        onValueChange={onChange}
        placeholder={placeholder}
        modalPopover
      />
    </FilterField>
  );
}

// ---------------------------------------------------------------------------
// DateRangeField — value: {from?, to?} como 'YYYY-MM-DD'
// "Desde" y "Hasta" por separado, con mes/año elegibles y atajos: elegir
// varios años (pedido CADERH 18/08 para R2) no exige recorrer mes por mes.
// ---------------------------------------------------------------------------

function yearRange(y: number) {
  return { from: `${y}-01-01`, to: `${y}-12-31` };
}

export function DateRangeField({
  label,
  value,
  onChange,
  description,
}: {
  label: string;
  value: { from?: string; to?: string };
  onChange: (v: { from?: string; to?: string }) => void;
  description?: string;
}) {
  const y = new Date().getFullYear();
  const presets = [
    { label: 'Este año', range: yearRange(y) },
    { label: 'Año pasado', range: yearRange(y - 1) },
    { label: `${y - 1}–${y}`, range: { from: `${y - 1}-01-01`, to: `${y}-12-31` } },
  ];
  return (
    <FilterField label={label} description={description}>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <span className="text-xs text-muted-foreground">Desde</span>
          <DatePicker
            value={value.from}
            maxDate={value.to}
            clearable
            placeholder="Sin límite"
            onChange={(v) => onChange({ ...value, from: v })}
          />
        </div>
        <div className="space-y-1">
          <span className="text-xs text-muted-foreground">Hasta</span>
          <DatePicker
            value={value.to}
            minDate={value.from}
            clearable
            placeholder="Sin límite"
            onChange={(v) => onChange({ ...value, to: v })}
          />
        </div>
      </div>
      <div className="flex flex-wrap gap-1 pt-1">
        {presets.map((p) => {
          const active = value.from === p.range.from && value.to === p.range.to;
          return (
            <Button
              key={p.label}
              type="button"
              size="sm"
              variant={active ? undefined : 'outline'}
              className="h-7 px-2 text-xs"
              onClick={() => onChange(p.range)}
            >
              {p.label}
            </Button>
          );
        })}
        {(value.from || value.to) && (
          <Button type="button" size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => onChange({})}>
            Todo el período
          </Button>
        )}
      </div>
    </FilterField>
  );
}

// ---------------------------------------------------------------------------
// DateField — value: 'YYYY-MM-DD'
// ---------------------------------------------------------------------------

export function DateField({
  label,
  value,
  onChange,
  description,
  placeholder,
}: {
  label: string;
  value?: string;
  onChange: (v: string | undefined) => void;
  description?: string;
  placeholder?: string;
}) {
  return (
    <FilterField label={label} description={description}>
      <DatePicker value={value} onChange={onChange} clearable placeholder={placeholder} />
    </FilterField>
  );
}

// ---------------------------------------------------------------------------
// NumberRangeField — value: {min?, max?}
// ---------------------------------------------------------------------------

const parse = (s: string) => (s === '' ? undefined : Number(s));
// Nota: los <Input type="number"> del rango de edad son el control del
// proyecto para números (shadcn Input), no un select nativo.

export function NumberRangeField({
  label,
  value,
  onChange,
  description,
}: {
  label: string;
  value: { min?: number; max?: number };
  onChange: (v: { min?: number; max?: number }) => void;
  description?: string;
}) {
  return (
    <FilterField label={label} description={description}>
      <div className="flex gap-1">
        <Input
          type="number"
          placeholder="Min"
          value={value.min ?? ''}
          onChange={(e) => onChange({ ...value, min: parse(e.target.value) })}
        />
        <Input
          type="number"
          placeholder="Max"
          value={value.max ?? ''}
          onChange={(e) => onChange({ ...value, max: parse(e.target.value) })}
        />
      </div>
    </FilterField>
  );
}
