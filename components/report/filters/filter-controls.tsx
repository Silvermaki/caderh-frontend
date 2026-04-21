'use client';

import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import { MultiSelect } from '@/components/ui/multi-select';
import type { DateRange } from 'react-day-picker';

export function FilterField({
  label, children,
}: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <Label className="text-[11px] text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

export interface OptionItem { value: string; label: string }

export function MultiSelectField({
  label, value, onChange, options, placeholder = 'Todos',
}: {
  label: string;
  value: string[];
  onChange: (v: string[]) => void;
  options: OptionItem[];
  placeholder?: string;
}) {
  return (
    <FilterField label={label}>
      <MultiSelect
        key={JSON.stringify(value)}
        options={options}
        defaultValue={value}
        onValueChange={onChange}
        placeholder={placeholder}
      />
    </FilterField>
  );
}

export function DateRangeField({
  label, from, to, onChange,
}: {
  label: string;
  from: string;
  to: string;
  onChange: (from: string, to: string) => void;
}) {
  const display = from && to ? `${from} — ${to}` : 'Seleccionar rango';
  const selected: DateRange | undefined =
    from && to ? { from: new Date(from), to: new Date(to) } : undefined;

  return (
    <FilterField label={label}>
      <Popover>
        <PopoverTrigger asChild>
          <button type="button" className="border rounded-md px-2 py-1.5 text-sm bg-background text-left">
            {display}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="range"
            selected={selected}
            onSelect={(range: DateRange | undefined) => {
              if (range?.from && range?.to) {
                onChange(
                  range.from.toISOString().slice(0, 10),
                  range.to.toISOString().slice(0, 10),
                );
              }
            }}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </FilterField>
  );
}

export function NumberRangeField({
  label, min, max, onChange,
}: {
  label: string;
  min: number | '';
  max: number | '';
  onChange: (min: number | '', max: number | '') => void;
}) {
  return (
    <FilterField label={label}>
      <div className="flex gap-1">
        <Input
          type="number"
          placeholder="Min"
          value={min}
          onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value), max)}
        />
        <Input
          type="number"
          placeholder="Max"
          value={max}
          onChange={(e) => onChange(min, e.target.value === '' ? '' : Number(e.target.value))}
        />
      </div>
    </FilterField>
  );
}
