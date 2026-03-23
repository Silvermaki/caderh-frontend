"use client";

import React, { useState, useEffect, Suspense, useMemo, useRef } from "react";
import { Breadcrumbs, BreadcrumbItem } from "@/components/ui/breadcrumbs";
import DataTable from "@/components/ui/service-datatable";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, ChevronLeft, ChevronRight, Loader2, Search, ChevronsUpDown, Check } from "lucide-react";
import { Stepper, Step, StepLabel } from "@/components/ui/steps";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { useMediaQuery } from "@/hooks/use-media-query";
import SkeletonTable from "@/components/skeleton-table";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useSession } from "next-auth/react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import ExcelActions from "@/components/centro/excel-actions";
import { cn } from "@/lib/utils";

const apiBase = process.env.NEXT_PUBLIC_API_URL;

const emptyForm = {
    centro_id: "",
    nombre: "",
    codigo: "",
    curso_id: "",
    instructor_id: "",
    metodologia_id: "",
    otra_metodologia: "",
    fecha_inicial: "",
    fecha_final: "",
    duracion_horas: "",
    tipo_jornada_id: "",
    horario: "",
    dias: "",
    sede: "0",
    lugar: "",
};

function PageContent() {
    const searchParams: any = useSearchParams();
    const isMobile = useMediaQuery("(max-width: 1000px)");
    const pathname = usePathname();
    const router = useRouter();
    const { data: session } = useSession() as any;
    const userRole = session?.user?.role;
    const isSupervisor = userRole === "ADMIN" || userRole === "MANAGER";
    const authHeaders: any = { Authorization: `Bearer ${session?.user?.session}` };

    const [processes, setProcesses] = useState<any[]>([]);
    const [offset, setOffset] = useState(0);
    const [limit, setLimit] = useState(10);
    const [count, setCount] = useState(0);
    const [desc, setDesc] = useState(false);
    const [sort, setSort] = useState("nombre");
    const searchInit = new URLSearchParams(searchParams).get("search") ?? "";
    const [search, setSearch] = useState(searchInit);
    const [loading, setLoading] = useState(true);

    const [centros, setCentros] = useState<{ id: number; nombre: string }[]>([]);
    const [centroFilter, setCentroFilter] = useState("all");
    const [centroFilterOpen, setCentroFilterOpen] = useState(false);
    const [centroFilterSearch, setCentroFilterSearch] = useState("");
    const [centroSelectWidth, setCentroSelectWidth] = useState(256);
    const centroMeasureRef = useRef<HTMLSpanElement>(null);

    // Create dialog state
    const [dialogOpen, setDialogOpen] = useState(false);
    const [form, setForm] = useState({ ...emptyForm });
    const [submitting, setSubmitting] = useState(false);
    const [wizardStep, setWizardStep] = useState(0);

    // Centro popover in dialog
    const [centroOpen, setCentroOpen] = useState(false);
    const [centroSearch, setCentroSearch] = useState("");

    // Dependent selects
    const [courses, setCourses] = useState<any[]>([]);
    const [instructors, setInstructors] = useState<any[]>([]);
    const [metodologias, setMetodologias] = useState<any[]>([]);
    const [tipoJornadas, setTipoJornadas] = useState<any[]>([]);
    const [diasCatalogo, setDiasCatalogo] = useState<{ value: string; label: string }[]>([]);
    const [diasOpen, setDiasOpen] = useState(false);

    const selectedCentro = useMemo(
        () => centros.find((c) => c.id.toString() === form.centro_id) ?? null,
        [centros, form.centro_id],
    );

    const filteredCentros = useMemo(() => {
        if (!centroSearch) return centros;
        const q = centroSearch.toLowerCase();
        return centros.filter((c) => c.nombre.toLowerCase().includes(q));
    }, [centros, centroSearch]);

    const longestCentroLabel = useMemo(() => {
        const labels = ["Todos los centros", ...centros.map((c) => c.nombre)];
        return labels.reduce((a, b) => (a.length >= b.length ? a : b), "");
    }, [centros]);

    useEffect(() => {
        if (!longestCentroLabel || !centroMeasureRef.current) return;
        const w = centroMeasureRef.current.getBoundingClientRect().width;
        setCentroSelectWidth(Math.ceil(w) + 48);
    }, [longestCentroLabel, centros]);

    const selectedCentroFilterLabel = centroFilter === "all" ? "Todos los centros" : (centros.find((c) => c.id.toString() === centroFilter)?.nombre ?? "Todos los centros");

    const filteredCentrosForFilter = useMemo(() => {
        const list = [{ value: "all", label: "Todos los centros" }, ...centros.map((c) => ({ value: c.id.toString(), label: c.nombre }))];
        if (!centroFilterSearch.trim()) return list;
        const q = centroFilterSearch.toLowerCase();
        return list.filter((item) => item.label.toLowerCase().includes(q));
    }, [centros, centroFilterSearch]);

    const fetchCentros = async () => {
        try {
            const res = await fetch(`${apiBase}/api/centros/centros?all=true`, { headers: authHeaders });
            if (res.ok) { const d = await res.json(); setCentros(d.data ?? []); }
        } catch { /* silent */ }
    };

    const fetchProcesses = async (params: string) => {
        setLoading(true);
        try {
            const res = await fetch(`${apiBase}/api/centros/processes?${params}`, { headers: authHeaders });
            if (res.ok) { const d = await res.json(); setProcesses(d.data ?? []); setCount(d.count ?? 0); }
            else toast.error("Error al cargar procesos");
        } catch { toast.error("Error al cargar procesos"); }
        setLoading(false);
    };

    const buildParams = (overrides: Record<string, any> = {}) => {
        const p = new URLSearchParams({
            offset: String((overrides.offset ?? offset) * (overrides.limit ?? limit)),
            limit: String(overrides.limit ?? limit),
            sort: overrides.sort ?? sort,
            desc: (overrides.desc ?? desc) ? "desc" : "asc",
            search: overrides.search ?? search,
        });
        const cid = overrides.centro_id ?? centroFilter;
        if (cid && cid !== "all") p.set("centro_id", cid);
        return p.toString();
    };

    const getDataInit = async (searchValue: string) => {
        setSearch(searchValue); setOffset(0);
        await fetchProcesses(buildParams({ search: searchValue, offset: 0 }));
    };
    const getDataSort = (sorting: string) => {
        const newDesc = !desc; setDesc(newDesc); setSort(sorting);
        fetchProcesses(buildParams({ sort: sorting, desc: newDesc }));
    };
    const getDataSearch = (searchValue: string) => {
        setSearch(searchValue); setOffset(0);
        fetchProcesses(buildParams({ search: searchValue, offset: 0 }));
    };
    const getDataPagination = (newOffset: number) => {
        setOffset(newOffset);
        fetchProcesses(buildParams({ offset: newOffset }));
    };
    const onSort = (sorting: { id: string }) => getDataSort(sorting.id);
    const onSearch = (value: string) => {
        if (value) window.history.replaceState(null, "", `${pathname}?search=${value}`);
        else window.history.replaceState(null, "", pathname);
        getDataSearch(value);
    };
    const onRefresh = () => { window.history.replaceState(null, "", pathname); getDataInit(""); };
    const reloadList = () => fetchProcesses(buildParams());

    // Fetch courses & instructors when centro_id changes in form
    useEffect(() => {
        if (!form.centro_id) { setCourses([]); setInstructors([]); return; }
        const centroId = form.centro_id;
        (async () => {
            try {
                const res = await fetch(`${apiBase}/api/centros/centros/${centroId}/cursos?limit=100&offset=0`, { headers: authHeaders });
                if (res.ok) { const d = await res.json(); setCourses(d.data ?? []); }
            } catch { /* silent */ }
        })();
        (async () => {
            try {
                const res = await fetch(`${apiBase}/api/centros/centros/${centroId}/instructors?limit=100&offset=0`, { headers: authHeaders });
                if (res.ok) { const d = await res.json(); setInstructors(d.data ?? []); }
            } catch { /* silent */ }
        })();
    }, [form.centro_id]);

    const fetchMetodologias = async () => {
        try {
            const res = await fetch(`${apiBase}/api/centros/metodologias`, { headers: authHeaders });
            if (res.ok) { const d = await res.json(); setMetodologias(d.data ?? []); }
        } catch { /* silent */ }
    };

    const fetchTipoJornadas = async () => {
        try {
            const res = await fetch(`${apiBase}/api/centros/tipo-jornadas`, { headers: authHeaders });
            if (res.ok) { const d = await res.json(); setTipoJornadas(d.data ?? []); }
        } catch { /* silent */ }
    };

    const fetchDiasCatalogo = async () => {
        try {
            const res = await fetch(`${apiBase}/api/centros/dias-catalogo`, { headers: authHeaders });
            if (res.ok) { const d = await res.json(); setDiasCatalogo(d.data ?? []); }
        } catch { /* silent */ }
    };

    useEffect(() => { if (session) { fetchCentros(); fetchMetodologias(); fetchTipoJornadas(); fetchDiasCatalogo(); getDataInit(searchInit); } }, [session]);
    useEffect(() => { if (processes.length > 0) getDataPagination(0); }, [limit]);

    useEffect(() => {
        if (!form.curso_id) return;
        const selected = courses.find((c: any) => c.id.toString() === form.curso_id);
        if (selected?.total_horas != null) {
            setField("duracion_horas", String(selected.total_horas));
        }
    }, [form.curso_id, courses]);

    const parseDias = (raw: string): string[] => {
        if (!raw) return [];
        try { const arr = JSON.parse(raw); if (Array.isArray(arr)) return arr.map(String); } catch { /* not JSON */ }
        return raw.split(",").filter(Boolean).map((s) => s.trim());
    };

    const selectedDias = useMemo(() => parseDias(form.dias), [form.dias]);

    const toggleDia = (val: string) => {
        const current = selectedDias.includes(val)
            ? selectedDias.filter((d) => d !== val)
            : [...selectedDias, val];
        current.sort((a, b) => Number(a) - Number(b));
        setField("dias", JSON.stringify(current));
    };

    const diasDisplayLabel = useMemo(() => {
        if (selectedDias.length === 0) return "";
        const sorted = [...selectedDias].sort((a, b) => Number(a) - Number(b));
        return sorted
            .map((v) => diasCatalogo.find((d) => d.value === v)?.label ?? v)
            .join(", ");
    }, [selectedDias, diasCatalogo]);

    const openCreateDialog = () => {
        setForm({ ...emptyForm });
        setCourses([]);
        setInstructors([]);
        setWizardStep(0);
        setDialogOpen(true);
    };

    const validateStep1 = (): boolean => {
        const step1Required: (keyof typeof emptyForm)[] = [
            "centro_id", "nombre", "codigo", "curso_id", "instructor_id", "metodologia_id",
        ];
        for (const key of step1Required) {
            if (!form[key]) { toast.error("Complete todos los campos requeridos del paso 1"); return false; }
        }
        return true;
    };

    const goToStep2 = () => {
        if (validateStep1()) setWizardStep(1);
    };

    const setField = (key: string, value: string) => setForm((prev) => ({ ...prev, [key]: value }));

    const handleCreate = async () => {
        const required: (keyof typeof emptyForm)[] = [
            "centro_id", "nombre", "codigo", "curso_id", "instructor_id",
            "metodologia_id", "fecha_inicial", "fecha_final", "duracion_horas",
            "tipo_jornada_id", "horario", "dias",
        ];
        for (const key of required) {
            if (!form[key]) { toast.error("Complete todos los campos requeridos"); return; }
        }
        if (form.fecha_inicial && form.fecha_final && form.fecha_inicial > form.fecha_final) {
            toast.error("La fecha de inicio debe ser anterior a la fecha fin");
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch(`${apiBase}/api/centros/processes`, {
                method: "POST",
                headers: { ...authHeaders, "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...form,
                    centro_id: Number(form.centro_id),
                    curso_id: Number(form.curso_id),
                    instructor_id: Number(form.instructor_id),
                    metodologia_id: Number(form.metodologia_id),
                    tipo_jornada_id: Number(form.tipo_jornada_id),
                    duracion_horas: Number(form.duracion_horas),
                    sede: Number(form.sede),
                }),
            });
            if (res.ok) {
                toast.success("Proceso creado");
                setDialogOpen(false);
                reloadList();
            } else {
                const d = await res.json();
                toast.error(d.message ?? "Error al crear proceso");
            }
        } catch { toast.error("Error al crear proceso"); }
        setSubmitting(false);
    };

    const sortableHeader = (label: string) => ({ column }: any) => (
        <Button variant="ghost" color="dark" className="p-2" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            {label}<ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
    );

    const columns: any[] = [
        {
            accessorKey: "centro_nombre", header: "Centro",
            meta: { headerClassName: "w-[30%] max-w-[14rem]", cellClassName: "w-[30%] max-w-[14rem] overflow-hidden" },
            cell: ({ row }: any) => (
                <span className="text-sm text-muted-foreground block truncate" title={row.original.centro_nombre ?? ""}>
                    {row.original.centro_nombre ?? "-"}
                </span>
            ),
        },
        {
            accessorKey: "nombre", header: sortableHeader("Nombre"),
            cell: ({ row }: any) => (
                <span className="text-sm font-medium text-primary">{row.original.nombre ?? "-"}</span>
            ),
        },
        {
            accessorKey: "codigo", header: "Código",
            cell: ({ row }: any) => <span className="text-sm">{row.original.codigo ?? "-"}</span>,
        },
        {
            accessorKey: "curso_nombre", header: "Curso",
            cell: ({ row }: any) => <span className="text-sm text-muted-foreground">{row.original.curso_nombre ?? "-"}</span>,
        },
        {
            accessorKey: "instructor_nombre", header: "Instructor",
            cell: ({ row }: any) => <span className="text-sm text-muted-foreground">{row.original.instructor_nombre ?? "-"}</span>,
        },
        {
            accessorKey: "fecha_inicial", header: "Fecha Inicio",
            cell: ({ row }: any) => <span className="text-sm">{row.original.fecha_inicial ?? "-"}</span>,
        },
        {
            accessorKey: "fecha_final", header: "Fecha Fin",
            cell: ({ row }: any) => <span className="text-sm">{row.original.fecha_final ?? "-"}</span>,
        },
    ];

    const mobileColumns: any[] = [
        {
            accessorKey: "nombre", header: sortableHeader("Nombre"),
            cell: ({ row }: any) => (
                <div>
                    <span className="text-sm font-medium text-primary">{row.original.nombre ?? "-"}</span>
                    <span className="text-xs text-muted-foreground block">{row.original.centro_nombre}</span>
                </div>
            ),
        },
    ];

    return (
        <div className="mb-4">
            <Breadcrumbs>
                <BreadcrumbItem>Plataforma</BreadcrumbItem>
                <BreadcrumbItem>Centros</BreadcrumbItem>
                <BreadcrumbItem className="text-primary">Procesos Educativos</BreadcrumbItem>
            </Breadcrumbs>
            <div className="mt-5 text-sm font-bold">Listado de Procesos Educativos</div>

            <div className="mt-4 mb-3 flex items-end gap-4">
                <div className="relative min-w-0" style={{ width: centroSelectWidth }}>
                    <span
                        ref={centroMeasureRef}
                        aria-hidden
                        className="invisible absolute left-0 top-0 whitespace-nowrap text-sm font-normal pointer-events-none"
                    >
                        {longestCentroLabel || "Todos los centros"}
                    </span>
                    <Label className="mb-1 text-xs font-medium text-muted-foreground">Centro</Label>
                    <Popover open={centroFilterOpen} onOpenChange={(o) => { setCentroFilterOpen(o); if (!o) setCentroFilterSearch(""); }}>
                        <PopoverTrigger asChild>
                            <Button
                                type="button"
                                variant="outline"
                                className="h-9 w-full min-w-0 justify-between font-normal px-3 bg-background border-default-300 text-default-500 hover:bg-background hover:text-default-500 hover:border-default-300"
                            >
                                <span className="truncate text-left">{selectedCentroFilterLabel}</span>
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                            <div className="p-2 border-b">
                                <div className="flex items-center gap-2 rounded-md border bg-background px-2">
                                    <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
                                    <input
                                        type="text"
                                        placeholder="Buscar centro..."
                                        value={centroFilterSearch}
                                        onChange={(e) => setCentroFilterSearch(e.target.value)}
                                        className="flex h-9 w-full bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground"
                                    />
                                </div>
                            </div>
                            <div className="max-h-[260px] overflow-y-auto p-1">
                                {filteredCentrosForFilter.length === 0 && (
                                    <p className="p-2 text-sm text-muted-foreground text-center">Sin resultados</p>
                                )}
                                {filteredCentrosForFilter.map((item) => (
                                    <button
                                        key={item.value}
                                        type="button"
                                        className={cn(
                                            "w-full text-left rounded-sm px-2 py-1.5 text-sm hover:bg-accent cursor-pointer",
                                            centroFilter === item.value && "bg-accent font-medium",
                                        )}
                                        onClick={() => {
                                            setCentroFilter(item.value);
                                            setCentroFilterOpen(false);
                                            setCentroFilterSearch("");
                                            setOffset(0);
                                            fetchProcesses(buildParams({ centro_id: item.value, offset: 0 }));
                                        }}
                                    >
                                        {item.label}
                                    </button>
                                ))}
                            </div>
                        </PopoverContent>
                    </Popover>
                </div>
                {isSupervisor && (
                    <div className="flex items-end pb-0.5">
                        <ExcelActions centroId={centroFilter !== "all" ? centroFilter : null} entity="processes" onSuccess={reloadList} />
                    </div>
                )}
            </div>

            <Card className="p-4">
                <CardContent className="p-0">
                    {loading && <SkeletonTable />}
                    {!loading && (
                        <DataTable
                            insertString={isSupervisor ? "Crear Proceso" : undefined}
                            onInsert={isSupervisor ? openCreateDialog : undefined}
                            search={search} setSearch={setSearch}
                            className={loading ? "hidden" : ""} data={processes}
                            columns={isMobile ? mobileColumns : columns}
                            refresh={onRefresh} searchPlaceholder="Buscar proceso..."
                            onSort={onSort} onSearch={onSearch}
                            offset={offset} count={count} limit={limit} setLimit={setLimit}
                            showLimit={true} onPagination={getDataPagination}
                            onRowClick={(row) => router.push(`/dashboard/centros/processes/${row.id}`)}
                        />
                    )}
                </CardContent>
            </Card>

            {/* Create process wizard */}
            <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) { setDialogOpen(false); setWizardStep(0); } }}>
                <DialogContent size="3xl" className="max-h-[90vh] overflow-y-auto">
                    <DialogTitle>Crear Proceso Educativo</DialogTitle>

                    <Stepper direction="horizontal" current={wizardStep} gap alternativeLabel>
                        <Step><StepLabel>Información General</StepLabel></Step>
                        <Step><StepLabel>Programación</StepLabel></Step>
                    </Stepper>

                    {/* Step 1: Info General */}
                    {wizardStep === 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <Label className="mb-1 text-xs">Centro *</Label>
                                <Popover open={centroOpen} onOpenChange={(o) => { setCentroOpen(o); if (!o) setCentroSearch(""); }}>
                                    <PopoverTrigger asChild>
                                        <Button type="button" variant="outline" disabled={submitting} className="group w-full justify-between font-normal">
                                            <span className={cn("truncate transition-colors", !selectedCentro && "text-muted-foreground group-hover:text-primary-foreground")}>
                                                {selectedCentro ? selectedCentro.nombre : "Buscar o seleccionar centro..."}
                                            </span>
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                                        <div className="p-2 border-b">
                                            <div className="flex items-center gap-2 rounded-md border bg-background px-2">
                                                <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
                                                <input
                                                    type="text" placeholder="Buscar centro..." value={centroSearch}
                                                    onChange={(e) => setCentroSearch(e.target.value)}
                                                    className="flex h-9 w-full bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground"
                                                />
                                            </div>
                                        </div>
                                        <div className="max-h-[260px] overflow-y-auto p-1">
                                            {filteredCentros.length === 0 && (
                                                <p className="p-2 text-sm text-muted-foreground text-center">Sin resultados</p>
                                            )}
                                            {filteredCentros.map((c) => (
                                                <button
                                                    key={c.id} type="button"
                                                    className={cn(
                                                        "w-full text-left rounded-sm px-2 py-1.5 text-sm hover:bg-accent cursor-pointer",
                                                        form.centro_id === c.id.toString() && "bg-accent font-medium",
                                                    )}
                                                    onClick={() => {
                                                        setField("centro_id", c.id.toString());
                                                        setField("curso_id", "");
                                                        setField("instructor_id", "");
                                                        setCentroOpen(false);
                                                        setCentroSearch("");
                                                    }}
                                                >
                                                    {c.nombre}
                                                </button>
                                            ))}
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            </div>

                            <div>
                                <Label className="mb-1 text-xs">Nombre *</Label>
                                <Input value={form.nombre} onChange={(e) => setField("nombre", e.target.value)} disabled={submitting} />
                            </div>
                            <div>
                                <Label className="mb-1 text-xs">Código *</Label>
                                <Input value={form.codigo} onChange={(e) => setField("codigo", e.target.value)} disabled={submitting} />
                            </div>

                            <div>
                                <Label className="mb-1 text-xs">Curso *</Label>
                                <Select value={form.curso_id || undefined} onValueChange={(v) => setField("curso_id", v)} disabled={submitting || !form.centro_id}>
                                    <SelectTrigger className="h-9"><SelectValue placeholder="Seleccionar curso" /></SelectTrigger>
                                    <SelectContent>
                                        {courses.map((c: any) => <SelectItem key={c.id} value={c.id.toString()}>{c.nombre}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label className="mb-1 text-xs">Instructor *</Label>
                                <Select value={form.instructor_id || undefined} onValueChange={(v) => setField("instructor_id", v)} disabled={submitting || !form.centro_id}>
                                    <SelectTrigger className="h-9"><SelectValue placeholder="Seleccionar instructor" /></SelectTrigger>
                                    <SelectContent>
                                        {instructors.map((i: any) => (
                                            <SelectItem key={i.id} value={i.id.toString()}>
                                                {[i.nombres, i.apellidos].filter(Boolean).join(" ") || i.nombre || `#${i.id}`}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label className="mb-1 text-xs">Metodología *</Label>
                                <Select value={form.metodologia_id || undefined} onValueChange={(v) => setField("metodologia_id", v)} disabled={submitting}>
                                    <SelectTrigger className="h-9"><SelectValue placeholder="Seleccionar metodología" /></SelectTrigger>
                                    <SelectContent>
                                        {metodologias.map((m: any) => <SelectItem key={m.id} value={m.id.toString()}>{m.nombre}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label className="mb-1 text-xs">Otra metodología</Label>
                                <Input value={form.otra_metodologia} onChange={(e) => setField("otra_metodologia", e.target.value)} disabled={submitting} />
                            </div>
                        </div>
                    )}

                    {/* Step 2: Programación */}
                    {wizardStep === 1 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label className="mb-1 text-xs">Fecha Inicio *</Label>
                                <Input type="date" value={form.fecha_inicial} onChange={(e) => setField("fecha_inicial", e.target.value)} disabled={submitting} />
                            </div>
                            <div>
                                <Label className="mb-1 text-xs">Fecha Fin *</Label>
                                <Input type="date" value={form.fecha_final} onChange={(e) => setField("fecha_final", e.target.value)} disabled={submitting} />
                            </div>

                            <div>
                                <Label className="mb-1 text-xs">Duración (horas) *</Label>
                                <Input type="number" value={form.duracion_horas} onChange={(e) => setField("duracion_horas", e.target.value)} disabled={submitting} />
                            </div>
                            <div>
                                <Label className="mb-1 text-xs">Tipo de Jornada *</Label>
                                <Select value={form.tipo_jornada_id || undefined} onValueChange={(v) => setField("tipo_jornada_id", v)} disabled={submitting}>
                                    <SelectTrigger className="h-9"><SelectValue placeholder="Seleccionar jornada" /></SelectTrigger>
                                    <SelectContent>
                                        {tipoJornadas.map((t: any) => <SelectItem key={t.id} value={t.id.toString()}>{t.nombre}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label className="mb-1 text-xs">Horario *</Label>
                                <Input value={form.horario} onChange={(e) => setField("horario", e.target.value)} disabled={submitting} />
                            </div>
                            <div>
                                <Label className="mb-1 text-xs">Días *</Label>
                                <Popover open={diasOpen} onOpenChange={setDiasOpen}>
                                    <PopoverTrigger asChild>
                                        <Button type="button" variant="outline" disabled={submitting} className="group w-full justify-between font-normal h-9">
                                            <span className={cn("truncate transition-colors", !form.dias && "text-muted-foreground group-hover:text-primary-foreground")}>
                                                {diasDisplayLabel || "Seleccionar días..."}
                                            </span>
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-1" align="start">
                                        {diasCatalogo.map((d) => (
                                            <button
                                                key={d.value} type="button"
                                                className="w-full flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent cursor-pointer"
                                                onClick={() => toggleDia(d.value)}
                                            >
                                                <div className={cn(
                                                    "flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border",
                                                    selectedDias.includes(d.value) ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground/40",
                                                )}>
                                                    {selectedDias.includes(d.value) && <Check className="h-3 w-3" />}
                                                </div>
                                                {d.label}
                                            </button>
                                        ))}
                                    </PopoverContent>
                                </Popover>
                            </div>

                            <div>
                                <Label className="mb-1 text-xs">Sede</Label>
                                <Select value={form.sede} onValueChange={(v) => setField("sede", v)} disabled={submitting}>
                                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="0">No</SelectItem>
                                        <SelectItem value="1">Sí</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label className="mb-1 text-xs">Lugar</Label>
                                <Input value={form.lugar} onChange={(e) => setField("lugar", e.target.value)} disabled={submitting} />
                            </div>
                        </div>
                    )}

                    <DialogFooter className="mt-4">
                        {wizardStep === 0 ? (
                            <>
                                <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={submitting}>Cancelar</Button>
                                <Button onClick={goToStep2} disabled={submitting}>
                                    Siguiente <ChevronRight className="ml-1.5 h-4 w-4" />
                                </Button>
                            </>
                        ) : (
                            <>
                                <Button variant="outline" onClick={() => setWizardStep(0)} disabled={submitting}>
                                    <ChevronLeft className="mr-1.5 h-4 w-4" /> Anterior
                                </Button>
                                <Button onClick={handleCreate} disabled={submitting}>
                                    {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Crear Proceso
                                </Button>
                            </>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default function Page() {
    return (
        <Suspense fallback={<SkeletonTable />}>
            <PageContent />
        </Suspense>
    );
}
