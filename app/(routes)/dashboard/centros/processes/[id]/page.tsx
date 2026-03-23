"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Breadcrumbs, BreadcrumbItem } from "@/components/ui/breadcrumbs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import SkeletonTable from "@/components/skeleton-table";
import toast from "react-hot-toast";
import { useSession } from "next-auth/react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
    Building2, BookOpen, Calendar, Check, Clock, ChevronsUpDown, ExternalLink, GraduationCap, Loader2,
    Pencil, PlusCircle, Trash2, User, Search, DollarSign, Users, Target, Phone, Mail,
} from "lucide-react";

const apiBase = process.env.NEXT_PUBLIC_API_URL;

const TAB_CLASS = "rounded-none border-b-2 border-transparent bg-transparent px-0 pb-3 -mb-px shadow-none data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none";

export default function ProcessDetailPage() {
    const params = useParams();
    const router = useRouter();
    const processId = params?.id as string;
    const { data: session } = useSession() as any;
    const userRole = session?.user?.role;
    const isSupervisor = userRole === "ADMIN" || userRole === "MANAGER";
    const authHeaders: any = { Authorization: `Bearer ${session?.user?.session}` };

    const [process_, setProcess] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState<Record<string, any>>({});
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [saving, setSaving] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const [enrollments, setEnrollments] = useState<any[]>([]);
    const [enrollmentsLoading, setEnrollmentsLoading] = useState(false);

    const [metodologias, setMetodologias] = useState<any[]>([]);
    const [tipoJornadas, setTipoJornadas] = useState<any[]>([]);
    const [diasCatalogo, setDiasCatalogo] = useState<{ value: string; label: string }[]>([]);
    const [diasOpen, setDiasOpen] = useState(false);
    const [courses, setCourses] = useState<any[]>([]);
    const [instructors, setInstructors] = useState<any[]>([]);

    const [enrollDialogOpen, setEnrollDialogOpen] = useState(false);
    const [enrollSearch, setEnrollSearch] = useState("");
    const [enrollSelected, setEnrollSelected] = useState<number[]>([]);
    const [enrolling, setEnrolling] = useState(false);
    const [availableStudents, setAvailableStudents] = useState<any[]>([]);
    const [studentsLoading, setStudentsLoading] = useState(false);

    const [unenrollOpen, setUnenrollOpen] = useState<any>(null);
    const [unenrolling, setUnenrolling] = useState(false);

    const [courseDetail, setCourseDetail] = useState<any>(null);
    const [courseModules, setCourseModules] = useState<any[]>([]);
    const [courseLoading, setCourseLoading] = useState(false);

    const [linkedProjects, setLinkedProjects] = useState<any[]>([]);
    const [projectsLoading, setProjectsLoading] = useState(false);
    const [linkProjectDialogOpen, setLinkProjectDialogOpen] = useState(false);
    const [linkProjectSearch, setLinkProjectSearch] = useState("");
    const [availableProjects, setAvailableProjects] = useState<any[]>([]);
    const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);
    const [linkingProject, setLinkingProject] = useState(false);
    const [unlinkProjectTarget, setUnlinkProjectTarget] = useState<any>(null);
    const [unlinkingProject, setUnlinkingProject] = useState(false);
    const [availableProjectsLoading, setAvailableProjectsLoading] = useState(false);

    const fetchProcess = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`${apiBase}/api/centros/processes/${processId}`, { headers: authHeaders });
            if (res.ok) { const d = await res.json(); setProcess(d.data ?? null); }
            else toast.error("Error al cargar proceso");
        } catch { toast.error("Error al cargar proceso"); }
        setLoading(false);
    }, [processId, session?.user?.session]);

    const fetchEnrollments = useCallback(async () => {
        setEnrollmentsLoading(true);
        try {
            const res = await fetch(`${apiBase}/api/centros/processes/${processId}/enrollments`, { headers: authHeaders });
            if (res.ok) { const d = await res.json(); setEnrollments(d.data ?? []); }
        } catch { /* silent */ }
        setEnrollmentsLoading(false);
    }, [processId, session?.user?.session]);

    useEffect(() => {
        if (session && processId) {
            fetchProcess();
            fetchEnrollments();
            fetch(`${apiBase}/api/centros/dias-catalogo`, { headers: authHeaders }).then(r => r.json()).then(d => setDiasCatalogo(d.data ?? [])).catch(() => {});
        }
    }, [session, processId]);

    const fetchCourseData = useCallback(async (cursoId: number) => {
        setCourseLoading(true);
        try {
            const [courseRes, modulesRes] = await Promise.all([
                fetch(`${apiBase}/api/centros/courses/${cursoId}`, { headers: authHeaders }),
                fetch(`${apiBase}/api/centros/courses/${cursoId}/modules`, { headers: authHeaders }),
            ]);
            if (courseRes.ok) { const d = await courseRes.json(); setCourseDetail(d.data ?? null); }
            if (modulesRes.ok) { const d = await modulesRes.json(); setCourseModules(d.data ?? []); }
        } catch { /* silent */ }
        setCourseLoading(false);
    }, [session?.user?.session]);

    useEffect(() => {
        if (process_?.curso_id) fetchCourseData(process_.curso_id);
    }, [process_?.curso_id]);

    const fetchLinkedProjects = useCallback(async () => {
        if (!processId || !session) return;
        setProjectsLoading(true);
        try {
            const res = await fetch(`${apiBase}/api/centros/processes/${processId}/projects`, { headers: authHeaders });
            if (res.ok) { const d = await res.json(); setLinkedProjects(d.data ?? []); }
        } catch { /* silent */ }
        setProjectsLoading(false);
    }, [processId, session?.user?.session]);

    useEffect(() => {
        if (process_) fetchLinkedProjects();
    }, [process_?.id]);

    const openLinkProjectDialog = async () => {
        setLinkProjectDialogOpen(true);
        setLinkProjectSearch("");
        setSelectedProjectIds([]);
        setAvailableProjectsLoading(true);
        try {
            const res = await fetch(`${apiBase}/api/supervisor/projects?limit=100&offset=0&status=ACTIVE`, { headers: authHeaders });
            if (res.ok) { const d = await res.json(); setAvailableProjects(d.data ?? []); }
        } catch { /* silent */ }
        setAvailableProjectsLoading(false);
    };

    const submitLinkProjects = async () => {
        if (!selectedProjectIds.length) return;
        setLinkingProject(true);
        try {
            const res = await fetch(`${apiBase}/api/centros/processes/${processId}/projects`, {
                method: "POST",
                headers: { "Content-Type": "application/json", ...authHeaders },
                body: JSON.stringify({ project_ids: selectedProjectIds }),
            });
            if (res.ok) {
                toast.success("Proyectos vinculados");
                setLinkProjectDialogOpen(false);
                fetchLinkedProjects();
            } else { const d = await res.json(); toast.error(d.message ?? "Error al vincular"); }
        } catch { toast.error("Error al vincular"); }
        setLinkingProject(false);
    };

    const unlinkProject = async () => {
        if (!unlinkProjectTarget) return;
        setUnlinkingProject(true);
        try {
            const res = await fetch(`${apiBase}/api/centros/processes/${processId}/projects/${unlinkProjectTarget.id}`, {
                method: "DELETE",
                headers: authHeaders,
            });
            if (res.ok) {
                toast.success("Proyecto desvinculado");
                setUnlinkProjectTarget(null);
                fetchLinkedProjects();
            } else { const d = await res.json(); toast.error(d.message ?? "Error al desvincular"); }
        } catch { toast.error("Error al desvincular"); }
        setUnlinkingProject(false);
    };

    const linkedProjectIds = new Set(linkedProjects.map((p: any) => p.id));
    const filteredAvailableProjects = availableProjects
        .filter((p: any) => !linkedProjectIds.has(p.id))
        .filter((p: any) => {
            if (!linkProjectSearch.trim()) return true;
            const q = linkProjectSearch.toLowerCase();
            return (p.name ?? "").toLowerCase().includes(q) || (p.description ?? "").toLowerCase().includes(q);
        });

    const startEditing = () => {
        if (!process_) return;
        const p = process_;
        setForm({
            codigo: p.codigo ?? "",
            nombre: p.nombre ?? "",
            curso_id: p.curso_id != null ? String(p.curso_id) : "",
            instructor_id: p.instructor_id != null ? String(p.instructor_id) : "",
            metodologia_id: p.metodologia_id != null ? String(p.metodologia_id) : "",
            otra_metodologia: p.otra_metodologia ?? "",
            fecha_inicial: p.fecha_inicial ?? "",
            fecha_final: p.fecha_final ?? "",
            duracion_horas: p.duracion_horas != null ? String(p.duracion_horas) : "",
            tipo_jornada_id: p.tipo_jornada_id != null ? String(p.tipo_jornada_id) : "",
            horario: p.horario ?? "",
            dias: p.dias ?? "",
            sede: p.sede != null ? String(p.sede) : "0",
            lugar: p.lugar ?? "",
        });
        setErrors({});
        setEditing(true);

        const centroId = p.centro_id;
        fetch(`${apiBase}/api/centros/metodologias`, { headers: authHeaders }).then(r => r.json()).then(d => setMetodologias(d.data ?? []));
        fetch(`${apiBase}/api/centros/tipo-jornadas`, { headers: authHeaders }).then(r => r.json()).then(d => setTipoJornadas(d.data ?? []));
        fetch(`${apiBase}/api/centros/dias-catalogo`, { headers: authHeaders }).then(r => r.json()).then(d => setDiasCatalogo(d.data ?? []));
        if (centroId) {
            fetch(`${apiBase}/api/centros/centros/${centroId}/cursos?limit=100&offset=0`, { headers: authHeaders }).then(r => r.json()).then(d => setCourses(d.data ?? []));
            fetch(`${apiBase}/api/centros/centros/${centroId}/instructors?limit=100&offset=0`, { headers: authHeaders }).then(r => r.json()).then(d => setInstructors(d.data ?? []));
        }
    };

    const set = (key: string, value: any) => {
        setForm(prev => ({ ...prev, [key]: value }));
        setErrors(prev => { const n = { ...prev }; delete n[key]; return n; });
    };

    const cancelEditing = () => { setEditing(false); setErrors({}); };

    useEffect(() => {
        if (!editing || !form.curso_id) return;
        const selected = courses.find((c: any) => c.id.toString() === form.curso_id);
        if (selected?.total_horas != null) {
            set("duracion_horas", String(selected.total_horas));
        }
    }, [form.curso_id, courses, editing]);

    const getAgeFromBirthDate = (fechaNacimiento: string | null | undefined): number | null => {
        const raw = fechaNacimiento != null && typeof fechaNacimiento === "string" ? fechaNacimiento.trim() : "";
        if (!raw) return null;
        let date: Date;
        const iso = /^\d{4}-\d{2}-\d{2}/.test(raw);
        const dmy = /^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}$/.test(raw);
        if (iso) {
            date = new Date(raw);
        } else if (dmy) {
            const parts = raw.split(/[\/\-]/);
            const day = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10) - 1;
            const year = parseInt(parts[2], 10);
            const y = year < 100 ? 2000 + year : year;
            date = new Date(y, month, day);
        } else {
            date = new Date(raw);
        }
        if (isNaN(date.getTime())) return null;
        const today = new Date();
        let age = today.getFullYear() - date.getFullYear();
        const m = today.getMonth() - date.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < date.getDate())) age--;
        return age >= 0 ? age : null;
    };

    const DIAS_LABELS: Record<string, string> = { "1": "Domingo", "2": "Lunes", "3": "Martes", "4": "Miércoles", "5": "Jueves", "6": "Viernes", "7": "Sábado" };

    const parseDias = (raw: string): string[] => {
        if (!raw) return [];
        const trimmed = String(raw).trim();
        if (trimmed.startsWith("[")) {
            try {
                const arr = JSON.parse(trimmed);
                if (Array.isArray(arr)) return arr.map((x: any) => String(x).trim()).filter(Boolean);
            } catch {
                try {
                    const normalized = trimmed.replace(/\\"/g, '"');
                    const arr = JSON.parse(normalized);
                    if (Array.isArray(arr)) return arr.map((x: any) => String(x).trim()).filter(Boolean);
                } catch { /* fallthrough */ }
            }
        }
        return trimmed.split(",").map((s) => s.trim().replace(/^["']|["']$/g, "")).filter(Boolean);
    };

    const selectedDias = useMemo(() => parseDias(String(form.dias ?? "")), [form.dias]);

    const toggleDia = (val: string) => {
        const current = selectedDias.includes(val)
            ? selectedDias.filter((d: string) => d !== val)
            : [...selectedDias, val];
        current.sort((a, b) => Number(a) - Number(b));
        set("dias", JSON.stringify(current));
    };

    const diasDisplayLabel = useMemo(() => {
        if (selectedDias.length === 0) return "";
        const sorted = [...selectedDias].sort((a, b) => Number(a) - Number(b));
        return sorted
            .map((v: string) => diasCatalogo.find((d) => d.value === v)?.label ?? v)
            .join(", ");
    }, [selectedDias, diasCatalogo]);

    const resolveDiasNames = (raw: string | unknown) => {
        const str = raw == null ? "" : Array.isArray(raw) ? JSON.stringify(raw) : String(raw);
        if (!str.trim()) return "-";
        const vals = parseDias(str).sort((a, b) => Number(a) - Number(b));
        if (vals.length === 0) return "-";
        return vals
            .map((v: string) => diasCatalogo.find((d) => d.value === v)?.label ?? DIAS_LABELS[v] ?? v)
            .join(", ");
    };

    const saveProcess = async () => {
        const e: Record<string, string> = {};
        if (!form.nombre?.trim()) e.nombre = "Requerido";
        setErrors(e);
        if (Object.keys(e).length > 0) return;

        setSaving(true);
        try {
            const body: any = {
                id: process_.id,
                ...form,
                curso_id: form.curso_id ? Number(form.curso_id) : null,
                instructor_id: form.instructor_id ? Number(form.instructor_id) : null,
                metodologia_id: form.metodologia_id ? Number(form.metodologia_id) : null,
                tipo_jornada_id: form.tipo_jornada_id ? Number(form.tipo_jornada_id) : null,
                duracion_horas: form.duracion_horas ? Number(form.duracion_horas) : null,
                sede: Number(form.sede) || 0,
            };

            const res = await fetch(`${apiBase}/api/centros/processes`, {
                method: "PUT",
                headers: { "Content-Type": "application/json", ...authHeaders },
                body: JSON.stringify(body),
            });

            if (res.ok) {
                toast.success("Proceso actualizado");
                setEditing(false);
                fetchProcess();
            } else {
                const json = await res.json();
                toast.error(json.message ?? "Error al guardar");
            }
        } catch { toast.error("Error al guardar"); }
        setSaving(false);
    };

    const deleteProcess = async () => {
        setDeleting(true);
        try {
            const res = await fetch(`${apiBase}/api/centros/processes/${processId}`, { method: "DELETE", headers: authHeaders });
            if (res.ok) { toast.success("Proceso eliminado"); router.push("/dashboard/centros/processes"); }
            else { const d = await res.json(); toast.error(d.message ?? "Error al eliminar"); }
        } catch { toast.error("Error al eliminar"); }
        setDeleting(false);
    };

    const openEnrollDialog = async () => {
        setEnrollDialogOpen(true);
        setEnrollSearch("");
        setEnrollSelected([]);
        setStudentsLoading(true);
        try {
            const res = await fetch(`${apiBase}/api/centros/students?limit=100&offset=0&centro_id=${process_.centro_id}`, { headers: authHeaders });
            if (res.ok) { const d = await res.json(); setAvailableStudents(d.data ?? []); }
        } catch { /* silent */ }
        setStudentsLoading(false);
    };

    const enrolledStudentIds = useMemo(() => new Set(enrollments.map(e => e.estudiante_id)), [enrollments]);

    const filteredStudents = useMemo(() => {
        const q = enrollSearch.toLowerCase();
        return availableStudents
            .filter(s => !enrolledStudentIds.has(s.id))
            .filter(s => {
                if (!q) return true;
                const name = [s.nombres, s.apellidos].filter(Boolean).join(" ").toLowerCase();
                return name.includes(q) || (s.identidad ?? "").toLowerCase().includes(q);
            });
    }, [availableStudents, enrolledStudentIds, enrollSearch]);

    const toggleEnrollStudent = (id: number) => {
        setEnrollSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    const submitEnrollment = async () => {
        if (!enrollSelected.length) return;
        setEnrolling(true);
        try {
            const res = await fetch(`${apiBase}/api/centros/processes/${processId}/enrollments`, {
                method: "POST",
                headers: { "Content-Type": "application/json", ...authHeaders },
                body: JSON.stringify({ student_ids: enrollSelected }),
            });
            if (res.ok) {
                toast.success("Estudiantes matriculados");
                setEnrollDialogOpen(false);
                fetchEnrollments();
            } else {
                const d = await res.json();
                toast.error(d.message ?? "Error al matricular");
            }
        } catch { toast.error("Error al matricular"); }
        setEnrolling(false);
    };

    const unenrollStudent = async () => {
        if (!unenrollOpen) return;
        setUnenrolling(true);
        try {
            const res = await fetch(`${apiBase}/api/centros/processes/${processId}/enrollments/${unenrollOpen.estudiante_id}`, {
                method: "DELETE", headers: authHeaders,
            });
            if (res.ok) {
                toast.success("Estudiante desmatriculado");
                setUnenrollOpen(null);
                fetchEnrollments();
            } else {
                const d = await res.json();
                toast.error(d.message ?? "Error al desmatricular");
            }
        } catch { toast.error("Error al desmatricular"); }
        setUnenrolling(false);
    };

    const fieldView = (label: string, value: any) => (
        <div>
            <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
            <p className="text-sm text-foreground">{value || "-"}</p>
        </div>
    );

    const fieldInput = (key: string, label: string, opts?: { required?: boolean; placeholder?: string; type?: string }) => (
        <div>
            <Label className="mb-1 font-medium text-default-600">{label}{opts?.required ? " *" : ""}</Label>
            <Input type={opts?.type ?? "text"} disabled={saving} value={form[key] ?? ""} onChange={(e) => set(key, e.target.value)} placeholder={opts?.placeholder ?? label} />
            {errors[key] && <p className="text-destructive text-xs mt-1">{errors[key]}</p>}
        </div>
    );

    const fieldSelect = (key: string, label: string, options: { value: string; label: string }[], opts?: { required?: boolean; disabled?: boolean; placeholder?: string }) => (
        <div>
            <Label className="mb-1 font-medium text-default-600">{label}{opts?.required ? " *" : ""}</Label>
            <Select value={form[key] || undefined} onValueChange={(v) => set(key, v)} disabled={saving || opts?.disabled}>
                <SelectTrigger><SelectValue placeholder={opts?.placeholder ?? "Seleccionar"} /></SelectTrigger>
                <SelectContent>{options.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
            </Select>
            {errors[key] && <p className="text-destructive text-xs mt-1">{errors[key]}</p>}
        </div>
    );

    const editButton = isSupervisor && !editing && (
        <Button size="sm" variant="outline" onClick={startEditing}><Pencil className="h-3.5 w-3.5 mr-1.5" />Editar</Button>
    );

    const saveButtons = (
        <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={cancelEditing} disabled={saving}>Cancelar</Button>
            <Button size="sm" onClick={saveProcess} disabled={saving}>
                {saving && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}Guardar
            </Button>
        </div>
    );

    if (loading) {
        return (
            <div className="mb-4">
                <Breadcrumbs>
                    <BreadcrumbItem>Plataforma</BreadcrumbItem>
                    <BreadcrumbItem>Centros</BreadcrumbItem>
                    <BreadcrumbItem asChild><Link href="/dashboard/centros/processes">Procesos Educativos</Link></BreadcrumbItem>
                    <BreadcrumbItem className="text-primary">Detalle</BreadcrumbItem>
                </Breadcrumbs>
                <div className="mt-5"><SkeletonTable /></div>
            </div>
        );
    }

    if (!process_) {
        return (
            <div className="mb-4">
                <Breadcrumbs>
                    <BreadcrumbItem>Plataforma</BreadcrumbItem>
                    <BreadcrumbItem>Centros</BreadcrumbItem>
                    <BreadcrumbItem asChild><Link href="/dashboard/centros/processes">Procesos Educativos</Link></BreadcrumbItem>
                    <BreadcrumbItem className="text-primary">Detalle</BreadcrumbItem>
                </Breadcrumbs>
                <div className="mt-5 py-12 text-center text-muted-foreground">Proceso no encontrado.</div>
            </div>
        );
    }

    const p = process_;

    return (
        <div className="mb-4">
            <Breadcrumbs>
                <BreadcrumbItem>Plataforma</BreadcrumbItem>
                <BreadcrumbItem>Centros</BreadcrumbItem>
                <BreadcrumbItem asChild><Link href="/dashboard/centros/processes">Procesos Educativos</Link></BreadcrumbItem>
                <BreadcrumbItem className="text-primary">{p.nombre}</BreadcrumbItem>
            </Breadcrumbs>

            {/* Header */}
            <Card className="mt-5">
                <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4">
                            <div className="rounded-full bg-primary/10 p-3">
                                <GraduationCap className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <h2 className="text-lg font-semibold">{p.nombre}</h2>
                                    <Badge color="secondary">Código: {p.codigo}</Badge>
                                </div>
                                <div className="flex flex-wrap gap-x-5 gap-y-1 mt-2 text-sm text-muted-foreground">
                                    {p.centro_nombre && <span className="flex items-center gap-1.5"><Building2 className="h-4 w-4" />{p.centro_nombre}</span>}
                                    {p.curso_nombre && <span className="flex items-center gap-1.5"><BookOpen className="h-4 w-4" />{p.curso_nombre}</span>}
                                    {p.instructor_nombre && <span className="flex items-center gap-1.5"><User className="h-4 w-4" />{p.instructor_nombre}</span>}
                                    {(p.fecha_inicial || p.fecha_final) && (
                                        <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4" />{p.fecha_inicial} - {p.fecha_final}</span>
                                    )}
                                    {p.duracion_horas && <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" />{p.duracion_horas} horas</span>}
                                </div>
                            </div>
                        </div>
                        {isSupervisor && (
                            <Button color="destructive" size="sm" onClick={() => setDeleteOpen(true)}>
                                <Trash2 className="h-4 w-4 mr-1.5" />Eliminar
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Tabs */}
            <Card className="mt-4">
                <Tabs defaultValue="general" className="w-full">
                    <TabsList className="w-full justify-start gap-8 border-b border-default-200 rounded-none bg-transparent p-0 h-auto min-h-0 px-6 pt-4 pb-0">
                        <TabsTrigger value="general" className={TAB_CLASS}>General</TabsTrigger>
                        <TabsTrigger value="course" className={TAB_CLASS}>Detalle del curso</TabsTrigger>
                        <TabsTrigger value="enrollment" className={TAB_CLASS}>Matrícula</TabsTrigger>
                        <TabsTrigger value="projects" className={TAB_CLASS}>Proyectos Relacionados</TabsTrigger>
                    </TabsList>

                    {/* Tab: General */}
                    <TabsContent value="general" className="mt-0 px-6 pt-6 pb-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-base font-semibold">Información General</h3>
                            {editing ? saveButtons : editButton}
                        </div>
                        {editing ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {fieldInput("codigo", "Código")}
                                {fieldInput("nombre", "Nombre", { required: true })}
                                {fieldSelect("curso_id", "Curso", courses.map((c: any) => ({ value: String(c.id), label: c.nombre })))}
                                {fieldSelect("instructor_id", "Instructor", instructors.map((i: any) => ({ value: String(i.id), label: i.nombre })))}
                                {fieldSelect("metodologia_id", "Metodología", metodologias.map((m: any) => ({ value: String(m.id), label: m.nombre })))}
                                {fieldInput("otra_metodologia", "Otra metodología")}
                                {fieldInput("fecha_inicial", "Fecha inicial", { type: "date" })}
                                {fieldInput("fecha_final", "Fecha final", { type: "date" })}
                                {fieldInput("duracion_horas", "Duración horas", { type: "number" })}
                                {fieldSelect("tipo_jornada_id", "Tipo de jornada", tipoJornadas.map((t: any) => ({ value: String(t.id), label: t.nombre })))}
                                {fieldInput("horario", "Horario")}
                                <div>
                                    <Label className="mb-1 font-medium text-default-600">Días</Label>
                                    <Popover open={diasOpen} onOpenChange={setDiasOpen}>
                                        <PopoverTrigger asChild>
                                            <Button type="button" variant="outline" disabled={saving} className="group w-full justify-between font-normal">
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
                                {fieldSelect("sede", "Sede", [{ value: "0", label: "No" }, { value: "1", label: "Sí" }])}
                                {fieldInput("lugar", "Lugar")}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-4">
                                {fieldView("Código", p.codigo)}
                                {fieldView("Nombre", p.nombre)}
                                {fieldView("Centro", p.centro_nombre)}
                                {fieldView("Curso", p.curso_nombre)}
                                {fieldView("Instructor", p.instructor_nombre)}
                                {fieldView("Metodología", p.metodologia_nombre)}
                                {fieldView("Otra metodología", p.otra_metodologia)}
                                {fieldView("Fecha inicial", p.fecha_inicial)}
                                {fieldView("Fecha final", p.fecha_final)}
                                {fieldView("Duración horas", p.duracion_horas)}
                                {fieldView("Tipo de jornada", p.tipo_jornada_nombre)}
                                {fieldView("Horario", p.horario)}
                                {fieldView("Días", resolveDiasNames(p.dias))}
                                {fieldView("Sede", Number(p.sede) ? "Sí" : "No")}
                                {fieldView("Lugar", p.lugar)}
                            </div>
                        )}
                    </TabsContent>

                    {/* Tab: Detalle del curso */}
                    <TabsContent value="course" className="mt-0 px-6 pt-6 pb-6">
                        {courseLoading ? (
                            <SkeletonTable />
                        ) : !courseDetail ? (
                            <div className="py-12 text-center text-muted-foreground">No se encontró información del curso.</div>
                        ) : (
                            <>
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-base font-semibold">Información del Curso</h3>
                                    <Link href={`/dashboard/centros/courses/${courseDetail.id}`} target="_blank" rel="noopener noreferrer">
                                        <Button size="sm" variant="outline">
                                            <ExternalLink className="h-3.5 w-3.5 mr-1.5" />Ver perfil del curso
                                        </Button>
                                    </Link>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-4">
                                    {fieldView("Código", courseDetail.codigo)}
                                    {fieldView("Nombre", courseDetail.nombre)}
                                    {fieldView("Código de programa", courseDetail.codigo_programa)}
                                    {fieldView("Total horas", courseDetail.total_horas)}
                                    {fieldView("Taller", Number(courseDetail.taller) ? "Sí" : "No")}
                                    <div className="md:col-span-3">
                                        {fieldView("Objetivo", courseDetail.objetivo)}
                                    </div>
                                </div>

                                <div className="mt-8 pt-6 border-t">
                                    <h3 className="text-base font-semibold mb-4">Módulos</h3>
                                    {courseModules.length === 0 ? (
                                        <div className="py-8 text-center text-muted-foreground">Este curso no tiene módulos registrados.</div>
                                    ) : (
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Código</TableHead>
                                                    <TableHead>Nombre</TableHead>
                                                    <TableHead>Horas Teóricas</TableHead>
                                                    <TableHead>Horas Prácticas</TableHead>
                                                    <TableHead>Total</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {courseModules.map((m) => (
                                                    <TableRow key={m.id}>
                                                        <TableCell className="text-sm">{m.codigo}</TableCell>
                                                        <TableCell className="text-sm">{m.nombre}</TableCell>
                                                        <TableCell className="text-sm">{m.horas_teoricas ?? "-"}</TableCell>
                                                        <TableCell className="text-sm">{m.horas_practicas ?? "-"}</TableCell>
                                                        <TableCell className="text-sm font-medium">
                                                            {(Number(m.horas_teoricas) || 0) + (Number(m.horas_practicas) || 0)}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    )}
                                </div>
                            </>
                        )}
                    </TabsContent>

                    {/* Tab: Matrícula */}
                    <TabsContent value="enrollment" className="mt-0 px-6 pt-6 pb-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-base font-semibold">Estudiantes Matriculados</h3>
                            {isSupervisor && (
                                <Button size="sm" onClick={openEnrollDialog}>
                                    <PlusCircle className="h-3.5 w-3.5 mr-1.5" />Matricular Estudiante
                                </Button>
                            )}
                        </div>
                        {enrollmentsLoading ? (
                            <SkeletonTable />
                        ) : enrollments.length === 0 ? (
                            <div className="py-12 text-center text-muted-foreground">No hay estudiantes matriculados.</div>
                        ) : (
                            <div>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Nombre completo</TableHead>
                                            <TableHead>Identidad</TableHead>
                                            {isSupervisor && <TableHead className="w-[80px]">Acciones</TableHead>}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {enrollments.map((en) => (
                                            <TableRow key={en.id}>
                                                <TableCell>{en.estudiante_nombre}</TableCell>
                                                <TableCell>{en.estudiante_identidad}</TableCell>
                                                {isSupervisor && (
                                                    <TableCell>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setUnenrollOpen(en)}>
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </TableCell>
                                                )}
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </TabsContent>

                    {/* Tab: Proyectos Relacionados */}
                    <TabsContent value="projects" className="mt-0 px-6 pt-6 pb-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-base font-semibold">Proyectos Relacionados</h3>
                            {isSupervisor && (
                                <Button size="sm" onClick={openLinkProjectDialog}>
                                    <PlusCircle className="h-3.5 w-3.5 mr-1.5" />Vincular Proyecto
                                </Button>
                            )}
                        </div>
                        {projectsLoading ? (
                            <SkeletonTable />
                        ) : linkedProjects.length === 0 ? (
                            <div className="py-12 text-center text-muted-foreground">No hay proyectos vinculados a este proceso.</div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Proyecto</TableHead>
                                        <TableHead>Categoría</TableHead>
                                        <TableHead>Estado</TableHead>
                                        <TableHead>Fecha inicio</TableHead>
                                        <TableHead>Fecha fin</TableHead>
                                        {isSupervisor && <TableHead className="w-[60px]"></TableHead>}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {linkedProjects.map((proj: any) => (
                                        <TableRow key={proj.id} className="cursor-pointer" onClick={() => router.push(`/dashboard/admin/projects/${proj.id}`)}>
                                            <TableCell className="font-medium text-primary">{proj.name}</TableCell>
                                            <TableCell className="text-muted-foreground">{proj.project_category === "PROGRAM" ? "Programa" : "Proyecto"}</TableCell>
                                            <TableCell>
                                                <Badge color={proj.project_status === "ACTIVE" ? "default" : "secondary"}>
                                                    {proj.project_status === "ACTIVE" ? "Activo" : proj.project_status === "ARCHIVED" ? "Archivado" : proj.project_status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">{proj.start_date ? proj.start_date.slice(0, 10) : "-"}</TableCell>
                                            <TableCell className="text-muted-foreground">{proj.end_date ? proj.end_date.slice(0, 10) : "-"}</TableCell>
                                            {isSupervisor && (
                                                <TableCell>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={(e) => { e.stopPropagation(); setUnlinkProjectTarget(proj); }}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            )}
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </TabsContent>
                </Tabs>
            </Card>

            {/* Delete process dialog */}
            <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar proceso?</AlertDialogTitle>
                        <AlertDialogDescription>Se eliminará &quot;{p.nombre}&quot;. Esta acción no se puede deshacer.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={deleteProcess} disabled={deleting} color="destructive">
                            {deleting ? "Eliminando..." : "Eliminar"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Unenroll dialog */}
            <AlertDialog open={!!unenrollOpen} onOpenChange={(open) => { if (!open) setUnenrollOpen(null); }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Desmatricular estudiante?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Se eliminará a &quot;{unenrollOpen?.estudiante_nombre}&quot; de este proceso. Esta acción no se puede deshacer.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={unenrolling}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={unenrollStudent} disabled={unenrolling} color="destructive">
                            {unenrolling ? "Eliminando..." : "Desmatricular"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Enroll dialog */}
            <Dialog open={enrollDialogOpen} onOpenChange={setEnrollDialogOpen}>
                <DialogContent size="5xl" className="p-0 gap-0 overflow-hidden max-h-[90vh]">
                    <div className="px-6 pt-6 pb-3">
                        <DialogTitle>Matricular Estudiantes</DialogTitle>
                        <p className="text-sm text-muted-foreground mt-1">Selecciona los estudiantes a matricular en este proceso educativo.</p>
                    </div>
                    <div className="px-4 pb-2 border-b">
                        <div className="flex items-center gap-2 rounded-md border bg-background px-3">
                            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Buscar por nombre o identidad..."
                                value={enrollSearch}
                                onChange={(e) => setEnrollSearch(e.target.value)}
                                className="flex h-10 w-full bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground"
                            />
                        </div>
                    </div>
                    <div className="overflow-y-auto px-4 py-3" style={{ maxHeight: "calc(90vh - 200px)" }}>
                        {studentsLoading ? (
                            <div className="py-12 text-center text-sm text-muted-foreground">Cargando...</div>
                        ) : filteredStudents.length === 0 ? (
                            <div className="py-12 text-center text-sm text-muted-foreground">No hay estudiantes disponibles.</div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {filteredStudents.map((s: any) => {
                                    const name = [s.nombres, s.apellidos].filter(Boolean).join(" ");
                                    const checked = enrollSelected.includes(s.id);
                                    return (
                                        <button
                                            key={s.id}
                                            type="button"
                                            onClick={() => toggleEnrollStudent(s.id)}
                                            className={cn(
                                                "relative flex flex-col rounded-lg border p-4 text-left transition-all duration-150",
                                                checked ? "border-primary bg-primary/5 ring-1 ring-primary/30" : "border-border hover:border-primary/40 hover:shadow-sm"
                                            )}
                                        >
                                            <div className="flex items-start gap-3 mb-3">
                                                <Checkbox checked={checked} className="mt-0.5 shrink-0" />
                                                <div className="min-w-0 flex-1">
                                                    <p className="font-semibold text-sm leading-tight">{name}</p>
                                                    {s.identidad && (
                                                        <span className="inline-block mt-1.5 text-[10px] font-medium bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded">
                                                            {s.identidad}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-x-4 gap-y-2 pl-7 text-xs">
                                                {(() => {
                                                    const fechaNac = s.fecha_nacimiento ?? (s as any).fechaNacimiento;
                                                    const age = getAgeFromBirthDate(fechaNac);
                                                    return (
                                                        <div className="flex items-center gap-1.5 text-muted-foreground">
                                                            <Calendar className="h-3 w-3 shrink-0" />
                                                            <span>{age !== null ? `${age} años` : "-"}</span>
                                                        </div>
                                                    );
                                                })()}
                                                {s.sexo && (
                                                    <div className="flex items-center gap-1.5 text-muted-foreground">
                                                        <User className="h-3 w-3 shrink-0" />
                                                        <span>{s.sexo === "M" ? "Masculino" : s.sexo === "F" ? "Femenino" : s.sexo}</span>
                                                    </div>
                                                )}
                                                {s.centro_nombre && (
                                                    <div className="flex items-center gap-1.5 text-muted-foreground">
                                                        <Building2 className="h-3 w-3 shrink-0" />
                                                        <span className="truncate">{s.centro_nombre}</span>
                                                    </div>
                                                )}
                                                {s.celular && (
                                                    <div className="flex items-center gap-1.5 text-muted-foreground">
                                                        <Phone className="h-3 w-3 shrink-0" />
                                                        <span className="truncate">{s.celular}</span>
                                                    </div>
                                                )}
                                                {s.email && (
                                                    <div className="flex items-center gap-1.5 text-muted-foreground">
                                                        <Mail className="h-3 w-3 shrink-0" />
                                                        <span className="truncate">{s.email}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                    <div className="px-4 py-3 border-t bg-background">
                        <Button onClick={submitEnrollment} disabled={enrolling || enrollSelected.length === 0} className="w-full">
                            {enrolling && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
                            Matricular {enrollSelected.length > 0 && `(${enrollSelected.length})`}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Link project dialog */}
            <Dialog open={linkProjectDialogOpen} onOpenChange={setLinkProjectDialogOpen}>
                <DialogContent size="5xl" className="p-0 gap-0 overflow-hidden max-h-[90vh]">
                    <div className="px-6 pt-6 pb-3">
                        <DialogTitle>Vincular Proyecto</DialogTitle>
                        <p className="text-sm text-muted-foreground mt-1">Selecciona los proyectos a vincular con este proceso educativo.</p>
                    </div>
                    <div className="px-4 pb-2 border-b">
                        <div className="flex items-center gap-2 rounded-md border bg-background px-3">
                            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Buscar por nombre o descripción..."
                                value={linkProjectSearch}
                                onChange={(e) => setLinkProjectSearch(e.target.value)}
                                className="flex h-10 w-full bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground"
                            />
                        </div>
                    </div>
                    <div className="overflow-y-auto px-4 py-3" style={{ maxHeight: "calc(90vh - 200px)" }}>
                        {availableProjectsLoading ? (
                            <div className="py-12 text-center text-sm text-muted-foreground">Cargando...</div>
                        ) : filteredAvailableProjects.length === 0 ? (
                            <div className="py-12 text-center text-sm text-muted-foreground">No hay proyectos disponibles.</div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {filteredAvailableProjects.map((proj: any) => {
                                    const checked = selectedProjectIds.includes(proj.id);
                                    const agents = Array.isArray(proj.assigned_agents) ? proj.assigned_agents : [];
                                    return (
                                        <button
                                            key={proj.id}
                                            type="button"
                                            onClick={() => setSelectedProjectIds((prev) => checked ? prev.filter((x) => x !== proj.id) : [...prev, proj.id])}
                                            className={cn(
                                                "relative flex flex-col rounded-lg border p-4 text-left transition-all duration-150",
                                                checked ? "border-primary bg-primary/5 ring-1 ring-primary/30" : "border-border hover:border-primary/40 hover:shadow-sm"
                                            )}
                                        >
                                            <div className="flex items-start gap-3 mb-3">
                                                <Checkbox checked={checked} className="mt-0.5 shrink-0" />
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <p className="font-semibold text-sm leading-tight">{proj.name}</p>
                                                        <span className={cn(
                                                            "text-[10px] font-medium px-1.5 py-0.5 rounded",
                                                            proj.project_category === "PROGRAM"
                                                                ? "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400"
                                                                : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                                                        )}>
                                                            {proj.project_category === "PROGRAM" ? "Programa" : "Proyecto"}
                                                        </span>
                                                    </div>
                                                    {proj.description && (
                                                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{proj.description}</p>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-x-4 gap-y-2 pl-7 text-xs">
                                                {(proj.start_date || proj.end_date) && (
                                                    <div className="flex items-center gap-1.5 text-muted-foreground">
                                                        <Calendar className="h-3 w-3 shrink-0" />
                                                        <span className="truncate">{proj.start_date ?? "—"} → {proj.end_date ?? "—"}</span>
                                                    </div>
                                                )}
                                                {proj.financed_amount != null && Number(proj.financed_amount) > 0 && (
                                                    <div className="flex items-center gap-1.5 text-muted-foreground">
                                                        <DollarSign className="h-3 w-3 shrink-0" />
                                                        <span className="truncate">L {Number(proj.financed_amount).toLocaleString("es-HN", { minimumFractionDigits: 2 })}</span>
                                                    </div>
                                                )}
                                                {agents.length > 0 && (
                                                    <div className="flex items-center gap-1.5 text-muted-foreground col-span-2">
                                                        <Users className="h-3 w-3 shrink-0" />
                                                        <span className="truncate">{agents.map((a: any) => a.name).join(", ")}</span>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="mt-3 pl-7">
                                                <a
                                                    href={`/dashboard/admin/projects/${proj.id}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                                                >
                                                    <ExternalLink className="h-3 w-3" />
                                                    Ver proyecto
                                                </a>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                    <div className="px-4 py-3 border-t bg-background">
                        <Button onClick={submitLinkProjects} disabled={linkingProject || selectedProjectIds.length === 0} className="w-full">
                            {linkingProject && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
                            Vincular {selectedProjectIds.length > 0 && `(${selectedProjectIds.length})`}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Unlink project dialog */}
            <AlertDialog open={!!unlinkProjectTarget} onOpenChange={(open) => { if (!open) setUnlinkProjectTarget(null); }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Desvincular proyecto?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Se desvinculará el proyecto &quot;{unlinkProjectTarget?.name}&quot; de este proceso educativo.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={unlinkingProject}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={unlinkProject} disabled={unlinkingProject} color="destructive">
                            {unlinkingProject ? "Desvinculando..." : "Desvincular"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
