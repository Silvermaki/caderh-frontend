import React from "react";
import { Calendar, CalendarRange, Clock } from "lucide-react";
import { dateToString } from "@/app/libs/utils";
import { cn } from "@/lib/utils";

interface DatesCardProps {
    startDate: string | null | undefined;
    endDate: string | null | undefined;
    className?: string;
}

const calculateDuration = (start: string, end: string): string => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays < 30) return `${diffDays} ${diffDays === 1 ? "día" : "días"}`;
    const months = Math.round(diffDays / 30);
    if (months < 12) return `${months} ${months === 1 ? "mes" : "meses"}`;
    const years = Math.floor(months / 12);
    const rem = months % 12;
    const yStr = `${years} ${years === 1 ? "año" : "años"}`;
    return rem > 0 ? `${yStr}, ${rem} ${rem === 1 ? "mes" : "meses"}` : yStr;
};

const DatesCard = ({ startDate, endDate, className }: DatesCardProps) => {
    const hasBoth = !!startDate && !!endDate;
    const duration = hasBoth ? calculateDuration(startDate!, endDate!) : null;

    return (
        <div className={cn("grid grid-cols-1 sm:grid-cols-3 gap-4", className)}>
            {/* Start date */}
            <div className="flex items-start gap-3 p-4 rounded-lg border border-border">
                <Calendar className="h-4 w-4 text-primary mt-0.5" />
                <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Fecha de Inicio</p>
                    <p className="text-sm font-semibold">
                        {startDate ? dateToString(new Date(startDate)) : "-"}
                    </p>
                </div>
            </div>

            {/* End date */}
            <div className="flex items-start gap-3 p-4 rounded-lg border border-border">
                <CalendarRange className="h-4 w-4 text-primary mt-0.5" />
                <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Fecha de Finalización</p>
                    <p className="text-sm font-semibold">
                        {endDate ? dateToString(new Date(endDate)) : "-"}
                    </p>
                </div>
            </div>

            {/* Duration */}
            <div className="flex items-start gap-3 p-4 rounded-lg border border-border">
                <Clock className="h-4 w-4 text-primary mt-0.5" />
                <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Duración</p>
                    <p className="text-sm font-semibold">{duration ?? "-"}</p>
                </div>
            </div>
        </div>
    );
};

export default DatesCard;
