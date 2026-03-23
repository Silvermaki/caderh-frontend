"use client";

import React, { useState, useEffect, useMemo, useRef, Suspense } from "react";
import { Breadcrumbs, BreadcrumbItem } from "@/components/ui/breadcrumbs";
import DataTable from "@/components/ui/service-datatable";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, Search, ChevronsUpDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useMediaQuery } from "@/hooks/use-media-query";
import SkeletonTable from "@/components/skeleton-table";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useSession } from "next-auth/react";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import ExcelActions from "@/components/centro/excel-actions";
import CourseWizardModal from "@/components/centro/course-wizard-modal";
import { cn } from "@/lib/utils";

const apiBase = process.env.NEXT_PUBLIC_API_URL;

function PageContent() {
    const searchParams: any = useSearchParams();
    const isMobile = useMediaQuery("(max-width: 1000px)");
    const pathname = usePathname();
    const router = useRouter();
    const { data: session } = useSession() as any;
    const userRole = session?.user?.role;
    const isSupervisor = userRole === "ADMIN" || userRole === "MANAGER";
    const authHeaders: any = { Authorization: `Bearer ${session?.user?.session}` };

    const [courses, setCourses] = useState<any[]>([]);
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

    const [wizardOpen, setWizardOpen] = useState(false);

    const fetchCentros = async () => {
        try {
            const res = await fetch(`${apiBase}/api/centros/centros?all=true`, { headers: authHeaders });
            if (res.ok) { const d = await res.json(); setCentros(d.data ?? []); }
        } catch { /* silent */ }
    };

    const fetchCourses = async (params: string) => {
        setLoading(true);
        try {
            const res = await fetch(`${apiBase}/api/centros/courses?${params}`, { headers: authHeaders });
            if (res.ok) { const d = await res.json(); setCourses(d.data ?? []); setCount(d.count ?? 0); }
            else toast.error("Error al cargar cursos");
        } catch { toast.error("Error al cargar cursos"); }
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
        await fetchCourses(buildParams({ search: searchValue, offset: 0 }));
    };
    const getDataSort = (sorting: string) => {
        const newDesc = !desc; setDesc(newDesc); setSort(sorting);
        fetchCourses(buildParams({ sort: sorting, desc: newDesc }));
    };
    const getDataSearch = (searchValue: string) => {
        setSearch(searchValue); setOffset(0);
        fetchCourses(buildParams({ search: searchValue, offset: 0 }));
    };
    const getDataPagination = (newOffset: number) => {
        setOffset(newOffset);
        fetchCourses(buildParams({ offset: newOffset }));
    };
    const onSort = (sorting: { id: string }) => getDataSort(sorting.id);
    const onSearch = (value: string) => {
        if (value) window.history.replaceState(null, "", `${pathname}?search=${value}`);
        else window.history.replaceState(null, "", pathname);
        getDataSearch(value);
    };
    const onRefresh = () => { window.history.replaceState(null, "", pathname); getDataInit(""); };
    const reloadList = () => fetchCourses(buildParams());

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

    useEffect(() => { if (session) { fetchCentros(); getDataInit(searchInit); } }, [session]);
    useEffect(() => { if (courses.length > 0) getDataPagination(0); }, [limit]);

    /* ── Table columns ── */
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
            id: "full_name", accessorFn: (r: any) => `${r.codigo ?? ""} ${r.nombre ?? ""}`.trim(),
            header: sortableHeader("Nombre"),
            cell: ({ row }: any) => (
                <span className="text-sm font-medium text-primary">{row.original.nombre}</span>
            ),
        },
        {
            accessorKey: "codigo_programa", header: "Cód. Programa",
            cell: ({ row }: any) => <span className="text-sm">{row.original.codigo_programa ?? "-"}</span>,
        },
        {
            accessorKey: "total_horas", header: "Total Horas",
            cell: ({ row }: any) => <span className="text-sm">{row.original.total_horas ?? "-"}</span>,
        },
    ];

    const mobileColumns: any[] = [
        {
            id: "full_name", accessorFn: (r: any) => `${r.codigo ?? ""} ${r.nombre ?? ""}`.trim(),
            header: sortableHeader("Nombre"),
            cell: ({ row }: any) => (
                <div>
                    <span className="text-sm font-medium text-primary">{row.original.nombre}</span>
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
                <BreadcrumbItem className="text-primary">Cursos</BreadcrumbItem>
            </Breadcrumbs>
            <div className="mt-5 text-sm font-bold">Listado de Cursos</div>

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
                                className="h-9 w-full min-w-0 justify-between font-normal px-3 bg-background border-default-300 text-default-500 hover:bg-transparent hover:text-default-500 hover:border-default-300"
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
                                            fetchCourses(buildParams({ centro_id: item.value, offset: 0 }));
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
                        <ExcelActions centroId={centroFilter !== "all" ? centroFilter : null} entity="courses" onSuccess={reloadList} />
                    </div>
                )}
            </div>

            <Card className="p-4">
                <CardContent className="p-0">
                    {loading && <SkeletonTable />}
                    {!loading && (
                        <DataTable
                            insertString={isSupervisor ? "Crear Curso" : undefined}
                            onInsert={isSupervisor ? () => setWizardOpen(true) : undefined}
                            search={search} setSearch={setSearch}
                            className={loading ? "hidden" : ""} data={courses}
                            columns={isMobile ? mobileColumns : columns}
                            refresh={onRefresh} searchPlaceholder="Buscar curso..."
                            onSort={onSort} onSearch={onSearch}
                            offset={offset} count={count} limit={limit} setLimit={setLimit}
                            showLimit={true} onPagination={getDataPagination}
                            onRowClick={(row) => router.push(`/dashboard/centros/courses/${row.id}`)}
                        />
                    )}
                </CardContent>
            </Card>

            {/* ── Course Wizard ── */}
            <CourseWizardModal isOpen={wizardOpen} setIsOpen={setWizardOpen} reloadList={reloadList} centros={centros} />
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
