'use client';

import Link from 'next/link';
import { CalendarClock, FileSearch, Inbox } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { DataNotice } from '@/lib/report/types';

const ICON_RING = 'mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-border/60';

export function ReportEmpty({
  onClear,
  notice,
  comingSoon,
}: {
  onClear?: () => void;
  /** Por qué no hay datos cuando la causa no son los filtros (limpiarlos no ayudaría). */
  notice?: DataNotice | null;
  /** Reporte aún sin datos de origen: qué mostrará. */
  comingSoon?: string;
}) {
  if (comingSoon) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className={ICON_RING}>
          <CalendarClock className="h-5 w-5 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium text-foreground mb-1">Próximamente</p>
        <p className="text-sm text-muted-foreground max-w-md">{comingSoon}</p>
      </div>
    );
  }
  if (notice) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className={ICON_RING}>
          <Inbox className="h-5 w-5 text-muted-foreground" />
        </div>
        {notice.title && (
          <p className="text-sm font-medium text-foreground mb-1">{notice.title}</p>
        )}
        <p className="text-sm text-muted-foreground max-w-md mb-4">{notice.text}</p>
        {notice.action && (
          <Button asChild>
            <Link href={notice.action.href}>{notice.action.label}</Link>
          </Button>
        )}
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <FileSearch className="h-10 w-10 text-muted-foreground/60 mb-3" />
      <p className="text-sm text-muted-foreground mb-4">
        No hay resultados con estos filtros.
      </p>
      {onClear && <Button onClick={onClear}>Limpiar filtros</Button>}
    </div>
  );
}
