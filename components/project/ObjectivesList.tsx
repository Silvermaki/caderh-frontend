import React from "react";
import { Target } from "lucide-react";
import { cn } from "@/lib/utils";

interface ObjectivesListProps {
    objectives: string | null | undefined;
    className?: string;
}

/**
 * Parse objectives string into individual items.
 * Supports:
 * - Multiline strings (split by \n)
 * - Bullet-prefixed lines (- or *)
 * - Numbered lists (1., 2., etc.)
 * Falls back to a single paragraph if nothing matches.
 */
const parseObjectives = (raw: string): string[] => {
    if (!raw || !raw.trim()) return [];

    // If the string has explicit newlines, split by them
    const lines = raw.split(/\n/).map((l) => l.trim()).filter(Boolean);

    if (lines.length > 1) {
        // Clean leading bullets/numbers: "- text", "* text", "1. text", "1) text"
        return lines.map((l) => l.replace(/^[-*•]\s*/, "").replace(/^\d+[.)]\s*/, "").trim()).filter(Boolean);
    }

    // Single blob – try splitting by ". " followed by uppercase (sentence breaks)
    const sentenceSplit = raw.split(/(?<=\.)\s+(?=[A-ZÁÉÍÓÚÑ])/).map((s) => s.trim()).filter(Boolean);
    if (sentenceSplit.length > 1) return sentenceSplit;

    // Fallback: single item
    return [raw.trim()];
};

const ObjectivesList = ({ objectives, className }: ObjectivesListProps) => {
    const items = parseObjectives(objectives ?? "");

    if (items.length === 0) {
        return (
            <p className="text-sm text-muted-foreground italic">Sin objetivos definidos.</p>
        );
    }

    // If only one item, render as a paragraph preserving whitespace
    if (items.length === 1) {
        return (
            <p className={cn("text-base leading-relaxed max-w-3xl whitespace-pre-line", className)}>
                {objectives}
            </p>
        );
    }

    return (
        <ul className={cn("space-y-3 max-w-3xl", className)}>
            {items.map((item, i) => (
                <li key={i} className="flex items-start gap-3 group">
                    <Target className="h-4 w-4 mt-1 shrink-0 text-primary/70 group-hover:text-primary transition-colors" />
                    <span className="text-base leading-relaxed">{item}</span>
                </li>
            ))}
        </ul>
    );
};

export default ObjectivesList;
