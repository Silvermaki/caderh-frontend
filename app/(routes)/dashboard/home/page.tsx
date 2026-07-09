"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useSession } from "next-auth/react";
import { Breadcrumbs, BreadcrumbItem } from "@/components/ui/breadcrumbs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectSeparator,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { formatCurrency, prettifyNumber } from "@/app/libs/utils";
import {
    GraduationCap,
    BookOpen,
    Building2,
    Users,
    FolderKanban,
    DollarSign,
    TrendingUp,
    Percent,
    ArrowUpRight,
    ArrowDownRight,
    AlertCircle,
    CalendarDays,
    BarChart3,
    PieChart as PieChartIcon,
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
} from "recharts";

// ---------------------------------------------------------------------------
// Paleta categórica de gráficas (tokens --chart-1..4, validados en light/dark).
// Orden categórico FIJO 1→4, nunca ciclado; el color sigue a la ENTIDAD:
//   - Donaciones: mapeo fijo por nombre (Efectivo/Especie/Beneficio).
//   - Fuentes: asignación por orden alfabético del nombre (estable ante filtros);
//     si hay >4 fuentes, las 4 de mayor total conservan su color alfabético y
//     el resto se agrupa en "Otras" con gris muted.
// ---------------------------------------------------------------------------

const CHART_COLORS = [
    "hsl(var(--chart-1))",
    "hsl(var(--chart-2))",
    "hsl(var(--chart-3))",
    "hsl(var(--chart-4))",
];

const OTHER_COLOR = "hsl(var(--muted-foreground))";

const DONATION_TYPE_COLORS: Record<string, string> = {
    Efectivo: "hsl(var(--chart-1))",
    Especie: "hsl(var(--chart-2))",
    Beneficio: "hsl(var(--chart-3))",
};

// Orden FIJO de la leyenda de donaciones (nunca por valor).
const DONATION_LEGEND_ORDER = ["Efectivo", "Especie", "Beneficio"];

// Estilo compartido de ejes cartesianos.
const AXIS_TICK = { fontSize: 11, fill: "hsl(var(--muted-foreground))" };

// Track fantasma detrás de las barras (una barra solitaria se lee como
// "1 de 12 meses" y no como chart roto).
const BAR_TRACK = { fill: "hsl(var(--border) / 0.35)", radius: 4 } as const;

// Formatter del eje Y monetario sin "0k" repetido.
const formatAxisMoney = (v: number) =>
    v === 0
        ? "0"
        : v >= 1000000
        ? `${(v / 1000000).toFixed(1)}M`
        : v >= 1000
        ? `${Math.round(v / 1000)}k`
        : String(v);

// ---------------------------------------------------------------------------
// Data (GET /stats/dashboard?year= — datos reales del sistema)
// ---------------------------------------------------------------------------

type DashboardData = {
    formacion: {
        estudiantesMatriculados: number;
        estudiantesTrend: number | null;
        procesosImpartidos: number;
        procesosEnCurso: number;
        centrosActivos: number;
        instructoresActivos: number;
        matriculaPorMes: { mes: string; hombres: number; mujeres: number }[];
        matriculaPorArea: { area: string; total: number }[];
    };
    finanzas: {
        proyectosActivos: number;
        ingresosRecibidos: number;
        gastos: number;
        pctEjecucion: number | null;
        ingresosVsGastosMensual: {
            mes: string;
            ingresos: number;
            gastos: number;
        }[];
        ejecucionPorProyecto: { nombre: string; pct: number }[];
        financiamientoPorFuente: { name: string; total: number }[];
        donacionesPorTipo: { tipo: string; total: number }[];
    };
};

type KpiDef = {
    label: string;
    value: string;
    icon: React.ElementType;
    trend: number | null;
    sub?: string;
};

type PieDatum = { name: string; value: number; fill: string };

// Escala "nice" para ejes Y: techo redondo y ticks en divisiones limpias,
// en lugar del techo exacto de los datos (que produce 650k/1.9M irregulares).
const NICE_MANTISSAS: [number, number][] = [
    [1, 4],
    [1.5, 3],
    [2, 4],
    [2.5, 5],
    [3, 3],
    [4, 4],
    [5, 5],
    [6, 3],
    [8, 4],
    [10, 5],
];
const niceAxisScale = (dataMax: number): { max: number; ticks: number[] } => {
    if (!Number.isFinite(dataMax) || dataMax <= 0)
        return { max: 4, ticks: [0, 1, 2, 3, 4] };
    const base = Math.pow(10, Math.floor(Math.log10(dataMax)));
    const [mantissa, divisions] = NICE_MANTISSAS.find(
        ([m]) => m * base >= dataMax
    ) ?? [10, 5];
    const max = mantissa * base;
    const step = max / divisions;
    const ticks = Array.from({ length: divisions + 1 }, (_, i) =>
        Math.round(i * step)
    );
    return { max, ticks };
};

// ---------------------------------------------------------------------------
// Custom tooltips — el texto nunca va coloreado con el color de la serie: un
// cuadradito de color lleva la identidad y el texto queda en muted-foreground.
// ---------------------------------------------------------------------------

const CustomTooltip = ({
    active,
    payload,
    label,
    formatter,
    labelKey,
}: any) => {
    if (!active || !payload?.length) return null;
    const heading = (labelKey && payload[0]?.payload?.[labelKey]) || label;
    return (
        <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-lg text-sm">
            {heading && (
                <p className="font-medium text-foreground mb-1">{heading}</p>
            )}
            {payload.map((entry: any, i: number) => (
                <p
                    key={i}
                    className="flex items-center gap-1.5 text-muted-foreground"
                >
                    <span
                        className="inline-block w-2 h-2 rounded-sm shrink-0"
                        style={{
                            background: entry.payload?.fill ?? entry.color,
                        }}
                    />
                    <span>
                        {entry.name}:{" "}
                        {formatter
                            ? formatter(entry)
                            : formatCurrency(entry.value)}
                    </span>
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
            <p className="flex items-center gap-1.5 font-medium text-foreground">
                <span
                    className="inline-block w-2 h-2 rounded-sm shrink-0"
                    style={{ background: d.payload?.fill ?? d.color }}
                />
                {d.name}
            </p>
            <p className="text-muted-foreground">{formatCurrency(d.value)}</p>
        </div>
    );
};

// ---------------------------------------------------------------------------
// Animations
// ---------------------------------------------------------------------------

const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const fadeUp = {
    hidden: { opacity: 0, y: 12 },
    show: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.35, ease: "easeOut" },
    },
};

// ---------------------------------------------------------------------------
// Shared pieces
// ---------------------------------------------------------------------------

const SectionHeader = ({ children }: { children: React.ReactNode }) => (
    <motion.div variants={fadeUp} className="flex items-center gap-3">
        <span className="h-4 w-1 rounded-full bg-primary" />
        <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-foreground whitespace-nowrap">
            {children}
        </h2>
        <span className="h-px flex-1 bg-border/60" />
    </motion.div>
);

// Anatomía fija de 3 filas — misma altura por estructura.
const KpiCard = ({ kpi }: { kpi: KpiDef }) => {
    const Icon = kpi.icon;
    const isPositive = kpi.trend !== null && kpi.trend >= 0;
    const TrendIcon = isPositive ? ArrowUpRight : ArrowDownRight;
    return (
        <motion.div variants={fadeUp} className="h-full">
            <Card className="h-full flex flex-col rounded-lg border border-border/60 bg-card p-5 shadow-[0_1px_2px_rgb(0_0_0/0.04)] hover:shadow-[0_2px_8px_rgb(0_0_0/0.06)] hover:border-border transition-[box-shadow,border-color] duration-200">
                <div className="flex items-start justify-between gap-3">
                    <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground leading-4">
                        {kpi.label}
                    </span>
                    <div className="h-8 w-8 shrink-0 rounded-md bg-primary/10 flex items-center justify-center">
                        <Icon className="h-4 w-4 text-primary" />
                    </div>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                    <p className="min-w-0 text-[28px] leading-9 font-semibold tracking-tight tabular-nums text-foreground truncate">
                        {kpi.value}
                    </p>
                    {kpi.trend !== null && (
                        <span
                            className={cn(
                                "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular-nums",
                                isPositive
                                    ? "bg-success/10 text-success"
                                    : "bg-destructive/10 text-destructive"
                            )}
                        >
                            <TrendIcon className="h-3 w-3" />
                            {Math.abs(kpi.trend)}%
                        </span>
                    )}
                </div>
                <p
                    className="mt-1 text-xs text-muted-foreground min-h-[1rem] truncate"
                    title={kpi.sub}
                >
                    {kpi.sub ?? " "}
                </p>
            </Card>
        </motion.div>
    );
};

// Leyenda propia en el header de la card (identidad en el swatch, texto en
// muted-foreground — nunca coloreado con el color de la serie).
const ChartLegend = ({
    items,
}: {
    items: { label: string; color: string }[];
}) => (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        {items.map((i) => (
            <span
                key={i.label}
                className="flex items-center gap-1.5 text-xs text-muted-foreground"
            >
                <span
                    className="h-2 w-2 rounded-full shrink-0"
                    style={{ background: i.color }}
                />
                {i.label}
            </span>
        ))}
    </div>
);

const ChartEmpty = ({
    icon: Icon,
    title,
    hint,
    className,
}: {
    icon: React.ElementType;
    title: string;
    hint: string;
    className?: string;
}) => (
    <div
        className={cn(
            "flex flex-col items-center justify-center gap-3",
            className
        )}
    >
        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border/60">
            <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="text-center space-y-1">
            <p className="text-sm font-medium text-foreground">{title}</p>
            <p className="text-xs text-muted-foreground">{hint}</p>
        </div>
    </div>
);

// Donut de tamaño fijo (sin ResponsiveContainer — garantiza el centrado del
// overlay) + leyenda-tabla con orden FIJO (nunca por valor).
const DonutBody = ({
    data,
    legend,
}: {
    data: PieDatum[];
    legend: PieDatum[];
}) => {
    const total = data.reduce((s, d) => s + d.value, 0);
    const totalLabel = formatCurrency(total);
    return (
        <div className="flex-1 flex flex-col sm:flex-row items-center gap-6 p-5">
            <div className="relative h-[200px] w-[200px] shrink-0">
                <PieChart width={200} height={200}>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={70}
                        outerRadius={88}
                        paddingAngle={2}
                        cornerRadius={3}
                        dataKey="value"
                        stroke="none"
                        isAnimationActive={false}
                    >
                        {data.map((entry, idx) => (
                            <Cell key={idx} fill={entry.fill} />
                        ))}
                    </Pie>
                    <Tooltip content={<PieTooltip />} />
                </PieChart>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
                        Total
                    </span>
                    <span
                        className={cn(
                            "font-semibold tabular-nums tracking-tight text-foreground",
                            totalLabel.length > 12 ? "text-sm" : "text-base"
                        )}
                    >
                        {totalLabel}
                    </span>
                </div>
            </div>
            <ul className="flex-1 w-full space-y-2.5 min-w-0">
                {legend.map((item) => (
                    <li key={item.name} className="flex items-center gap-2.5">
                        <span
                            className="h-2.5 w-2.5 rounded-[3px] shrink-0"
                            style={{ background: item.fill }}
                        />
                        <span className="flex-1 truncate text-[13px] text-muted-foreground">
                            {item.name}
                        </span>
                        <span className="text-[13px] font-medium tabular-nums text-foreground">
                            {formatCurrency(item.value)}
                        </span>
                        <span className="w-11 text-right text-xs tabular-nums text-muted-foreground">
                            {total > 0
                                ? ((item.value / total) * 100).toFixed(1)
                                : "0.0"}
                            %
                        </span>
                    </li>
                ))}
            </ul>
        </div>
    );
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

const CURRENT_YEAR = new Date().getFullYear();
const FALLBACK_MIN_YEAR = 2019;

const Page = () => {
    const { data: session } = useSession() as any;
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<boolean>(false);
    const [year, setYear] = useState<string>(String(CURRENT_YEAR));
    const [yearOptions, setYearOptions] = useState<number[]>(() =>
        Array.from(
            { length: CURRENT_YEAR - FALLBACK_MIN_YEAR + 1 },
            (_, i) => CURRENT_YEAR - i
        )
    );

    // Entrada animada SOLO en el primer render con datos; los cambios de año
    // no re-disparan el stagger (initial={false} se propaga a los hijos).
    // useReducedMotion desactiva la entrada por completo.
    const shouldReduceMotion = useReducedMotion();
    const hasAnimatedRef = useRef(false);

    useEffect(() => {
        if (!loading && data && !error) {
            hasAnimatedRef.current = true;
        }
    }, [loading, data, error]);

    const getYears = async () => {
        try {
            const request = await fetch(
                `${process.env.NEXT_PUBLIC_API_PROXY}/reports/meta/years`,
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${session?.user?.session}`,
                    },
                }
            );
            if (!request.ok) return; // fallback 2019..actual ya establecido
            const range = await request.json();
            const max = Number.isFinite(Number(range?.max))
                ? Number(range.max)
                : CURRENT_YEAR;
            const min =
                Number.isFinite(Number(range?.min)) && Number(range.min) <= max
                    ? Number(range.min)
                    : FALLBACK_MIN_YEAR;
            setYearOptions(
                Array.from({ length: max - min + 1 }, (_, i) => max - i)
            );
        } catch {
            /* fallback silencioso */
        }
    };

    const getDashboard = async (selectedYear: string) => {
        setLoading(true);
        setError(false);
        try {
            const request = await fetch(
                `${process.env.NEXT_PUBLIC_API_PROXY}/stats/dashboard?year=${selectedYear}`,
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${session?.user?.session}`,
                    },
                }
            );
            if (request.ok) {
                const response = await request.json();
                setData(response.data ?? null);
            } else {
                setError(true);
            }
        } catch {
            setError(true);
        }
        setLoading(false);
    };

    useEffect(() => {
        if (session) {
            getYears();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [session]);

    useEffect(() => {
        if (session) {
            getDashboard(year);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [session, year]);

    const formacion = data?.formacion;
    const finanzas = data?.finanzas;

    // ── Derived chart data ──────────────────────────────────────────────────

    const matriculaMensual = formacion?.matriculaPorMes ?? [];

    // Bar list HTML (mismo patrón que Ejecución): nombre completo sin truncar,
    // valor siempre visible y ancho relativo al máximo del período.
    const matriculaArea = (formacion?.matriculaPorArea ?? []).map((a) => ({
        fullArea: a.area,
        total: a.total,
    }));
    const matriculaAreaMax = Math.max(1, ...matriculaArea.map((a) => a.total));

    const monthlySeries = finanzas?.ingresosVsGastosMensual ?? [];

    // Escalas nice de los ejes Y (ticks redondos).
    const matriculaScale = niceAxisScale(
        Math.max(0, ...matriculaMensual.map((m) => m.hombres + m.mujeres))
    );
    const monthlyScale = niceAxisScale(
        Math.max(0, ...monthlySeries.map((m) => Math.max(m.ingresos, m.gastos)))
    );

    // Bar list HTML ordenada desc por % real (sin tope; el ancho visual se
    // recorta a 100 y la sobre-ejecución la marcan fill destructive + icono).
    const executionByProject = (finanzas?.ejecucionPorProyecto ?? [])
        .map((p) => ({ fullName: p.nombre, pctReal: p.pct }))
        .sort((a, b) => b.pctReal - a.pctReal);

    // Fuentes: las 4 de mayor total conservan su color alfabético (chart-1..4
    // por orden alfabético del nombre); el resto se agrupa en "Otras" gris.
    const fuentesByTotal = [...(finanzas?.financiamientoPorFuente ?? [])].sort(
        (a, b) => b.total - a.total
    );
    const fuentesTop = fuentesByTotal.slice(0, 4);
    const fuentesRest = fuentesByTotal.slice(4);
    const fuenteColorByName: Record<string, string> = {};
    [...fuentesTop]
        .sort((a, b) => a.name.localeCompare(b.name, "es"))
        .forEach((f, i) => {
            fuenteColorByName[f.name] = CHART_COLORS[i];
        });
    const financingBySource: PieDatum[] = [
        ...fuentesTop.map((f) => ({
            name: f.name,
            value: f.total,
            fill: fuenteColorByName[f.name],
        })),
        ...(fuentesRest.length
            ? [
                  {
                      name: "Otras",
                      value: fuentesRest.reduce((s, f) => s + f.total, 0),
                      fill: OTHER_COLOR,
                  },
              ]
            : []),
    ];

    // Donaciones: mapeo FIJO por nombre (el color sigue a la entidad).
    const donationsByType: PieDatum[] = (finanzas?.donacionesPorTipo ?? []).map(
        (d) => ({
            name: d.tipo,
            value: d.total,
            fill: DONATION_TYPE_COLORS[d.tipo] ?? OTHER_COLOR,
        })
    );

    // Leyendas de los donuts en ORDEN FIJO (nunca por valor):
    //   fuentes → alfabético es-ES con "Otras" siempre al final;
    //   donaciones → Efectivo, Especie, Beneficio (los presentes).
    const financingLegend = [...financingBySource].sort((a, b) => {
        if (a.name === "Otras") return 1;
        if (b.name === "Otras") return -1;
        return a.name.localeCompare(b.name, "es");
    });
    const donationOrderIdx = (name: string) => {
        const i = DONATION_LEGEND_ORDER.indexOf(name);
        return i === -1 ? DONATION_LEGEND_ORDER.length : i;
    };
    const donationsLegend = [...donationsByType].sort(
        (a, b) => donationOrderIdx(a.name) - donationOrderIdx(b.name)
    );

    // ── Empty states (array vacío o todos los valores 0) ────────────────────

    const periodLabel = year === "all" ? "en el período" : `en ${year}`;

    const matriculaMensualEmpty =
        matriculaMensual.length === 0 ||
        matriculaMensual.every((m) => m.hombres === 0 && m.mujeres === 0);
    const matriculaAreaEmpty =
        matriculaArea.length === 0 ||
        matriculaArea.every((a) => a.total === 0);
    const monthlySeriesEmpty =
        monthlySeries.length === 0 ||
        monthlySeries.every((m) => m.ingresos === 0 && m.gastos === 0);
    const executionEmpty =
        executionByProject.length === 0 ||
        executionByProject.every((p) => p.pctReal === 0);
    const financingEmpty =
        financingBySource.length === 0 ||
        financingBySource.every((f) => f.value === 0);
    const donationsEmpty =
        donationsByType.length === 0 ||
        donationsByType.every((d) => d.value === 0);

    // ── KPI defs ────────────────────────────────────────────────────────────

    const formacionKpis: KpiDef[] = [
        {
            label: "Estudiantes Matriculados",
            value: prettifyNumber(formacion?.estudiantesMatriculados ?? 0),
            icon: GraduationCap,
            trend: formacion?.estudiantesTrend ?? null,
        },
        {
            label: "Procesos Impartidos",
            value: prettifyNumber(formacion?.procesosImpartidos ?? 0),
            icon: BookOpen,
            trend: null,
            // "hoy" es un dato del presente: mostrarlo bajo un año pasado
            // mezclaría períodos en la misma card.
            sub:
                year === String(CURRENT_YEAR) || year === "all"
                    ? `${formacion?.procesosEnCurso ?? 0} en curso hoy`
                    : undefined,
        },
        {
            label: "Centros Activos",
            value: prettifyNumber(formacion?.centrosActivos ?? 0),
            icon: Building2,
            trend: null,
        },
        {
            label: "Instructores Activos",
            value: prettifyNumber(formacion?.instructoresActivos ?? 0),
            icon: Users,
            trend: null,
        },
    ];

    const finanzasKpis: KpiDef[] = [
        {
            label: "Proyectos Activos",
            value: prettifyNumber(finanzas?.proyectosActivos ?? 0),
            icon: FolderKanban,
            trend: null,
            // Conteo global: junto a vecinas filtradas por año necesita el
            // mismo clarificador que "Ejecución de Fondos".
            sub: "no se filtra por año",
        },
        {
            label: "Ingresos Recibidos",
            value: formatCurrency(finanzas?.ingresosRecibidos ?? 0),
            icon: DollarSign,
            trend: null,
        },
        {
            label: "Gastos",
            value: formatCurrency(finanzas?.gastos ?? 0),
            icon: TrendingUp,
            trend: null,
        },
        {
            label: "% Ejecución Financiera",
            value:
                finanzas?.pctEjecucion != null
                    ? `${finanzas.pctEjecucion.toFixed(1)}%`
                    : "N/D",
            icon: Percent,
            trend: null,
            sub: "gastos en efectivo ÷ ingresos en efectivo",
        },
    ];

    const skipEntrance = Boolean(shouldReduceMotion) || hasAnimatedRef.current;

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
                initial={skipEntrance ? false : "hidden"}
                animate="show"
                className="mt-6 space-y-10"
            >
                {/* ---------- HEADER ---------- */}
                <motion.div
                    variants={fadeUp}
                    className="flex flex-wrap items-end justify-between gap-4 border-b border-border/60 pb-5"
                >
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                            Dashboard
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Resumen general del sistema
                        </p>
                    </div>
                    <div className="flex flex-col gap-1">
                        <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                            Período
                        </span>
                        <Select value={year} onValueChange={setYear}>
                            <SelectTrigger className="w-[160px] bg-card border-border text-foreground font-medium shadow-sm data-[state=open]:border-primary/60 transition-colors">
                                <span className="flex items-center min-w-0">
                                    <CalendarDays className="h-4 w-4 text-muted-foreground mr-2 shrink-0" />
                                    <SelectValue placeholder="Año" />
                                </span>
                            </SelectTrigger>
                            <SelectContent>
                                {yearOptions.map((y) => (
                                    <SelectItem key={y} value={String(y)}>
                                        {y}
                                    </SelectItem>
                                ))}
                                <SelectSeparator />
                                <SelectItem value="all">Todos</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </motion.div>

                {loading && !data ? (
                    <>
                        {/* ---------- SKELETON (solo primera carga) ---------- */}
                        {[0, 1].map((section) => (
                            <div key={section} className="space-y-5">
                                <div className="animate-pulse flex items-center gap-3">
                                    <div className="h-4 w-1 rounded-full bg-border/50" />
                                    <div className="h-3 w-32 rounded bg-border/40" />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
                                    {[0, 1, 2, 3].map((i) => (
                                        <Card
                                            key={i}
                                            className="rounded-lg border border-border/60 bg-card p-5 shadow-[0_1px_2px_rgb(0_0_0/0.04)]"
                                        >
                                            <div className="animate-pulse">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="h-3 w-24 rounded bg-border/40" />
                                                    <div className="h-8 w-8 rounded-md bg-border/40" />
                                                </div>
                                                <div className="mt-3 h-9 w-28 rounded bg-border/40" />
                                                <div className="mt-2 h-3 w-32 rounded bg-border/40" />
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                                <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                                    {(section === 0
                                        ? [0, 1]
                                        : [0, 1, 2, 3]
                                    ).map((i) => (
                                        <Card
                                            key={i}
                                            className="rounded-lg border border-border/60 bg-card shadow-[0_1px_2px_rgb(0_0_0/0.04)]"
                                        >
                                            <div className="border-b border-border/50 px-5 py-4">
                                                <div className="animate-pulse h-4 w-48 rounded bg-border/40" />
                                            </div>
                                            <div className="p-5">
                                                <div className="animate-pulse h-[280px] rounded-lg bg-border/40" />
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </>
                ) : error || !data ? (
                    /* ---------- ERROR ---------- */
                    <motion.div variants={fadeUp}>
                        <Card className="rounded-lg border border-border/60 bg-card p-10 flex flex-col items-center justify-center text-center gap-3 shadow-[0_1px_2px_rgb(0_0_0/0.04)]">
                            <AlertCircle className="h-8 w-8 text-destructive" />
                            <p className="text-sm text-muted-foreground">
                                No se pudieron cargar las estadísticas del
                                sistema.
                            </p>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => getDashboard(year)}
                            >
                                Reintentar
                            </Button>
                        </Card>
                    </motion.div>
                ) : (
                <div
                    className={cn(
                        "space-y-10 transition-opacity",
                        loading && "opacity-60 pointer-events-none"
                    )}
                >

                {/* ══════════════ FORMACIÓN ══════════════ */}
                <section className="space-y-5">
                <SectionHeader>Formación</SectionHeader>

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
                    {formacionKpis.map((kpi) => (
                        <KpiCard key={kpi.label} kpi={kpi} />
                    ))}
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 items-stretch">
                    {/* Stacked bar: matrícula por mes (Hombres + Mujeres) */}
                    <motion.div variants={fadeUp} className="h-full">
                        <Card className="h-full flex flex-col rounded-lg border border-border/60 bg-card shadow-[0_1px_2px_rgb(0_0_0/0.04)]">
                            <div className="flex items-start justify-between gap-4 border-b border-border/50 px-5 py-4 min-h-[70px]">
                                <div className="min-w-0">
                                    <h3 className="text-sm font-semibold tracking-tight leading-5 text-foreground">
                                        Matrícula por Mes
                                    </h3>
                                    {year === 'all' && (
                                        <p className="mt-0.5 text-xs text-muted-foreground">
                                            Últimos 12 meses
                                        </p>
                                    )}
                                </div>
                                {!matriculaMensualEmpty && (
                                    <ChartLegend
                                        items={[
                                            {
                                                label: "Hombres",
                                                color: "hsl(var(--chart-1))",
                                            },
                                            {
                                                label: "Mujeres",
                                                color: "hsl(var(--chart-2))",
                                            },
                                        ]}
                                    />
                                )}
                            </div>
                            <div className="p-5 flex-1">
                                {matriculaMensualEmpty ? (
                                    <ChartEmpty
                                        icon={BarChart3}
                                        title={`Sin matrícula registrada ${periodLabel}`}
                                        hint="Cuando se registren estudiantes, verás aquí su evolución mes a mes."
                                        className="h-full min-h-[280px]"
                                    />
                                ) : (
                                    <div className="h-full min-h-[280px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart
                                                data={matriculaMensual}
                                                margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                                                barCategoryGap="25%"
                                            >
                                                <CartesianGrid
                                                    vertical={false}
                                                    stroke="hsl(var(--border))"
                                                    strokeOpacity={0.5}
                                                />
                                                <XAxis
                                                    dataKey="mes"
                                                    interval={0}
                                                    tick={AXIS_TICK}
                                                    axisLine={false}
                                                    tickLine={false}
                                                    tickMargin={8}
                                                />
                                                <YAxis
                                                    domain={[0, matriculaScale.max]}
                                                    ticks={matriculaScale.ticks}
                                                    tickFormatter={(v: number) =>
                                                        prettifyNumber(v)
                                                    }
                                                    width={44}
                                                    tick={AXIS_TICK}
                                                    axisLine={false}
                                                    tickLine={false}
                                                    tickMargin={8}
                                                />
                                                <Tooltip
                                                    content={
                                                        <CustomTooltip
                                                            formatter={(e: any) =>
                                                                prettifyNumber(e.value)
                                                            }
                                                        />
                                                    }
                                                    cursor={{ fill: "hsl(var(--primary) / 0.08)" }}
                                                />
                                                {/* Separador de 2px entre segmentos: stroke color card.
                                                    Track fantasma en la PRIMERA Bar del stack. */}
                                                <Bar
                                                    dataKey="hombres"
                                                    name="Hombres"
                                                    stackId="sexo"
                                                    fill="hsl(var(--chart-1))"
                                                    stroke="hsl(var(--card))"
                                                    strokeWidth={2}
                                                    maxBarSize={28}
                                                    background={BAR_TRACK}
                                                    isAnimationActive={false}
                                                />
                                                <Bar
                                                    dataKey="mujeres"
                                                    name="Mujeres"
                                                    stackId="sexo"
                                                    fill="hsl(var(--chart-2))"
                                                    stroke="hsl(var(--card))"
                                                    strokeWidth={2}
                                                    maxBarSize={28}
                                                    radius={[4, 4, 0, 0]}
                                                    isAnimationActive={false}
                                                />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                )}
                            </div>
                        </Card>
                    </motion.div>

                    {/* Horizontal bar: matrícula por área técnica */}
                    <motion.div variants={fadeUp} className="h-full">
                        <Card className="h-full flex flex-col rounded-lg border border-border/60 bg-card shadow-[0_1px_2px_rgb(0_0_0/0.04)]">
                            <div className="flex items-start justify-between gap-4 border-b border-border/50 px-5 py-4 min-h-[70px]">
                                <div className="min-w-0">
                                    <h3 className="text-sm font-semibold tracking-tight leading-5 text-foreground">
                                        Matrícula por Área Técnica
                                    </h3>
                                </div>
                                {/* Una sola serie: sin leyenda (el título la nombra) */}
                            </div>
                            <div className="p-5 flex-1">
                                {matriculaAreaEmpty ? (
                                    <ChartEmpty
                                        icon={BarChart3}
                                        title={`Sin matrícula registrada ${periodLabel}`}
                                        hint="Las áreas técnicas aparecerán cuando haya estudiantes matriculados."
                                        className="h-full min-h-[280px]"
                                    />
                                ) : (
                                    <div className="h-full min-h-[280px] space-y-4">
                                        {matriculaArea.map((a) => (
                                            <div
                                                key={a.fullArea}
                                                className="space-y-1.5"
                                            >
                                                <div className="flex items-baseline justify-between gap-3">
                                                    <p
                                                        className="text-[13px] leading-5 text-foreground truncate"
                                                        title={a.fullArea}
                                                    >
                                                        {a.fullArea}
                                                    </p>
                                                    <span className="text-xs font-semibold tabular-nums text-foreground shrink-0">
                                                        {prettifyNumber(a.total)}
                                                    </span>
                                                </div>
                                                <div className="h-2 rounded-full bg-border/40 overflow-hidden">
                                                    <div
                                                        className="h-full rounded-full"
                                                        style={{
                                                            width: `${(a.total / matriculaAreaMax) * 100}%`,
                                                            background:
                                                                "hsl(var(--chart-1))",
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </Card>
                    </motion.div>
                </div>
                </section>

                {/* ══════════════ FINANZAS DE PROYECTOS ══════════════ */}
                <section className="space-y-5">
                <SectionHeader>Finanzas de Proyectos</SectionHeader>

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
                    {finanzasKpis.map((kpi) => (
                        <KpiCard key={kpi.label} kpi={kpi} />
                    ))}
                </div>

                {/* ---------- ROW: Ingresos vs Gastos + Ejecución ---------- */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 items-stretch">
                    {/* Area: monthly ingresos vs gastos */}
                    <motion.div variants={fadeUp} className="h-full">
                        <Card className="h-full flex flex-col rounded-lg border border-border/60 bg-card shadow-[0_1px_2px_rgb(0_0_0/0.04)]">
                            <div className="flex items-start justify-between gap-4 border-b border-border/50 px-5 py-4 min-h-[70px]">
                                <div className="min-w-0">
                                    <h3 className="text-sm font-semibold tracking-tight leading-5 text-foreground">
                                        Ingresos vs Gastos (Mensual)
                                    </h3>
                                    {year === 'all' && (
                                        <p className="mt-0.5 text-xs text-muted-foreground">
                                            Últimos 12 meses
                                        </p>
                                    )}
                                </div>
                                {!monthlySeriesEmpty && (
                                    <ChartLegend
                                        items={[
                                            {
                                                label: "Ingresos",
                                                color: "hsl(var(--chart-1))",
                                            },
                                            {
                                                label: "Gastos",
                                                color: "hsl(var(--chart-2))",
                                            },
                                        ]}
                                    />
                                )}
                            </div>
                            <div className="p-5 flex-1">
                                {monthlySeriesEmpty ? (
                                    <ChartEmpty
                                        icon={TrendingUp}
                                        title={`Sin movimientos financieros ${periodLabel}`}
                                        hint="Prueba con otro año, o registra ingresos y gastos de proyectos."
                                        className="h-full min-h-[280px]"
                                    />
                                ) : (
                                    <div className="h-full min-h-[280px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart
                                                data={monthlySeries}
                                                margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                                            >
                                                <defs>
                                                    <linearGradient
                                                        id="gradIngresos"
                                                        x1="0"
                                                        y1="0"
                                                        x2="0"
                                                        y2="1"
                                                    >
                                                        <stop
                                                            offset="5%"
                                                            stopColor="hsl(var(--chart-1))"
                                                            stopOpacity={0.18}
                                                        />
                                                        <stop
                                                            offset="95%"
                                                            stopColor="hsl(var(--chart-1))"
                                                            stopOpacity={0}
                                                        />
                                                    </linearGradient>
                                                    <linearGradient
                                                        id="gradGastos"
                                                        x1="0"
                                                        y1="0"
                                                        x2="0"
                                                        y2="1"
                                                    >
                                                        <stop
                                                            offset="5%"
                                                            stopColor="hsl(var(--chart-2))"
                                                            stopOpacity={0.18}
                                                        />
                                                        <stop
                                                            offset="95%"
                                                            stopColor="hsl(var(--chart-2))"
                                                            stopOpacity={0}
                                                        />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid
                                                    vertical={false}
                                                    stroke="hsl(var(--border))"
                                                    strokeOpacity={0.5}
                                                />
                                                <XAxis
                                                    dataKey="mes"
                                                    tick={AXIS_TICK}
                                                    axisLine={false}
                                                    tickLine={false}
                                                    tickMargin={8}
                                                />
                                                <YAxis
                                                    domain={[0, monthlyScale.max]}
                                                    ticks={monthlyScale.ticks}
                                                    width={44}
                                                    tickFormatter={formatAxisMoney}
                                                    tick={AXIS_TICK}
                                                    axisLine={false}
                                                    tickLine={false}
                                                    tickMargin={8}
                                                />
                                                <Tooltip
                                                    content={<CustomTooltip />}
                                                />
                                                <Area
                                                    type="monotone"
                                                    dataKey="ingresos"
                                                    name="Ingresos"
                                                    stroke="hsl(var(--chart-1))"
                                                    fillOpacity={1}
                                                    fill="url(#gradIngresos)"
                                                    strokeWidth={2}
                                                    dot={false}
                                                    activeDot={{ r: 3, strokeWidth: 0 }}
                                                    isAnimationActive={false}
                                                />
                                                <Area
                                                    type="monotone"
                                                    dataKey="gastos"
                                                    name="Gastos"
                                                    stroke="hsl(var(--chart-2))"
                                                    fillOpacity={1}
                                                    fill="url(#gradGastos)"
                                                    strokeWidth={2}
                                                    dot={false}
                                                    activeDot={{ r: 3, strokeWidth: 0 }}
                                                    isAnimationActive={false}
                                                />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                )}
                            </div>
                        </Card>
                    </motion.div>

                    {/* Bar list HTML: execution % (acumulado por proyecto) */}
                    <motion.div variants={fadeUp} className="h-full">
                        <Card className="h-full flex flex-col rounded-lg border border-border/60 bg-card shadow-[0_1px_2px_rgb(0_0_0/0.04)]">
                            <div className="flex items-start justify-between gap-4 border-b border-border/50 px-5 py-4 min-h-[70px]">
                                <div className="min-w-0">
                                    <h3 className="text-sm font-semibold tracking-tight leading-5 text-foreground">
                                        Ejecución de Fondos por Proyecto
                                    </h3>
                                    <p className="mt-0.5 text-xs text-muted-foreground">
                                        % acumulado por proyecto (no se filtra
                                        por año)
                                    </p>
                                </div>
                            </div>
                            <div className="p-5 flex-1">
                                {executionEmpty ? (
                                    <ChartEmpty
                                        icon={FolderKanban}
                                        title="Sin proyectos con ejecución registrada"
                                        hint="Los proyectos activos aparecerán aquí con su % ejecutado."
                                        className="h-full min-h-[280px]"
                                    />
                                ) : (
                                    <div className="min-h-[280px] max-h-[420px] overflow-y-auto pr-2 space-y-4 [scrollbar-width:thin] [scrollbar-color:hsl(var(--border))_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border">
                                        {executionByProject.map((p) => (
                                            <div
                                                key={p.fullName}
                                                className="space-y-1.5"
                                            >
                                                <div className="flex items-baseline justify-between gap-3">
                                                    <p
                                                        className="text-[13px] leading-5 text-foreground truncate"
                                                        title={p.fullName}
                                                    >
                                                        {p.fullName}
                                                    </p>
                                                    <span className="flex items-center gap-1 shrink-0">
                                                        {p.pctReal > 100 && (
                                                            <AlertCircle className="h-3.5 w-3.5 text-destructive" />
                                                        )}
                                                        <span className="text-xs font-semibold tabular-nums text-foreground">
                                                            {p.pctReal.toFixed(1)}%
                                                        </span>
                                                    </span>
                                                </div>
                                                <div className="h-2 rounded-full bg-border/40 overflow-hidden">
                                                    <div
                                                        className="h-full rounded-full"
                                                        style={{
                                                            width: `${Math.min(100, p.pctReal)}%`,
                                                            background:
                                                                p.pctReal > 100
                                                                    ? "hsl(var(--destructive))"
                                                                    : "hsl(var(--chart-1))",
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </Card>
                    </motion.div>
                </div>

                {/* ---------- ROW: Donuts ---------- */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 items-stretch">
                    {/* Donut: financing by source */}
                    <motion.div variants={fadeUp} className="h-full">
                        <Card className="h-full flex flex-col rounded-lg border border-border/60 bg-card shadow-[0_1px_2px_rgb(0_0_0/0.04)]">
                            <div className="flex items-start justify-between gap-4 border-b border-border/50 px-5 py-4 min-h-[70px]">
                                <div className="min-w-0">
                                    <h3 className="text-sm font-semibold tracking-tight leading-5 text-foreground">
                                        Financiamiento por Fuente
                                    </h3>
                                </div>
                            </div>
                            {financingEmpty ? (
                                <div className="p-5 flex-1">
                                    <ChartEmpty
                                        icon={PieChartIcon}
                                        title={`Sin registros ${periodLabel}`}
                                        hint="Aún no hay montos para este período."
                                        className="h-full min-h-[200px]"
                                    />
                                </div>
                            ) : (
                                <DonutBody
                                    data={financingBySource}
                                    legend={financingLegend}
                                />
                            )}
                        </Card>
                    </motion.div>

                    {/* Donut: donations by type */}
                    <motion.div variants={fadeUp} className="h-full">
                        <Card className="h-full flex flex-col rounded-lg border border-border/60 bg-card shadow-[0_1px_2px_rgb(0_0_0/0.04)]">
                            <div className="flex items-start justify-between gap-4 border-b border-border/50 px-5 py-4 min-h-[70px]">
                                <div className="min-w-0">
                                    <h3 className="text-sm font-semibold tracking-tight leading-5 text-foreground">
                                        Donaciones por Tipo
                                    </h3>
                                </div>
                            </div>
                            {donationsEmpty ? (
                                <div className="p-5 flex-1">
                                    <ChartEmpty
                                        icon={PieChartIcon}
                                        title={`Sin registros ${periodLabel}`}
                                        hint="Aún no hay montos para este período."
                                        className="h-full min-h-[200px]"
                                    />
                                </div>
                            ) : (
                                <DonutBody
                                    data={donationsByType}
                                    legend={donationsLegend}
                                />
                            )}
                        </Card>
                    </motion.div>
                </div>
                </section>

                </div>
                )}

            </motion.div>
        </div>
    );
};

export default Page;
