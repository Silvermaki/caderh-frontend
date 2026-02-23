"use client";

import React, { useState, useEffect, Suspense } from "react";
import { Breadcrumbs, BreadcrumbItem } from "@/components/ui/breadcrumbs";
import DataTable from "@/components/ui/service-datatable";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, ExternalLink, Eye, MenuSquare, Pencil, Trash2 } from "lucide-react";
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
import StudentWizard from "@/components/centro/student-wizard";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

const apiBase = process.env.NEXT_PUBLIC_API_URL;

function PageContent() {
    const searchParams: any = useSearchParams();
    const isMobile = useMediaQuery("(max-width: 1000px)");
    const pathname = usePathname();
    const { data: session } = useSession() as any;
    const userRole = session?.user?.role;
    const isSupervisor = userRole === "ADMIN" || userRole === "MANAGER";
    const authHeaders: any = { Authorization: `Bearer ${session?.user?.session}` };

    const [students, setStudents] = useState<any[]>([]);
    const [offset, setOffset] = useState(0);
    const [limit, setLimit] = useState(10);
    const [count, setCount] = useState(0);
    const [desc, setDesc] = useState(false);
    const [sort, setSort] = useState("nombres");
    const searchInit = new URLSearchParams(searchParams).get("search") ?? "";
    const [search, setSearch] = useState(searchInit);
    const [loading, setLoading] = useState(true);

    const [centros, setCentros] = useState<{ id: number; nombre: string }[]>([]);
    const [centroFilter, setCentroFilter] = useState("all");

    const [selected, setSelected] = useState<any>(null);
    const [wizardOpen, setWizardOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<any>(null);
    const [deleting, setDeleting] = useState(false);

    const fetchCentros = async () => {
        try {
            const res = await fetch(`${apiBase}/api/centros/centros?all=true`, { headers: authHeaders });
            if (res.ok) { const d = await res.json(); setCentros(d.data ?? []); }
        } catch { /* silent */ }
    };

    const fetchStudents = async (params: string) => {
        setLoading(true);
        try {
            const res = await fetch(`${apiBase}/api/centros/students?${params}`, { headers: authHeaders });
            if (res.ok) { const d = await res.json(); setStudents(d.data ?? []); setCount(d.count ?? 0); }
            else toast.error("Error al cargar estudiantes");
        } catch { toast.error("Error al cargar estudiantes"); }
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
        await fetchStudents(buildParams({ search: searchValue, offset: 0 }));
    };
    const getDataSort = (sorting: string) => {
        const newDesc = !desc; setDesc(newDesc); setSort(sorting);
        fetchStudents(buildParams({ sort: sorting, desc: newDesc }));
    };
    const getDataSearch = (searchValue: string) => {
        setSearch(searchValue); setOffset(0);
        fetchStudents(buildParams({ search: searchValue, offset: 0 }));
    };
    const getDataPagination = (newOffset: number) => {
        setOffset(newOffset);
        fetchStudents(buildParams({ offset: newOffset }));
    };
    const onSort = (sorting: { id: string }) => getDataSort(sorting.id);
    const onSearch = (value: string) => {
        if (value) window.history.replaceState(null, "", `${pathname}?search=${value}`);
        else window.history.replaceState(null, "", pathname);
        getDataSearch(value);
    };
    const onRefresh = () => { window.history.replaceState(null, "", pathname); getDataInit(""); };
    const reloadList = () => fetchStudents(buildParams());

    const onDeleteConfirm = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            const res = await fetch(`${apiBase}/api/centros/students/${deleteTarget.id}`, { method: "DELETE", headers: authHeaders });
            if (res.ok) { toast.success("Estudiante eliminado"); setDeleteTarget(null); reloadList(); }
            else { const d = await res.json(); toast.error(d.message ?? "Error al eliminar"); }
        } catch { toast.error("Error al eliminar"); }
        setDeleting(false);
    };

    const openPdfInNewTab = async (s: any) => {
        try {
            const res = await fetch(`${apiBase}/api/centros/students/${s.id}/pdf`, { headers: authHeaders });
            if (!res.ok) { toast.error("Error al abrir"); return; }
            const blob = await res.blob();
            window.open(URL.createObjectURL(blob), "_blank", "noopener,noreferrer");
        } catch { toast.error("Error al abrir"); }
    };

    const onCentroFilterChange = (value: string) => {
        setCentroFilter(value); setOffset(0);
        fetchStudents(buildParams({ centro_id: value, offset: 0 }));
    };

    useEffect(() => { if (session) { fetchCentros(); getDataInit(searchInit); } }, [session]);
    useEffect(() => { if (students.length > 0) getDataPagination(0); }, [limit]);

    const actionsColumn = {
        id: "actions", enableHiding: false,
        cell: ({ row }: any) => {
            const s = row.original;
            return (
                <div className="text-end">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0" color="dark"><MenuSquare className="h-5 w-5" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" side="bottom">
                            <DropdownMenuLabel>Opciones</DropdownMenuLabel>
                            <DropdownMenuItem asChild>
                                <Link href={`/dashboard/centros/students/${s.id}`}>
                                    <Eye className="h-4 w-4 mr-2" />Ver perfil
                                </Link>
                            </DropdownMenuItem>
                            {s.pdf && (
                                <DropdownMenuItem onClick={() => openPdfInNewTab(s)}>
                                    <ExternalLink className="h-4 w-4 mr-2" />Visualizar CV
                                </DropdownMenuItem>
                            )}
                            {isSupervisor && (<>
                                <DropdownMenuItem onClick={() => { setSelected(s); setWizardOpen(true); }}>
                                    <Pencil className="h-4 w-4 mr-2" />Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setDeleteTarget(s)} className="text-destructive">
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
            id: "full_name", accessorFn: (r: any) => `${r.nombres ?? ""} ${r.apellidos ?? ""}`.trim(),
            header: sortableHeader("Nombre completo"),
            cell: ({ row }: any) => (
                <Link href={`/dashboard/centros/students/${row.original.id}`} className="text-sm font-medium text-primary hover:underline">
                    {[row.original.nombres, row.original.apellidos].filter(Boolean).join(" ")}
                </Link>
            ),
        },
        {
            accessorKey: "identidad", header: sortableHeader("Identidad"),
            cell: ({ row }: any) => <span className="text-sm">{row.original.identidad ?? "-"}</span>,
        },
        {
            id: "contact", header: "Contacto",
            cell: ({ row }: any) => <span className="text-sm text-muted-foreground">{row.original.celular || row.original.email || "-"}</span>,
        },
        {
            id: "pdf", header: "Hoja de vida",
            cell: ({ row }: any) => row.original.pdf ? (
                <Button variant="ghost" size="sm" className="h-8 bg-transparent text-primary hover:bg-primary/80 hover:text-primary-foreground rounded-md px-3 font-semibold"
                    onClick={() => openPdfInNewTab(row.original)}>Ver</Button>
            ) : <span className="text-sm text-muted-foreground">-</span>,
        },
        actionsColumn,
    ];

    const mobileColumns: any[] = [
        {
            id: "full_name", accessorFn: (r: any) => `${r.nombres ?? ""} ${r.apellidos ?? ""}`.trim(),
            header: sortableHeader("Nombre completo"),
            cell: ({ row }: any) => (
                <div>
                    <Link href={`/dashboard/centros/students/${row.original.id}`} className="text-sm font-medium text-primary hover:underline">
                        {[row.original.nombres, row.original.apellidos].filter(Boolean).join(" ")}
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
                <BreadcrumbItem className="text-primary">Estudiantes</BreadcrumbItem>
            </Breadcrumbs>
            <div className="mt-5 text-sm font-bold">Listado de Estudiantes</div>

            <div className="mt-4 mb-3 flex items-end gap-4">
                <div className="w-64">
                    <Label className="mb-1 text-xs font-medium text-muted-foreground">Centro</Label>
                    <Select value={centroFilter} onValueChange={onCentroFilterChange}>
                        <SelectTrigger className="h-9"><SelectValue placeholder="Todos los centros" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos los centros</SelectItem>
                            {centros.map((c) => <SelectItem key={c.id} value={c.id.toString()}>{c.nombre}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <Card className="p-4">
                <CardContent className="p-0">
                    {loading && <SkeletonTable />}
                    {!loading && (
                        <DataTable
                            insertString={isSupervisor ? "Crear Estudiante" : undefined}
                            onInsert={isSupervisor ? () => { setSelected(null); setWizardOpen(true); } : undefined}
                            search={search} setSearch={setSearch}
                            className={loading ? "hidden" : ""} data={students}
                            columns={isMobile ? mobileColumns : columns}
                            refresh={onRefresh} searchPlaceholder="Buscar estudiante..."
                            onSort={onSort} onSearch={onSearch}
                            offset={offset} count={count} limit={limit} setLimit={setLimit}
                            showLimit={true} onPagination={getDataPagination}
                        />
                    )}
                </CardContent>
            </Card>

            <StudentWizard
                student={selected} centros={centros}
                isOpen={wizardOpen}
                setIsOpen={(open) => { setWizardOpen(open); if (!open) setSelected(null); }}
                reloadList={reloadList}
            />

            <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar estudiante?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Se eliminará a &quot;{deleteTarget?.nombres} {deleteTarget?.apellidos}&quot;. Esta acción no se puede deshacer.
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
