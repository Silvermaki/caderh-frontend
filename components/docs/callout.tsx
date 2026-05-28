import * as React from "react";
import { cn } from "@/lib/utils";
import { Info, AlertTriangle, ShieldAlert, CheckCircle2, Lightbulb } from "lucide-react";

type Variant = "tip" | "info" | "warning" | "danger" | "success";

const VARIANT_STYLES: Record<
  Variant,
  { wrapper: string; icon: React.ComponentType<{ className?: string }>; iconWrap: string; title: string }
> = {
  tip: {
    wrapper: "border-info/30 bg-info/[0.06]",
    icon: Lightbulb,
    iconWrap: "bg-info/15 text-info",
    title: "text-info",
  },
  info: {
    wrapper: "border-primary/25 bg-primary/[0.05]",
    icon: Info,
    iconWrap: "bg-primary/15 text-primary",
    title: "text-primary",
  },
  warning: {
    wrapper: "border-warning/30 bg-warning/[0.08]",
    icon: AlertTriangle,
    iconWrap: "bg-warning/15 text-warning",
    title: "text-warning",
  },
  danger: {
    wrapper: "border-destructive/30 bg-destructive/[0.06]",
    icon: ShieldAlert,
    iconWrap: "bg-destructive/15 text-destructive",
    title: "text-destructive",
  },
  success: {
    wrapper: "border-success/30 bg-success/[0.06]",
    icon: CheckCircle2,
    iconWrap: "bg-success/15 text-success",
    title: "text-success",
  },
};

const DEFAULT_TITLES: Record<Variant, string> = {
  tip: "Sugerencia",
  info: "Información",
  warning: "Atención",
  danger: "No hagas esto",
  success: "Resultado esperado",
};

export interface CalloutProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: Variant;
  title?: string;
}

export function Callout({
  variant = "info",
  title,
  className,
  children,
  ...props
}: CalloutProps) {
  const v = VARIANT_STYLES[variant];
  const Icon = v.icon;
  return (
    <div
      role="note"
      className={cn(
        "flex gap-3 rounded-lg border p-4 text-sm",
        v.wrapper,
        className
      )}
      {...props}
    >
      <div className={cn("h-8 w-8 shrink-0 rounded-md flex items-center justify-center", v.iconWrap)}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn("font-semibold text-sm mb-1", v.title)}>
          {title ?? DEFAULT_TITLES[variant]}
        </p>
        <div className="text-foreground/80 leading-relaxed [&_p+p]:mt-2 [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2">
          {children}
        </div>
      </div>
    </div>
  );
}
