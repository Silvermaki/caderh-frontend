'use client';

import { Breadcrumbs, BreadcrumbItem } from '@/components/ui/breadcrumbs';

export interface Crumb { label: string; href?: string }

export function ReportBreadcrumbs({ crumbs }: { crumbs: Crumb[] }) {
  return (
    <Breadcrumbs>
      {crumbs.map((c, i) => {
        const isLast = i === crumbs.length - 1;
        return (
          <BreadcrumbItem
            key={i}
            href={c.href}
            className={isLast ? 'text-primary' : undefined}
          >
            {c.label}
          </BreadcrumbItem>
        );
      })}
    </Breadcrumbs>
  );
}
