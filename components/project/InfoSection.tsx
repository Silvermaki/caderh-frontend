import React from "react";
import { cn } from "@/lib/utils";

interface InfoSectionProps {
    title: string;
    children: React.ReactNode;
    className?: string;
}

const InfoSection = ({ title, children, className }: InfoSectionProps) => {
    return (
        <section className={cn("space-y-4", className)}>
            <div className="flex items-center gap-3">
                <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    {title}
                </h4>
                <div className="flex-1 h-px bg-border" />
            </div>
            <div>{children}</div>
        </section>
    );
};

export default InfoSection;
