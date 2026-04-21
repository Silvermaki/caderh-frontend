'use client';

import { Save, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface ReportHeaderProps {
  title: string;
  subtitle?: string;
  onClear?: () => void;
  exportMenu?: React.ReactNode;
}

export function ReportHeader({ title, subtitle, onClear, exportMenu }: ReportHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-4">
      <div>
        <h1 className="text-2xl font-bold leading-tight">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
      </div>
      <div className="flex gap-2">
        <Button variant="ghost" size="sm" disabled title="Disponible en fase 2">
          <Save className="h-4 w-4 mr-1" /> Guardar vista
        </Button>
        <Button variant="outline" size="sm" onClick={onClear}>
          <RotateCcw className="h-4 w-4 mr-1" /> Limpiar
        </Button>
        {exportMenu}
      </div>
    </div>
  );
}
