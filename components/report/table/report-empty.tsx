'use client';

import { FileSearch, Hammer } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ReportEmpty({
  onClear,
  pendingNote,
}: {
  onClear?: () => void;
  pendingNote?: string;
}) {
  // Stub: el reporte depende de un módulo que aún no existe — sugerir
  // "limpiar filtros" aquí confunde (no hay datos que filtrar).
  if (pendingNote) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-border/60">
          <Hammer className="h-5 w-5 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium text-foreground mb-1">
          Reporte pendiente de desarrollo
        </p>
        <p className="text-sm text-muted-foreground max-w-md">{pendingNote}</p>
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
