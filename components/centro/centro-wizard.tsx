"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
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
import { excelValueToIsoDate } from "@/lib/excel-date";

const apiBase = process.env.NEXT_PUBLIC_API_PROXY;

// ─── Types ───────────────────────────────────────────────────────────────────

interface ModuleItem {
    codigo: string; nombre: string; horas_teoricas: string; horas_practicas: string;
    tipo_evaluacion: string; observaciones: string;
}
interface CourseItem {
    _id: number; nombre: string; codigo_programa: string; objetivo: string;
    codigo: string; taller: number; modules: ModuleItem[];
    // Área técnica: id elegido en el formulario, o nombre leído del Excel
    // (lo resuelve el servidor).
    area_id: string; area: string;
}
interface AreaItem { id: number; nombre: string; }
interface InstructorItem {
    _id: number; nombres: string; apellidos: string; titulo_obtenido: string; otros_titulos: string;
}
// Departamento, municipio y catálogos van por NOMBRE (los resuelve el servidor);
// los *_id solo llegan de plantillas viejas.
interface StudentItem {
    _id: number; identidad: string; nombres: string; apellidos: string; sexo: string;
    vive: string; numero_dep: string;
    [key: string]: any;
}

const emptyModule = (): ModuleItem => ({ codigo: "", nombre: "", horas_teoricas: "", horas_practicas: "", tipo_evaluacion: "1", observaciones: "" });

let _nextId = 1;
const nextId = () => _nextId++;

// Texto comparable, mismo criterio que plano() del backend: sin tildes,
// minúsculas y sin signos ("Mecánica_Automotriz" → "mecanica automotriz").
const plano = (v: any) => String(v ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

// Área del curso: la elegida en el formulario o la del Excel resuelta contra el catálogo.
const areaDeCurso = (c: Pick<CourseItem, "area_id" | "area">, areas: AreaItem[]) =>
    areas.find((a) => String(a.id) === c.area_id) ?? (c.area ? areas.find((a) => plano(a.nombre) === plano(c.area)) : undefined);

// Primera hoja del Excel como filas. Los encabezados obligatorios de las
// plantillas llevan "*" ("Identidad*"): se quita para leer row["Identidad"].
// __fila es el número de fila en Excel (1 = encabezados), para los mensajes.
const readExcelRows = (data: any): Record<string, any>[] => {
    const wb = XLSX.read(data, { type: "array" });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });
    return rows.map((row) => {
        const clean: Record<string, any> = { __fila: (row.__rowNum__ ?? 0) + 1 };
        for (const [key, val] of Object.entries(row)) clean[key.replace(/\*\s*$/, "").trim()] = val;
        return clean;
    });
};

// Celda como texto recortado ("" si está vacía).
const cell = (row: Record<string, any>, col: string) => String(row[col] ?? "").trim();

// Celda para el payload: vacía → null; los números se envían tal cual (el
// servidor normaliza banderas, cantidades y fechas seriales de Excel).
const cellOrNull = (row: Record<string, any>, col: string) => {
    const v = row[col];
    if (typeof v === "number") return v;
    const s = String(v ?? "").trim();
    return s || null;
};

// Resumen de filas omitidas (máximo 3 en el aviso).
const avisoFilas = (errors: string[]) =>
    errors.slice(0, 3).join("\n") + (errors.length > 3 ? `\n… y ${errors.length - 3} más` : "");

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
    const [areas, setAreas] = useState<AreaItem[]>([]);

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
        fetch(`${apiBase}/centros/areas?all=true`, { headers: authHeadersRaw }).then(r => r.json()).then(d => setAreas(d.data ?? [])).catch(() => {});
    }, [isOpen, session?.user?.session]);

    useEffect(() => {
        if (!centroForm.departamento_id) { setMunicipios([]); return; }
        fetch(`${apiBase}/centros/municipios?departamento_id=${centroForm.departamento_id}`, { headers: authHeadersRaw })
            .then(r => r.json()).then(d => setMunicipios(d.data ?? [])).catch(() => {});
    }, [centroForm.departamento_id, session?.user?.session]);

    // ─── Suggest next centro code (editable) ───
    // Precarga el siguiente CFP-### disponible como sugerencia. El campo sigue
    // siendo editable; solo se rellena si el usuario aún no escribió un código.
    useEffect(() => {
        if (!isOpen || !session) return;
        fetch(`${apiBase}/centros/centros/next-code`, { headers: authHeadersRaw })
            .then(r => r.json())
            .then(d => {
                const code = d?.data?.code;
                if (code) setCentroForm(prev => (prev.codigo?.trim() ? prev : { ...prev, codigo: code }));
            })
            .catch(() => {});
    }, [isOpen, session?.user?.session]);

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
                const rows = readExcelRows(e.target?.result);
                const nuevos: CourseItem[] = [];
                const errors: string[] = [];
                for (const row of rows) {
                    const nombre = cell(row, "Nombre");
                    const codigo_programa = cell(row, "Codigo Programa");
                    const objetivo = cell(row, "Objetivo");
                    const faltan = [!nombre && "Nombre", !codigo_programa && "Codigo Programa", !objetivo && "Objetivo"].filter(Boolean);
                    if (faltan.length) { errors.push(`Fila ${row.__fila}: falta ${faltan.join(", ")}`); continue; }
                    nuevos.push({
                        _id: nextId(), nombre, codigo_programa, objetivo,
                        codigo: cell(row, "Codigo"),
                        taller: cell(row, "Taller") === "0" ? 0 : 1,
                        // Área por nombre; si falta o no existe, el curso queda
                        // marcado en la lista para elegirla al editarlo.
                        area_id: "", area: cell(row, "Area Tecnica"),
                        modules: [],
                    });
                }
                setCourses(prev => [...prev, ...nuevos]);
                toast.success(`${nuevos.length} curso(s) importado(s)`);
                const sinArea = nuevos.filter((c) => (areas.length ? !areaDeCurso(c, areas) : !c.area)).length;
                if (sinArea) errors.push(`${sinArea} curso(s) sin un área técnica válida: edítelos para elegirla`);
                if (errors.length > 0) toast(avisoFilas(errors), { duration: 6000, icon: "⚠️" });
            } catch { toast.error("Error al leer el archivo"); }
        };
        reader.readAsArrayBuffer(file);
    };

    // ─── Excel import: Instructors ───
    const importInstructorsExcel = (file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const rows = readExcelRows(e.target?.result);
                const nuevos: InstructorItem[] = [];
                const errors: string[] = [];
                for (const row of rows) {
                    const nombres = cell(row, "Nombres");
                    const apellidos = cell(row, "Apellidos");
                    const faltan = [!nombres && "Nombres", !apellidos && "Apellidos"].filter(Boolean);
                    if (faltan.length) { errors.push(`Fila ${row.__fila}: falta ${faltan.join(", ")}`); continue; }
                    nuevos.push({
                        _id: nextId(), nombres, apellidos,
                        titulo_obtenido: cell(row, "Titulo Obtenido"),
                        otros_titulos: cell(row, "Otros Titulos"),
                    });
                }
                setInstructors(prev => [...prev, ...nuevos]);
                toast.success(`${nuevos.length} instructor(es) importado(s)`);
                if (errors.length > 0) toast(avisoFilas(errors), { duration: 6000, icon: "⚠️" });
            } catch { toast.error("Error al leer el archivo"); }
        };
        reader.readAsArrayBuffer(file);
    };

    // ─── Excel import: Students ───
    // Mismo mapeo de columnas que parseStudentsExcel del backend. Departamento,
    // municipio y catálogos van por nombre (los resuelve el servidor); las
    // columnas "… ID" de plantillas viejas se siguen aceptando.
    const importStudentsExcel = (file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const rows = readExcelRows(e.target?.result);
                const nuevos: StudentItem[] = [];
                const errors: string[] = [];
                for (const row of rows) {
                    const identidad = cell(row, "Identidad");
                    const nombres = cell(row, "Nombres");
                    const apellidos = cell(row, "Apellidos");
                    const sexo = cell(row, "Sexo");
                    const departamento = cell(row, "Departamento");
                    const departamentoId = cell(row, "Departamento ID");
                    const municipio = cell(row, "Municipio");
                    const municipioId = cell(row, "Municipio ID");
                    const vive = cell(row, "Vive");
                    const numero_dep = cell(row, "Num. Dependientes");
                    const faltan = [
                        !identidad && "Identidad", !nombres && "Nombres", !apellidos && "Apellidos", !sexo && "Sexo",
                        !departamento && !departamentoId && "Departamento", !municipio && !municipioId && "Municipio",
                        !vive && "Vive", !numero_dep && "Num. Dependientes",
                    ].filter(Boolean);
                    if (faltan.length) {
                        errors.push(`Fila ${row.__fila}${identidad ? ` (${identidad})` : ""}: falta ${faltan.join(", ")}`);
                        continue;
                    }
                    const opt = (col: string) => cellOrNull(row, col);
                    // Catálogo por nombre + ID solo si la plantilla vieja lo trae.
                    const catalogo = (campo: string, col: string) => ({
                        [campo]: opt(col),
                        ...(cell(row, `${col} ID`) ? { [`${campo}_id`]: cell(row, `${col} ID`) } : {}),
                    });
                    const fecha = row["Fecha Nacimiento"];
                    nuevos.push({
                        _id: nextId(), identidad, nombres, apellidos, sexo, vive, numero_dep,
                        ...catalogo("departamento", "Departamento"),
                        ...catalogo("municipio", "Municipio"),
                        estado_civil: opt("Estado Civil"),
                        // ISO si se reconoce; si no, el valor tal cual para que el servidor explique el error.
                        fecha_nacimiento: excelValueToIsoDate(fecha) ?? cellOrNull(row, "Fecha Nacimiento"),
                        sangre: opt("Tipo Sangre"),
                        direccion: opt("Direccion"),
                        email: opt("Email"), telefono: opt("Telefono"), celular: opt("Celular"),
                        facebook: opt("Facebook"), instagram: opt("Instagram"), twitter: opt("Twitter"),
                        estudia: opt("Estudia"),
                        ...catalogo("nivel_escolaridad", "Nivel Escolaridad"),
                        tiene_hijos: opt("Tiene Hijos"), cuantos_hijos: opt("Cuantos Hijos"),
                        vivienda: opt("Vivienda"),
                        cantidad_viven: opt("Cant. Viven"),
                        cantidad_trabajan_viven: opt("Cant. Trabajan"),
                        cantidad_notrabajan_viven: opt("Cant. No Trabajan"),
                        ingreso_promedio: opt("Ingreso Promedio"),
                        trabajo_actual: opt("Trabajo Actual"),
                        donde_trabaja: opt("Donde Trabaja"), puesto: opt("Puesto"),
                        trabajado_ant: opt("Trabajado Ant."),
                        tiempo_ant: opt("Tiempo Ant."),
                        tipo_contrato_ant: opt("Tipo Contrato Ant."),
                        beneficios_empleo: opt("Beneficios Empleo"),
                        beneficios_empleo_otro: opt("Beneficios Empleo Otro"),
                        autoempleo: opt("Autoempleo"),
                        autoempleo_dedicacion: opt("Autoempleo Dedicacion"),
                        autoempleo_otro: opt("Autoempleo Otro"),
                        autoempleo_tiempo: opt("Autoempleo Tiempo"),
                        dias_semana_trabajo: opt("Dias Semana Trabajo"),
                        horas_dia_trabajo: opt("Horas Dia Trabajo"),
                        socios: opt("Socios"), socios_cantidad: opt("Socios Cantidad"),
                        especial: opt("Especial"),
                        ...catalogo("discapacidad", "Discapacidad"),
                        ...catalogo("etnia", "Etnia"),
                        interno: opt("Interno"),
                        nombre_r: opt("Nombre Ref."), telefono_r: opt("Telefono Ref."),
                        datos_r: opt("Datos Ref."), parentesco_r: opt("Parentesco Ref."),
                        adicional_r: opt("Adicional Ref."),
                        // Columnas nuevas: solo si existen en el archivo (plantillas viejas no las traen).
                        ...("Detalle Discapacidad" in row ? { discapacidad_detalle: opt("Detalle Discapacidad") } : {}),
                        ...("Observaciones" in row ? { observaciones: opt("Observaciones") } : {}),
                    });
                }
                setStudents(prev => [...prev, ...nuevos]);
                toast.success(`${nuevos.length} estudiante(s) importado(s)`);
                if (errors.length > 0) toast(avisoFilas(errors), { duration: 6000, icon: "⚠️" });
            } catch { toast.error("Error al leer el archivo"); }
        };
        reader.readAsArrayBuffer(file);
    };

    // ─── Submit ───
    // Candado síncrono anti doble-envío: evita crear el centro dos veces si el
    // segundo click llega antes del re-render que deshabilita el botón.
    const submitLockRef = useRef(false);

    // Todo curso necesita área técnica: sin ella el servidor lo descarta y el
    // centro se crearía sin ese curso.
    const validateCoursesAreas = (): boolean => {
        const sinArea = courses.filter((c) => (areas.length ? !areaDeCurso(c, areas) : !c.area_id && !c.area));
        if (sinArea.length === 0) return true;
        toast.error(sinArea.length === 1
            ? `El curso "${sinArea[0].nombre}" no tiene un área técnica válida. Edítelo para elegirla.`
            : `${sinArea.length} cursos no tienen un área técnica válida. Edítelos para elegirla.`);
        return false;
    };

    const handleSubmit = async () => {
        if (!validateStep1()) { setStep(1); return; }
        if (!validateCoursesAreas()) { setStep(2); return; }
        if (submitLockRef.current) return;
        submitLockRef.current = true;
        setIsSubmitting(true);
        try {
            const payload = {
                ...centroForm,
                departamento_id: Number(centroForm.departamento_id),
                municipio_id: Number(centroForm.municipio_id),
                courses: courses.map(c => ({
                    nombre: c.nombre, codigo_programa: c.codigo_programa, objetivo: c.objetivo,
                    codigo: c.codigo ? Number(c.codigo) : null, taller: c.taller,
                    // Área elegida en el formulario (id) o nombre del Excel (lo resuelve el servidor).
                    ...(c.area_id ? { area_id: Number(c.area_id) } : { area: c.area || null }),
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
        submitLockRef.current = false;
    };

    // ─── Navigation ───
    const goNext = () => {
        if (step === 1 && !validateStep1()) return;
        if (step === 2 && !validateCoursesAreas()) return;
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
                                        {fieldInput("codigo", "Código", { required: true, placeholder: "Se sugiere automáticamente (editable)" })}
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
                                                <TableHead>Área Técnica</TableHead>
                                                <TableHead>Módulos</TableHead>
                                                <TableHead className="w-[80px]">Acciones</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {courses.map((c) => {
                                                const area = areaDeCurso(c, areas);
                                                return (
                                                    <TableRow key={c._id}>
                                                        <TableCell className="font-medium">{c.nombre}</TableCell>
                                                        <TableCell className="text-sm text-muted-foreground">{c.codigo_programa}</TableCell>
                                                        <TableCell className="text-sm">
                                                            {area ? area.nombre : !areas.length ? (c.area || "—") : (
                                                                // Sin área o con un nombre que no está en el catálogo.
                                                                <span className="text-destructive">
                                                                    {c.area ? `"${c.area}" no está en el catálogo` : "Sin área"} · edítelo para elegirla
                                                                </span>
                                                            )}
                                                        </TableCell>
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
                                                );
                                            })}
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
                                        Descarga el formato para conocer las columnas. Obligatorias (marcadas con *): Identidad, Nombres, Apellidos, Sexo, Departamento, Municipio, Vive, Num. Dependientes.
                                        Departamento, municipio y demás catálogos se escriben por nombre, como en las listas desplegables del formato.
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
                areas={areas}
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

function CourseSubModal({ isOpen, setIsOpen, editing, areas, onSave }: {
    isOpen: boolean; setIsOpen: (v: boolean) => void;
    editing: CourseItem | null;
    areas: AreaItem[];
    onSave: (c: CourseItem) => void;
}) {
    const [nombre, setNombre] = useState("");
    const [codigoPrograma, setCodigoPrograma] = useState("");
    const [objetivo, setObjetivo] = useState("");
    const [codigo, setCodigo] = useState("");
    const [taller, setTaller] = useState("1");
    const [areaId, setAreaId] = useState("");
    const [modules, setModules] = useState<ModuleItem[]>([]);
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (isOpen) {
            if (editing) {
                setNombre(editing.nombre); setCodigoPrograma(editing.codigo_programa);
                setObjetivo(editing.objetivo); setCodigo(editing.codigo);
                setTaller(String(editing.taller)); setModules([...editing.modules]);
                // Importado del Excel: se preselecciona el área si el nombre está en el catálogo.
                const area = areaDeCurso(editing, areas);
                setAreaId(area ? String(area.id) : "");
            } else {
                setNombre(""); setCodigoPrograma(""); setObjetivo(""); setCodigo(""); setTaller("1"); setAreaId(""); setModules([]);
            }
            setErrors({});
        }
    }, [isOpen, editing]);

    const validate = () => {
        const e: Record<string, string> = {};
        if (!nombre.trim()) e.nombre = "Requerido";
        if (!codigoPrograma.trim()) e.codigo_programa = "Requerido";
        if (!areaId) e.area_id = "Requerido";
        if (!objetivo.trim()) e.objetivo = "Requerido";
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const save = () => {
        if (!validate()) return;
        // El área elegida reemplaza al nombre leído del Excel.
        onSave({ _id: 0, nombre: nombre.trim(), codigo_programa: codigoPrograma.trim(), objetivo: objetivo.trim(), codigo: codigo.trim(), taller: Number(taller), area_id: areaId, area: "", modules });
    };

    const updateModule = (idx: number, key: string, value: string) => {
        setModules(prev => prev.map((m, i) => i === idx ? { ...m, [key]: value } : m));
    };

    const importModulesExcel = (file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const rows = readExcelRows(e.target?.result);
                const imported: ModuleItem[] = [];
                for (const row of rows) {
                    const cod = cell(row, "Codigo");
                    const nom = cell(row, "Nombre");
                    const ht = cell(row, "Horas Teoricas");
                    const hp = cell(row, "Horas Practicas");
                    if (!cod || !nom || !ht || !hp) continue;
                    let te = (cell(row, "Tipo Evaluacion") || "1").toUpperCase();
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
                            <div className="md:col-span-2">
                                <Label className="mb-1 font-medium text-default-600">Área técnica *</Label>
                                <Select value={areaId} onValueChange={(v) => { setAreaId(v); setErrors(p => { const n = { ...p }; delete n.area_id; return n; }); }}>
                                    <SelectTrigger><SelectValue placeholder={areas.length ? "Seleccionar área" : "Cargando áreas..."} /></SelectTrigger>
                                    <SelectContent>
                                        {areas.map((a) => <SelectItem key={a.id} value={String(a.id)}>{a.nombre}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                {errors.area_id && <p className="text-destructive text-xs mt-1">{errors.area_id}</p>}
                                {/* Nombre del Excel que no se encontró en el catálogo. */}
                                {!areaId && editing?.area && areas.length > 0 && !errors.area_id && (
                                    <p className="text-xs text-muted-foreground mt-1">En el Excel: &quot;{editing.area}&quot; (no está en el catálogo)</p>
                                )}
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
