'use client';

import { AlertTriangle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export interface MissingDbHeaderProps {
  label: string;
  note?: string;
  source?: string;
}

export function MissingDbHeader({ label, note, source }: MissingDbHeaderProps) {
  return (
    <span className="inline-flex items-center gap-1.5">
      {label}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span
              aria-label="Columna pendiente de captura"
              className="text-amber-600"
            >
              <AlertTriangle className="h-3.5 w-3.5" />
            </span>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p className="font-semibold mb-1">Columna pendiente de captura.</p>
            {note && <p className="text-xs mb-1">{note}</p>}
            {source && <p className="text-xs">Origen previsto: <b>{source}</b>.</p>}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </span>
  );
}
