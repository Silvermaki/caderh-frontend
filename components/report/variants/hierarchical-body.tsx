'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import type { ColumnDef } from '@/lib/report/types';

export interface HierarchicalGroup<TRow> {
  key: string;
  label: string;
  totals?: Partial<Record<string, number | string>>;
  children: Array<HierarchicalGroup<TRow> | TRow>;
}

export function HierarchicalBody<TRow>({
  groups, columns,
}: {
  groups: HierarchicalGroup<TRow>[];
  columns: ColumnDef<TRow>[];
}) {
  return <tbody>{groups.map((g, i) => <GroupRow key={g.key + i} group={g} columns={columns} depth={0} />)}</tbody>;
}

function GroupRow<TRow>({
  group, columns, depth,
}: {
  group: HierarchicalGroup<TRow>;
  columns: ColumnDef<TRow>[];
  depth: number;
}) {
  const [open, setOpen] = useState(true);
  return (
    <>
      <tr className="bg-primary/5 font-semibold text-primary">
        <td className="px-2 py-1.5" colSpan={1}>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="inline-flex items-center gap-1"
            style={{ paddingLeft: `${depth * 16}px` }}
          >
            {open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            {group.label}
          </button>
        </td>
        {columns.slice(1).map((c) => (
          <td key={c.key} className={`px-2 py-1.5 text-${c.align ?? 'left'} tabular-nums`}>
            {group.totals?.[c.key] ?? ''}
          </td>
        ))}
      </tr>
      {open &&
        group.children.map((child, i) => {
          if ('children' in (child as any)) {
            return (
              <GroupRow
                key={i}
                group={child as HierarchicalGroup<TRow>}
                columns={columns}
                depth={depth + 1}
              />
            );
          }
          const row = child as TRow;
          return (
            <tr key={i}>
              {columns.map((c) => (
                <td
                  key={c.key}
                  className={`px-2 py-1.5 text-${c.align ?? 'left'} tabular-nums`}
                  style={c === columns[0] ? { paddingLeft: `${(depth + 1) * 16}px` } : undefined}
                >
                  {c.render ? c.render(row) : String((row as any)[c.key] ?? '')}
                </td>
              ))}
            </tr>
          );
        })}
    </>
  );
}
