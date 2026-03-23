"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Breadcrumbs, BreadcrumbItem } from "@/components/ui/breadcrumbs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import SkeletonTable from "@/components/skeleton-table";
import KPIBlock from "@/components/project/KPIBlock";
import toast from "react-hot-toast";
import { useSession } from "next-auth/react";
import {
    Building2, BookOpen, Clock, Hash, Pencil, Trash2, Loader2, PlusCircle,
    Layers, Wrench, Download, Upload,
} from "lucide-react";

const apiBase = process.env.NEXT_PUBLIC_API_URL;

const TAB_CLASS = "rounded-none border-b-2 border-transparent bg-transparent px-0 pb-3 -mb-px shadow-none data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none";

export default function CourseDetailPage() {
    const params = useParams();
    const router = useRouter();
    const courseId = params?.id as string;
    const { data: session } = useSession() as any;
    const userRole = session?.user?.role;
    const isSupervisor = userRole === "ADMIN" || userRole === "MANAGER";
    const authHeaders: any = { Authorization: `Bearer ${session?.user?.session}` };

    const [course, setCourse] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [editingTab, setEditingTab] = useState<string | null>(null);
    const [form, setForm] = useState<Record<string, any>>({});
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [saving, setSaving] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const [modules, setModules] = useState<any[]>([]);
    const [modulesLoading, setModulesLoading] = useState(true);
    const [moduleDialogOpen, setModuleDialogOpen] = useState(false);
    const [moduleForm, setModuleForm] = useState<Record<string, any>>({});
    const [moduleErrors, setModuleErrors] = useState<Record<string, string>>({});
    const [moduleSaving, setModuleSaving] = useState(false);
    const [editingModule, setEditingModule] = useState<any>(null);
    const [deleteModuleOpen, setDeleteModuleOpen] = useState(false);
    const [deletingModule, setDeletingModule] = useState(false);
    const [moduleToDelete, setModuleToDelete] = useState<any>(null);
    const [importing, setImporting] = useState(false);

    const [courseProcesses, setCourseProcesses] = useState<any[]>([]);
    const [processesLoading, setProcessesLoading] = useState(false);

    const fetchCourse = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${apiBase}/api/centros/courses/${courseId}`, { headers: authHeaders });
            if (res.ok) { const d = await res.json(); setCourse(d.data ?? null); }
            else toast.error("Error al cargar curso");
        } catch { toast.error("Error al cargar curso"); }
        setLoading(false);
    };

    const fetchModules = async () => {
        setModulesLoading(true);
        try {
            const res = await fetch(`${apiBase}/api/centros/courses/${courseId}/modules`, { headers: authHeaders });
            if (res.ok) { const d = await res.json(); setModules(d.data ?? []); }
            else toast.error("Error al cargar módulos");
        } catch { toast.error("Error al cargar módulos"); }
        setModulesLoading(false);
    };

    const fetchCourseProcesses = async () => {
        setProcessesLoading(true);
        try {
            const res = await fetch(`${apiBase}/api/centros/processes?limit=100&offset=0&curso_id=${courseId}`, { headers: authHeaders });
            if (res.ok) { const d = await res.json(); setCourseProcesses(d.data ?? []); }
        } catch { /* silent */ }
        setProcessesLoading(false);
    };

    useEffect(() => {
        if (session && courseId) { fetchCourse(); fetchModules(); fetchCourseProcesses(); }
    }, [session, courseId]);

    const set = (key: string, value: any) => {
        setForm(prev => ({ ...prev, [key]: value }));
        setErrors(prev => { const n = { ...prev }; delete n[key]; return n; });
    };

    const startEditing = () => {
        if (!course) return;
        setForm({
            codigo: course.codigo != null ? String(course.codigo) : "",
            nombre: course.nombre ?? "",
            codigo_programa: course.codigo_programa ?? "",
            taller: course.taller != null ? String(course.taller) : "0",
            objetivo: course.objetivo ?? "",
        });
        setErrors({});
        setEditingTab("general");
    };

    const cancelEditing = () => { setEditingTab(null); setErrors({}); };

    const saveGeneral = async () => {
        const e: Record<string, string> = {};
        if (!form.codigo?.toString().trim()) e.codigo = "Requerido";
        if (!form.nombre?.trim()) e.nombre = "Requerido";
        if (!form.codigo_programa?.toString().trim()) e.codigo_programa = "Requerido";
        if (!form.objetivo?.trim()) e.objetivo = "Requerido";
        setErrors(e);
        if (Object.keys(e).length > 0) return;

        setSaving(true);
        try {
            const body = {
                id: course.id,
                codigo: form.codigo,
                nombre: form.nombre,
                codigo_programa: form.codigo_programa,
                taller: Number(form.taller) || 0,
                objetivo: form.objetivo,
            };
            const res = await fetch(`${apiBase}/api/centros/courses`, {
                method: "PUT",
                headers: { "Content-Type": "application/json", ...authHeaders },
                body: JSON.stringify(body),
            });
            if (res.ok) {
                toast.success("Información guardada");
                setEditingTab(null);
                fetchCourse();
            } else {
                const json = await res.json();
                toast.error(json.message ?? "Error al guardar");
            }
        } catch { toast.error("Error al guardar"); }
        setSaving(false);
    };

    const deleteCourse = async () => {
        setDeleting(true);
        try {
            const res = await fetch(`${apiBase}/api/centros/courses/${courseId}`, { method: "DELETE", headers: authHeaders });
            if (res.ok) { toast.success("Curso eliminado"); router.push("/dashboard/centros/courses"); }
            else { const d = await res.json(); toast.error(d.message ?? "Error al eliminar"); }
        } catch { toast.error("Error al eliminar"); }
        setDeleting(false);
    };

    /* ── Module helpers ── */

    const openModuleDialog = (mod?: any) => {
        if (mod) {
            setEditingModule(mod);
            setModuleForm({
                codigo: mod.codigo ?? "",
                nombre: mod.nombre ?? "",
                horas_teoricas: mod.horas_teoricas != null ? String(mod.horas_teoricas) : "",
                horas_practicas: mod.horas_practicas != null ? String(mod.horas_practicas) : "",
                tipo_evaluacion: mod.tipo_evaluacion != null ? String(mod.tipo_evaluacion) : "",
                observaciones: mod.observaciones ?? "",
            });
        } else {
            setEditingModule(null);
            setModuleForm({ codigo: "", nombre: "", horas_teoricas: "", horas_practicas: "", tipo_evaluacion: "", observaciones: "" });
        }
        setModuleErrors({});
        setModuleDialogOpen(true);
    };

    const setMod = (key: string, value: any) => {
        setModuleForm(prev => ({ ...prev, [key]: value }));
        setModuleErrors(prev => { const n = { ...prev }; delete n[key]; return n; });
    };

    const saveModule = async () => {
        const e: Record<string, string> = {};
        if (!moduleForm.codigo?.toString().trim()) e.codigo = "Requerido";
        if (!moduleForm.nombre?.trim()) e.nombre = "Requerido";
        if (!moduleForm.horas_teoricas?.toString().trim()) e.horas_teoricas = "Requerido";
        if (!moduleForm.horas_practicas?.toString().trim()) e.horas_practicas = "Requerido";
        setModuleErrors(e);
        if (Object.keys(e).length > 0) return;

        setModuleSaving(true);
        try {
            const body: any = {
                codigo: moduleForm.codigo,
                nombre: moduleForm.nombre,
                horas_teoricas: moduleForm.horas_teoricas,
                horas_practicas: moduleForm.horas_practicas,
                tipo_evaluacion: moduleForm.tipo_evaluacion ? Number(moduleForm.tipo_evaluacion) : null,
                observaciones: moduleForm.observaciones || null,
            };
            if (editingModule) body.id = editingModule.id;

            const res = await fetch(`${apiBase}/api/centros/courses/${courseId}/modules`, {
                method: editingModule ? "PUT" : "POST",
                headers: { "Content-Type": "application/json", ...authHeaders },
                body: JSON.stringify(body),
            });
            if (res.ok) {
                toast.success(editingModule ? "Módulo actualizado" : "Módulo creado");
                setModuleDialogOpen(false);
                fetchModules();
                fetchCourse();
            } else {
                const json = await res.json();
                toast.error(json.message ?? "Error al guardar módulo");
            }
        } catch { toast.error("Error al guardar módulo"); }
        setModuleSaving(false);
    };

    const confirmDeleteModule = (mod: any) => { setModuleToDelete(mod); setDeleteModuleOpen(true); };

    const deleteModule = async () => {
        if (!moduleToDelete) return;
        setDeletingModule(true);
        try {
            const res = await fetch(`${apiBase}/api/centros/courses/${courseId}/modules/${moduleToDelete.id}`, { method: "DELETE", headers: authHeaders });
            if (res.ok) { toast.success("Módulo eliminado"); setDeleteModuleOpen(false); fetchModules(); fetchCourse(); }
            else { const d = await res.json(); toast.error(d.message ?? "Error al eliminar módulo"); }
        } catch { toast.error("Error al eliminar módulo"); }
        setDeletingModule(false);
    };

    /* ── Excel helpers ── */

    const downloadModulesTemplate = async () => {
        try {
            const res = await fetch(`${apiBase}/api/centros/courses/${courseId}/excel/modules`, { headers: authHeaders });
            if (!res.ok) { toast.error("Error al descargar plantilla"); return; }
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "plantilla-modulos.xlsx";
            a.click();
            URL.revokeObjectURL(url);
        } catch {
            toast.error("Error al descargar plantilla");
        }
    };

    const importModulesFile = async (file: File) => {
        setImporting(true);
        try {
            const fd = new FormData();
            fd.append("file", file);
            const res = await fetch(`${apiBase}/api/centros/courses/${courseId}/excel/modules`, {
                method: "POST", headers: authHeaders, body: fd,
            });
            const json = await res.json();
            if (res.ok) {
                const parts: string[] = [];
                if (json.created > 0) parts.push(`${json.created} creados`);
                if (json.updated > 0) parts.push(`${json.updated} actualizados`);
                if (json.deleted > 0) parts.push(`${json.deleted} eliminados`);
                const summary = parts.length ? parts.join(", ") : "Sin cambios";
                if (json.errors?.length > 0) {
                    toast.error(`${summary}. ${json.errors.length} error(es).`, { duration: 6000 });
                } else {
                    toast.success(summary);
                }
                fetchModules();
                fetchCourse();
            } else {
                toast.error(json.message ?? "Error al importar");
            }
        } catch {
            toast.error("Error al importar archivo");
        }
        setImporting(false);
    };

    const triggerImportModules = () => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".xlsx";
        input.onchange = (e: any) => {
            const file = e.target.files?.[0];
            if (file) importModulesFile(file);
        };
        input.click();
    };

    /* ── Field helpers ── */

    const fieldView = (label: string, value: any, icon?: React.ReactNode) => (
        <div className="flex items-start gap-3">
            {icon && <div className="mt-0.5 text-muted-foreground">{icon}</div>}
            <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">{label}</p>
                <p className="text-sm text-foreground font-medium">{value || "-"}</p>
            </div>
        </div>
    );

    const fieldInput = (key: string, label: string, opts?: { required?: boolean; placeholder?: string; type?: string }) => (
        <div>
            <Label className="mb-1 font-medium text-default-600">{label}{opts?.required ? " *" : ""}</Label>
            <Input type={opts?.type ?? "text"} disabled={saving} value={form[key] ?? ""} onChange={(e) => set(key, e.target.value)} placeholder={opts?.placeholder ?? label} />
            {errors[key] && <p className="text-destructive text-xs mt-1">{errors[key]}</p>}
        </div>
    );

    const fieldSelect = (key: string, label: string, options: { value: string; label: string }[], opts?: { required?: boolean }) => (
        <div>
            <Label className="mb-1 font-medium text-default-600">{label}{opts?.required ? " *" : ""}</Label>
            <Select value={form[key] || undefined} onValueChange={(v) => set(key, v)} disabled={saving}>
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>{options.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
            </Select>
            {errors[key] && <p className="text-destructive text-xs mt-1">{errors[key]}</p>}
        </div>
    );

    const editButton = () => isSupervisor && editingTab !== "general" && (
        <Button size="sm" variant="outline" onClick={() => startEditing()}><Pencil className="h-3.5 w-3.5 mr-1.5" />Editar</Button>
    );

    const saveButtons = () => (
        <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={cancelEditing} disabled={saving}>Cancelar</Button>
            <Button size="sm" onClick={saveGeneral} disabled={saving}>
                {saving && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}Guardar
            </Button>
        </div>
    );

    /* ── Loading / not found ── */

    if (loading) {
        return (
            <div className="mb-4">
                <Breadcrumbs>
                    <BreadcrumbItem>Plataforma</BreadcrumbItem>
                    <BreadcrumbItem>Centros</BreadcrumbItem>
                    <BreadcrumbItem asChild><Link href="/dashboard/centros/courses">Cursos</Link></BreadcrumbItem>
                    <BreadcrumbItem className="text-primary">Curso</BreadcrumbItem>
                </Breadcrumbs>
                <div className="mt-5"><SkeletonTable /></div>
            </div>
        );
    }

    if (!course) {
        return (
            <div className="mb-4">
                <Breadcrumbs>
                    <BreadcrumbItem>Plataforma</BreadcrumbItem>
                    <BreadcrumbItem>Centros</BreadcrumbItem>
                    <BreadcrumbItem asChild><Link href="/dashboard/centros/courses">Cursos</Link></BreadcrumbItem>
                    <BreadcrumbItem className="text-primary">Curso</BreadcrumbItem>
                </Breadcrumbs>
                <div className="mt-5 py-12 text-center text-muted-foreground">Curso no encontrado.</div>
            </div>
        );
    }

    const EVAL_LABELS: Record<number, string> = { 1: "Teórica", 2: "Práctica", 3: "Mixta" };

    return (
        <div className="mb-4">
            <Breadcrumbs>
                <BreadcrumbItem>Plataforma</BreadcrumbItem>
                <BreadcrumbItem>Centros</BreadcrumbItem>
                <BreadcrumbItem asChild><Link href="/dashboard/centros/courses">Cursos</Link></BreadcrumbItem>
                <BreadcrumbItem className="text-primary">{course.nombre}</BreadcrumbItem>
            </Breadcrumbs>

            {/* ── Professional Header ── */}
            <Card className="mt-5 overflow-hidden">
                <div className="p-6 pb-4">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-3 flex-wrap">
                                <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-primary">
                                    {course.nombre}
                                </h1>
                                {course.codigo && (
                                    <Badge variant="outline" className="text-xs shrink-0">Código: {course.codigo}</Badge>
                                )}
                            </div>
                            {course.objetivo && (
                                <p className="text-sm text-muted-foreground mt-2 break-words max-w-3xl leading-relaxed line-clamp-2">
                                    {course.objetivo}
                                </p>
                            )}
                            <div className="flex flex-wrap gap-x-6 gap-y-1 mt-3 text-sm text-muted-foreground">
                                {course.centro_nombre && (
                                    <span className="flex items-center gap-2">
                                        <Building2 className="h-4 w-4 shrink-0" />{course.centro_nombre}
                                    </span>
                                )}
                                {course.codigo_programa && (
                                    <span className="flex items-center gap-2">
                                        <Hash className="h-4 w-4 shrink-0" />Programa: {course.codigo_programa}
                                    </span>
                                )}
                            </div>
                        </div>
                        {isSupervisor && (
                            <Button color="destructive" size="sm" className="shrink-0" onClick={() => setDeleteOpen(true)}>
                                <Trash2 className="h-4 w-4 mr-1.5" />Eliminar
                            </Button>
                        )}
                    </div>
                </div>

                {/* KPI Grid */}
                <div className="px-6 pb-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        <KPIBlock icon={Clock} label="Total Horas" value={course.total_horas ?? "0"} iconColor="text-primary" index={0} />
                        <KPIBlock icon={Layers} label="Módulos" value={String(modules.length)} iconColor="text-success" index={1} />
                        <KPIBlock icon={Wrench} label="Taller" value={course.taller === 1 ? "Sí" : "No"} iconColor="text-warning" index={2} />
                        <KPIBlock icon={BookOpen} label="Cód. Programa" value={course.codigo_programa ?? "-"} iconColor="text-muted-foreground" index={3} />
                    </div>
                </div>
            </Card>

            {/* ── Tabs ── */}
            <Card className="mt-4">
                <Tabs defaultValue="general" className="w-full">
                    <TabsList className="w-full justify-start gap-8 border-b border-default-200 rounded-none bg-transparent p-0 h-auto min-h-0 px-6 pt-4 pb-0">
                        <TabsTrigger value="general" className={TAB_CLASS}>General</TabsTrigger>
                        <TabsTrigger value="modules" className={TAB_CLASS}>Módulos</TabsTrigger>
                        <TabsTrigger value="processes" className={TAB_CLASS}>Procesos{courseProcesses.length > 0 ? ` (${courseProcesses.length})` : ""}</TabsTrigger>
                    </TabsList>

                    {/* Tab: General */}
                    <TabsContent value="general" className="mt-0 px-6 pt-6 pb-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-semibold">Información General</h3>
                            {editingTab === "general" ? saveButtons() : editButton()}
                        </div>
                        {editingTab === "general" ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {fieldInput("codigo", "Código", { type: "number" })}
                                {fieldInput("nombre", "Nombre", { required: true })}
                                {fieldInput("codigo_programa", "Código de programa", { required: true })}
                                {fieldSelect("taller", "Taller", [{ value: "1", label: "Sí" }, { value: "0", label: "No" }])}
                                <div className="md:col-span-2">
                                    <Label className="mb-1 font-medium text-default-600">Objetivo *</Label>
                                    <Textarea disabled={saving} value={form.objetivo ?? ""} onChange={(e) => set("objetivo", e.target.value)} placeholder="Objetivo" />
                                    {errors.objetivo && <p className="text-destructive text-xs mt-1">{errors.objetivo}</p>}
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-5">
                                    {fieldView("Código", course.codigo, <Hash className="h-4 w-4" />)}
                                    {fieldView("Nombre", course.nombre, <BookOpen className="h-4 w-4" />)}
                                    {fieldView("Código de Programa", course.codigo_programa, <Layers className="h-4 w-4" />)}
                                    {fieldView("Total Horas", course.total_horas, <Clock className="h-4 w-4" />)}
                                    {fieldView("Taller", course.taller === 1 ? "Sí" : "No", <Wrench className="h-4 w-4" />)}
                                    {fieldView("Centro", course.centro_nombre, <Building2 className="h-4 w-4" />)}
                                </div>
                                <div className="border-t pt-5">
                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Objetivo</p>
                                    <p className="text-sm text-foreground leading-relaxed">{course.objetivo || "-"}</p>
                                </div>
                            </div>
                        )}
                    </TabsContent>

                    {/* Tab: Módulos */}
                    <TabsContent value="modules" className="mt-0 px-6 pt-6 pb-6">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
                            <div className="flex items-center gap-4">
                                <h3 className="text-lg font-semibold">Módulos del Curso</h3>
                                <span className="text-sm text-muted-foreground">
                                    {modules.length} módulo{modules.length !== 1 ? "s" : ""}
                                </span>
                            </div>
                            <div className="flex gap-2 flex-wrap">
                                <Button variant="outline" size="sm" onClick={downloadModulesTemplate}>
                                    <Download className="h-4 w-4 mr-2" />Descargar Formato
                                </Button>
                                {isSupervisor && (
                                    <>
                                        <Button variant="outline" size="sm" onClick={triggerImportModules} disabled={importing}>
                                            {importing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                                            Importar Excel
                                        </Button>
                                        <Button size="sm" onClick={() => openModuleDialog()}>
                                            <PlusCircle className="h-3.5 w-3.5 mr-1.5" />Crear Módulo
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>
                        {modulesLoading ? (
                            <SkeletonTable />
                        ) : modules.length === 0 ? (
                            <div className="py-12 text-center text-muted-foreground">No hay módulos registrados.</div>
                        ) : (
                            <div>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Código</TableHead>
                                            <TableHead>Nombre</TableHead>
                                            <TableHead>Horas Teóricas</TableHead>
                                            <TableHead>Horas Prácticas</TableHead>
                                            <TableHead>Total</TableHead>
                                            <TableHead>Evaluación</TableHead>
                                            {isSupervisor && <TableHead className="text-right">Acciones</TableHead>}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {modules.map((m: any) => (
                                            <TableRow key={m.id}>
                                                <TableCell className="font-medium">{m.codigo}</TableCell>
                                                <TableCell>{m.nombre}</TableCell>
                                                <TableCell>{m.horas_teoricas}</TableCell>
                                                <TableCell>{m.horas_practicas}</TableCell>
                                                <TableCell className="font-medium">{parseFloat(m.horas_teoricas) + parseFloat(m.horas_practicas)}</TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="text-xs">
                                                        {EVAL_LABELS[m.tipo_evaluacion] ?? "-"}
                                                    </Badge>
                                                </TableCell>
                                                {isSupervisor && (
                                                    <TableCell className="text-right">
                                                        <Button variant="ghost" size="icon" onClick={() => openModuleDialog(m)}>
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" onClick={() => confirmDeleteModule(m)}>
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

                    {/* Tab: Procesos Educativos */}
                    <TabsContent value="processes" className="mt-0 px-6 pt-6 pb-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-4">
                                <h3 className="text-base font-semibold">Procesos Educativos</h3>
                                {courseProcesses.length > 0 && (
                                    <span className="text-sm text-muted-foreground">{courseProcesses.length} proceso{courseProcesses.length !== 1 ? "s" : ""}</span>
                                )}
                            </div>
                        </div>
                        {processesLoading ? (
                            <SkeletonTable />
                        ) : courseProcesses.length === 0 ? (
                            <div className="py-12 text-center">
                                <BookOpen className="h-8 w-8 mx-auto text-muted-foreground/50 mb-3" />
                                <p className="text-muted-foreground">No hay procesos educativos asociados a este curso.</p>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Nombre</TableHead>
                                        <TableHead>Código</TableHead>
                                        <TableHead>Centro</TableHead>
                                        <TableHead>Instructor</TableHead>
                                        <TableHead>Fecha Inicio</TableHead>
                                        <TableHead>Fecha Fin</TableHead>
                                        <TableHead>Matriculados</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {courseProcesses.map((proc: any) => (
                                        <TableRow key={proc.id} className="cursor-pointer" onClick={() => router.push(`/dashboard/centros/processes/${proc.id}`)}>
                                            <TableCell className="font-medium text-primary">{proc.nombre}</TableCell>
                                            <TableCell className="text-sm">{proc.codigo}</TableCell>
                                            <TableCell className="text-sm text-muted-foreground">{proc.centro_nombre}</TableCell>
                                            <TableCell className="text-sm text-muted-foreground">{proc.instructor_nombre}</TableCell>
                                            <TableCell className="text-sm text-muted-foreground">{proc.fecha_inicial ?? "-"}</TableCell>
                                            <TableCell className="text-sm text-muted-foreground">{proc.fecha_final ?? "-"}</TableCell>
                                            <TableCell className="text-sm">
                                                <Badge variant="outline">{proc.enrolled_count ?? 0}</Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </TabsContent>
                </Tabs>
            </Card>

            {/* Delete course dialog */}
            <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar curso?</AlertDialogTitle>
                        <AlertDialogDescription>Se eliminará &quot;{course.nombre}&quot;. Esta acción no se puede deshacer.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={deleteCourse} disabled={deleting} color="destructive">
                            {deleting ? "Eliminando..." : "Eliminar"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Delete module dialog */}
            <AlertDialog open={deleteModuleOpen} onOpenChange={setDeleteModuleOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar módulo?</AlertDialogTitle>
                        <AlertDialogDescription>Se eliminará el módulo &quot;{moduleToDelete?.nombre}&quot;. Esta acción no se puede deshacer.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deletingModule}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={deleteModule} disabled={deletingModule} color="destructive">
                            {deletingModule ? "Eliminando..." : "Eliminar"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Module create/edit dialog */}
            <Dialog open={moduleDialogOpen} onOpenChange={setModuleDialogOpen}>
                <DialogContent size="3xl">
                    <DialogTitle>{editingModule ? "Editar Módulo" : "Crear Módulo"}</DialogTitle>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div>
                            <Label className="mb-1 font-medium text-default-600">Código *</Label>
                            <Input disabled={moduleSaving} value={moduleForm.codigo ?? ""} onChange={(e) => setMod("codigo", e.target.value)} placeholder="Código" />
                            {moduleErrors.codigo && <p className="text-destructive text-xs mt-1">{moduleErrors.codigo}</p>}
                        </div>
                        <div>
                            <Label className="mb-1 font-medium text-default-600">Nombre *</Label>
                            <Input disabled={moduleSaving} value={moduleForm.nombre ?? ""} onChange={(e) => setMod("nombre", e.target.value)} placeholder="Nombre" />
                            {moduleErrors.nombre && <p className="text-destructive text-xs mt-1">{moduleErrors.nombre}</p>}
                        </div>
                        <div>
                            <Label className="mb-1 font-medium text-default-600">Horas Teóricas *</Label>
                            <Input type="number" disabled={moduleSaving} value={moduleForm.horas_teoricas ?? ""} onChange={(e) => setMod("horas_teoricas", e.target.value)} placeholder="Horas Teóricas" />
                            {moduleErrors.horas_teoricas && <p className="text-destructive text-xs mt-1">{moduleErrors.horas_teoricas}</p>}
                        </div>
                        <div>
                            <Label className="mb-1 font-medium text-default-600">Horas Prácticas *</Label>
                            <Input type="number" disabled={moduleSaving} value={moduleForm.horas_practicas ?? ""} onChange={(e) => setMod("horas_practicas", e.target.value)} placeholder="Horas Prácticas" />
                            {moduleErrors.horas_practicas && <p className="text-destructive text-xs mt-1">{moduleErrors.horas_practicas}</p>}
                        </div>
                        <div>
                            <Label className="mb-1 font-medium text-default-600">Tipo de evaluación</Label>
                            <Select value={moduleForm.tipo_evaluacion || undefined} onValueChange={(v) => setMod("tipo_evaluacion", v)} disabled={moduleSaving}>
                                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="1">Teórica</SelectItem>
                                    <SelectItem value="2">Práctica</SelectItem>
                                    <SelectItem value="3">Mixta</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="md:col-span-2">
                            <Label className="mb-1 font-medium text-default-600">Observaciones</Label>
                            <Textarea disabled={moduleSaving} value={moduleForm.observaciones ?? ""} onChange={(e) => setMod("observaciones", e.target.value)} placeholder="Observaciones" />
                        </div>
                    </div>
                    <DialogFooter className="mt-4">
                        <Button variant="outline" onClick={() => setModuleDialogOpen(false)} disabled={moduleSaving}>Cancelar</Button>
                        <Button onClick={saveModule} disabled={moduleSaving}>
                            {moduleSaving && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
                            {editingModule ? "Guardar" : "Crear"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
