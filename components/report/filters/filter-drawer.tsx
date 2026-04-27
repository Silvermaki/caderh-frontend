'use client';

import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';

export interface FilterDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApply: () => void;
  onClearAll: () => void;
  activeCount: number;
  children: React.ReactNode;
}

export function FilterDrawer({
  open, onOpenChange, onApply, onClearAll, activeCount, children,
}: FilterDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-[320px] p-0 flex flex-col">
        <SheetHeader className="p-4 border-b">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-base font-semibold">
              Filtros
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                ({activeCount} activos)
              </span>
            </SheetTitle>
            <button
              type="button"
              onClick={onClearAll}
              className="text-xs text-destructive hover:underline"
            >
              Limpiar todo
            </button>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto">{children}</div>

        <div className="p-3 border-t flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={onApply}>Aplicar</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
