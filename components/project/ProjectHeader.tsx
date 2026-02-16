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
    Package,
    Banknote,
    AlertCircle,
} from "lucide-react";
import { dateToString, formatCurrency } from "@/app/libs/utils";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
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
    interactive?: boolean;
    /** Suma de donaciones tipo suministro (SUPPLY). */
    inKindDonations?: number;
    /** Suma de donaciones tipo efectivo (CASH). */
    cashDonations?: number;
    /** Categoría del proyecto (PROJECT o AGREEMENT). */
    projectCategory?: string;
    /** Nombre del agente asignado al proyecto. */
    assignedAgentName?: string | null;
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
    interactive,
    inKindDonations,
    cashDonations,
    projectCategory,
    assignedAgentName,
}: ProjectHeaderProps) => {
    const acc = Array.isArray(accomplishments)
        ? accomplishments.filter((a: any) => a && typeof a.text === "string")
        : [];
    const completedCount = acc.filter((a: any) => a && a.completed).length;
    const overExecution = totalExpenses > financed ? totalExpenses - financed : 0;

    return (
        <Card className={cn(
            "mb-6 overflow-hidden",
            interactive && "cursor-pointer group"
        )}>
            {/* Title + description + dates */}
            <div className="p-6 pb-4">
                <div className="flex items-center gap-3 flex-wrap">
                    <h1 className={cn(
                        "text-2xl lg:text-3xl font-bold tracking-tight break-words relative inline-block text-primary",
                        interactive && "after:content-[''] after:absolute after:bottom-0 after:left-0 after:h-0.5 after:bg-primary after:w-0 after:transition-all after:duration-[5000ms] after:ease-in-out group-hover:after:w-full"
                    )}>
                        {name}
                    </h1>
                    {projectCategory && (
                        <Badge variant={projectCategory === "AGREEMENT" ? "outline" : "default"} className="text-xs shrink-0">
                            {projectCategory === "AGREEMENT" ? "Convenio" : "Proyecto"}
                        </Badge>
                    )}
                    {assignedAgentName && (
                        <Badge variant="secondary" className="text-xs shrink-0">
                            Agente: {assignedAgentName}
                        </Badge>
                    )}
                </div>
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

            {/* KPI grid; Logros al final */}
            <div className="px-6 pb-2">
                <div className={cn(
                    "grid grid-cols-1 sm:grid-cols-2 gap-3",
                    overExecution > 0 ? "lg:grid-cols-7" : "lg:grid-cols-6"
                )}>
                    <KPIBlock
                        icon={DollarSign}
                        label="Presupuesto General"
                        value={formatCurrency(financed)}
                        iconColor="text-success"
                        index={0}
                    />
                    <KPIBlock
                        icon={TrendingUp}
                        label="Presupuesto Ejecutado"
                        value={formatCurrency(totalExpenses)}
                        iconColor="text-warning"
                        index={1}
                    />
                    <KPIBlock
                        icon={Wallet}
                        label="Presupuesto Disponible"
                        value={formatCurrency(remaining)}
                        iconColor="text-primary"
                        index={2}
                    />
                    {overExecution > 0 && (
                        <KPIBlock
                            icon={AlertCircle}
                            label="Sobre Ejecución"
                            value={formatCurrency(overExecution)}
                            iconColor="text-destructive"
                            index={3}
                        />
                    )}
                    <KPIBlock
                        icon={Package}
                        label="Donaciones en Especie"
                        value={formatCurrency(inKindDonations ?? 0)}
                        iconColor="text-muted-foreground"
                        index={overExecution > 0 ? 4 : 3}
                    />
                    <KPIBlock
                        icon={Banknote}
                        label="Donaciones en Efectivo"
                        value={formatCurrency(cashDonations ?? 0)}
                        iconColor="text-success"
                        index={overExecution > 0 ? 5 : 4}
                    />
                    <KPIBlock
                        icon={Target}
                        label="Logros"
                        value={acc.length > 0 ? `${completedCount} / ${acc.length}` : "-"}
                        iconColor="text-[#04bb36]"
                        index={overExecution > 0 ? 6 : 5}
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
