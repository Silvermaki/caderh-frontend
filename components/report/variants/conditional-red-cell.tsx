import { cn } from '@/lib/utils';

export function ConditionalRedCell({
  isRed, children, className,
}: {
  isRed: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <td
      className={cn(
        'px-2 py-1.5 text-right tabular-nums',
        isRed && 'bg-destructive/5 text-destructive font-semibold',
        className
      )}
    >
      {children}
    </td>
  );
}
