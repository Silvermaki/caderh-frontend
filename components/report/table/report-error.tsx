'use client';

import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ReportError({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center border border-destructive/30 bg-destructive/5 rounded-lg">
      <AlertTriangle className="h-10 w-10 text-destructive mb-3" />
      <p className="text-sm text-foreground mb-4">
        No se pudo cargar el reporte. Intentá de nuevo en un momento.
      </p>
      {onRetry && <Button color="destructive" onClick={onRetry}>Reintentar</Button>}
    </div>
  );
}
