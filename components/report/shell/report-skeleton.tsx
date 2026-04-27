import { cn } from '@/lib/utils';

export function ReportSkeleton({ rows = 8, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="divide-y">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-3 px-3 py-2.5">
          {Array.from({ length: cols }).map((_, c) => (
            <div
              key={c}
              className={cn(
                'h-4 rounded bg-primary/10 animate-pulse',
                c === 0 ? 'w-40' : 'flex-1 max-w-32'
              )}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
