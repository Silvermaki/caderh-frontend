'use client';

import { FileSearch } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ReportEmpty({ onClear }: { onClear?: () => void }) {
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
