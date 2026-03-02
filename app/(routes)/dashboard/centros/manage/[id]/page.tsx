"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    MapPin, Phone, Mail, User, Building2, UserCheck, GraduationCap, BookOpen,
    PlusCircle, Pencil, Trash2, RefreshCcw, FileText, Globe, Save, X,
} from "lucide-react";
import { Icon } from "@iconify/react";
import { prettifyNumber } from "@/app/libs/utils";
import KPIBlock from "@/components/project/KPIBlock";
import InstructorModal from "@/components/centro/instructor-modal";
import StudentWizard from "@/components/centro/student-wizard";
import CursoModal from "@/components/centro/curso-modal";
import ExcelActions from "@/components/centro/excel-actions";

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

    // Edit centro
    const [editing, setEditing] = useState(false);
    const [editForm, setEditForm] = useState<any>({});
    const [editSaving, setEditSaving] = useState(false);
    const [departamentos, setDepartamentos] = useState<any[]>([]);
    const [municipios, setMunicipios] = useState<any[]>([]);

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

    const fetchDepartamentos = async () => {
        try {
            const res = await fetch(`${apiBase}/api/centros/departamentos`, { headers: authHeaders });
            if (res.ok) { const d = await res.json(); setDepartamentos(d.data ?? []); }
        } catch { /* silent */ }
    };

    const fetchMunicipios = async (depId: number) => {
        try {
            const res = await fetch(`${apiBase}/api/centros/municipios?departamento_id=${depId}`, { headers: authHeaders });
            if (res.ok) { const d = await res.json(); setMunicipios(d.data ?? []); }
        } catch { /* silent */ }
    };

    const startEdit = () => {
        setEditForm({
            nombre: centro.nombre ?? "", siglas: centro.siglas ?? "", codigo: centro.codigo ?? "",
            descripcion: centro.descripcion ?? "", departamento_id: centro.departamento_id ?? "",
            municipio_id: centro.municipio_id ?? "", direccion: centro.direccion ?? "",
            telefono: centro.telefono ?? "", email: centro.email ?? "",
            pagina_web: centro.pagina_web ?? "", facebook: centro.facebook ?? "", twitter: centro.twitter ?? "",
            nombre_director: centro.nombre_director ?? "", telefono_director: centro.telefono_director ?? "",
            email_director: centro.email_director ?? "",
            nombre_contacto: centro.nombre_contacto ?? "", telefono_contacto: centro.telefono_contacto ?? "",
            email_contacto: centro.email_contacto ?? "", puesto_contacto: centro.puesto_contacto ?? "",
        });
        fetchDepartamentos();
        if (centro.departamento_id) fetchMunicipios(centro.departamento_id);
        setEditing(true);
    };

    const cancelEdit = () => { setEditing(false); setEditForm({}); };

    const saveEdit = async () => {
        if (!editForm.nombre || !editForm.siglas || !editForm.codigo || !editForm.departamento_id || !editForm.municipio_id) {
            toast.error("Nombre, siglas, código, departamento y municipio son requeridos");
            return;
        }
        setEditSaving(true);
        try {
            const res = await fetch(`${apiBase}/api/centros/centros/${centroId}`, {
                method: "PUT",
                headers: { ...authHeaders, "Content-Type": "application/json" },
                body: JSON.stringify(editForm),
            });
            if (res.ok) {
                toast.success("Centro actualizado");
                setEditing(false);
                fetchCentro();
            } else {
                const d = await res.json();
                toast.error(d.message ?? "Error al actualizar");
            }
        } catch { toast.error("Error al actualizar"); }
        setEditSaving(false);
    };

    const ef = (field: string, value: any) => setEditForm((prev: any) => ({ ...prev, [field]: value }));

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

    const downloadInstructorPdf = async (inst: any) => {
        try {
            const res = await fetch(`${apiBase}/api/centros/instructors/${inst.id}/pdf`, { headers: authHeaders });
            if (!res.ok) { toast.error("Error al descargar"); return; }
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `hoja_de_vida_${inst.nombres}_${inst.apellidos}`.replace(/\s+/g, "_");
            a.click();
            URL.revokeObjectURL(url);
        } catch { toast.error("Error al descargar"); }
    };

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

    const openStudentPdf = async (est: any) => {
        try {
            const res = await fetch(`${apiBase}/api/centros/students/${est.id}/pdf`, { headers: authHeaders });
            if (!res.ok) { toast.error("Error al abrir"); return; }
            const blob = await res.blob();
            window.open(URL.createObjectURL(blob), "_blank", "noopener,noreferrer");
        } catch { toast.error("Error al abrir"); }
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

    const getAgeFromBirthDate = (fechaNacimiento: string | null | undefined): number | null => {
        const raw = fechaNacimiento != null && typeof fechaNacimiento === "string" ? String(fechaNacimiento).trim() : "";
        if (!raw) return null;
        let date: Date;
        const iso = /^\d{4}-\d{2}-\d{2}/.test(raw);
        const dmy = /^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}$/.test(raw);
        if (iso) date = new Date(raw);
        else if (dmy) {
            const parts = raw.split(/[\/\-]/);
            const day = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10) - 1;
            const year = parseInt(parts[2], 10);
            const y = year < 100 ? 2000 + year : year;
            date = new Date(y, month, day);
        } else date = new Date(raw);
        if (isNaN(date.getTime())) return null;
        const today = new Date();
        let age = today.getFullYear() - date.getFullYear();
        const m = today.getMonth() - date.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < date.getDate())) age--;
        return age >= 0 ? age : null;
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
            <Card className="mt-5 overflow-hidden">
                <div className="p-6 pb-4">
                    <div className="flex items-center gap-3 flex-wrap">
                        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-primary">{centro.nombre}</h1>
                        {centro.siglas && <Badge variant="secondary">{centro.siglas}</Badge>}
                        {centro.codigo && <Badge variant="outline">{centro.codigo}</Badge>}
                        <Badge variant={centro.estatus === 1 ? "soft" : "secondary"} color={centro.estatus === 1 ? "success" : "secondary"}>
                            {centro.estatus === 1 ? "Activo" : "Inactivo"}
                        </Badge>
                    </div>
                    {centro.descripcion && (
                        <p className="text-sm text-muted-foreground mt-2 max-w-3xl leading-relaxed">{centro.descripcion}</p>
                    )}
                    <div className="flex flex-wrap gap-x-6 gap-y-2 mt-4 text-sm text-muted-foreground">
                        {(centro.municipio_nombre || centro.departamento_nombre) && (
                            <span className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 shrink-0" />
                                {[centro.municipio_nombre, centro.departamento_nombre].filter(Boolean).join(", ")}
                            </span>
                        )}
                        {centro.direccion && (
                            <span className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 shrink-0" />
                                {centro.direccion}
                            </span>
                        )}
                        {centro.telefono && (
                            <span className="flex items-center gap-2">
                                <Phone className="h-4 w-4 shrink-0" />
                                {centro.telefono}
                            </span>
                        )}
                        {centro.email && (
                            <span className="flex items-center gap-2">
                                <Mail className="h-4 w-4 shrink-0" />
                                {centro.email}
                            </span>
                        )}
                    </div>
                    {centro.nombre_director && (
                        <div className="flex flex-wrap gap-x-6 gap-y-2 mt-2 text-sm text-muted-foreground">
                            <span className="flex items-center gap-2">
                                <User className="h-4 w-4 shrink-0" />
                                Director: {centro.nombre_director}
                            </span>
                            {centro.telefono_director && (
                                <span className="flex items-center gap-2">
                                    <Phone className="h-4 w-4 shrink-0" />
                                    {centro.telefono_director}
                                </span>
                            )}
                            {centro.email_director && (
                                <span className="flex items-center gap-2">
                                    <Mail className="h-4 w-4 shrink-0" />
                                    {centro.email_director}
                                </span>
                            )}
                        </div>
                    )}
                </div>
                <div className="px-6 pb-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        <KPIBlock icon={UserCheck} label="Instructores" value={prettifyNumber(summary.instructores)} iconColor="text-primary" index={0} />
                        <KPIBlock icon={GraduationCap} label="Estudiantes" value={prettifyNumber(summary.estudiantes)} iconColor="text-success" index={1} />
                        <KPIBlock icon={BookOpen} label="Cursos" value={prettifyNumber(summary.cursos)} iconColor="text-warning" index={2} />
                    </div>
                </div>
            </Card>

            {/* Tabs Card */}
            <Card className="mt-4">
                <Tabs defaultValue="general" className="w-full">
                    <TabsList className="w-full justify-start gap-8 border-b border-default-200 rounded-none bg-transparent p-0 h-auto min-h-0 px-6 pt-4 pb-0">
                        <TabsTrigger value="general" className={TAB_TRIGGER_CLASS}>General</TabsTrigger>
                        <TabsTrigger value="cursos" className={TAB_TRIGGER_CLASS}>Cursos</TabsTrigger>
                        <TabsTrigger value="instructores" className={TAB_TRIGGER_CLASS}>Instructores</TabsTrigger>
                        <TabsTrigger value="estudiantes" className={TAB_TRIGGER_CLASS}>Estudiantes</TabsTrigger>
                    </TabsList>

                    {/* ═══ Tab General ═══ */}
                    <TabsContent value="general" className="mt-0 px-6 pt-6 pb-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-semibold">Información General</h3>
                            {isSupervisor && !editing && (
                                <Button size="sm" variant="outline" onClick={startEdit}>
                                    <Pencil className="h-4 w-4 mr-2" />Editar
                                </Button>
                            )}
                            {editing && (
                                <div className="flex gap-2">
                                    <Button size="sm" variant="outline" onClick={cancelEdit} disabled={editSaving}>
                                        <X className="h-4 w-4 mr-2" />Cancelar
                                    </Button>
                                    <Button size="sm" color="success" onClick={saveEdit} disabled={editSaving}>
                                        <Save className="h-4 w-4 mr-2" />{editSaving ? "Guardando..." : "Guardar"}
                                    </Button>
                                </div>
                            )}
                        </div>

                        {!editing ? (() => {
                            const Field = ({ label, value }: { label: string; value: any }) =>
                                value ? <div><p className="text-xs text-muted-foreground">{label}</p><p className="text-sm font-medium">{value}</p></div> : null;

                            const centroFields = [
                                { label: "Nombre", value: centro.nombre },
                                { label: "Siglas", value: centro.siglas },
                                { label: "Código", value: centro.codigo },
                                { label: "Descripción", value: centro.descripcion },
                            ].filter(f => f.value);

                            const ubicacionFields = [
                                { label: "Departamento", value: centro.departamento_nombre },
                                { label: "Municipio", value: centro.municipio_nombre },
                                { label: "Dirección", value: centro.direccion },
                                { label: "Teléfono", value: centro.telefono },
                                { label: "Email", value: centro.email },
                                { label: "Página Web", value: centro.pagina_web },
                                { label: "Facebook", value: centro.facebook },
                            ].filter(f => f.value);

                            const directorFields = [
                                { label: "Nombre", value: centro.nombre_director },
                                { label: "Teléfono", value: centro.telefono_director },
                                { label: "Email", value: centro.email_director },
                            ].filter(f => f.value);

                            const contactoFields = [
                                { label: "Nombre", value: centro.nombre_contacto },
                                { label: "Puesto", value: centro.puesto_contacto },
                                { label: "Teléfono", value: centro.telefono_contacto },
                                { label: "Email", value: centro.email_contacto },
                            ].filter(f => f.value);

                            return (
                                <div className="space-y-6">
                                    {centroFields.length > 0 && (
                                        <div>
                                            <h4 className="text-sm font-semibold text-muted-foreground border-b pb-2 mb-3">Centro</h4>
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-3 gap-x-6">
                                                {centroFields.map(f => <Field key={f.label} label={f.label} value={f.value} />)}
                                            </div>
                                        </div>
                                    )}
                                    {ubicacionFields.length > 0 && (
                                        <div>
                                            <h4 className="text-sm font-semibold text-muted-foreground border-b pb-2 mb-3">Ubicación y Contacto</h4>
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-3 gap-x-6">
                                                {ubicacionFields.map(f => <Field key={f.label} label={f.label} value={f.value} />)}
                                            </div>
                                        </div>
                                    )}
                                    {directorFields.length > 0 && (
                                        <div>
                                            <h4 className="text-sm font-semibold text-muted-foreground border-b pb-2 mb-3">Director</h4>
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-3 gap-x-6">
                                                {directorFields.map(f => <Field key={f.label} label={f.label} value={f.value} />)}
                                            </div>
                                        </div>
                                    )}
                                    {contactoFields.length > 0 && (
                                        <div>
                                            <h4 className="text-sm font-semibold text-muted-foreground border-b pb-2 mb-3">Persona de Contacto</h4>
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-3 gap-x-6">
                                                {contactoFields.map(f => <Field key={f.label} label={f.label} value={f.value} />)}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })() : (
                            <div className="space-y-6">
                                <div>
                                    <h4 className="text-sm font-semibold text-muted-foreground border-b pb-2 mb-3">Centro</h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                                        <div className="sm:col-span-2">
                                            <Label>Nombre *</Label>
                                            <Input value={editForm.nombre} onChange={(e) => ef("nombre", e.target.value)} />
                                        </div>
                                        <div>
                                            <Label>Siglas *</Label>
                                            <Input value={editForm.siglas} onChange={(e) => ef("siglas", e.target.value)} />
                                        </div>
                                        <div>
                                            <Label>Código *</Label>
                                            <Input value={editForm.codigo} onChange={(e) => ef("codigo", e.target.value)} />
                                        </div>
                                        <div className="sm:col-span-2 md:col-span-4">
                                            <Label>Descripción</Label>
                                            <Textarea value={editForm.descripcion} onChange={(e) => ef("descripcion", e.target.value)} rows={2} />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-sm font-semibold text-muted-foreground border-b pb-2 mb-3">Ubicación y Contacto</h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                                        <div>
                                            <Label>Departamento *</Label>
                                            <Select
                                                value={editForm.departamento_id?.toString() ?? ""}
                                                onValueChange={(v) => {
                                                    ef("departamento_id", Number(v));
                                                    ef("municipio_id", "");
                                                    fetchMunicipios(Number(v));
                                                }}
                                            >
                                                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                                                <SelectContent>
                                                    {departamentos.map((d: any) => (
                                                        <SelectItem key={d.id} value={d.id.toString()}>{d.nombre}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div>
                                            <Label>Municipio *</Label>
                                            <Select
                                                value={editForm.municipio_id?.toString() ?? ""}
                                                onValueChange={(v) => ef("municipio_id", Number(v))}
                                            >
                                                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                                                <SelectContent>
                                                    {municipios.map((m: any) => (
                                                        <SelectItem key={m.id} value={m.id.toString()}>{m.nombre}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="sm:col-span-2">
                                            <Label>Dirección</Label>
                                            <Input value={editForm.direccion} onChange={(e) => ef("direccion", e.target.value)} />
                                        </div>
                                        <div>
                                            <Label>Teléfono</Label>
                                            <Input value={editForm.telefono} onChange={(e) => ef("telefono", e.target.value)} />
                                        </div>
                                        <div>
                                            <Label>Email</Label>
                                            <Input value={editForm.email} onChange={(e) => ef("email", e.target.value)} />
                                        </div>
                                        <div>
                                            <Label>Página Web</Label>
                                            <Input value={editForm.pagina_web} onChange={(e) => ef("pagina_web", e.target.value)} />
                                        </div>
                                        <div>
                                            <Label>Facebook</Label>
                                            <Input value={editForm.facebook} onChange={(e) => ef("facebook", e.target.value)} />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-sm font-semibold text-muted-foreground border-b pb-2 mb-3">Director</h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                                        <div className="sm:col-span-2">
                                            <Label>Nombre del Director</Label>
                                            <Input value={editForm.nombre_director} onChange={(e) => ef("nombre_director", e.target.value)} />
                                        </div>
                                        <div>
                                            <Label>Teléfono</Label>
                                            <Input value={editForm.telefono_director} onChange={(e) => ef("telefono_director", e.target.value)} />
                                        </div>
                                        <div>
                                            <Label>Email</Label>
                                            <Input value={editForm.email_director} onChange={(e) => ef("email_director", e.target.value)} />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-sm font-semibold text-muted-foreground border-b pb-2 mb-3">Persona de Contacto</h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                                        <div>
                                            <Label>Nombre</Label>
                                            <Input value={editForm.nombre_contacto} onChange={(e) => ef("nombre_contacto", e.target.value)} />
                                        </div>
                                        <div>
                                            <Label>Puesto</Label>
                                            <Input value={editForm.puesto_contacto} onChange={(e) => ef("puesto_contacto", e.target.value)} />
                                        </div>
                                        <div>
                                            <Label>Teléfono</Label>
                                            <Input value={editForm.telefono_contacto} onChange={(e) => ef("telefono_contacto", e.target.value)} />
                                        </div>
                                        <div>
                                            <Label>Email</Label>
                                            <Input value={editForm.email_contacto} onChange={(e) => ef("email_contacto", e.target.value)} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </TabsContent>

                    {/* ═══ Tab Instructores ═══ */}
                    <TabsContent value="instructores" className="mt-0 px-6 pt-6 pb-6">
                        <div className="flex flex-row items-center justify-between mb-4 gap-4">
                            <InputGroup className="max-w-sm shrink-0">
                                <Input
                                    placeholder="Buscar por nombre, título..."
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
                            <div className="flex gap-2 items-center">
                                <ExcelActions centroId={centroId} entity="instructors" onSuccess={() => fetchInstructors(instSearch, instOffset, instLimit)} disabled={!isSupervisor} />
                                {isSupervisor && (
                                    <Button size="sm" color="success" onClick={() => { setInstSelected(null); setInstModalOpen(true); }}>
                                        <PlusCircle className="h-4 w-4 mr-2" />Crear Instructor
                                    </Button>
                                )}
                            </div>
                        </div>
                        {instLoading ? <SkeletonTable /> : instructors.length === 0 ? (
                            <p className="text-muted-foreground py-8 text-center">No hay instructores registrados.</p>
                        ) : (
                            <>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Nombres</TableHead>
                                            <TableHead>Apellidos</TableHead>
                                            <TableHead className="hidden md:table-cell">Título Obtenido</TableHead>
                                            <TableHead className="hidden md:table-cell">Hoja de Vida</TableHead>
                                            {isSupervisor && <TableHead className="text-right">Acciones</TableHead>}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {instructors.map((r: any) => (
                                            <TableRow key={r.id}>
                                                <TableCell className="font-medium">{r.nombres}</TableCell>
                                                <TableCell>{r.apellidos}</TableCell>
                                                <TableCell className="hidden md:table-cell">{r.titulo_obtenido || "-"}</TableCell>
                                                <TableCell className="hidden md:table-cell">
                                                    {r.pdf ? (
                                                        <Button variant="ghost" size="icon" onClick={() => downloadInstructorPdf(r)} title="Descargar hoja de vida">
                                                            <FileText className="h-4 w-4 text-primary" />
                                                        </Button>
                                                    ) : "-"}
                                                </TableCell>
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
                            <div className="flex gap-2 items-center">
                                <ExcelActions centroId={centroId} entity="students" onSuccess={() => fetchEstudiantes(estSearch, estOffset, estLimit)} disabled={!isSupervisor} />
                                {isSupervisor && (
                                    <Button size="sm" color="success" onClick={() => { setEstSelected(null); setEstModalOpen(true); }}>
                                        <PlusCircle className="h-4 w-4 mr-2" />Crear Estudiante
                                    </Button>
                                )}
                            </div>
                        </div>
                        {estLoading ? <SkeletonTable /> : estudiantes.length === 0 ? (
                            <p className="text-muted-foreground py-8 text-center">No hay estudiantes registrados.</p>
                        ) : (
                            <>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Nombre completo</TableHead>
                                            <TableHead>Identidad</TableHead>
                                            <TableHead>Edad</TableHead>
                                            <TableHead className="hidden md:table-cell">Contacto</TableHead>
                                            {isSupervisor && <TableHead className="text-right">Acciones</TableHead>}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {estudiantes.map((r: any) => {
                                            const fechaNac = r.fecha_nacimiento ?? (r as any).fechaNacimiento;
                                            const age = getAgeFromBirthDate(fechaNac);
                                            return (
                                            <TableRow key={r.id}>
                                                <TableCell className="font-medium">
                                                    <Link href={`/dashboard/centros/students/${r.id}`} className="text-primary hover:underline">
                                                        {[r.nombres, r.apellidos].filter(Boolean).join(" ")}
                                                    </Link>
                                                </TableCell>
                                                <TableCell>{r.identidad}</TableCell>
                                                <TableCell>{age !== null ? `${age} años` : "-"}</TableCell>
                                                <TableCell className="hidden md:table-cell">{r.celular || r.email || "-"}</TableCell>
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
                                        ); })}
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
                            <div className="flex gap-2 items-center">
                                <ExcelActions centroId={centroId} entity="courses" onSuccess={() => fetchCursos(curSearch, curOffset, curLimit)} disabled={!isSupervisor} />
                                {isSupervisor && (
                                    <Button size="sm" color="success" onClick={() => { setCurSelected(null); setCurModalOpen(true); }}>
                                        <PlusCircle className="h-4 w-4 mr-2" />Crear Curso
                                    </Button>
                                )}
                            </div>
                        </div>
                        {curLoading ? <SkeletonTable /> : cursos.length === 0 ? (
                            <p className="text-muted-foreground py-8 text-center">No hay cursos registrados.</p>
                        ) : (
                            <>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Cód. Programa</TableHead>
                                            <TableHead>Nombre</TableHead>
                                            <TableHead className="hidden sm:table-cell">Total Horas</TableHead>
                                            <TableHead className="hidden md:table-cell">Taller</TableHead>
                                            {isSupervisor && <TableHead className="text-right">Acciones</TableHead>}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {cursos.map((r: any) => (
                                            <TableRow key={r.id}>
                                                <TableCell className="font-medium">{r.codigo_programa ?? "-"}</TableCell>
                                                <TableCell>{r.nombre}</TableCell>
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
            <StudentWizard
                student={estSelected}
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
