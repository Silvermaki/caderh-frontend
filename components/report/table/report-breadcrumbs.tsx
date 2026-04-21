import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

export interface Crumb { label: string; href?: string }

export function ReportBreadcrumbs({ crumbs }: { crumbs: Crumb[] }) {
  return (
    <nav className="text-xs text-muted-foreground mb-2" aria-label="Breadcrumb">
      {crumbs.map((c, i) => (
        <span key={i} className="inline-flex items-center">
          {c.href ? (
            <Link href={c.href} className="hover:underline">{c.label}</Link>
          ) : (
            <span>{c.label}</span>
          )}
          {i < crumbs.length - 1 && <ChevronRight className="h-3 w-3 mx-1 text-muted-foreground/60" />}
        </span>
      ))}
    </nav>
  );
}
