"use client";

import React from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
    Calendar,
    CalendarRange,
    ClipboardList,
    DollarSign,
    TrendingUp,
    Target,
    Wallet,
    Package,
    Banknote,
    AlertCircle,
    Gift,
} from "lucide-react";
import { formatDate, formatCurrency } from "@/app/libs/utils";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import KPIBlock from "./KPIBlock";

interface ProjectHeaderProps {
    name: string;
    description: string;
    startDate: string | null;
    endDate: string | null;
    accomplishments: any[];
    /** Presupuesto General: fuentes + donaciones en efectivo. */
    financed: number;
    /** Presupuesto Ejecutado: gastos pagados con el presupuesto en efectivo. */
    totalExpenses: number;
    remaining: number;
    /** % de ejecución financiera (efectivo). Sin tope; null = no determinable
     *  (hay gastos en efectivo pero ningún ingreso en efectivo). */
    executedPct: number | null;
    progressColor: "destructive" | "warning" | "success";
    interactive?: boolean;
    /** Suma de donaciones tipo suministro (SUPPLY). */
    inKindDonations?: number;
    /** Suma de donaciones tipo efectivo (CASH). */
    cashDonations?: number;
    /** Disponible neto de especie (donado − gastos imputados). */
    inKindAvailable?: number;
    /** Disponible neto de efectivo (donado − gastos imputados). */
    cashAvailable?: number;
    /** Suma de donaciones tipo beneficio (BENEFIT). */
    benefitDonations?: number;
    /** Disponible neto de beneficios (donado − gastos imputados). */
    benefitAvailable?: number;
    /** Presupuesto total planificado (referencia; no suma a ingresos). */
    totalBudget?: number | null;
    /** Categoría del proyecto (PROJECT o AGREEMENT). */
    projectCategory?: string;
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
    inKindAvailable,
    cashAvailable,
    benefitDonations,
    benefitAvailable,
    totalBudget,
    projectCategory,
}: ProjectHeaderProps) => {
    const acc = Array.isArray(accomplishments)
        ? accomplishments.filter((a: any) => a && typeof a.text === "string")
        : [];
    const completedCount = acc.filter((a: any) => a && a.completed).length;
    const overExecution = totalExpenses > financed ? totalExpenses - financed : 0;

    const kpiCards = [
        ...(totalBudget != null && totalBudget > 0 ? [{
            icon: ClipboardList,
            label: "Presupuesto Total",
            value: formatCurrency(totalBudget),
            tooltip: "Monto planificado de referencia para control presupuestario. No se suma a los ingresos recibidos.",
            iconColor: "text-info",
        }] : []),
        {
            icon: DollarSign,
            label: "Presupuesto General",
            value: formatCurrency(financed),
            tooltip: "Ingresos en efectivo: fuentes de financiamiento + donaciones en efectivo. Las donaciones en suministros y beneficios no suman al presupuesto.",
            iconColor: "text-success",
        },
        {
            icon: TrendingUp,
            label: "Presupuesto Ejecutado",
            value: formatCurrency(totalExpenses),
            tooltip: "Gastos pagados con el presupuesto: generales, contra una fuente o contra una donación en efectivo. Los gastos imputados a suministros o beneficios se rebajan de esas donaciones.",
            iconColor: "text-warning",
        },
        {
            icon: Wallet,
            label: "Presupuesto Disponible",
            value: formatCurrency(remaining),
            tooltip: "Presupuesto general menos presupuesto ejecutado.",
            iconColor: "text-primary",
        },
        ...(overExecution > 0 ? [{
            icon: AlertCircle,
            label: "Sobre Ejecución",
            value: formatCurrency(overExecution),
            iconColor: "text-destructive",
        }] : []),
        {
            icon: Package,
            label: "Donaciones en Especie",
            value: formatCurrency(inKindAvailable ?? inKindDonations ?? 0),
            tooltip: `Monto disponible: suministros donados menos los gastos imputados a ellos. Total recibido: ${formatCurrency(inKindDonations ?? 0)}. No suma al presupuesto general.`,
            iconColor: "text-muted-foreground",
        },
        ...(benefitDonations != null && benefitDonations > 0 ? [{
            icon: Gift,
            label: "Beneficios",
            value: formatCurrency(benefitAvailable ?? benefitDonations),
            tooltip: `Monto disponible: beneficios donados menos los gastos imputados a ellos. Total recibido: ${formatCurrency(benefitDonations)}. No suma al presupuesto general.`,
            iconColor: "text-info",
        }] : []),
        {
            icon: Banknote,
            label: "Donaciones en Efectivo",
            value: formatCurrency(cashAvailable ?? cashDonations ?? 0),
            tooltip: `Monto disponible: donaciones en efectivo recibidas menos los gastos imputados a ellas. Total recibido: ${formatCurrency(cashDonations ?? 0)}. Forma parte del presupuesto general.`,
            iconColor: "text-success",
        },
        {
            icon: Target,
            label: "Logros",
            value: acc.length > 0 ? `${completedCount} / ${acc.length}` : "-",
            iconColor: "text-[#04bb36]",
        },
    ];

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
                        <Badge variant={projectCategory === "AGREEMENT" ? "outline" : undefined} color={projectCategory === "AGREEMENT" ? undefined : "default"} className="text-xs shrink-0">
                            {projectCategory === "AGREEMENT" ? "Convenio" : "Proyecto"}
                        </Badge>
                    )}
                </div>
                <p className="text-sm text-muted-foreground mt-2 break-words leading-relaxed">
                    {description}
                </p>
                <div className="flex flex-wrap gap-x-6 gap-y-1 mt-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 shrink-0" />
                        Inicio: {formatDate(startDate)}
                    </span>
                    <span className="flex items-center gap-2">
                        <CalendarRange className="h-4 w-4 shrink-0" />
                        Fin: {formatDate(endDate)}
                    </span>
                </div>
            </div>

            {/* KPI grid; Logros al final */}
            <div className="px-6 pb-2">
                <div className={cn(
                    "grid grid-cols-1 sm:grid-cols-2 gap-3",
                    // 9 tarjetas (total + sobre ejecución + beneficios) no caben
                    // legibles en una fila: van en dos.
                    kpiCards.length >= 9 ? "lg:grid-cols-5" : kpiCards.length === 8 ? "lg:grid-cols-8" : kpiCards.length === 7 ? "lg:grid-cols-7" : "lg:grid-cols-6"
                )}>
                    {kpiCards.map((card, i) => (
                        <KPIBlock key={card.label} {...card} index={i} />
                    ))}
                </div>
            </div>

            {/* Animated progress bar */}
            <div className="px-6 pt-3 pb-6">
                <p className="text-xs text-muted-foreground mb-2">
                    Ejecución Financiera (efectivo): {executedPct == null ? "N/D" : `${executedPct}%`}
                </p>
                <motion.div
                    initial={{ opacity: 0, scaleX: 0 }}
                    animate={{ opacity: 1, scaleX: 1 }}
                    transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
                    style={{ transformOrigin: "left" }}
                >
                    <Progress value={executedPct == null ? 100 : Math.min(100, executedPct)} color={progressColor} size="sm" />
                </motion.div>
            </div>
        </Card>
    );
};

export default ProjectHeader;
