"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Breadcrumbs, BreadcrumbItem } from "@/components/ui/breadcrumbs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupButton } from "@/components/ui/input-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import SkeletonTable from "@/components/skeleton-table";
import toast from "react-hot-toast";
import { useSession } from "next-auth/react";
import {
    MapPin, Phone, Mail, User, Building2, UserCheck, GraduationCap, BookOpen,
    PlusCircle, Pencil, Trash2, RefreshCcw,
} from "lucide-react";
import { Icon } from "@iconify/react";
import { prettifyNumber } from "@/app/libs/utils";
import InstructorModal from "@/components/centro/instructor-modal";
import EstudianteModal from "@/components/centro/estudiante-modal";
import CursoModal from "@/components/centro/curso-modal";

const TAB_TRIGGER_CLASS = "rounded-none border-b-2 border-transparent bg-transparent px-0 pb-3 -mb-px shadow-none data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none";

export default function CentroDetailPage() {
    const params = useParams();
    const centroId = params?.id as string;
    const { data: session } = useSession() as any;
    const userRole = session?.user?.role;
    const isSupervisor = userRole === "ADMIN" || userRole === "MANAGER";

    // Centro
    const [centro, setCentro] = useState<any>(null);
    const [loading, setLoading] = useState<boolean>(true);

    // Summary
    const [summary, setSummary] = useState({ instructores: 0, estudiantes: 0, cursos: 0 });

    // Instructors
    const [instructors, setInstructors] = useState<any[]>([]);
    const [instOffset, setInstOffset] = useState(0);
    const [instLimit, setInstLimit] = useState(10);
    const [instCount, setInstCount] = useState(0);
    const [instSearch, setInstSearch] = useState("");
    const [instSearchInput, setInstSearchInput] = useState("");
    const [instLoading, setInstLoading] = useState(false);
    const [instModalOpen, setInstModalOpen] = useState(false);
    const [instSelected, setInstSelected] = useState<any>(null);
    const [instDelete, setInstDelete] = useState<any>(null);
    const [instDeleting, setInstDeleting] = useState(false);

    // Estudiantes
    const [estudiantes, setEstudiantes] = useState<any[]>([]);
    const [estOffset, setEstOffset] = useState(0);
    const [estLimit, setEstLimit] = useState(10);
    const [estCount, setEstCount] = useState(0);
    const [estSearch, setEstSearch] = useState("");
    const [estSearchInput, setEstSearchInput] = useState("");
    const [estLoading, setEstLoading] = useState(false);
    const [estModalOpen, setEstModalOpen] = useState(false);
    const [estSelected, setEstSelected] = useState<any>(null);
    const [estDelete, setEstDelete] = useState<any>(null);
    const [estDeleting, setEstDeleting] = useState(false);

    // Cursos
    const [cursos, setCursos] = useState<any[]>([]);
    const [curOffset, setCurOffset] = useState(0);
    const [curLimit, setCurLimit] = useState(10);
    const [curCount, setCurCount] = useState(0);
    const [curSearch, setCurSearch] = useState("");
    const [curSearchInput, setCurSearchInput] = useState("");
    const [curLoading, setCurLoading] = useState(false);
    const [curModalOpen, setCurModalOpen] = useState(false);
    const [curSelected, setCurSelected] = useState<any>(null);
    const [curDelete, setCurDelete] = useState<any>(null);
    const [curDeleting, setCurDeleting] = useState(false);

    const authHeaders = { Authorization: `Bearer ${session?.user?.session}` };
    const apiBase = process.env.NEXT_PUBLIC_API_URL;

    // ─── Fetch Centro ────────────────────────────────────────────────────────
    const fetchCentro = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${apiBase}/api/centros/centros/${centroId}`, { headers: authHeaders });
            if (res.ok) { const d = await res.json(); setCentro(d.data ?? null); }
            else { const d = await res.json(); toast.error(d.message ?? "Error al cargar centro"); }
        } catch { toast.error("Error al cargar centro"); }
        setLoading(false);
    };

    const fetchSummary = async () => {
        try {
            const res = await fetch(`${apiBase}/api/centros/centros/${centroId}/summary`, { headers: authHeaders });
            if (res.ok) { const d = await res.json(); setSummary(d); }
        } catch { /* silent */ }
    };

    // ─── Instructors ─────────────────────────────────────────────────────────
    const fetchInstructors = async (search: string, offset: number, limit: number) => {
        setInstLoading(true);
        try {
            const p = new URLSearchParams({ limit: limit + "", offset: (offset * limit) + "", search });
            const res = await fetch(`${apiBase}/api/centros/centros/${centroId}/instructors?${p}`, { headers: authHeaders });
            if (res.ok) { const d = await res.json(); setInstructors(d.data ?? []); setInstCount(d.count ?? 0); }
            else { toast.error("Error al cargar instructores"); }
        } catch { toast.error("Error al cargar instructores"); }
        setInstLoading(false);
    };

    const reloadInstructors = () => { fetchInstructors(instSearch, instOffset, instLimit); fetchSummary(); };

    const deleteInstructor = async () => {
        if (!instDelete) return;
        setInstDeleting(true);
        try {
            const res = await fetch(`${apiBase}/api/centros/centros/${centroId}/instructors/${instDelete.id}`, { method: "DELETE", headers: authHeaders });
            if (res.ok) { toast.success("Instructor eliminado"); setInstDelete(null); reloadInstructors(); }
            else { const d = await res.json(); toast.error(d.message ?? "Error al eliminar"); }
        } catch { toast.error("Error al eliminar"); }
        setInstDeleting(false);
    };

    // ─── Estudiantes ─────────────────────────────────────────────────────────
    const fetchEstudiantes = async (search: string, offset: number, limit: number) => {
        setEstLoading(true);
        try {
            const p = new URLSearchParams({ limit: limit + "", offset: (offset * limit) + "", search });
            const res = await fetch(`${apiBase}/api/centros/centros/${centroId}/estudiantes?${p}`, { headers: authHeaders });
            if (res.ok) { const d = await res.json(); setEstudiantes(d.data ?? []); setEstCount(d.count ?? 0); }
            else { toast.error("Error al cargar estudiantes"); }
        } catch { toast.error("Error al cargar estudiantes"); }
        setEstLoading(false);
    };

    const reloadEstudiantes = () => { fetchEstudiantes(estSearch, estOffset, estLimit); fetchSummary(); };

    const deleteEstudiante = async () => {
        if (!estDelete) return;
        setEstDeleting(true);
        try {
            const res = await fetch(`${apiBase}/api/centros/centros/${centroId}/estudiantes/${estDelete.id}`, { method: "DELETE", headers: authHeaders });
            if (res.ok) { toast.success("Estudiante eliminado"); setEstDelete(null); reloadEstudiantes(); }
            else { const d = await res.json(); toast.error(d.message ?? "Error al eliminar"); }
        } catch { toast.error("Error al eliminar"); }
        setEstDeleting(false);
    };

    // ─── Cursos ──────────────────────────────────────────────────────────────
    const fetchCursos = async (search: string, offset: number, limit: number) => {
        setCurLoading(true);
        try {
            const p = new URLSearchParams({ limit: limit + "", offset: (offset * limit) + "", search });
            const res = await fetch(`${apiBase}/api/centros/centros/${centroId}/cursos?${p}`, { headers: authHeaders });
            if (res.ok) { const d = await res.json(); setCursos(d.data ?? []); setCurCount(d.count ?? 0); }
            else { toast.error("Error al cargar cursos"); }
        } catch { toast.error("Error al cargar cursos"); }
        setCurLoading(false);
    };

    const reloadCursos = () => { fetchCursos(curSearch, curOffset, curLimit); fetchSummary(); };

    const deleteCurso = async () => {
        if (!curDelete) return;
        setCurDeleting(true);
        try {
            const res = await fetch(`${apiBase}/api/centros/centros/${centroId}/cursos/${curDelete.id}`, { method: "DELETE", headers: authHeaders });
            if (res.ok) { toast.success("Curso eliminado"); setCurDelete(null); reloadCursos(); }
            else { const d = await res.json(); toast.error(d.message ?? "Error al eliminar"); }
        } catch { toast.error("Error al eliminar"); }
        setCurDeleting(false);
    };

    // ─── Init ────────────────────────────────────────────────────────────────
    useEffect(() => {
        if (session && centroId) {
            fetchCentro();
            fetchSummary();
            fetchInstructors("", 0, 10);
            fetchEstudiantes("", 0, 10);
            fetchCursos("", 0, 10);
        }
    }, [session, centroId]);

    // ─── Pagination helper ───────────────────────────────────────────────────
    const PaginationBar = ({
        offset, count, limit, setLimit: setLim, onPagination, onRefresh,
    }: {
        offset: number; count: number; limit: number;
        setLimit: (l: number) => void; onPagination: (p: number) => void; onRefresh: () => void;
    }) => {
        const pages = count > 0 ? Math.ceil(count / limit) : 0;
        const pageIndices = Array.from({ length: pages }, (_, i) => i);
        const show = (idx: number) => {
            if (offset <= 2 && idx <= 6) return true;
            if (offset >= pages - 3 && idx >= pages - 7) return true;
            if (offset + 3 >= idx && offset - 3 <= idx) return true;
            return false;
        };

        if (count === 0) return null;

        return (
            <div className="flex flex-row flex-wrap items-center justify-between gap-4 mt-4 pt-4 border-t">
                <div className="flex flex-row items-center gap-4">
                    <Select value={limit + ""} onValueChange={(v) => { setLim(+v); }}>
                        <SelectTrigger size="sm" className="w-[100px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="10">10</SelectItem>
                            <SelectItem value="25">25</SelectItem>
                            <SelectItem value="50">50</SelectItem>
                        </SelectContent>
                    </Select>
                    <div className="text-xs">Total: <b>{prettifyNumber(count)}</b></div>
                </div>
                <div className="flex gap-2 items-center">
                    <Button variant="outline" size="icon" onClick={() => offset > 0 && onPagination(offset - 1)} disabled={offset === 0} className="h-8 w-8">
                        <Icon icon="heroicons:chevron-left" className="w-5 h-5 rtl:rotate-180" />
                    </Button>
                    {pageIndices.map((p) => show(p) ? (
                        <Button key={p} variant={offset === p ? undefined : "outline"} onClick={() => onPagination(p)} className="w-8 h-8">{p + 1}</Button>
                    ) : null)}
                    <Button variant="outline" size="icon" onClick={() => offset + 1 < pages && onPagination(offset + 1)} disabled={offset + 1 >= pages} className="h-8 w-8">
                        <Icon icon="heroicons:chevron-right" className="w-5 h-5 rtl:rotate-180" />
                    </Button>
                    <Button size="icon" color="info" className="h-8 w-8" onClick={onRefresh}>
                        <RefreshCcw className="h-3 w-3" />
                    </Button>
                </div>
            </div>
        );
    };

    // ─── Render ──────────────────────────────────────────────────────────────

    if (loading) {
        return (
            <div className="mb-4">
                <Breadcrumbs>
                    <BreadcrumbItem>Plataforma</BreadcrumbItem>
                    <BreadcrumbItem>Centros</BreadcrumbItem>
                    <BreadcrumbItem>Gestionar Centros</BreadcrumbItem>
                    <BreadcrumbItem className="text-primary">Detalle</BreadcrumbItem>
                </Breadcrumbs>
                <div className="mt-5"><SkeletonTable /></div>
            </div>
        );
    }

    if (!centro) {
        return (
            <div className="mb-4">
                <Breadcrumbs>
                    <BreadcrumbItem>Plataforma</BreadcrumbItem>
                    <BreadcrumbItem>Centros</BreadcrumbItem>
                    <BreadcrumbItem>Gestionar Centros</BreadcrumbItem>
                    <BreadcrumbItem className="text-primary">Detalle</BreadcrumbItem>
                </Breadcrumbs>
                <div className="mt-5 py-12 text-center text-muted-foreground">Centro no encontrado.</div>
            </div>
        );
    }

    return (
        <div className="mb-4">
            <Breadcrumbs>
                <BreadcrumbItem>Plataforma</BreadcrumbItem>
                <BreadcrumbItem>Centros</BreadcrumbItem>
                <BreadcrumbItem>Gestionar Centros</BreadcrumbItem>
                <BreadcrumbItem className="text-primary">{centro.nombre}</BreadcrumbItem>
            </Breadcrumbs>

            {/* Header Card */}
            <Card className="mt-5">
                <CardContent className="p-6">
                    <div className="flex flex-col gap-4">
                        <div className="flex items-start justify-between gap-2">
                            <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <Building2 className="h-5 w-5 text-primary" />
                                    <h2 className="text-lg font-semibold">{centro.nombre}</h2>
                                    {centro.siglas && <Badge variant="secondary">{centro.siglas}</Badge>}
                                    {centro.codigo && <Badge variant="outline">{centro.codigo}</Badge>}
                                </div>
                                {centro.descripcion && (
                                    <p className="text-muted-foreground text-sm mt-2">{centro.descripcion}</p>
                                )}
                            </div>
                            <Badge variant={centro.estatus === 1 ? "soft" : "secondary"} color={centro.estatus === 1 ? "success" : "secondary"}>
                                {centro.estatus === 1 ? "Activo" : "Inactivo"}
                            </Badge>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                            <div className="space-y-2">
                                <h3 className="text-sm font-semibold text-muted-foreground">Información general</h3>
                                {(centro.departamento_nombre || centro.municipio_nombre) && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <MapPin className="h-4 w-4 text-muted-foreground" />
                                        <span>{[centro.municipio_nombre, centro.departamento_nombre].filter(Boolean).join(", ")}</span>
                                    </div>
                                )}
                                {centro.direccion && (
                                    <div className="flex items-center gap-2 text-sm"><MapPin className="h-4 w-4 text-muted-foreground" /><span>{centro.direccion}</span></div>
                                )}
                                {centro.telefono && (
                                    <div className="flex items-center gap-2 text-sm"><Phone className="h-4 w-4 text-muted-foreground" /><span>{centro.telefono}</span></div>
                                )}
                                {centro.email && (
                                    <div className="flex items-center gap-2 text-sm"><Mail className="h-4 w-4 text-muted-foreground" /><span>{centro.email}</span></div>
                                )}
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-sm font-semibold text-muted-foreground">Director</h3>
                                {centro.nombre_director && (
                                    <div className="flex items-center gap-2 text-sm"><User className="h-4 w-4 text-muted-foreground" /><span>{centro.nombre_director}</span></div>
                                )}
                                {centro.telefono_director && (
                                    <div className="flex items-center gap-2 text-sm"><Phone className="h-4 w-4 text-muted-foreground" /><span>{centro.telefono_director}</span></div>
                                )}
                                {centro.email_director && (
                                    <div className="flex items-center gap-2 text-sm"><Mail className="h-4 w-4 text-muted-foreground" /><span>{centro.email_director}</span></div>
                                )}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Tabs Card */}
            <Card className="mt-4">
                <Tabs defaultValue="resumen" className="w-full">
                    <TabsList className="w-full justify-start gap-8 border-b border-default-200 rounded-none bg-transparent p-0 h-auto min-h-0 px-6 pt-4 pb-0">
                        <TabsTrigger value="resumen" className={TAB_TRIGGER_CLASS}>Resumen</TabsTrigger>
                        <TabsTrigger value="instructores" className={TAB_TRIGGER_CLASS}>Instructores</TabsTrigger>
                        <TabsTrigger value="estudiantes" className={TAB_TRIGGER_CLASS}>Estudiantes</TabsTrigger>
                        <TabsTrigger value="cursos" className={TAB_TRIGGER_CLASS}>Cursos</TabsTrigger>
                    </TabsList>

                    {/* ═══ Tab Resumen ═══ */}
                    <TabsContent value="resumen" className="mt-0 px-6 pt-6 pb-6">
                        <h3 className="text-lg font-semibold mb-4">Resumen del Centro</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <Card className="border-l-4 border-l-primary">
                                <CardContent className="p-4 flex items-center gap-4">
                                    <div className="rounded-full bg-primary/10 p-3">
                                        <UserCheck className="h-6 w-6 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Instructores</p>
                                        <p className="text-2xl font-bold">{prettifyNumber(summary.instructores)}</p>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card className="border-l-4 border-l-success">
                                <CardContent className="p-4 flex items-center gap-4">
                                    <div className="rounded-full bg-success/10 p-3">
                                        <GraduationCap className="h-6 w-6 text-success" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Estudiantes</p>
                                        <p className="text-2xl font-bold">{prettifyNumber(summary.estudiantes)}</p>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card className="border-l-4 border-l-warning">
                                <CardContent className="p-4 flex items-center gap-4">
                                    <div className="rounded-full bg-warning/10 p-3">
                                        <BookOpen className="h-6 w-6 text-warning" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Cursos</p>
                                        <p className="text-2xl font-bold">{prettifyNumber(summary.cursos)}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* ═══ Tab Instructores ═══ */}
                    <TabsContent value="instructores" className="mt-0 px-6 pt-6 pb-6">
                        <div className="flex flex-row items-center justify-between mb-4 gap-4">
                            <InputGroup className="max-w-sm shrink-0">
                                <Input
                                    placeholder="Buscar por identidad, nombre..."
                                    value={instSearchInput}
                                    onChange={(e) => setInstSearchInput(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === "Enter") { setInstSearch(instSearchInput); setInstOffset(0); fetchInstructors(instSearchInput, 0, instLimit); } }}
                                    className="h-10 rounded-r-none"
                                />
                                <InputGroupButton className="rounded-l-none border-l-0">
                                    <Button color="primary" size="sm" className="h-10 rounded-l-none" onClick={() => { setInstSearch(instSearchInput); setInstOffset(0); fetchInstructors(instSearchInput, 0, instLimit); }}>
                                        Buscar
                                    </Button>
                                </InputGroupButton>
                            </InputGroup>
                            {isSupervisor && (
                                <Button size="sm" color="success" onClick={() => { setInstSelected(null); setInstModalOpen(true); }}>
                                    <PlusCircle className="h-4 w-4 mr-2" />Crear Instructor
                                </Button>
                            )}
                        </div>
                        {instLoading ? <SkeletonTable /> : instructors.length === 0 ? (
                            <p className="text-muted-foreground py-8 text-center">No hay instructores registrados.</p>
                        ) : (
                            <>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Identidad</TableHead>
                                            <TableHead>Nombres</TableHead>
                                            <TableHead>Apellidos</TableHead>
                                            <TableHead className="hidden md:table-cell">Email</TableHead>
                                            <TableHead className="hidden md:table-cell">Teléfono</TableHead>
                                            <TableHead className="hidden sm:table-cell">Sexo</TableHead>
                                            {isSupervisor && <TableHead className="text-right">Acciones</TableHead>}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {instructors.map((r: any) => (
                                            <TableRow key={r.id}>
                                                <TableCell className="font-medium">{r.identidad}</TableCell>
                                                <TableCell>{r.nombres}</TableCell>
                                                <TableCell>{r.apellidos}</TableCell>
                                                <TableCell className="hidden md:table-cell">{r.email || "-"}</TableCell>
                                                <TableCell className="hidden md:table-cell">{r.telefono || "-"}</TableCell>
                                                <TableCell className="hidden sm:table-cell">{r.sexo === "M" ? "Masculino" : r.sexo === "F" ? "Femenino" : r.sexo}</TableCell>
                                                {isSupervisor && (
                                                    <TableCell className="text-right">
                                                        <Button variant="ghost" size="icon" onClick={() => { setInstSelected(r); setInstModalOpen(true); }}>
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setInstDelete(r)}>
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </TableCell>
                                                )}
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                                <PaginationBar
                                    offset={instOffset} count={instCount} limit={instLimit}
                                    setLimit={(l) => { setInstLimit(l); setInstOffset(0); fetchInstructors(instSearch, 0, l); }}
                                    onPagination={(p) => { setInstOffset(p); fetchInstructors(instSearch, p, instLimit); }}
                                    onRefresh={() => { setInstSearchInput(""); setInstSearch(""); setInstOffset(0); fetchInstructors("", 0, instLimit); }}
                                />
                            </>
                        )}
                    </TabsContent>

                    {/* ═══ Tab Estudiantes ═══ */}
                    <TabsContent value="estudiantes" className="mt-0 px-6 pt-6 pb-6">
                        <div className="flex flex-row items-center justify-between mb-4 gap-4">
                            <InputGroup className="max-w-sm shrink-0">
                                <Input
                                    placeholder="Buscar por identidad, nombre..."
                                    value={estSearchInput}
                                    onChange={(e) => setEstSearchInput(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === "Enter") { setEstSearch(estSearchInput); setEstOffset(0); fetchEstudiantes(estSearchInput, 0, estLimit); } }}
                                    className="h-10 rounded-r-none"
                                />
                                <InputGroupButton className="rounded-l-none border-l-0">
                                    <Button color="primary" size="sm" className="h-10 rounded-l-none" onClick={() => { setEstSearch(estSearchInput); setEstOffset(0); fetchEstudiantes(estSearchInput, 0, estLimit); }}>
                                        Buscar
                                    </Button>
                                </InputGroupButton>
                            </InputGroup>
                            {isSupervisor && (
                                <Button size="sm" color="success" onClick={() => { setEstSelected(null); setEstModalOpen(true); }}>
                                    <PlusCircle className="h-4 w-4 mr-2" />Crear Estudiante
                                </Button>
                            )}
                        </div>
                        {estLoading ? <SkeletonTable /> : estudiantes.length === 0 ? (
                            <p className="text-muted-foreground py-8 text-center">No hay estudiantes registrados.</p>
                        ) : (
                            <>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Identidad</TableHead>
                                            <TableHead>Nombres</TableHead>
                                            <TableHead>Apellidos</TableHead>
                                            <TableHead className="hidden md:table-cell">Email</TableHead>
                                            <TableHead className="hidden md:table-cell">Teléfono</TableHead>
                                            <TableHead className="hidden sm:table-cell">Sexo</TableHead>
                                            {isSupervisor && <TableHead className="text-right">Acciones</TableHead>}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {estudiantes.map((r: any) => (
                                            <TableRow key={r.id}>
                                                <TableCell className="font-medium">{r.identidad}</TableCell>
                                                <TableCell>{r.nombres}</TableCell>
                                                <TableCell>{r.apellidos}</TableCell>
                                                <TableCell className="hidden md:table-cell">{r.email || "-"}</TableCell>
                                                <TableCell className="hidden md:table-cell">{r.telefono || "-"}</TableCell>
                                                <TableCell className="hidden sm:table-cell">{r.sexo === "M" ? "Masculino" : r.sexo === "F" ? "Femenino" : r.sexo}</TableCell>
                                                {isSupervisor && (
                                                    <TableCell className="text-right">
                                                        <Button variant="ghost" size="icon" onClick={() => { setEstSelected(r); setEstModalOpen(true); }}>
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setEstDelete(r)}>
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </TableCell>
                                                )}
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                                <PaginationBar
                                    offset={estOffset} count={estCount} limit={estLimit}
                                    setLimit={(l) => { setEstLimit(l); setEstOffset(0); fetchEstudiantes(estSearch, 0, l); }}
                                    onPagination={(p) => { setEstOffset(p); fetchEstudiantes(estSearch, p, estLimit); }}
                                    onRefresh={() => { setEstSearchInput(""); setEstSearch(""); setEstOffset(0); fetchEstudiantes("", 0, estLimit); }}
                                />
                            </>
                        )}
                    </TabsContent>

                    {/* ═══ Tab Cursos ═══ */}
                    <TabsContent value="cursos" className="mt-0 px-6 pt-6 pb-6">
                        <div className="flex flex-row items-center justify-between mb-4 gap-4">
                            <InputGroup className="max-w-sm shrink-0">
                                <Input
                                    placeholder="Buscar por nombre, código..."
                                    value={curSearchInput}
                                    onChange={(e) => setCurSearchInput(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === "Enter") { setCurSearch(curSearchInput); setCurOffset(0); fetchCursos(curSearchInput, 0, curLimit); } }}
                                    className="h-10 rounded-r-none"
                                />
                                <InputGroupButton className="rounded-l-none border-l-0">
                                    <Button color="primary" size="sm" className="h-10 rounded-l-none" onClick={() => { setCurSearch(curSearchInput); setCurOffset(0); fetchCursos(curSearchInput, 0, curLimit); }}>
                                        Buscar
                                    </Button>
                                </InputGroupButton>
                            </InputGroup>
                            {isSupervisor && (
                                <Button size="sm" color="success" onClick={() => { setCurSelected(null); setCurModalOpen(true); }}>
                                    <PlusCircle className="h-4 w-4 mr-2" />Crear Curso
                                </Button>
                            )}
                        </div>
                        {curLoading ? <SkeletonTable /> : cursos.length === 0 ? (
                            <p className="text-muted-foreground py-8 text-center">No hay cursos registrados.</p>
                        ) : (
                            <>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Código</TableHead>
                                            <TableHead>Nombre</TableHead>
                                            <TableHead className="hidden md:table-cell">Cód. Programa</TableHead>
                                            <TableHead className="hidden sm:table-cell">Total Horas</TableHead>
                                            <TableHead className="hidden md:table-cell">Taller</TableHead>
                                            {isSupervisor && <TableHead className="text-right">Acciones</TableHead>}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {cursos.map((r: any) => (
                                            <TableRow key={r.id}>
                                                <TableCell className="font-medium">{r.codigo}</TableCell>
                                                <TableCell>{r.nombre}</TableCell>
                                                <TableCell className="hidden md:table-cell">{r.codigo_programa}</TableCell>
                                                <TableCell className="hidden sm:table-cell">{r.total_horas}</TableCell>
                                                <TableCell className="hidden md:table-cell">{r.taller === 1 ? "Sí" : "No"}</TableCell>
                                                {isSupervisor && (
                                                    <TableCell className="text-right">
                                                        <Button variant="ghost" size="icon" onClick={() => { setCurSelected(r); setCurModalOpen(true); }}>
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setCurDelete(r)}>
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </TableCell>
                                                )}
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                                <PaginationBar
                                    offset={curOffset} count={curCount} limit={curLimit}
                                    setLimit={(l) => { setCurLimit(l); setCurOffset(0); fetchCursos(curSearch, 0, l); }}
                                    onPagination={(p) => { setCurOffset(p); fetchCursos(curSearch, p, curLimit); }}
                                    onRefresh={() => { setCurSearchInput(""); setCurSearch(""); setCurOffset(0); fetchCursos("", 0, curLimit); }}
                                />
                            </>
                        )}
                    </TabsContent>
                </Tabs>
            </Card>

            {/* ═══ Modals ═══ */}
            <InstructorModal
                instructor={instSelected}
                centroId={centroId}
                isOpen={instModalOpen}
                setIsOpen={(open) => { setInstModalOpen(open); if (!open) setInstSelected(null); }}
                reloadList={reloadInstructors}
            />
            <EstudianteModal
                estudiante={estSelected}
                centroId={centroId}
                isOpen={estModalOpen}
                setIsOpen={(open) => { setEstModalOpen(open); if (!open) setEstSelected(null); }}
                reloadList={reloadEstudiantes}
            />
            <CursoModal
                curso={curSelected}
                centroId={centroId}
                isOpen={curModalOpen}
                setIsOpen={(open) => { setCurModalOpen(open); if (!open) setCurSelected(null); }}
                reloadList={reloadCursos}
            />

            {/* ═══ Delete Dialogs ═══ */}
            <AlertDialog open={!!instDelete} onOpenChange={(open) => !open && setInstDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar instructor?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Se eliminará a &quot;{instDelete?.nombres} {instDelete?.apellidos}&quot;. Esta acción no se puede deshacer.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={instDeleting}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={deleteInstructor} disabled={instDeleting} color="destructive">
                            {instDeleting ? "Eliminando..." : "Eliminar"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={!!estDelete} onOpenChange={(open) => !open && setEstDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar estudiante?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Se eliminará a &quot;{estDelete?.nombres} {estDelete?.apellidos}&quot;. Esta acción no se puede deshacer.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={estDeleting}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={deleteEstudiante} disabled={estDeleting} color="destructive">
                            {estDeleting ? "Eliminando..." : "Eliminar"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={!!curDelete} onOpenChange={(open) => !open && setCurDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar curso?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Se eliminará el curso &quot;{curDelete?.nombre}&quot;. Esta acción no se puede deshacer.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={curDeleting}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={deleteCurso} disabled={curDeleting} color="destructive">
                            {curDeleting ? "Eliminando..." : "Eliminar"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
