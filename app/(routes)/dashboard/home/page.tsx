"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { Breadcrumbs, BreadcrumbItem } from "@/components/ui/breadcrumbs";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { formatCurrency, prettifyNumber } from "@/app/libs/utils";
import {
    FolderKanban,
    DollarSign,
    TrendingUp,
    Heart,
    ArrowUpRight,
    ArrowDownRight,
} from "lucide-react";
import {
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area,
    CartesianGrid,
    Legend,
} from "recharts";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const rand = (min: number, max: number) =>
    Math.round(min + Math.random() * (max - min));

const PROJECT_NAMES = [
    "Panadería y Pastelería",
    "Refrigeración y A/C",
    "Ventas e Inventarios",
    "Jóvenes Emprendedores",
    "Certificación en RRHH",
    "Soldadura Industrial",
    "Turismo Sostenible",
    "Desarrollo Web",
];

const FINANCING_SOURCES = ["UTH", "USAID", "BANHCAFE"];

const MONTHS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun"];

const PIE_COLORS = [
    "hsl(var(--primary))",
    "hsl(var(--success))",
    "hsl(var(--warning))",
];

const DONATION_COLORS = [
    "hsl(var(--primary))",
    "hsl(var(--info))",
];

// ---------------------------------------------------------------------------
// Data generation (runs once per mount)
// ---------------------------------------------------------------------------

function generateDashboardData() {
    const numProjects = rand(5, 8);
    const projects = PROJECT_NAMES.slice(0, numProjects);

    // Financing per source
    const financingBySource = FINANCING_SOURCES.map((name) => ({
        name,
        value: rand(80000, 350000),
    }));

    // Execution % per project
    const executionByProject = projects.map((name) => ({
        name: name.length > 18 ? name.slice(0, 18) + "…" : name,
        fullName: name,
        ejecutado: rand(15, 95),
    }));

    // Monthly financing vs expenses
    const monthlySeries = MONTHS.map((month) => {
        const financing = rand(100000, 300000);
        const expenses = rand(40000, financing);
        return { month, financiamiento: financing, gastos: expenses };
    });

    // Donations by type
    const cashDonations = rand(50000, 200000);
    const supplyDonations = rand(10000, 80000);
    const donationsByType = [
        { name: "Efectivo", value: cashDonations },
        { name: "Insumos", value: supplyDonations },
    ];

    // KPIs
    const totalFinancing = financingBySource.reduce((s, d) => s + d.value, 0);
    const totalExpenses = monthlySeries.reduce((s, d) => s + d.gastos, 0);
    const totalDonations = cashDonations + supplyDonations;

    // Trends (random %)
    const financingTrend = rand(-12, 25);
    const expensesTrend = rand(-15, 20);
    const donationsTrend = rand(-10, 30);

    return {
        numProjects,
        financingBySource,
        executionByProject,
        monthlySeries,
        donationsByType,
        totalFinancing,
        totalExpenses,
        totalDonations,
        financingTrend,
        expensesTrend,
        donationsTrend,
    };
}

// ---------------------------------------------------------------------------
// Custom tooltip
// ---------------------------------------------------------------------------

const CustomTooltip = ({ active, payload, label, isCurrency = true }: any) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-lg text-sm">
            {label && (
                <p className="font-medium text-foreground mb-1">{label}</p>
            )}
            {payload.map((entry: any, i: number) => (
                <p key={i} className="text-muted-foreground" style={{ color: entry.color }}>
                    {entry.name}: {isCurrency ? formatCurrency(entry.value) : `${entry.value}%`}
                </p>
            ))}
        </div>
    );
};

const PieTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const d = payload[0];
    return (
        <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-lg text-sm">
            <p className="font-medium text-foreground">{d.name}</p>
            <p className="text-muted-foreground">{formatCurrency(d.value)}</p>
        </div>
    );
};

// ---------------------------------------------------------------------------
// Animations
// ---------------------------------------------------------------------------

const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

const Page = () => {
    const data = useMemo(() => generateDashboardData(), []);

    const kpis = [
        {
            label: "Total Proyectos",
            value: String(data.numProjects),
            icon: FolderKanban,
            iconColor: "text-primary",
            trend: null,
        },
        {
            label: "Financiamiento",
            value: formatCurrency(data.totalFinancing),
            icon: DollarSign,
            iconColor: "text-success",
            trend: data.financingTrend,
        },
        {
            label: "Total Gastos",
            value: formatCurrency(data.totalExpenses),
            icon: TrendingUp,
            iconColor: "text-warning",
            trend: data.expensesTrend,
        },
        {
            label: "Donaciones",
            value: formatCurrency(data.totalDonations),
            icon: Heart,
            iconColor: "text-primary",
            trend: data.donationsTrend,
        },
    ];

    return (
        <div className="mb-4">
            <Breadcrumbs>
                <BreadcrumbItem>Plataforma</BreadcrumbItem>
                <BreadcrumbItem className="text-primary">
                    Estadísticas
                </BreadcrumbItem>
            </Breadcrumbs>

            <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="mt-5 space-y-6"
            >
                {/* ---------- HEADER ---------- */}
                <motion.div variants={fadeUp}>
                    <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-primary">
                        Dashboard
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Resumen general del sistema — datos de demostración
                    </p>
                </motion.div>

                {/* ---------- KPI CARDS ---------- */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                    {kpis.map((kpi, i) => {
                        const Icon = kpi.icon;
                        const isPositive = kpi.trend !== null && kpi.trend >= 0;
                        const TrendIcon = isPositive ? ArrowUpRight : ArrowDownRight;

                        return (
                            <motion.div key={kpi.label} variants={fadeUp}>
                                <Card className="p-5 hover:shadow-md hover:border-primary/20 transition-all duration-200">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                                                <Icon className={`h-5 w-5 ${kpi.iconColor}`} />
                                            </div>
                                            <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                                                {kpi.label}
                                            </span>
                                        </div>
                                        {kpi.trend !== null && (
                                            <span
                                                className={`flex items-center gap-0.5 text-xs font-semibold ${
                                                    isPositive
                                                        ? "text-success"
                                                        : "text-destructive"
                                                }`}
                                            >
                                                <TrendIcon className="h-3.5 w-3.5" />
                                                {Math.abs(kpi.trend)}%
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-2xl font-bold text-foreground truncate">
                                        {kpi.value}
                                    </p>
                                </Card>
                            </motion.div>
                        );
                    })}
                </div>

                {/* ---------- ROW 1: Financing by source + Area chart ---------- */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    {/* Pie: financing by source */}
                    <motion.div variants={fadeUp}>
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">
                                    Financiamiento por Fuente
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[300px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={data.financingBySource}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={65}
                                                outerRadius={110}
                                                paddingAngle={3}
                                                dataKey="value"
                                                stroke="none"
                                            >
                                                {data.financingBySource.map((_, idx) => (
                                                    <Cell
                                                        key={idx}
                                                        fill={PIE_COLORS[idx % PIE_COLORS.length]}
                                                    />
                                                ))}
                                            </Pie>
                                            <Tooltip content={<PieTooltip />} />
                                            <Legend
                                                verticalAlign="bottom"
                                                height={36}
                                                formatter={(value: string) => (
                                                    <span className="text-xs text-muted-foreground">
                                                        {value}
                                                    </span>
                                                )}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Area: monthly financing vs expenses */}
                    <motion.div variants={fadeUp}>
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">
                                    Financiamiento vs Gastos (Mensual)
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[300px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart
                                            data={data.monthlySeries}
                                            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                                        >
                                            <defs>
                                                <linearGradient
                                                    id="gradFinancing"
                                                    x1="0"
                                                    y1="0"
                                                    x2="0"
                                                    y2="1"
                                                >
                                                    <stop
                                                        offset="5%"
                                                        stopColor="hsl(var(--primary))"
                                                        stopOpacity={0.3}
                                                    />
                                                    <stop
                                                        offset="95%"
                                                        stopColor="hsl(var(--primary))"
                                                        stopOpacity={0}
                                                    />
                                                </linearGradient>
                                                <linearGradient
                                                    id="gradExpenses"
                                                    x1="0"
                                                    y1="0"
                                                    x2="0"
                                                    y2="1"
                                                >
                                                    <stop
                                                        offset="5%"
                                                        stopColor="hsl(var(--warning))"
                                                        stopOpacity={0.3}
                                                    />
                                                    <stop
                                                        offset="95%"
                                                        stopColor="hsl(var(--warning))"
                                                        stopOpacity={0}
                                                    />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid
                                                strokeDasharray="3 3"
                                                stroke="hsl(var(--chartGird))"
                                            />
                                            <XAxis
                                                dataKey="month"
                                                tick={{ fontSize: 11, fill: "hsl(var(--chartLabel))" }}
                                                axisLine={false}
                                                tickLine={false}
                                            />
                                            <YAxis
                                                tickFormatter={(v: number) =>
                                                    `${prettifyNumber(v / 1000)}k`
                                                }
                                                tick={{ fontSize: 11, fill: "hsl(var(--chartLabel))" }}
                                                axisLine={false}
                                                tickLine={false}
                                            />
                                            <Tooltip
                                                content={
                                                    <CustomTooltip isCurrency={true} />
                                                }
                                            />
                                            <Legend
                                                verticalAlign="top"
                                                height={36}
                                                formatter={(value: string) => (
                                                    <span className="text-xs text-muted-foreground">
                                                        {value}
                                                    </span>
                                                )}
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="financiamiento"
                                                name="Financiamiento"
                                                stroke="hsl(var(--primary))"
                                                fillOpacity={1}
                                                fill="url(#gradFinancing)"
                                                strokeWidth={2}
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="gastos"
                                                name="Gastos"
                                                stroke="hsl(var(--warning))"
                                                fillOpacity={1}
                                                fill="url(#gradExpenses)"
                                                strokeWidth={2}
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>

                {/* ---------- ROW 2: Donations pie + Execution bar ---------- */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    {/* Pie: donations by type */}
                    <motion.div variants={fadeUp}>
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">
                                    Donaciones por Tipo
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[300px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={data.donationsByType}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={95}
                                                paddingAngle={4}
                                                dataKey="value"
                                                stroke="none"
                                            >
                                                {data.donationsByType.map((_, idx) => (
                                                    <Cell
                                                        key={idx}
                                                        fill={
                                                            DONATION_COLORS[
                                                                idx % DONATION_COLORS.length
                                                            ]
                                                        }
                                                    />
                                                ))}
                                            </Pie>
                                            <Tooltip content={<PieTooltip />} />
                                            <Legend
                                                verticalAlign="bottom"
                                                height={36}
                                                formatter={(value: string) => (
                                                    <span className="text-xs text-muted-foreground">
                                                        {value}
                                                    </span>
                                                )}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Bar: execution % */}
                    <motion.div variants={fadeUp}>
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">
                                    Ejecución de Fondos por Proyecto
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[300px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart
                                            data={data.executionByProject}
                                            layout="vertical"
                                            margin={{ left: 10, right: 20, top: 5, bottom: 5 }}
                                        >
                                            <CartesianGrid
                                                horizontal={false}
                                                stroke="hsl(var(--chartGird))"
                                                strokeDasharray="3 3"
                                            />
                                            <XAxis
                                                type="number"
                                                domain={[0, 100]}
                                                tickFormatter={(v: number) => `${v}%`}
                                                tick={{ fontSize: 11, fill: "hsl(var(--chartLabel))" }}
                                                axisLine={false}
                                                tickLine={false}
                                            />
                                            <YAxis
                                                dataKey="name"
                                                type="category"
                                                width={130}
                                                tick={{ fontSize: 11, fill: "hsl(var(--chartLabel))" }}
                                                axisLine={false}
                                                tickLine={false}
                                            />
                                            <Tooltip
                                                content={
                                                    <CustomTooltip isCurrency={false} />
                                                }
                                            />
                                            <Bar
                                                dataKey="ejecutado"
                                                name="Ejecutado"
                                                fill="hsl(var(--primary))"
                                                radius={[0, 6, 6, 0]}
                                                barSize={18}
                                            />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>

            </motion.div>
        </div>
    );
};

export default Page;
