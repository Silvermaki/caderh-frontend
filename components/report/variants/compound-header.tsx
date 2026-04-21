import type { AnyColumn, ColumnDef, CompoundColumnDef } from '@/lib/report/types';
import { MissingDbHeader } from '../missing-db/missing-db-header';

function isCompound<T>(c: AnyColumn<T>): c is CompoundColumnDef<T> {
  return 'group' in c;
}

function renderLabel<T>(c: ColumnDef<T>) {
  if (c.missingInDb) {
    return <MissingDbHeader label={c.label} note={c.missingNote} source={c.plannedSource} />;
  }
  return c.label;
}

export function CompoundHeader<TRow>({ columns }: { columns: AnyColumn<TRow>[] }) {
  const hasGroups = columns.some(isCompound);

  if (!hasGroups) {
    return (
      <thead>
        <tr>
          {columns.map((c) => {
            const col = c as ColumnDef<TRow>;
            return (
              <th key={col.key} className="px-2 py-2 text-left text-xs uppercase tracking-wide text-muted-foreground bg-muted/40 border-b">
                {renderLabel(col)}
              </th>
            );
          })}
        </tr>
      </thead>
    );
  }

  return (
    <thead>
      <tr>
        {columns.map((c, i) => {
          if (isCompound(c)) {
            return (
              <th
                key={c.group + i}
                colSpan={c.children.length}
                className="px-2 py-2 text-center text-xs uppercase tracking-wide text-muted-foreground bg-muted/40 border-b border-r"
              >
                {c.group}
              </th>
            );
          }
          return (
            <th
              key={c.key}
              rowSpan={2}
              className="px-2 py-2 text-left text-xs uppercase tracking-wide text-muted-foreground bg-muted/40 border-b align-bottom"
            >
              {renderLabel(c)}
            </th>
          );
        })}
      </tr>
      <tr>
        {columns.flatMap((c) =>
          isCompound(c)
            ? c.children.map((sub) => (
                <th key={sub.key} className={`px-2 py-1.5 text-${sub.align ?? 'left'} text-xs uppercase tracking-wide text-muted-foreground bg-muted/40 border-b`}>
                  {renderLabel(sub)}
                </th>
              ))
            : []
        )}
      </tr>
    </thead>
  );
}
