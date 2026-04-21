'use client';

import type { ReactNode } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { MultiSelect } from '@/components/ui/multi-select';
import { format } from 'date-fns';

// ---------------------------------------------------------------------------
// FilterField
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
// MultiSelectField
// ---------------------------------------------------------------------------

export function MultiSelectField({
  label,
  options,
  value,
  onChange,
  description,
}: {
  label: string;
  options: { value: string; label: string }[];
  value: string[];
  onChange: (v: string[]) => void;
  description?: string;
}) {
  return (
    <FilterField label={label} description={description}>
      <MultiSelect
        key={JSON.stringify(value)}
        options={options}
        defaultValue={value}
        onValueChange={onChange}
      />
    </FilterField>
  );
}

// ---------------------------------------------------------------------------
// DateRangeField
// ---------------------------------------------------------------------------

export function DateRangeField({
  label,
  value,
  onChange,
  description,
}: {
  label: string;
  value: { from?: Date; to?: Date };
  onChange: (v: { from?: Date; to?: Date }) => void;
  description?: string;
}) {
  const display =
    value.from && value.to
      ? `${format(value.from, 'PP')} — ${format(value.to, 'PP')}`
      : value.from
        ? format(value.from, 'PP')
        : 'Seleccionar rango';

  return (
    <FilterField label={label} description={description}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="w-full justify-start text-left font-normal"
          >
            {display}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="range"
            selected={value.from || value.to ? { from: value.from, to: value.to } : undefined}
            onSelect={(range) => onChange(range ?? {})}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </FilterField>
  );
}

// ---------------------------------------------------------------------------
// NumberRangeField
// ---------------------------------------------------------------------------

const parse = (s: string) => (s === '' ? undefined : Number(s));

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
