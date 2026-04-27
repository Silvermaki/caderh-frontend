'use client';

import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export interface ExportMenuProps {
  disabled?: boolean;
  onExport: (kind: 'xlsx' | 'pdf' | 'csv') => void;
}

export function ExportMenu({ disabled, onExport }: ExportMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" disabled={disabled}>
          <Download className="h-4 w-4 mr-1" /> Exportar
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onExport('xlsx')}>Excel (.xlsx)</DropdownMenuItem>
        <DropdownMenuItem onClick={() => onExport('pdf')}>PDF</DropdownMenuItem>
        <DropdownMenuItem onClick={() => onExport('csv')}>CSV</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
