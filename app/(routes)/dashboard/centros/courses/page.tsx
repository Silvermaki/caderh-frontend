"use client";

import React, { useState, useEffect, useMemo, useRef, Suspense } from "react";
import { Breadcrumbs, BreadcrumbItem } from "@/components/ui/breadcrumbs";
import DataTable from "@/components/ui/service-datatable";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, Eye, MenuSquare, Pencil, Trash2, Building2, Loader2, Search, ChevronsUpDown } from "lucide-react";
import Link from "next/link";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent } from "@/components/ui/card";
import { useMediaQuery } from "@/hooks/use-media-query";
import SkeletonTable from "@/components/skeleton-table";
import { usePathname, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { useSession } from "next-auth/react";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const apiBase = process.env.NEXT_PUBLIC_API_URL;

interface CourseForm {
    centro_id: string;
    codigo: string;
    nombre: string;
    codigo_programa: string;
    taller: string;
    objetivo: string;
}

const emptyCourseForm: CourseForm = {
    centro_id: "",
    codigo: "",
    nombre: "",
    codigo_programa: "",
    taller: "0",
    objetivo: "",
};

function PageContent() {
    const searchParams: any = useSearchParams();
    const isMobile = useMediaQuery("(max-width: 1000px)");
    const pathname = usePathname();
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

    const [selected, setSelected] = useState<any>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<any>(null);
    const [deleting, setDeleting] = useState(false);

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

    const onDeleteConfirm = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            const res = await fetch(`${apiBase}/api/centros/courses/${deleteTarget.id}`, { method: "DELETE", headers: authHeaders });
            if (res.ok) { toast.success("Curso eliminado"); setDeleteTarget(null); reloadList(); }
            else { const d = await res.json(); toast.error(d.message ?? "Error al eliminar"); }
        } catch { toast.error("Error al eliminar"); }
        setDeleting(false);
    };

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

    /* ── Modal state ── */
    const [courseForm, setCourseForm] = useState<CourseForm>(emptyCourseForm);
    const [formErrors, setFormErrors] = useState<Partial<Record<keyof CourseForm, string>>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const isEdit = !!selected;

    const [centroOpen, setCentroOpen] = useState(false);
    const [centroSearch, setCentroSearch] = useState("");

    const selectedCentro = useMemo(
        () => centros.find((c) => c.id.toString() === courseForm.centro_id),
        [centros, courseForm.centro_id],
    );
    const filteredCentros = useMemo(
        () => centroSearch.trim()
            ? centros.filter((c) => c.nombre.toLowerCase().includes(centroSearch.toLowerCase()))
            : centros,
        [centros, centroSearch],
    );

    useEffect(() => {
        if (modalOpen) {
            if (selected) {
                setCourseForm({
                    centro_id: selected.centro_id != null ? String(selected.centro_id) : "",
                    codigo: selected.codigo != null ? String(selected.codigo) : "",
                    nombre: selected.nombre ?? "",
                    codigo_programa: selected.codigo_programa ?? "",
                    taller: selected.taller != null ? String(selected.taller) : "0",
                    objetivo: selected.objetivo ?? "",
                });
            } else {
                setCourseForm({ ...emptyCourseForm });
            }
            setFormErrors({});
        }
    }, [modalOpen, selected]);

    const validateForm = (): boolean => {
        const errs: Partial<Record<keyof CourseForm, string>> = {};
        if (!isEdit && !courseForm.centro_id) errs.centro_id = "Selecciona un centro";
        if (!courseForm.nombre.trim()) errs.nombre = "El nombre es requerido";
        if (!courseForm.codigo_programa.trim()) errs.codigo_programa = "El código de programa es requerido";
        if (!courseForm.objetivo.trim()) errs.objetivo = "El objetivo es requerido";
        setFormErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;
        setIsSubmitting(true);
        try {
            const body: any = {
                nombre: courseForm.nombre.trim(),
                codigo_programa: courseForm.codigo_programa.trim(),
                taller: Number(courseForm.taller),
                objetivo: courseForm.objetivo.trim(),
            };
            if (courseForm.codigo) body.codigo = Number(courseForm.codigo);
            if (isEdit) {
                body.id = selected.id;
            } else {
                body.centro_id = Number(courseForm.centro_id);
            }

            const res = await fetch(`${apiBase}/api/centros/courses`, {
                method: isEdit ? "PUT" : "POST",
                headers: { "Content-Type": "application/json", ...authHeaders },
                body: JSON.stringify(body),
            });

            if (res.ok) {
                toast.success(isEdit ? "Curso actualizado" : "Curso creado");
                setModalOpen(false);
                setSelected(null);
                reloadList();
            } else {
                const d = await res.json();
                toast.error(d.message ?? "Error al guardar");
            }
        } catch { toast.error("Error al guardar"); }
        setIsSubmitting(false);
    };

    /* ── Table columns ── */
    const actionsColumn = {
        id: "actions", enableHiding: false,
        cell: ({ row }: any) => {
            const c = row.original;
            return (
                <div className="text-end">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0" color="dark"><MenuSquare className="h-5 w-5" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" side="bottom">
                            <DropdownMenuLabel>Opciones</DropdownMenuLabel>
                            <DropdownMenuItem asChild>
                                <Link href={`/dashboard/centros/courses/${c.id}`}>
                                    <Eye className="h-4 w-4 mr-2" />Ver detalle
                                </Link>
                            </DropdownMenuItem>
                            {isSupervisor && (<>
                                <DropdownMenuItem onClick={() => { setSelected(c); setModalOpen(true); }}>
                                    <Pencil className="h-4 w-4 mr-2" />Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setDeleteTarget(c)} className="text-destructive">
                                    <Trash2 className="h-4 w-4 mr-2" />Eliminar
                                </DropdownMenuItem>
                            </>)}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            );
        },
    };

    const sortableHeader = (label: string) => ({ column }: any) => (
        <Button variant="ghost" color="dark" className="p-2" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            {label}<ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
    );

    const columns: any[] = [
        {
            accessorKey: "centro_nombre", header: "Centro",
            cell: ({ row }: any) => <span className="text-sm text-muted-foreground">{row.original.centro_nombre ?? "-"}</span>,
        },
        {
            id: "full_name", accessorFn: (r: any) => `${r.codigo ?? ""} ${r.nombre ?? ""}`.trim(),
            header: sortableHeader("Nombre"),
            cell: ({ row }: any) => (
                <Link href={`/dashboard/centros/courses/${row.original.id}`} className="text-sm font-medium text-primary hover:underline">
                    {row.original.nombre}
                </Link>
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
        actionsColumn,
    ];

    const mobileColumns: any[] = [
        {
            id: "full_name", accessorFn: (r: any) => `${r.codigo ?? ""} ${r.nombre ?? ""}`.trim(),
            header: sortableHeader("Nombre"),
            cell: ({ row }: any) => (
                <div>
                    <Link href={`/dashboard/centros/courses/${row.original.id}`} className="text-sm font-medium text-primary hover:underline">
                        {row.original.nombre}
                    </Link>
                    <span className="text-xs text-muted-foreground block">{row.original.centro_nombre}</span>
                </div>
            ),
        },
        actionsColumn,
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
            </div>

            <Card className="p-4">
                <CardContent className="p-0">
                    {loading && <SkeletonTable />}
                    {!loading && (
                        <DataTable
                            insertString={isSupervisor ? "Crear Curso" : undefined}
                            onInsert={isSupervisor ? () => { setSelected(null); setModalOpen(true); } : undefined}
                            search={search} setSearch={setSearch}
                            className={loading ? "hidden" : ""} data={courses}
                            columns={isMobile ? mobileColumns : columns}
                            refresh={onRefresh} searchPlaceholder="Buscar curso..."
                            onSort={onSort} onSearch={onSearch}
                            offset={offset} count={count} limit={limit} setLimit={setLimit}
                            showLimit={true} onPagination={getDataPagination}
                        />
                    )}
                </CardContent>
            </Card>

            {/* ── Course Modal ── */}
            <Dialog open={modalOpen} onOpenChange={(open) => { if (!isSubmitting) { setModalOpen(open); if (!open) setSelected(null); } }}>
                <DialogContent size="3xl">
                    <DialogTitle>{isEdit ? "Editar Curso" : "Crear Curso"}</DialogTitle>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                        {/* Centro select (only on create) */}
                        {!isEdit && (
                            <div className="md:col-span-2">
                                <Label className="mb-1 font-medium text-default-600">Centro *</Label>
                                <Popover open={centroOpen} onOpenChange={(o) => { setCentroOpen(o); if (!o) setCentroSearch(""); }}>
                                    <PopoverTrigger asChild>
                                        <Button type="button" variant="outline" disabled={isSubmitting || isEdit} className="w-full justify-between font-normal">
                                            <span className={cn("truncate", !selectedCentro && "text-muted-foreground")}>
                                                {selectedCentro ? selectedCentro.nombre : "Buscar o seleccionar centro..."}
                                            </span>
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                                        <div className="p-2 border-b">
                                            <div className="flex items-center gap-2 rounded-md border bg-background px-2">
                                                <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
                                                <input type="text" placeholder="Buscar centro..." value={centroSearch} onChange={(e) => setCentroSearch(e.target.value)}
                                                    className="flex h-9 w-full bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground" />
                                            </div>
                                        </div>
                                        <div className="max-h-[260px] overflow-y-auto p-1">
                                            {filteredCentros.length === 0 ? (
                                                <p className="py-4 text-center text-sm text-muted-foreground">No se encontraron centros.</p>
                                            ) : filteredCentros.map((c) => (
                                                <button key={c.id} type="button" className="w-full rounded-sm px-2 py-2 text-left text-sm text-foreground hover:bg-accent focus:bg-accent focus:outline-none"
                                                    onClick={() => { setCourseForm(prev => ({ ...prev, centro_id: String(c.id) })); setCentroOpen(false); }}>
                                                    {c.nombre}
                                                </button>
                                            ))}
                                        </div>
                                    </PopoverContent>
                                </Popover>
                                {formErrors.centro_id && <p className="text-destructive text-xs mt-1">{formErrors.centro_id}</p>}
                            </div>
                        )}

                        <div>
                            <Label className="mb-1 font-medium text-default-600">Código</Label>
                            <Input type="number" disabled={isSubmitting} value={courseForm.codigo}
                                onChange={(e) => setCourseForm(prev => ({ ...prev, codigo: e.target.value }))} placeholder="Código" />
                        </div>
                        <div>
                            <Label className="mb-1 font-medium text-default-600">Nombre *</Label>
                            <Input disabled={isSubmitting} value={courseForm.nombre}
                                onChange={(e) => setCourseForm(prev => ({ ...prev, nombre: e.target.value }))} placeholder="Nombre del curso" />
                            {formErrors.nombre && <p className="text-destructive text-xs mt-1">{formErrors.nombre}</p>}
                        </div>
                        <div>
                            <Label className="mb-1 font-medium text-default-600">Código de programa *</Label>
                            <Input disabled={isSubmitting} value={courseForm.codigo_programa}
                                onChange={(e) => setCourseForm(prev => ({ ...prev, codigo_programa: e.target.value }))} placeholder="Código de programa" />
                            {formErrors.codigo_programa && <p className="text-destructive text-xs mt-1">{formErrors.codigo_programa}</p>}
                        </div>
                        <div>
                            <Label className="mb-1 font-medium text-default-600">Taller</Label>
                            <Select value={courseForm.taller} onValueChange={(v) => setCourseForm(prev => ({ ...prev, taller: v }))} disabled={isSubmitting}>
                                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="1">Sí</SelectItem>
                                    <SelectItem value="0">No</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="md:col-span-2">
                            <Label className="mb-1 font-medium text-default-600">Objetivo *</Label>
                            <Textarea disabled={isSubmitting} value={courseForm.objetivo} rows={3}
                                onChange={(e) => setCourseForm(prev => ({ ...prev, objetivo: e.target.value }))} placeholder="Objetivo del curso" />
                            {formErrors.objetivo && <p className="text-destructive text-xs mt-1">{formErrors.objetivo}</p>}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => { setModalOpen(false); setSelected(null); }} disabled={isSubmitting}>Cancelar</Button>
                        <Button type="button" onClick={handleSubmit} disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isEdit ? "Guardar" : "Crear"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ── Delete confirmation ── */}
            <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar curso?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Se eliminará el curso &quot;{deleteTarget?.nombre}&quot;. Esta acción no se puede deshacer.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={onDeleteConfirm} disabled={deleting} color="destructive">
                            {deleting ? "Eliminando..." : "Eliminar"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
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
