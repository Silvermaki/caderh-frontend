"use client";

import React from "react";
import { CheckCircle2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Achievement {
    text: string;
    completed: boolean;
}

interface AchievementsListProps {
    accomplishments: any[];
    onToggle: (index: number, checked: boolean) => void;
    disabled?: boolean;
    className?: string;
}

const AchievementsList = ({
    accomplishments,
    onToggle,
    disabled,
    className,
}: AchievementsListProps) => {
    const items: Achievement[] = (
        Array.isArray(accomplishments)
            ? accomplishments.filter((a: any) => a && typeof a.text === "string")
            : []
    ).map((a: any) => ({ text: String(a.text), completed: Boolean(a?.completed) }));

    if (items.length === 0) {
        return (
            <p className="text-sm text-muted-foreground italic">
                No hay logros definidos para este proyecto.
            </p>
        );
    }

    const completedCount = items.filter((a) => a.completed).length;

    return (
        <div className={cn("space-y-3", className)}>
            {/* Summary badge */}
            <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium text-muted-foreground">
                    {completedCount} de {items.length} completados
                </span>
                <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden max-w-[140px]">
                    <div
                        className="h-full rounded-full bg-success transition-all duration-500"
                        style={{ width: `${items.length > 0 ? (completedCount / items.length) * 100 : 0}%` }}
                    />
                </div>
            </div>

            {/* Achievement items */}
            <div className="space-y-2">
                {items.map((a, i) => (
                    <button
                        key={i}
                        type="button"
                        onClick={() => onToggle(i, !a.completed)}
                        disabled={disabled}
                        className={cn(
                            "w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-all duration-200",
                            "hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                            a.completed
                                ? "bg-success/5 border-success/20 hover:bg-success/10"
                                : "bg-card border-border hover:border-primary/20 hover:bg-muted/30",
                            disabled && "opacity-60 pointer-events-none"
                        )}
                    >
                        {a.completed ? (
                            <CheckCircle2 className="h-5 w-5 shrink-0 text-success" />
                        ) : (
                            <Circle className="h-5 w-5 shrink-0 text-muted-foreground/50" />
                        )}
                        <span
                            className={cn(
                                "flex-1 text-sm",
                                a.completed && "line-through text-muted-foreground"
                            )}
                        >
                            {a.text}
                        </span>
                        {a.completed && (
                            <span className="text-success text-xs font-medium shrink-0">
                                Completado
                            </span>
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default AchievementsList;
