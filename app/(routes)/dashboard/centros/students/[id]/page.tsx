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
import { Switch } from "@/components/ui/switch";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import SkeletonTable from "@/components/skeleton-table";
import toast from "react-hot-toast";
import { useSession } from "next-auth/react";
import {
    Building2, Phone, Mail, Pencil, Trash2, User, FileText, Loader2, Upload, X, CreditCard,
} from "lucide-react";
import { useDropzone } from "react-dropzone";
import { cn } from "@/lib/utils";

const apiBase = process.env.NEXT_PUBLIC_API_URL;

const TAB_CLASS = "rounded-none border-b-2 border-transparent bg-transparent px-0 pb-3 -mb-px shadow-none data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none";

const TABS = [
    { key: "personal", label: "Datos Personales" },
    { key: "location", label: "Ubicación y Contacto" },
    { key: "education", label: "Educación y Hogar" },
    { key: "employment", label: "Situación Laboral" },
    { key: "additional", label: "Información Adicional" },
];

const NUM_KEYS = ["estudia", "tiene_hijos", "cuantos_hijos", "cantidad_viven", "cantidad_trabajan_viven",
    "cantidad_notrabajan_viven", "ingreso_promedio", "trabajo_actual", "trabajado_ant",
    "autoempleo", "socios", "socios_cantidad", "especial", "riesgo_social", "interno"];

export default function StudentDetailPage() {
    const params = useParams();
    const router = useRouter();
    const studentId = params?.id as string;
    const { data: session } = useSession() as any;
    const userRole = session?.user?.role;
    const isSupervisor = userRole === "ADMIN" || userRole === "MANAGER";
    const authHeaders: any = { Authorization: `Bearer ${session?.user?.session}` };

    const [student, setStudent] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [editingTab, setEditingTab] = useState<string | null>(null);
    const [form, setForm] = useState<Record<string, any>>({});
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [saving, setSaving] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const [departamentos, setDepartamentos] = useState<any[]>([]);
    const [municipios, setMunicipios] = useState<any[]>([]);
    const [nivelEscolaridades, setNivelEscolaridades] = useState<any[]>([]);
    const [viveOptions, setViveOptions] = useState<{ value: string; label: string }[]>([]);

    const [pendingFile, setPendingFile] = useState<File | null>(null);
    const [pdfUploading, setPdfUploading] = useState(false);
    const [pdfDeleting, setPdfDeleting] = useState(false);

    const fetchStudent = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${apiBase}/api/centros/students/${studentId}`, { headers: authHeaders });
            if (res.ok) { const d = await res.json(); setStudent(d.data ?? null); }
            else toast.error("Error al cargar estudiante");
        } catch { toast.error("Error al cargar estudiante"); }
        setLoading(false);
    };

    useEffect(() => { if (session && studentId) fetchStudent(); }, [session, studentId]);

    const startEditing = (tabKey: string) => {
        if (!student) return;
        const f: Record<string, any> = {};
        const allKeys = [
            "identidad", "nombres", "apellidos", "fecha_nacimiento", "sexo", "estado_civil",
            "departamento_id", "municipio_id", "direccion", "email", "telefono", "celular",
            "facebook", "twitter", "instagram",
            "estudia", "nivel_escolaridad_id", "vive", "numero_dep",
            "tiene_hijos", "cuantos_hijos", "vivienda",
            "cantidad_viven", "cantidad_trabajan_viven", "cantidad_notrabajan_viven", "ingreso_promedio",
            "trabajo_actual", "donde_trabaja", "puesto",
            "trabajado_ant", "tiempo_ant", "tipo_contrato_ant",
            "beneficios_empleo", "beneficios_empleo_otro",
            "autoempleo", "autoempleo_dedicacion", "autoempleo_otro", "autoempleo_tiempo",
            "dias_semana_trabajo", "horas_dia_trabajo", "socios", "socios_cantidad",
            "especial", "discapacidad_id", "riesgo_social", "etnia_id", "interno",
            "nombre_r", "telefono_r", "datos_r", "parentesco_r", "adicional_r",
        ];
        for (const key of allKeys) {
            f[key] = NUM_KEYS.includes(key) ? Number(student[key] ?? 0) : (student[key] != null ? String(student[key]) : "");
        }
        f.departamento_id = student.departamento_id != null ? String(student.departamento_id) : "";
        f.municipio_id = student.municipio_id != null ? String(student.municipio_id) : "";
        f.nivel_escolaridad_id = student.nivel_escolaridad_id != null ? String(student.nivel_escolaridad_id) : "";
        setForm(f);
        setErrors({});
        setPendingFile(null);
        setEditingTab(tabKey);

        if (!departamentos.length) {
            fetch(`${apiBase}/api/centros/departamentos`, { headers: authHeaders }).then(r => r.json()).then(d => setDepartamentos(d.data ?? []));
        }
        if (!nivelEscolaridades.length) {
            fetch(`${apiBase}/api/centros/nivel-escolaridades`, { headers: authHeaders }).then(r => r.json()).then(d => setNivelEscolaridades(d.data ?? []));
        }
        if (!viveOptions.length) {
            fetch(`${apiBase}/api/centros/vive-catalogo`, { headers: authHeaders }).then(r => r.json()).then(d => setViveOptions(d.data ?? []));
        }
    };

    useEffect(() => {
        if (!form.departamento_id || !session) { setMunicipios([]); return; }
        fetch(`${apiBase}/api/centros/municipios?departamento_id=${form.departamento_id}`, { headers: authHeaders })
            .then(r => r.json()).then(d => setMunicipios(d.data ?? []));
    }, [form.departamento_id, session?.user?.session]);

    const set = (key: string, value: any) => {
        setForm(prev => ({ ...prev, [key]: value }));
        setErrors(prev => { const n = { ...prev }; delete n[key]; return n; });
    };

    const cancelEditing = () => { setEditingTab(null); setErrors({}); setPendingFile(null); };

    const saveTab = async () => {
        const e: Record<string, string> = {};
        if (editingTab === "personal") {
            if (!form.identidad?.trim()) e.identidad = "Requerido";
            if (!form.nombres?.trim()) e.nombres = "Requerido";
            if (!form.apellidos?.trim()) e.apellidos = "Requerido";
            if (!form.sexo) e.sexo = "Requerido";
            if (!form.estado_civil) e.estado_civil = "Requerido";
        } else if (editingTab === "location") {
            if (!form.departamento_id) e.departamento_id = "Requerido";
            if (!form.municipio_id) e.municipio_id = "Requerido";
        } else if (editingTab === "education") {
            if (!form.vive) e.vive = "Requerido";
            if (!form.numero_dep?.toString().trim()) e.numero_dep = "Requerido";
        }
        setErrors(e);
        if (Object.keys(e).length > 0) return;

        setSaving(true);
        try {
            const body: any = { id: student.id, ...form, departamento_id: Number(form.departamento_id), municipio_id: Number(form.municipio_id) };
            for (const k of NUM_KEYS) body[k] = Number(body[k]) || 0;
            body.tipo_contrato_ant = Number(body.tipo_contrato_ant) || 0;

            const res = await fetch(`${apiBase}/api/centros/students`, {
                method: "PUT",
                headers: { "Content-Type": "application/json", ...authHeaders },
                body: JSON.stringify(body),
            });

            if (res.ok) {
                if (pendingFile) {
                    setPdfUploading(true);
                    const fd = new FormData(); fd.append("file", pendingFile);
                    await fetch(`${apiBase}/api/centros/students/${student.id}/pdf`, { method: "POST", headers: authHeaders, body: fd });
                    setPdfUploading(false);
                }
                toast.success("Información guardada");
                setEditingTab(null);
                fetchStudent();
            } else {
                const json = await res.json();
                toast.error(json.message ?? "Error al guardar");
            }
        } catch { toast.error("Error al guardar"); }
        setSaving(false);
    };

    const deleteStudent = async () => {
        setDeleting(true);
        try {
            const res = await fetch(`${apiBase}/api/centros/students/${studentId}`, { method: "DELETE", headers: authHeaders });
            if (res.ok) { toast.success("Estudiante eliminado"); router.push("/dashboard/centros/students"); }
            else { const d = await res.json(); toast.error(d.message ?? "Error al eliminar"); }
        } catch { toast.error("Error al eliminar"); }
        setDeleting(false);
    };

    const openPdf = async () => {
        try {
            const res = await fetch(`${apiBase}/api/centros/students/${studentId}/pdf`, { headers: authHeaders });
            if (!res.ok) { toast.error("Error al abrir"); return; }
            const blob = await res.blob();
            window.open(URL.createObjectURL(blob), "_blank", "noopener,noreferrer");
        } catch { toast.error("Error al abrir"); }
    };

    const deletePdf = async () => {
        setPdfDeleting(true);
        try {
            const res = await fetch(`${apiBase}/api/centros/students/${studentId}/pdf`, { method: "DELETE", headers: authHeaders });
            if (res.ok) { toast.success("Hoja de vida eliminada"); fetchStudent(); }
            else { const d = await res.json(); toast.error(d.message ?? "Error al eliminar"); }
        } catch { toast.error("Error al eliminar"); }
        setPdfDeleting(false);
    };

    const onDrop = useCallback((accepted: File[]) => { if (accepted[0]) setPendingFile(accepted[0]); }, []);
    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop, maxFiles: 1, maxSize: 10 * 1024 * 1024, disabled: saving || pdfUploading,
        onDropRejected: (r) => { const err = r[0]?.errors[0]; toast.error(err?.code === "file-too-large" ? "El archivo excede 10MB" : err?.message ?? "Archivo rechazado"); },
    });

    const fieldView = (label: string, value: any) => (
        <div>
            <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
            <p className="text-sm text-foreground">{value || "-"}</p>
        </div>
    );

    const boolView = (label: string, value: any) => (
        <div>
            <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
            <p className="text-sm text-foreground">{Number(value) ? "Sí" : "No"}</p>
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
            <Select value={form[key] ?? ""} onValueChange={(v) => set(key, v)} disabled={saving || opts?.disabled}>
                <SelectTrigger><SelectValue placeholder={opts?.placeholder ?? "Seleccionar"} /></SelectTrigger>
                <SelectContent>{options.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
            </Select>
            {errors[key] && <p className="text-destructive text-xs mt-1">{errors[key]}</p>}
        </div>
    );

    const fieldSwitch = (key: string, label: string) => (
        <div className="flex items-center gap-3 py-2">
            <Switch checked={!!form[key]} onCheckedChange={(v) => set(key, v ? 1 : 0)} disabled={saving} />
            <Label className="text-default-600">{label}</Label>
        </div>
    );

    const editButton = (tabKey: string) => isSupervisor && editingTab !== tabKey && (
        <Button size="sm" variant="outline" onClick={() => startEditing(tabKey)}><Pencil className="h-3.5 w-3.5 mr-1.5" />Editar</Button>
    );

    const saveButtons = () => (
        <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={cancelEditing} disabled={saving}>Cancelar</Button>
            <Button size="sm" onClick={saveTab} disabled={saving || pdfUploading}>
                {(saving || pdfUploading) && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}Guardar
            </Button>
        </div>
    );

    if (loading) {
        return (
            <div className="mb-4">
                <Breadcrumbs>
                    <BreadcrumbItem>Plataforma</BreadcrumbItem>
                    <BreadcrumbItem>Centros</BreadcrumbItem>
                    <BreadcrumbItem asChild><Link href="/dashboard/centros/students">Estudiantes</Link></BreadcrumbItem>
                    <BreadcrumbItem className="text-primary">Perfil</BreadcrumbItem>
                </Breadcrumbs>
                <div className="mt-5"><SkeletonTable /></div>
            </div>
        );
    }

    if (!student) {
        return (
            <div className="mb-4">
                <Breadcrumbs>
                    <BreadcrumbItem>Plataforma</BreadcrumbItem>
                    <BreadcrumbItem>Centros</BreadcrumbItem>
                    <BreadcrumbItem asChild><Link href="/dashboard/centros/students">Estudiantes</Link></BreadcrumbItem>
                    <BreadcrumbItem className="text-primary">Perfil</BreadcrumbItem>
                </Breadcrumbs>
                <div className="mt-5 py-12 text-center text-muted-foreground">Estudiante no encontrado.</div>
            </div>
        );
    }

    const s = student;
    const fullName = [s.nombres, s.apellidos].filter(Boolean).join(" ");

    return (
        <div className="mb-4">
            <Breadcrumbs>
                <BreadcrumbItem>Plataforma</BreadcrumbItem>
                <BreadcrumbItem>Centros</BreadcrumbItem>
                <BreadcrumbItem asChild><Link href="/dashboard/centros/students">Estudiantes</Link></BreadcrumbItem>
                <BreadcrumbItem className="text-primary">{fullName}</BreadcrumbItem>
            </Breadcrumbs>

            {/* Header */}
            <Card className="mt-5">
                <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4">
                            <div className="rounded-full bg-primary/10 p-3">
                                <User className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <h2 className="text-lg font-semibold">{fullName}</h2>
                                    <Badge variant="secondary">{s.sexo === "M" ? "Masculino" : s.sexo === "F" ? "Femenino" : s.sexo}</Badge>
                                </div>
                                <div className="flex flex-wrap gap-x-5 gap-y-1 mt-2 text-sm text-muted-foreground">
                                    {s.identidad && <span className="flex items-center gap-1.5"><CreditCard className="h-4 w-4" />{s.identidad}</span>}
                                    {s.centro_nombre && <span className="flex items-center gap-1.5"><Building2 className="h-4 w-4" />{s.centro_nombre}</span>}
                                    {(s.celular || s.telefono) && <span className="flex items-center gap-1.5"><Phone className="h-4 w-4" />{s.celular || s.telefono}</span>}
                                    {s.email && <span className="flex items-center gap-1.5"><Mail className="h-4 w-4" />{s.email}</span>}
                                </div>
                            </div>
                        </div>
                        {isSupervisor && (
                            <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}>
                                <Trash2 className="h-4 w-4 mr-1.5" />Eliminar
                            </Button>
                        )}
                    </div>
                    {/* Reserved for future metrics */}
                </CardContent>
            </Card>

            {/* Tabs */}
            <Card className="mt-4">
                <Tabs defaultValue="personal" className="w-full">
                    <TabsList className="w-full justify-start gap-8 border-b border-default-200 rounded-none bg-transparent p-0 h-auto min-h-0 px-6 pt-4 pb-0">
                        {TABS.map((t) => <TabsTrigger key={t.key} value={t.key} className={TAB_CLASS}>{t.label}</TabsTrigger>)}
                    </TabsList>

                    {/* Tab: Datos Personales */}
                    <TabsContent value="personal" className="mt-0 px-6 pt-6 pb-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-base font-semibold">Datos Personales</h3>
                            {editingTab === "personal" ? saveButtons() : editButton("personal")}
                        </div>
                        {editingTab === "personal" ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {fieldInput("identidad", "Identidad", { required: true })}
                                {fieldInput("fecha_nacimiento", "Fecha de nacimiento", { placeholder: "DD/MM/AAAA" })}
                                {fieldInput("nombres", "Nombres", { required: true })}
                                {fieldInput("apellidos", "Apellidos", { required: true })}
                                {fieldSelect("sexo", "Sexo", [{ value: "M", label: "Masculino" }, { value: "F", label: "Femenino" }], { required: true })}
                                {fieldSelect("estado_civil", "Estado civil", [
                                    { value: "Soltero(a)", label: "Soltero(a)" }, { value: "Casado(a)", label: "Casado(a)" },
                                    { value: "Divorciado(a)", label: "Divorciado(a)" }, { value: "Viudo(a)", label: "Viudo(a)" },
                                    { value: "Unión libre", label: "Unión libre" },
                                ], { required: true })}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-4">
                                {fieldView("Identidad", s.identidad)}
                                {fieldView("Nombres", s.nombres)}
                                {fieldView("Apellidos", s.apellidos)}
                                {fieldView("Fecha de nacimiento", s.fecha_nacimiento)}
                                {fieldView("Sexo", s.sexo === "M" ? "Masculino" : s.sexo === "F" ? "Femenino" : s.sexo)}
                                {fieldView("Estado civil", s.estado_civil)}
                            </div>
                        )}
                    </TabsContent>

                    {/* Tab: Ubicacion y Contacto */}
                    <TabsContent value="location" className="mt-0 px-6 pt-6 pb-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-base font-semibold">Ubicación y Contacto</h3>
                            {editingTab === "location" ? saveButtons() : editButton("location")}
                        </div>
                        {editingTab === "location" ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {fieldSelect("departamento_id", "Departamento", departamentos.map((d: any) => ({ value: d.id.toString(), label: d.nombre })), { required: true })}
                                {fieldSelect("municipio_id", "Municipio", municipios.map((m: any) => ({ value: m.id.toString(), label: m.nombre })), { required: true, disabled: !form.departamento_id })}
                                {fieldInput("direccion", "Dirección")}
                                {fieldInput("email", "Email")}
                                {fieldInput("telefono", "Teléfono")}
                                {fieldInput("celular", "Celular")}
                                {fieldInput("facebook", "Facebook")}
                                {fieldInput("twitter", "Twitter")}
                                {fieldInput("instagram", "Instagram")}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-4">
                                {fieldView("Departamento", s.departamento_nombre)}
                                {fieldView("Municipio", s.municipio_nombre)}
                                {fieldView("Dirección", s.direccion)}
                                {fieldView("Email", s.email)}
                                {fieldView("Teléfono", s.telefono)}
                                {fieldView("Celular", s.celular)}
                                {fieldView("Facebook", s.facebook)}
                                {fieldView("Twitter", s.twitter)}
                                {fieldView("Instagram", s.instagram)}
                            </div>
                        )}
                    </TabsContent>

                    {/* Tab: Educacion y Hogar */}
                    <TabsContent value="education" className="mt-0 px-6 pt-6 pb-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-base font-semibold">Educación y Hogar</h3>
                            {editingTab === "education" ? saveButtons() : editButton("education")}
                        </div>
                        {editingTab === "education" ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">{fieldSwitch("estudia", "¿Estudia actualmente?")}</div>
                                {fieldSelect("nivel_escolaridad_id", "Nivel de escolaridad", nivelEscolaridades.map((n: any) => ({ value: n.id.toString(), label: n.nombre })))}
                                <div className="md:col-span-2">
                                    <Label className="mb-1 font-medium text-default-600">Hoja de vida</Label>
                                    {(s.pdf && !pendingFile) ? (
                                        <div className="flex items-center gap-2 mt-1 p-3 border rounded-lg bg-muted/30">
                                            <FileText className="h-5 w-5 text-primary shrink-0" />
                                            <button type="button" onClick={openPdf} className="text-sm text-primary underline truncate">Ver archivo actual</button>
                                            <Button type="button" variant="ghost" size="icon" className="ml-auto text-destructive shrink-0" onClick={deletePdf} disabled={pdfDeleting}>
                                                {pdfDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                            </Button>
                                        </div>
                                    ) : pendingFile ? (
                                        <div className="flex items-center gap-2 mt-1 p-3 border rounded-lg bg-muted/30">
                                            <FileText className="h-5 w-5 text-primary shrink-0" />
                                            <span className="text-sm truncate">{pendingFile.name}</span>
                                            <Button type="button" variant="ghost" size="icon" className="ml-auto shrink-0" onClick={() => setPendingFile(null)}><X className="h-4 w-4" /></Button>
                                        </div>
                                    ) : (
                                        <div {...getRootProps()} className={cn("mt-1 border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
                                            isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/30 hover:border-primary/50")}>
                                            <input {...getInputProps()} />
                                            <Upload className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
                                            <p className="text-sm text-muted-foreground">{isDragActive ? "Suelta el archivo aquí" : "Arrastra un archivo o haz clic para subir"}</p>
                                            <p className="text-xs text-muted-foreground mt-1">pdf, docx, xlsx, jpg, png · Máx. 10MB</p>
                                        </div>
                                    )}
                                </div>
                                {fieldSelect("vive", "¿Con quién vive?", viveOptions, { required: true })}
                                {fieldInput("numero_dep", "No. de dependientes", { required: true })}
                                <div className="md:col-span-2">{fieldSwitch("tiene_hijos", "¿Tiene hijos?")}</div>
                                {!!form.tiene_hijos && fieldInput("cuantos_hijos", "¿Cuántos hijos?", { type: "number" })}
                                {fieldInput("vivienda", "Tipo de vivienda")}
                                {fieldInput("cantidad_viven", "Cantidad que viven en el hogar", { type: "number" })}
                                {fieldInput("cantidad_trabajan_viven", "Cantidad que trabajan", { type: "number" })}
                                {fieldInput("cantidad_notrabajan_viven", "Cantidad que no trabajan", { type: "number" })}
                                {fieldInput("ingreso_promedio", "Ingreso promedio", { type: "number" })}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-4">
                                {boolView("¿Estudia actualmente?", s.estudia)}
                                {fieldView("Nivel de escolaridad", s.nivel_escolaridad_nombre)}
                                <div>
                                    <p className="text-xs text-muted-foreground mb-0.5">Hoja de vida</p>
                                    {s.pdf ? (
                                        <Button variant="ghost" size="sm" className="h-8 bg-transparent text-primary hover:bg-primary/80 hover:text-primary-foreground rounded-md px-3 font-semibold -ml-3"
                                            onClick={openPdf}>Ver</Button>
                                    ) : <p className="text-sm text-foreground">-</p>}
                                </div>
                                {fieldView("¿Con quién vive?", s.vive)}
                                {fieldView("No. de dependientes", s.numero_dep)}
                                {boolView("¿Tiene hijos?", s.tiene_hijos)}
                                {Number(s.tiene_hijos) ? fieldView("¿Cuántos hijos?", s.cuantos_hijos) : null}
                                {fieldView("Tipo de vivienda", s.vivienda)}
                                {fieldView("Cantidad que viven en el hogar", s.cantidad_viven)}
                                {fieldView("Cantidad que trabajan", s.cantidad_trabajan_viven)}
                                {fieldView("Cantidad que no trabajan", s.cantidad_notrabajan_viven)}
                                {fieldView("Ingreso promedio", s.ingreso_promedio)}
                            </div>
                        )}
                    </TabsContent>

                    {/* Tab: Situacion Laboral */}
                    <TabsContent value="employment" className="mt-0 px-6 pt-6 pb-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-base font-semibold">Situación Laboral</h3>
                            {editingTab === "employment" ? saveButtons() : editButton("employment")}
                        </div>
                        {editingTab === "employment" ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">{fieldSwitch("trabajo_actual", "¿Trabaja actualmente?")}</div>
                                {!!form.trabajo_actual && <>{fieldInput("donde_trabaja", "¿Dónde trabaja?")}{fieldInput("puesto", "Puesto")}</>}
                                <div className="md:col-span-2">{fieldSwitch("trabajado_ant", "¿Ha trabajado antes?")}</div>
                                {!!form.trabajado_ant && fieldInput("tiempo_ant", "Tiempo trabajado")}
                                {fieldInput("tipo_contrato_ant", "Tipo de contrato")}
                                {fieldInput("beneficios_empleo", "Beneficios del empleo")}
                                {fieldInput("beneficios_empleo_otro", "Otros beneficios")}
                                <div className="md:col-span-2">{fieldSwitch("autoempleo", "¿Autoempleo?")}</div>
                                {!!form.autoempleo && <>{fieldInput("autoempleo_dedicacion", "Dedicación")}{fieldInput("autoempleo_otro", "Otro autoempleo")}{fieldInput("autoempleo_tiempo", "Tiempo en autoempleo")}</>}
                                {fieldInput("dias_semana_trabajo", "Días por semana que trabaja")}
                                {fieldInput("horas_dia_trabajo", "Horas por día que trabaja")}
                                <div className="md:col-span-2">{fieldSwitch("socios", "¿Tiene socios?")}</div>
                                {!!form.socios && fieldInput("socios_cantidad", "Cantidad de socios", { type: "number" })}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-4">
                                {boolView("¿Trabaja actualmente?", s.trabajo_actual)}
                                {Number(s.trabajo_actual) ? <>{fieldView("¿Dónde trabaja?", s.donde_trabaja)}{fieldView("Puesto", s.puesto)}</> : null}
                                {boolView("¿Ha trabajado antes?", s.trabajado_ant)}
                                {Number(s.trabajado_ant) ? fieldView("Tiempo trabajado", s.tiempo_ant) : null}
                                {fieldView("Tipo de contrato", s.tipo_contrato_ant)}
                                {fieldView("Beneficios del empleo", s.beneficios_empleo)}
                                {fieldView("Otros beneficios", s.beneficios_empleo_otro)}
                                {boolView("¿Autoempleo?", s.autoempleo)}
                                {Number(s.autoempleo) ? <>{fieldView("Dedicación", s.autoempleo_dedicacion)}{fieldView("Otro autoempleo", s.autoempleo_otro)}{fieldView("Tiempo en autoempleo", s.autoempleo_tiempo)}</> : null}
                                {fieldView("Días por semana", s.dias_semana_trabajo)}
                                {fieldView("Horas por día", s.horas_dia_trabajo)}
                                {boolView("¿Tiene socios?", s.socios)}
                                {Number(s.socios) ? fieldView("Cantidad de socios", s.socios_cantidad) : null}
                            </div>
                        )}
                    </TabsContent>

                    {/* Tab: Informacion Adicional */}
                    <TabsContent value="additional" className="mt-0 px-6 pt-6 pb-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-base font-semibold">Información Adicional</h3>
                            {editingTab === "additional" ? saveButtons() : editButton("additional")}
                        </div>
                        {editingTab === "additional" ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">{fieldSwitch("especial", "¿Necesidades especiales?")}</div>
                                {!!form.especial && fieldInput("discapacidad_id", "Discapacidad")}
                                <div className="md:col-span-2">{fieldSwitch("riesgo_social", "¿Riesgo social?")}</div>
                                {fieldInput("etnia_id", "Etnia")}
                                <div className="md:col-span-2">{fieldSwitch("interno", "¿Interno?")}</div>
                                <div className="md:col-span-2 mt-4 border-t pt-4">
                                    <h4 className="text-sm font-semibold text-foreground mb-3">Contacto de referencia</h4>
                                </div>
                                {fieldInput("nombre_r", "Nombre")}
                                {fieldInput("telefono_r", "Teléfono")}
                                {fieldInput("datos_r", "Datos adicionales")}
                                {fieldInput("parentesco_r", "Parentesco")}
                                <div className="md:col-span-2">{fieldInput("adicional_r", "Información adicional")}</div>
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-4">
                                    {boolView("¿Necesidades especiales?", s.especial)}
                                    {Number(s.especial) ? fieldView("Discapacidad", s.discapacidad_id) : null}
                                    {boolView("¿Riesgo social?", s.riesgo_social)}
                                    {fieldView("Etnia", s.etnia_id)}
                                    {boolView("¿Interno?", s.interno)}
                                </div>
                                <div className="mt-6 border-t pt-4">
                                    <h4 className="text-sm font-semibold text-foreground mb-3">Contacto de referencia</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-4">
                                        {fieldView("Nombre", s.nombre_r)}
                                        {fieldView("Teléfono", s.telefono_r)}
                                        {fieldView("Datos adicionales", s.datos_r)}
                                        {fieldView("Parentesco", s.parentesco_r)}
                                        {fieldView("Información adicional", s.adicional_r)}
                                    </div>
                                </div>
                            </>
                        )}
                    </TabsContent>
                </Tabs>
            </Card>

            {/* Delete dialog */}
            <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar estudiante?</AlertDialogTitle>
                        <AlertDialogDescription>Se eliminará a &quot;{fullName}&quot;. Esta acción no se puede deshacer.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={deleteStudent} disabled={deleting} color="destructive">
                            {deleting ? "Eliminando..." : "Eliminar"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
