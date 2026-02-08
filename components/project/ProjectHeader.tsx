"use client";

import React from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
    Calendar,
    CalendarRange,
    DollarSign,
    TrendingUp,
    Target,
    Wallet,
} from "lucide-react";
import { dateToString, formatCurrency } from "@/app/libs/utils";
import KPIBlock from "./KPIBlock";

interface ProjectHeaderProps {
    name: string;
    description: string;
    startDate: string | null;
    endDate: string | null;
    accomplishments: any[];
    financed: number;
    totalExpenses: number;
    remaining: number;
    executedPct: number;
    progressColor: "destructive" | "warning" | "success";
}

const ProjectHeader = ({
    name,
    description,
    startDate,
    endDate,
    accomplishments,
    financed,
    totalExpenses,
    remaining,
    executedPct,
    progressColor,
}: ProjectHeaderProps) => {
    const acc = Array.isArray(accomplishments)
        ? accomplishments.filter((a: any) => a && typeof a.text === "string")
        : [];
    const completedCount = acc.filter((a: any) => a && a.completed).length;

    return (
        <Card className="mb-6 overflow-hidden">
            {/* Title + description + dates */}
            <div className="p-6 pb-4">
                <h1 className="text-2xl lg:text-3xl font-bold tracking-tight break-words">
                    {name}
                </h1>
                <p className="text-sm text-muted-foreground mt-2 break-words max-w-3xl leading-relaxed">
                    {description}
                </p>
                <div className="flex flex-wrap gap-x-6 gap-y-1 mt-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 shrink-0" />
                        Inicio: {startDate ? dateToString(new Date(startDate)) : "-"}
                    </span>
                    <span className="flex items-center gap-2">
                        <CalendarRange className="h-4 w-4 shrink-0" />
                        Fin: {endDate ? dateToString(new Date(endDate)) : "-"}
                    </span>
                </div>
            </div>

            {/* KPI grid */}
            <div className="px-6 pb-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {acc.length > 0 && (
                        <KPIBlock
                            icon={Target}
                            label="Logros"
                            value={`${completedCount} / ${acc.length}`}
                            iconColor="text-[#04bb36]"
                            index={0}
                        />
                    )}
                    <KPIBlock
                        icon={DollarSign}
                        label="Monto Financiado"
                        value={formatCurrency(financed)}
                        iconColor="text-success"
                        index={acc.length > 0 ? 1 : 0}
                    />
                    <KPIBlock
                        icon={TrendingUp}
                        label="Total de Gasto"
                        value={formatCurrency(totalExpenses)}
                        iconColor="text-warning"
                        index={acc.length > 0 ? 2 : 1}
                    />
                    <KPIBlock
                        icon={Wallet}
                        label="Restante"
                        value={formatCurrency(remaining)}
                        iconColor="text-primary"
                        index={acc.length > 0 ? 3 : 2}
                    />
                </div>
            </div>

            {/* Animated progress bar */}
            <div className="px-6 pt-3 pb-6">
                <p className="text-xs text-muted-foreground mb-2">
                    Total Fondo Ejecutado: {executedPct}%
                </p>
                <motion.div
                    initial={{ opacity: 0, scaleX: 0 }}
                    animate={{ opacity: 1, scaleX: 1 }}
                    transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
                    style={{ transformOrigin: "left" }}
                >
                    <Progress value={executedPct} color={progressColor} size="sm" />
                </motion.div>
            </div>
        </Card>
    );
};

export default ProjectHeader;
