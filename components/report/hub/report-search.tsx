'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { allReports } from '@/lib/report/registry';
import { Search } from 'lucide-react';

export function ReportSearch() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm text-muted-foreground hover:border-foreground/30 w-full max-w-md"
      >
        <Search className="h-4 w-4" />
        <span>Buscar reporte…</span>
        <kbd className="ml-auto text-xs border rounded px-1">⌘K</kbd>
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="p-0 overflow-hidden">
          <Command>
            <CommandInput placeholder="Buscar por nombre, código o tema…" />
            <CommandList>
              <CommandEmpty>Sin resultados.</CommandEmpty>
              <CommandGroup heading="Reportes">
                {allReports().map((r) => (
                  <CommandItem
                    key={r.id}
                    value={`${r.code} ${r.title} ${r.subtitle}`}
                    onSelect={() => {
                      router.push(`/dashboard/reportes/${r.id}`);
                      setOpen(false);
                    }}
                  >
                    <span className="font-mono text-xs text-muted-foreground mr-2">{r.code}</span>
                    {r.title}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </DialogContent>
      </Dialog>
    </>
  );
}
