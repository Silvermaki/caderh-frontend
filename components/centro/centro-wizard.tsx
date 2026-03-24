"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Dialog, DialogContent, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Stepper, Step, StepLabel } from "@/components/ui/steps";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import {
    Loader2, PlusCircle, Trash2, Upload, Download, ChevronLeft, ChevronRight, Pencil, BookOpen, Users, GraduationCap,
} from "lucide-react";
import * as XLSX from "xlsx";
import { useDropzone } from "react-dropzone";
import { cn } from "@/lib/utils";

const apiBase = process.env.NEXT_PUBLIC_API_PROXY;

// ─── Types ───────────────────────────────────────────────────────────────────

interface ModuleItem {
    codigo: string; nombre: string; horas_teoricas: string; horas_practicas: string;
    tipo_evaluacion: string; observaciones: string;
}
interface CourseItem {
    _id: number; nombre: string; codigo_programa: string; objetivo: string;
    codigo: string; taller: number; modules: ModuleItem[];
}
interface InstructorItem {
    _id: number; nombres: string; apellidos: string; titulo_obtenido: string; otros_titulos: string;
}
interface StudentItem {
    _id: number; identidad: string; nombres: string; apellidos: string; sexo: string;
    departamento_id: number; municipio_id: number; vive: string; numero_dep: string;
    [key: string]: any;
}

const emptyModule = (): ModuleItem => ({ codigo: "", nombre: "", horas_teoricas: "", horas_practicas: "", tipo_evaluacion: "1", observaciones: "" });

let _nextId = 1;
const nextId = () => _nextId++;

// ─── ExcelDropzone ───────────────────────────────────────────────────────────

const ExcelDropzone = ({ disabled, onFile, label }: { disabled: boolean; onFile: (file: File) => void; label: string }) => {
    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        accept: { "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"] },
        maxFiles: 1, maxSize: 10 * 1024 * 1024, disabled,
        onDrop: (accepted) => { if (accepted[0]) onFile(accepted[0]); },
        onDropRejected: () => toast.error("Solo archivos .xlsx de hasta 10MB"),
    });
    return (
        <div {...getRootProps()} className={cn("border-2 border-dashed rounded-lg py-8 px-4 text-center cursor-pointer transition-colors text-sm",
            isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/30 hover:border-primary/50")}>
            <input {...getInputProps()} />
            <Upload className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
            <span className="text-muted-foreground">{isDragActive ? "Suelta el archivo aquí" : label}</span>
            <p className="text-xs text-muted-foreground mt-1">Solo archivos .xlsx</p>
        </div>
    );
};

// ─── Main Wizard ─────────────────────────────────────────────────────────────

interface CentroWizardProps {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    reloadList: () => void;
}

const STEPS = [
    { key: "general", label: "Información General" },
    { key: "courses", label: "Cursos" },
    { key: "instructors", label: "Instructores" },
    { key: "students", label: "Estudiantes" },
];

export default function CentroWizard({ isOpen, setIsOpen, reloadList }: CentroWizardProps) {
    const { data: session } = useSession() as any;
    const authHeaders: any = { Authorization: `Bearer ${session?.user?.session}`, "Content-Type": "application/json" };
    const authHeadersRaw: any = { Authorization: `Bearer ${session?.user?.session}` };

    // ─── Step tracking ───
    const [step, setStep] = useState(1);

    // ─── Step 1: Centro form ───
    const [centroForm, setCentroForm] = useState<Record<string, any>>({
        nombre: "", siglas: "", codigo: "", departamento_id: "", municipio_id: "",
        descripcion: "", direccion: "", telefono: "", email: "", pagina_web: "", facebook: "",
        nombre_director: "", telefono_director: "", email_director: "",
        nombre_contacto: "", telefono_contacto: "", email_contacto: "", puesto_contacto: "",
    });
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [departamentos, setDepartamentos] = useState<any[]>([]);
    const [municipios, setMunicipios] = useState<any[]>([]);

    // ─── Step 2: Courses ───
    const [courses, setCourses] = useState<CourseItem[]>([]);
    const [courseModalOpen, setCourseModalOpen] = useState(false);
    const [editingCourse, setEditingCourse] = useState<CourseItem | null>(null);

    // ─── Step 3: Instructors ───
    const [instructors, setInstructors] = useState<InstructorItem[]>([]);
    const [instructorModalOpen, setInstructorModalOpen] = useState(false);
    const [editingInstructor, setEditingInstructor] = useState<InstructorItem | null>(null);

    // ─── Step 4: Students ───
    const [students, setStudents] = useState<StudentItem[]>([]);

    // ─── Shared ───
    const [isSubmitting, setIsSubmitting] = useState(false);

    // ─── Fetch catalogs ───
    useEffect(() => {
        if (!isOpen || !session) return;
        fetch(`${apiBase}/centros/departamentos`, { headers: authHeadersRaw }).then(r => r.json()).then(d => setDepartamentos(d.data ?? [])).catch(() => {});
    }, [isOpen, session?.user?.session]);

    useEffect(() => {
        if (!centroForm.departamento_id) { setMunicipios([]); return; }
        fetch(`${apiBase}/centros/municipios?departamento_id=${centroForm.departamento_id}`, { headers: authHeadersRaw })
            .then(r => r.json()).then(d => setMunicipios(d.data ?? [])).catch(() => {});
    }, [centroForm.departamento_id, session?.user?.session]);

    // ─── Reset on close ───
    useEffect(() => {
        if (!isOpen) {
            setStep(1);
            setCentroForm({ nombre: "", siglas: "", codigo: "", departamento_id: "", municipio_id: "", descripcion: "", direccion: "", telefono: "", email: "", pagina_web: "", facebook: "", nombre_director: "", telefono_director: "", email_director: "", nombre_contacto: "", telefono_contacto: "", email_contacto: "", puesto_contacto: "" });
            setFormErrors({});
            setCourses([]);
            setInstructors([]);
            setStudents([]);
        }
    }, [isOpen]);

    // ─── Form helpers ───
    const set = (key: string, value: any) => {
        setCentroForm(prev => ({ ...prev, [key]: value }));
        setFormErrors(prev => { const n = { ...prev }; delete n[key]; return n; });
    };

    const fieldInput = (key: string, label: string, opts?: { required?: boolean; placeholder?: string; type?: string; colSpan?: number }) => (
        <div className={opts?.colSpan === 2 ? "md:col-span-2" : opts?.colSpan === 3 ? "md:col-span-3" : ""}>
            <Label className="mb-1 font-medium text-default-600">{label}{opts?.required ? " *" : ""}</Label>
            <Input type={opts?.type ?? "text"} disabled={isSubmitting} value={centroForm[key] ?? ""} onChange={(e) => set(key, e.target.value)} placeholder={opts?.placeholder ?? label} />
            {formErrors[key] && <p className="text-destructive text-xs mt-1">{formErrors[key]}</p>}
        </div>
    );

    // ─── Step 1 Validation ───
    const validateStep1 = (): boolean => {
        const e: Record<string, string> = {};
        if (!centroForm.nombre?.trim()) e.nombre = "Requerido";
        if (!centroForm.siglas?.trim()) e.siglas = "Requerido";
        if (!centroForm.codigo?.trim()) e.codigo = "Requerido";
        if (!centroForm.departamento_id) e.departamento_id = "Requerido";
        if (!centroForm.municipio_id) e.municipio_id = "Requerido";
        setFormErrors(e);
        return Object.keys(e).length === 0;
    };

    // ─── Excel download ───
    const downloadTemplate = async (entity: string) => {
        try {
            const res = await fetch(`${apiBase}/centros/centros/excel/template/${entity}`, { headers: authHeadersRaw });
            if (!res.ok) { toast.error("Error al descargar plantilla"); return; }
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `plantilla-${entity}.xlsx`;
            a.click();
            URL.revokeObjectURL(url);
        } catch { toast.error("Error al descargar plantilla"); }
    };

    // ─── Excel import: Courses ───
    const importCoursesExcel = (file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const wb = XLSX.read(e.target?.result, { type: "array" });
                const sheet = wb.Sheets[wb.SheetNames[0]];
                const rows: any[] = XLSX.utils.sheet_to_json(sheet);
                let imported = 0;
                for (const row of rows) {
                    const nombre = (row["Nombre"] ?? "").toString().trim();
                    const codigo_programa = (row["Codigo Programa"] ?? "").toString().trim();
                    const objetivo = (row["Objetivo"] ?? "").toString().trim();
                    if (!nombre || !codigo_programa || !objetivo) continue;
                    setCourses(prev => [...prev, {
                        _id: nextId(), nombre, codigo_programa, objetivo,
                        codigo: (row["Codigo"] ?? "").toString().trim(),
                        taller: (row["Taller"] ?? "1").toString().trim() === "0" ? 0 : 1,
                        modules: [],
                    }]);
                    imported++;
                }
                toast.success(`${imported} curso(s) importado(s)`);
            } catch { toast.error("Error al leer el archivo"); }
        };
        reader.readAsArrayBuffer(file);
    };

    // ─── Excel import: Instructors ───
    const importInstructorsExcel = (file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const wb = XLSX.read(e.target?.result, { type: "array" });
                const sheet = wb.Sheets[wb.SheetNames[0]];
                const rows: any[] = XLSX.utils.sheet_to_json(sheet);
                let imported = 0;
                for (const row of rows) {
                    const nombres = (row["Nombres"] ?? "").toString().trim();
                    const apellidos = (row["Apellidos"] ?? "").toString().trim();
                    if (!nombres || !apellidos) continue;
                    setInstructors(prev => [...prev, {
                        _id: nextId(), nombres, apellidos,
                        titulo_obtenido: (row["Titulo Obtenido"] ?? "").toString().trim(),
                        otros_titulos: (row["Otros Titulos"] ?? "").toString().trim(),
                    }]);
                    imported++;
                }
                toast.success(`${imported} instructor(es) importado(s)`);
            } catch { toast.error("Error al leer el archivo"); }
        };
        reader.readAsArrayBuffer(file);
    };

    // ─── Excel import: Students ───
    const importStudentsExcel = (file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const wb = XLSX.read(e.target?.result, { type: "array" });
                const sheet = wb.Sheets[wb.SheetNames[0]];
                const rows: any[] = XLSX.utils.sheet_to_json(sheet);
                let imported = 0;
                const errors: string[] = [];
                for (const row of rows) {
                    const identidad = (row["Identidad"] ?? "").toString().trim();
                    const nombres = (row["Nombres"] ?? "").toString().trim();
                    const apellidos = (row["Apellidos"] ?? "").toString().trim();
                    const sexo = (row["Sexo"] ?? "").toString().trim();
                    const departamento_id = Number(row["Departamento ID"]) || 0;
                    const municipio_id = Number(row["Municipio ID"]) || 0;
                    const vive = (row["Vive"] ?? "").toString().trim();
                    const numero_dep = (row["Num. Dependientes"] ?? "").toString().trim();
                    if (!identidad || !nombres || !apellidos || !sexo || !departamento_id || !municipio_id || !vive || !numero_dep) {
                        errors.push(`Fila con identidad "${identidad || "vacía"}": faltan campos requeridos`);
                        continue;
                    }
                    setStudents(prev => [...prev, {
                        _id: nextId(), identidad, nombres, apellidos, sexo,
                        departamento_id, municipio_id, vive, numero_dep,
                        estado_civil: (row["Estado Civil"] ?? "").toString().trim() || null,
                        fecha_nacimiento: (row["Fecha Nacimiento"] ?? "").toString().trim() || null,
                        direccion: (row["Direccion"] ?? "").toString().trim() || null,
                        email: (row["Email"] ?? "").toString().trim() || null,
                        telefono: (row["Telefono"] ?? "").toString().trim() || null,
                        celular: (row["Celular"] ?? "").toString().trim() || null,
                    }]);
                    imported++;
                }
                toast.success(`${imported} estudiante(s) importado(s)`);
                if (errors.length > 0) toast(errors.slice(0, 3).join("\n"), { duration: 6000, icon: "⚠️" });
            } catch { toast.error("Error al leer el archivo"); }
        };
        reader.readAsArrayBuffer(file);
    };

    // ─── Submit ───
    const handleSubmit = async () => {
        if (!validateStep1()) { setStep(1); return; }
        setIsSubmitting(true);
        try {
            const payload = {
                ...centroForm,
                departamento_id: Number(centroForm.departamento_id),
                municipio_id: Number(centroForm.municipio_id),
                courses: courses.map(c => ({
                    nombre: c.nombre, codigo_programa: c.codigo_programa, objetivo: c.objetivo,
                    codigo: c.codigo ? Number(c.codigo) : null, taller: c.taller,
                    modules: c.modules.map(m => ({
                        ...m, horas_teoricas: m.horas_teoricas, horas_practicas: m.horas_practicas,
                        tipo_evaluacion: Number(m.tipo_evaluacion) || 1,
                    })),
                })),
                instructors: instructors.map(i => ({
                    nombres: i.nombres, apellidos: i.apellidos,
                    titulo_obtenido: i.titulo_obtenido || null, otros_titulos: i.otros_titulos || null,
                })),
                students: students.map(s => {
                    const { _id, ...rest } = s;
                    return rest;
                }),
            };

            const res = await fetch(`${apiBase}/centros/centros/wizard`, {
                method: "POST", headers: authHeaders, body: JSON.stringify(payload),
            });
            const data = await res.json();
            if (res.ok) {
                const parts = [`Centro creado`];
                if (data.coursesCreated) parts.push(`${data.coursesCreated} curso(s)`);
                if (data.instructorsCreated) parts.push(`${data.instructorsCreated} instructor(es)`);
                if (data.studentsCreated) parts.push(`${data.studentsCreated} estudiante(s)`);
                toast.success(parts.join(" · "), { duration: 5000 });
                if (data.errors?.length) toast(data.errors.slice(0, 3).join("\n"), { duration: 6000, icon: "⚠️" });
                setIsOpen(false);
                reloadList();
            } else {
                toast.error(data.message ?? "Error al crear centro");
            }
        } catch { toast.error("Error al crear centro"); }
        setIsSubmitting(false);
    };

    // ─── Navigation ───
    const goNext = () => {
        if (step === 1 && !validateStep1()) return;
        setStep(prev => Math.min(prev + 1, 4));
    };
    const goBack = () => setStep(prev => Math.max(prev - 1, 1));

    return (
        <Dialog open={isOpen} onOpenChange={(v) => { if (!isSubmitting) setIsOpen(v); }}>
            <DialogContent size="5xl" className="max-h-[90vh] flex flex-col">
                <DialogTitle>Crear Centro</DialogTitle>
                <Stepper direction="horizontal" current={step - 1} gap alternativeLabel>
                    {STEPS.map((s, i) => (
                        <Step key={s.key} onClick={() => { if (i < step - 1) setStep(i + 1); }} className={i < step - 1 ? "cursor-pointer" : ""}>
                            <StepLabel>{s.label}</StepLabel>
                        </Step>
                    ))}
                </Stepper>

                <div className="flex-1 min-h-0 py-4">
                    {/* ═══ Step 1: Información General ═══ */}
                    {step === 1 && (
                        <ScrollArea className="h-full max-h-[55vh]">
                            <div className="px-4 space-y-6">
                                <div>
                                    <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">Datos del Centro</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {fieldInput("nombre", "Nombre", { required: true })}
                                        {fieldInput("siglas", "Siglas", { required: true })}
                                        {fieldInput("codigo", "Código", { required: true })}
                                        <div>
                                            <Label className="mb-1 font-medium text-default-600">Departamento *</Label>
                                            <Select value={centroForm.departamento_id} onValueChange={(v) => { set("departamento_id", v); set("municipio_id", ""); }} disabled={isSubmitting}>
                                                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                                                <SelectContent>{departamentos.map(d => <SelectItem key={d.id} value={String(d.id)}>{d.nombre}</SelectItem>)}</SelectContent>
                                            </Select>
                                            {formErrors.departamento_id && <p className="text-destructive text-xs mt-1">{formErrors.departamento_id}</p>}
                                        </div>
                                        <div>
                                            <Label className="mb-1 font-medium text-default-600">Municipio *</Label>
                                            <Select value={centroForm.municipio_id} onValueChange={(v) => set("municipio_id", v)} disabled={isSubmitting || !centroForm.departamento_id}>
                                                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                                                <SelectContent>{municipios.map(m => <SelectItem key={m.id} value={String(m.id)}>{m.nombre}</SelectItem>)}</SelectContent>
                                            </Select>
                                            {formErrors.municipio_id && <p className="text-destructive text-xs mt-1">{formErrors.municipio_id}</p>}
                                        </div>
                                        <div className="md:col-span-3">
                                            <Label className="mb-1 font-medium text-default-600">Descripción</Label>
                                            <Textarea disabled={isSubmitting} value={centroForm.descripcion} onChange={(e) => set("descripcion", e.target.value)} placeholder="Descripción del centro" rows={2} />
                                        </div>
                                        {fieldInput("direccion", "Dirección")}
                                        {fieldInput("telefono", "Teléfono")}
                                        {fieldInput("email", "Email")}
                                        {fieldInput("pagina_web", "Página web")}
                                        {fieldInput("facebook", "Facebook")}
                                    </div>
                                </div>
                                <div>
                                    <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">Director</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {fieldInput("nombre_director", "Nombre del Director")}
                                        {fieldInput("telefono_director", "Teléfono Director")}
                                        {fieldInput("email_director", "Email Director")}
                                    </div>
                                </div>
                                <div>
                                    <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">Persona de Contacto</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        {fieldInput("nombre_contacto", "Nombre")}
                                        {fieldInput("puesto_contacto", "Puesto")}
                                        {fieldInput("telefono_contacto", "Teléfono")}
                                        {fieldInput("email_contacto", "Email")}
                                    </div>
                                </div>
                            </div>
                        </ScrollArea>
                    )}

                    {/* ═══ Step 2: Cursos ═══ */}
                    {step === 2 && (
                        <div className="px-4 h-full flex flex-col">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <h4 className="text-sm font-semibold">Cursos</h4>
                                    {courses.length > 0 && <span className="text-xs text-muted-foreground">{courses.length} agregado(s)</span>}
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm" onClick={() => downloadTemplate("courses")}>
                                        <Download className="h-4 w-4 mr-1.5" />Descargar Formato
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={() => {
                                        const input = document.createElement("input"); input.type = "file"; input.accept = ".xlsx";
                                        input.onchange = (e) => { const f = (e.target as HTMLInputElement).files?.[0]; if (f) importCoursesExcel(f); };
                                        input.click();
                                    }}>
                                        <Upload className="h-4 w-4 mr-1.5" />Importar Excel
                                    </Button>
                                    <Button size="sm" onClick={() => { setEditingCourse(null); setCourseModalOpen(true); }}>
                                        <PlusCircle className="h-4 w-4 mr-1.5" />Agregar Curso
                                    </Button>
                                </div>
                            </div>
                            {courses.length === 0 ? (
                                <div className="flex-1 flex flex-col items-center justify-center py-12">
                                    <BookOpen className="h-8 w-8 text-muted-foreground/50 mb-3" />
                                    <p className="text-muted-foreground text-sm">No hay cursos agregados. Puedes agregar manualmente o importar desde Excel.</p>
                                </div>
                            ) : (
                                <ScrollArea className="flex-1 max-h-[45vh]">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Nombre</TableHead>
                                                <TableHead>Cód. Programa</TableHead>
                                                <TableHead>Módulos</TableHead>
                                                <TableHead className="w-[80px]">Acciones</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {courses.map((c) => (
                                                <TableRow key={c._id}>
                                                    <TableCell className="font-medium">{c.nombre}</TableCell>
                                                    <TableCell className="text-sm text-muted-foreground">{c.codigo_programa}</TableCell>
                                                    <TableCell className="text-sm">{c.modules.length}</TableCell>
                                                    <TableCell>
                                                        <div className="flex gap-1">
                                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingCourse(c); setCourseModalOpen(true); }}>
                                                                <Pencil className="h-3.5 w-3.5" />
                                                            </Button>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setCourses(prev => prev.filter(x => x._id !== c._id))}>
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </ScrollArea>
                            )}
                        </div>
                    )}

                    {/* ═══ Step 3: Instructores ═══ */}
                    {step === 3 && (
                        <div className="px-4 h-full flex flex-col">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <h4 className="text-sm font-semibold">Instructores</h4>
                                    {instructors.length > 0 && <span className="text-xs text-muted-foreground">{instructors.length} agregado(s)</span>}
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm" onClick={() => downloadTemplate("instructors")}>
                                        <Download className="h-4 w-4 mr-1.5" />Descargar Formato
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={() => {
                                        const input = document.createElement("input"); input.type = "file"; input.accept = ".xlsx";
                                        input.onchange = (e) => { const f = (e.target as HTMLInputElement).files?.[0]; if (f) importInstructorsExcel(f); };
                                        input.click();
                                    }}>
                                        <Upload className="h-4 w-4 mr-1.5" />Importar Excel
                                    </Button>
                                    <Button size="sm" onClick={() => { setEditingInstructor(null); setInstructorModalOpen(true); }}>
                                        <PlusCircle className="h-4 w-4 mr-1.5" />Agregar Instructor
                                    </Button>
                                </div>
                            </div>
                            {instructors.length === 0 ? (
                                <div className="flex-1 flex flex-col items-center justify-center py-12">
                                    <Users className="h-8 w-8 text-muted-foreground/50 mb-3" />
                                    <p className="text-muted-foreground text-sm">No hay instructores agregados. Puedes agregar manualmente o importar desde Excel.</p>
                                </div>
                            ) : (
                                <ScrollArea className="flex-1 max-h-[45vh]">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Nombres</TableHead>
                                                <TableHead>Apellidos</TableHead>
                                                <TableHead>Título</TableHead>
                                                <TableHead className="w-[80px]">Acciones</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {instructors.map((i) => (
                                                <TableRow key={i._id}>
                                                    <TableCell className="font-medium">{i.nombres}</TableCell>
                                                    <TableCell>{i.apellidos}</TableCell>
                                                    <TableCell className="text-sm text-muted-foreground">{i.titulo_obtenido || "-"}</TableCell>
                                                    <TableCell>
                                                        <div className="flex gap-1">
                                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingInstructor(i); setInstructorModalOpen(true); }}>
                                                                <Pencil className="h-3.5 w-3.5" />
                                                            </Button>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setInstructors(prev => prev.filter(x => x._id !== i._id))}>
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </ScrollArea>
                            )}
                        </div>
                    )}

                    {/* ═══ Step 4: Estudiantes ═══ */}
                    {step === 4 && (
                        <div className="px-4 h-full flex flex-col">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <h4 className="text-sm font-semibold">Estudiantes</h4>
                                    {students.length > 0 && <span className="text-xs text-muted-foreground">{students.length} agregado(s)</span>}
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm" onClick={() => downloadTemplate("students")}>
                                        <Download className="h-4 w-4 mr-1.5" />Descargar Formato
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={() => {
                                        const input = document.createElement("input"); input.type = "file"; input.accept = ".xlsx";
                                        input.onchange = (e) => { const f = (e.target as HTMLInputElement).files?.[0]; if (f) importStudentsExcel(f); };
                                        input.click();
                                    }}>
                                        <Upload className="h-4 w-4 mr-1.5" />Importar Excel
                                    </Button>
                                </div>
                            </div>
                            {students.length === 0 ? (
                                <div className="flex-1">
                                    <ExcelDropzone disabled={isSubmitting} onFile={importStudentsExcel} label="Arrastra un Excel de estudiantes o haz clic para importar" />
                                    <p className="text-xs text-muted-foreground mt-3 text-center">
                                        Descarga el formato para conocer las columnas requeridas. Columnas obligatorias: Identidad, Nombres, Apellidos, Sexo, Departamento ID, Municipio ID, Vive, Num. Dependientes.
                                    </p>
                                </div>
                            ) : (
                                <ScrollArea className="flex-1 max-h-[45vh]">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Identidad</TableHead>
                                                <TableHead>Nombre Completo</TableHead>
                                                <TableHead>Sexo</TableHead>
                                                <TableHead className="w-[60px]">Acciones</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {students.map((s) => (
                                                <TableRow key={s._id}>
                                                    <TableCell className="font-medium">{s.identidad}</TableCell>
                                                    <TableCell>{s.nombres} {s.apellidos}</TableCell>
                                                    <TableCell className="text-sm">{s.sexo}</TableCell>
                                                    <TableCell>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setStudents(prev => prev.filter(x => x._id !== s._id))}>
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </ScrollArea>
                            )}
                        </div>
                    )}
                </div>

                {/* ─── Footer ─── */}
                <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isSubmitting}>Cancelar</Button>
                    {step > 1 && (
                        <Button variant="outline" onClick={goBack} disabled={isSubmitting}>
                            <ChevronLeft className="h-4 w-4 mr-1" />Anterior
                        </Button>
                    )}
                    {step < 4 ? (
                        <Button onClick={goNext} disabled={isSubmitting}>
                            Siguiente<ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                    ) : (
                        <Button onClick={handleSubmit} disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
                            Crear Centro
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>

            {/* ═══ Sub-dialog: Course ═══ */}
            <CourseSubModal
                isOpen={courseModalOpen}
                setIsOpen={setCourseModalOpen}
                editing={editingCourse}
                onSave={(course) => {
                    if (editingCourse) {
                        setCourses(prev => prev.map(c => c._id === editingCourse._id ? { ...course, _id: editingCourse._id } : c));
                    } else {
                        setCourses(prev => [...prev, { ...course, _id: nextId() }]);
                    }
                    setCourseModalOpen(false);
                }}
            />

            {/* ═══ Sub-dialog: Instructor ═══ */}
            <InstructorSubModal
                isOpen={instructorModalOpen}
                setIsOpen={setInstructorModalOpen}
                editing={editingInstructor}
                onSave={(inst) => {
                    if (editingInstructor) {
                        setInstructors(prev => prev.map(i => i._id === editingInstructor._id ? { ...inst, _id: editingInstructor._id } : i));
                    } else {
                        setInstructors(prev => [...prev, { ...inst, _id: nextId() }]);
                    }
                    setInstructorModalOpen(false);
                }}
            />
        </Dialog>
    );
}

// ─── Course Sub-Modal ────────────────────────────────────────────────────────

function CourseSubModal({ isOpen, setIsOpen, editing, onSave }: {
    isOpen: boolean; setIsOpen: (v: boolean) => void;
    editing: CourseItem | null;
    onSave: (c: CourseItem) => void;
}) {
    const [nombre, setNombre] = useState("");
    const [codigoPrograma, setCodigoPrograma] = useState("");
    const [objetivo, setObjetivo] = useState("");
    const [codigo, setCodigo] = useState("");
    const [taller, setTaller] = useState("1");
    const [modules, setModules] = useState<ModuleItem[]>([]);
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (isOpen) {
            if (editing) {
                setNombre(editing.nombre); setCodigoPrograma(editing.codigo_programa);
                setObjetivo(editing.objetivo); setCodigo(editing.codigo);
                setTaller(String(editing.taller)); setModules([...editing.modules]);
            } else {
                setNombre(""); setCodigoPrograma(""); setObjetivo(""); setCodigo(""); setTaller("1"); setModules([]);
            }
            setErrors({});
        }
    }, [isOpen, editing]);

    const validate = () => {
        const e: Record<string, string> = {};
        if (!nombre.trim()) e.nombre = "Requerido";
        if (!codigoPrograma.trim()) e.codigo_programa = "Requerido";
        if (!objetivo.trim()) e.objetivo = "Requerido";
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const save = () => {
        if (!validate()) return;
        onSave({ _id: 0, nombre: nombre.trim(), codigo_programa: codigoPrograma.trim(), objetivo: objetivo.trim(), codigo: codigo.trim(), taller: Number(taller), modules });
    };

    const updateModule = (idx: number, key: string, value: string) => {
        setModules(prev => prev.map((m, i) => i === idx ? { ...m, [key]: value } : m));
    };

    const importModulesExcel = (file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const wb = XLSX.read(e.target?.result, { type: "array" });
                const sheet = wb.Sheets[wb.SheetNames[0]];
                const rows: any[] = XLSX.utils.sheet_to_json(sheet);
                const imported: ModuleItem[] = [];
                for (const row of rows) {
                    const cod = (row["Codigo"] ?? "").toString().trim();
                    const nom = (row["Nombre"] ?? "").toString().trim();
                    const ht = (row["Horas Teoricas"] ?? "").toString().trim();
                    const hp = (row["Horas Practicas"] ?? "").toString().trim();
                    if (!cod || !nom || !ht || !hp) continue;
                    let te = (row["Tipo Evaluacion"] ?? "1").toString().trim().toUpperCase();
                    if (te === "TEORICA" || te === "TEÓRICA") te = "1";
                    else if (te === "PRACTICA" || te === "PRÁCTICA") te = "2";
                    else if (te === "MIXTA") te = "3";
                    imported.push({ codigo: cod, nombre: nom, horas_teoricas: ht, horas_practicas: hp, tipo_evaluacion: te || "1", observaciones: (row["Observaciones"] ?? "").toString().trim() });
                }
                setModules(imported);
                toast.success(`${imported.length} módulo(s) importado(s)`);
            } catch { toast.error("Error al leer el archivo"); }
        };
        reader.readAsArrayBuffer(file);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent size="3xl" className="max-h-[85vh] flex flex-col">
                <DialogTitle>{editing ? "Editar Curso" : "Agregar Curso"}</DialogTitle>
                <ScrollArea className="flex-1 max-h-[60vh]">
                    <div className="px-1 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label className="mb-1 font-medium text-default-600">Nombre *</Label>
                                <Input value={nombre} onChange={(e) => { setNombre(e.target.value); setErrors(p => { const n = { ...p }; delete n.nombre; return n; }); }} placeholder="Nombre del curso" />
                                {errors.nombre && <p className="text-destructive text-xs mt-1">{errors.nombre}</p>}
                            </div>
                            <div>
                                <Label className="mb-1 font-medium text-default-600">Código de Programa *</Label>
                                <Input value={codigoPrograma} onChange={(e) => { setCodigoPrograma(e.target.value); setErrors(p => { const n = { ...p }; delete n.codigo_programa; return n; }); }} placeholder="Código del programa" />
                                {errors.codigo_programa && <p className="text-destructive text-xs mt-1">{errors.codigo_programa}</p>}
                            </div>
                            <div>
                                <Label className="mb-1 font-medium text-default-600">Código</Label>
                                <Input type="number" value={codigo} onChange={(e) => setCodigo(e.target.value)} placeholder="Código numérico" />
                            </div>
                            <div>
                                <Label className="mb-1 font-medium text-default-600">Taller</Label>
                                <Select value={taller} onValueChange={setTaller}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="1">Sí</SelectItem>
                                        <SelectItem value="0">No</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="md:col-span-2">
                                <Label className="mb-1 font-medium text-default-600">Objetivo *</Label>
                                <Textarea value={objetivo} onChange={(e) => { setObjetivo(e.target.value); setErrors(p => { const n = { ...p }; delete n.objetivo; return n; }); }} placeholder="Objetivo del curso" rows={2} />
                                {errors.objetivo && <p className="text-destructive text-xs mt-1">{errors.objetivo}</p>}
                            </div>
                        </div>

                        {/* Modules */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <h4 className="text-sm font-semibold">Módulos</h4>
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm" onClick={() => {
                                        const input = document.createElement("input"); input.type = "file"; input.accept = ".xlsx";
                                        input.onchange = (e) => { const f = (e.target as HTMLInputElement).files?.[0]; if (f) importModulesExcel(f); };
                                        input.click();
                                    }}>
                                        <Upload className="h-3.5 w-3.5 mr-1" />Importar
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={() => setModules(prev => [...prev, emptyModule()])}>
                                        <PlusCircle className="h-3.5 w-3.5 mr-1" />Agregar
                                    </Button>
                                </div>
                            </div>
                            {modules.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-4">Sin módulos. Puedes agregar manualmente o importar desde Excel.</p>
                            ) : (
                                <div className="space-y-2">
                                    {modules.map((m, idx) => (
                                        <div key={idx} className="grid grid-cols-[1fr_1fr_80px_80px_40px] gap-2 items-end">
                                            <div>
                                                {idx === 0 && <Label className="text-xs mb-0.5">Código</Label>}
                                                <Input value={m.codigo} onChange={(e) => updateModule(idx, "codigo", e.target.value)} placeholder="Código" className="h-9 text-sm" />
                                            </div>
                                            <div>
                                                {idx === 0 && <Label className="text-xs mb-0.5">Nombre</Label>}
                                                <Input value={m.nombre} onChange={(e) => updateModule(idx, "nombre", e.target.value)} placeholder="Nombre" className="h-9 text-sm" />
                                            </div>
                                            <div>
                                                {idx === 0 && <Label className="text-xs mb-0.5">H. Teórica</Label>}
                                                <Input type="number" value={m.horas_teoricas} onChange={(e) => updateModule(idx, "horas_teoricas", e.target.value)} placeholder="0" className="h-9 text-sm" />
                                            </div>
                                            <div>
                                                {idx === 0 && <Label className="text-xs mb-0.5">H. Práctica</Label>}
                                                <Input type="number" value={m.horas_practicas} onChange={(e) => updateModule(idx, "horas_practicas", e.target.value)} placeholder="0" className="h-9 text-sm" />
                                            </div>
                                            <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive" onClick={() => setModules(prev => prev.filter((_, i) => i !== idx))}>
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </ScrollArea>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
                    <Button onClick={save}>{editing ? "Guardar" : "Agregar"}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ─── Instructor Sub-Modal ────────────────────────────────────────────────────

function InstructorSubModal({ isOpen, setIsOpen, editing, onSave }: {
    isOpen: boolean; setIsOpen: (v: boolean) => void;
    editing: InstructorItem | null;
    onSave: (i: InstructorItem) => void;
}) {
    const [nombres, setNombres] = useState("");
    const [apellidos, setApellidos] = useState("");
    const [titulo, setTitulo] = useState("");
    const [otros, setOtros] = useState("");
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (isOpen) {
            if (editing) {
                setNombres(editing.nombres); setApellidos(editing.apellidos);
                setTitulo(editing.titulo_obtenido); setOtros(editing.otros_titulos);
            } else {
                setNombres(""); setApellidos(""); setTitulo(""); setOtros("");
            }
            setErrors({});
        }
    }, [isOpen, editing]);

    const save = () => {
        const e: Record<string, string> = {};
        if (!nombres.trim()) e.nombres = "Requerido";
        if (!apellidos.trim()) e.apellidos = "Requerido";
        setErrors(e);
        if (Object.keys(e).length > 0) return;
        onSave({ _id: 0, nombres: nombres.trim(), apellidos: apellidos.trim(), titulo_obtenido: titulo.trim(), otros_titulos: otros.trim() });
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent size="lg">
                <DialogTitle>{editing ? "Editar Instructor" : "Agregar Instructor"}</DialogTitle>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                    <div>
                        <Label className="mb-1 font-medium text-default-600">Nombres *</Label>
                        <Input value={nombres} onChange={(e) => { setNombres(e.target.value); setErrors(p => { const n = { ...p }; delete n.nombres; return n; }); }} placeholder="Nombres" />
                        {errors.nombres && <p className="text-destructive text-xs mt-1">{errors.nombres}</p>}
                    </div>
                    <div>
                        <Label className="mb-1 font-medium text-default-600">Apellidos *</Label>
                        <Input value={apellidos} onChange={(e) => { setApellidos(e.target.value); setErrors(p => { const n = { ...p }; delete n.apellidos; return n; }); }} placeholder="Apellidos" />
                        {errors.apellidos && <p className="text-destructive text-xs mt-1">{errors.apellidos}</p>}
                    </div>
                    <div>
                        <Label className="mb-1 font-medium text-default-600">Título obtenido</Label>
                        <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Título obtenido" />
                    </div>
                    <div>
                        <Label className="mb-1 font-medium text-default-600">Otros títulos</Label>
                        <Input value={otros} onChange={(e) => setOtros(e.target.value)} placeholder="Otros títulos" />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
                    <Button onClick={save}>{editing ? "Guardar" : "Agregar"}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
