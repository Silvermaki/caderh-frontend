"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import toast from "react-hot-toast";
import { useSession } from "next-auth/react";
import { Check, ChevronsUpDown, FileText, Loader2, Search, Trash2, Upload, X } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { cn } from "@/lib/utils";

const apiBase = process.env.NEXT_PUBLIC_API_URL;

const STEPS = [
    { key: "personal", label: "Datos Personales" },
    { key: "location", label: "Ubicación y Contacto" },
    { key: "education", label: "Educación y Hogar" },
    { key: "employment", label: "Situación Laboral" },
    { key: "additional", label: "Información Adicional" },
];

interface StudentWizardProps {
    student?: any;
    centroId?: string | number;
    centros?: { id: number; nombre: string }[];
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    reloadList: () => void;
}

export default function StudentWizard({ student, centroId, centros, isOpen, setIsOpen, reloadList }: StudentWizardProps) {
    const { data: session } = useSession() as any;
    const authHeaders: any = { Authorization: `Bearer ${session?.user?.session}` };
    const isEdit = !!student;
    const showCentroSelect = !centroId;

    const [currentStep, setCurrentStep] = useState(0);
    const [submitting, setSubmitting] = useState(false);
    const [loading, setLoading] = useState(false);

    const [centroOpen, setCentroOpen] = useState(false);
    const [centroSearch, setCentroSearch] = useState("");
    const [centrosLocal, setCentrosLocal] = useState<{ id: number; nombre: string }[]>([]);
    const centrosList = (centros?.length ? centros : centrosLocal).map((c) => ({ id: Number(c.id), nombre: String(c.nombre) }));
    const filteredCentros = useMemo(() =>
        centroSearch.trim() ? centrosList.filter((c) => c.nombre.toLowerCase().includes(centroSearch.toLowerCase())) : centrosList,
        [centrosList, centroSearch]
    );

    const [departamentos, setDepartamentos] = useState<any[]>([]);
    const [municipios, setMunicipios] = useState<any[]>([]);
    const [nivelEscolaridades, setNivelEscolaridades] = useState<any[]>([]);
    const [viveOptions, setViveOptions] = useState<{ value: string; label: string }[]>([]);

    const [pendingFile, setPendingFile] = useState<File | null>(null);
    const [existingPdf, setExistingPdf] = useState<string | null>(null);
    const [pdfUploading, setPdfUploading] = useState(false);
    const [pdfDeleting, setPdfDeleting] = useState(false);

    const defaultForm = (): Record<string, any> => ({
        centro_id: centroId ? String(centroId) : "",
        identidad: "", nombres: "", apellidos: "", fecha_nacimiento: "", sexo: "", estado_civil: "",
        departamento_id: "", municipio_id: "", direccion: "", email: "", telefono: "", celular: "",
        facebook: "", twitter: "", instagram: "",
        estudia: 0, nivel_escolaridad_id: "", vive: "", numero_dep: "",
        tiene_hijos: 0, cuantos_hijos: 0, vivienda: "",
        cantidad_viven: 0, cantidad_trabajan_viven: 0, cantidad_notrabajan_viven: 0, ingreso_promedio: 0,
        trabajo_actual: 0, donde_trabaja: "", puesto: "",
        trabajado_ant: 0, tiempo_ant: "", tipo_contrato_ant: "",
        beneficios_empleo: "", beneficios_empleo_otro: "",
        autoempleo: 0, autoempleo_dedicacion: "", autoempleo_otro: "", autoempleo_tiempo: "",
        dias_semana_trabajo: "", horas_dia_trabajo: "", socios: 0, socios_cantidad: 0,
        especial: 0, discapacidad_id: "", riesgo_social: 0, etnia_id: "", interno: 0,
        nombre_r: "", telefono_r: "", datos_r: "", parentesco_r: "", adicional_r: "",
    });

    const [form, setForm] = useState<Record<string, any>>(defaultForm());
    const [errors, setErrors] = useState<Record<string, string>>({});

    const set = (key: string, value: any) => {
        setForm((prev) => ({ ...prev, [key]: value }));
        setErrors((prev) => { const n = { ...prev }; delete n[key]; return n; });
    };

    useEffect(() => {
        if (!isOpen) return;
        setCurrentStep(0);
        setErrors({});
        setPendingFile(null);

        if (isEdit && student?.id && session) {
            setLoading(true);
            fetch(`${apiBase}/api/centros/students/${student.id}`, { headers: authHeaders })
                .then((r) => r.json())
                .then((d) => {
                    const s = d.data ?? {};
                    const f = defaultForm();
                    for (const key of Object.keys(f)) {
                        if (s[key] != null) f[key] = String(s[key]);
                    }
                    for (const numKey of ["estudia", "tiene_hijos", "cuantos_hijos", "cantidad_viven", "cantidad_trabajan_viven",
                        "cantidad_notrabajan_viven", "ingreso_promedio", "trabajo_actual", "trabajado_ant",
                        "autoempleo", "socios", "socios_cantidad", "especial", "riesgo_social", "interno"]) {
                        f[numKey] = Number(s[numKey] ?? 0);
                    }
                    f.centro_id = s.centro_id != null ? String(s.centro_id) : "";
                    f.departamento_id = s.departamento_id != null ? String(s.departamento_id) : "";
                    f.municipio_id = s.municipio_id != null ? String(s.municipio_id) : "";
                    f.nivel_escolaridad_id = s.nivel_escolaridad_id != null ? String(s.nivel_escolaridad_id) : "";
                    setForm(f);
                    setExistingPdf(s.pdf || null);
                })
                .catch(() => toast.error("Error al cargar estudiante"))
                .finally(() => setLoading(false));
        } else {
            setForm(defaultForm());
            setExistingPdf(null);
        }
    }, [isOpen, student?.id, session?.user?.session]);

    useEffect(() => {
        if (!isOpen || !session) return;
        fetch(`${apiBase}/api/centros/departamentos`, { headers: authHeaders }).then((r) => r.json()).then((d) => setDepartamentos(d.data ?? []));
        fetch(`${apiBase}/api/centros/nivel-escolaridades`, { headers: authHeaders }).then((r) => r.json()).then((d) => setNivelEscolaridades(d.data ?? []));
        fetch(`${apiBase}/api/centros/vive-catalogo`, { headers: authHeaders }).then((r) => r.json()).then((d) => setViveOptions(d.data ?? []));
    }, [isOpen, session?.user?.session]);

    useEffect(() => {
        if (!form.departamento_id || !session) { setMunicipios([]); return; }
        fetch(`${apiBase}/api/centros/municipios?departamento_id=${form.departamento_id}`, { headers: authHeaders })
            .then((r) => r.json()).then((d) => setMunicipios(d.data ?? []));
    }, [form.departamento_id, session?.user?.session]);

    useEffect(() => {
        if (!isOpen || !showCentroSelect || centros?.length || !session?.user?.session) return;
        fetch(`${apiBase}/api/centros/centros?all=true`, { headers: authHeaders })
            .then((r) => r.json()).then((d) => setCentrosLocal(d.data ?? [])).catch(() => {});
    }, [isOpen, showCentroSelect, centros?.length, session?.user?.session]);

    const selectedCentro = useMemo(() => centrosList.find((c) => c.id.toString() === form.centro_id), [centrosList, form.centro_id]);

    const validateStep = (step: number): boolean => {
        const e: Record<string, string> = {};
        if (step === 0) {
            if (showCentroSelect && !form.centro_id) e.centro_id = "Requerido";
            if (!form.identidad.trim()) e.identidad = "Requerido";
            if (!form.nombres.trim()) e.nombres = "Requerido";
            if (!form.apellidos.trim()) e.apellidos = "Requerido";
            if (!form.sexo) e.sexo = "Requerido";
            if (!form.estado_civil) e.estado_civil = "Requerido";
        } else if (step === 1) {
            if (!form.departamento_id) e.departamento_id = "Requerido";
            if (!form.municipio_id) e.municipio_id = "Requerido";
        } else if (step === 2) {
            if (!form.vive) e.vive = "Requerido";
            if (!form.numero_dep.toString().trim()) e.numero_dep = "Requerido";
        }
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const goNext = () => { if (validateStep(currentStep)) setCurrentStep((s) => Math.min(s + 1, STEPS.length - 1)); };
    const goBack = () => setCurrentStep((s) => Math.max(s - 1, 0));

    const onDrop = useCallback((accepted: File[]) => { if (accepted[0]) setPendingFile(accepted[0]); }, []);
    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop, maxFiles: 1, maxSize: 10 * 1024 * 1024, disabled: submitting || pdfUploading,
        onDropRejected: (r) => { const err = r[0]?.errors[0]; toast.error(err?.code === "file-too-large" ? "El archivo excede 10MB" : err?.message ?? "Archivo rechazado"); },
    });

    const uploadPdf = async (studentId: number | string) => {
        if (!pendingFile) return;
        setPdfUploading(true);
        try {
            const fd = new FormData(); fd.append("file", pendingFile);
            const res = await fetch(`${apiBase}/api/centros/students/${studentId}/pdf`, { method: "POST", headers: authHeaders, body: fd });
            if (!res.ok) { const d = await res.json(); toast.error(d.message ?? "Error al subir hoja de vida"); }
        } catch { toast.error("Error al subir hoja de vida"); }
        setPdfUploading(false);
    };

    const deletePdf = async () => {
        if (!student?.id) return;
        setPdfDeleting(true);
        try {
            const res = await fetch(`${apiBase}/api/centros/students/${student.id}/pdf`, { method: "DELETE", headers: authHeaders });
            if (res.ok) { setExistingPdf(null); toast.success("Hoja de vida eliminada"); }
            else { const d = await res.json(); toast.error(d.message ?? "Error al eliminar"); }
        } catch { toast.error("Error al eliminar hoja de vida"); }
        setPdfDeleting(false);
    };

    const downloadPdf = async () => {
        if (!student?.id) return;
        try {
            const res = await fetch(`${apiBase}/api/centros/students/${student.id}/pdf`, { headers: authHeaders });
            if (!res.ok) { toast.error("Error al abrir"); return; }
            const blob = await res.blob(); window.open(URL.createObjectURL(blob), "_blank", "noopener,noreferrer");
        } catch { toast.error("Error al abrir"); }
    };

    const onSubmit = async () => {
        if (!validateStep(currentStep)) return;
        setSubmitting(true);
        try {
            const effectiveCentroId = centroId || form.centro_id;
            const useGlobal = !centroId;
            const url = useGlobal ? `${apiBase}/api/centros/students` : `${apiBase}/api/centros/centros/${effectiveCentroId}/estudiantes`;
            const method = isEdit ? "PUT" : "POST";

            const body: any = { ...form, departamento_id: Number(form.departamento_id), municipio_id: Number(form.municipio_id) };
            for (const numKey of ["estudia", "tiene_hijos", "cuantos_hijos", "cantidad_viven", "cantidad_trabajan_viven",
                "cantidad_notrabajan_viven", "ingreso_promedio", "trabajo_actual", "trabajado_ant", "tipo_contrato_ant",
                "autoempleo", "socios", "socios_cantidad", "especial", "riesgo_social", "interno"]) {
                body[numKey] = Number(body[numKey]) || 0;
            }
            if (isEdit) body.id = student.id;
            if (!centroId) body.centro_id = Number(effectiveCentroId);

            const res = await fetch(url, {
                method, headers: { "Content-Type": "application/json", ...authHeaders }, body: JSON.stringify(body),
            });

            if (res.ok) {
                const json = await res.json();
                const newId = isEdit ? student.id : json.id;
                if (pendingFile && newId) await uploadPdf(newId);
                toast.success(isEdit ? "Estudiante actualizado" : "Estudiante creado");
                setIsOpen(false);
                reloadList();
            } else {
                const json = await res.json();
                toast.error(json.message ?? "Error al guardar");
            }
        } catch { toast.error("Error al guardar"); }
        setSubmitting(false);
    };

    const fieldInput = (key: string, label: string, opts?: { required?: boolean; placeholder?: string; type?: string }) => (
        <div>
            <Label className="mb-1 font-medium text-default-600">{label}{opts?.required ? " *" : ""}</Label>
            <Input
                type={opts?.type ?? "text"}
                disabled={submitting}
                value={form[key] ?? ""}
                onChange={(e) => set(key, e.target.value)}
                placeholder={opts?.placeholder ?? label}
            />
            {errors[key] && <p className="text-destructive text-xs mt-1">{errors[key]}</p>}
        </div>
    );

    const fieldSelect = (key: string, label: string, options: { value: string; label: string }[], opts?: { required?: boolean; disabled?: boolean; placeholder?: string }) => (
        <div>
            <Label className="mb-1 font-medium text-default-600">{label}{opts?.required ? " *" : ""}</Label>
            <Select value={form[key] ?? ""} onValueChange={(v) => set(key, v)} disabled={submitting || opts?.disabled}>
                <SelectTrigger><SelectValue placeholder={opts?.placeholder ?? "Seleccionar"} /></SelectTrigger>
                <SelectContent>
                    {options.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
            </Select>
            {errors[key] && <p className="text-destructive text-xs mt-1">{errors[key]}</p>}
        </div>
    );

    const fieldSwitch = (key: string, label: string) => (
        <div className="flex items-center gap-3 py-2">
            <Switch checked={!!form[key]} onCheckedChange={(v) => set(key, v ? 1 : 0)} disabled={submitting} />
            <Label className="text-default-600">{label}</Label>
        </div>
    );

    const renderStep = () => {
        if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

        switch (currentStep) {
            case 0: return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {showCentroSelect && (
                        <div className="md:col-span-2">
                            <Label className="mb-1 font-medium text-default-600">Centro *</Label>
                            <Popover open={centroOpen} onOpenChange={(o) => { setCentroOpen(o); if (!o) setCentroSearch(""); }}>
                                <PopoverTrigger asChild>
                                    <Button type="button" variant="outline" disabled={submitting || isEdit} className="w-full justify-between font-normal">
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
                                                onClick={() => { set("centro_id", String(c.id)); setCentroOpen(false); }}>
                                                {c.nombre}
                                            </button>
                                        ))}
                                    </div>
                                </PopoverContent>
                            </Popover>
                            {errors.centro_id && <p className="text-destructive text-xs mt-1">{errors.centro_id}</p>}
                        </div>
                    )}
                    {fieldInput("identidad", "Identidad", { required: true, placeholder: "Número de identidad" })}
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
            );
            case 1: return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {fieldSelect("departamento_id", "Departamento", departamentos.map((d: any) => ({ value: d.id.toString(), label: d.nombre })), {
                        required: true, placeholder: "Seleccionar departamento",
                    })}
                    {fieldSelect("municipio_id", "Municipio", municipios.map((m: any) => ({ value: m.id.toString(), label: m.nombre })), {
                        required: true, disabled: !form.departamento_id, placeholder: form.departamento_id ? "Seleccionar municipio" : "Seleccione departamento",
                    })}
                    {fieldInput("direccion", "Dirección")}
                    {fieldInput("email", "Email", { placeholder: "correo@ejemplo.com" })}
                    {fieldInput("telefono", "Teléfono")}
                    {fieldInput("celular", "Celular")}
                    {fieldInput("facebook", "Facebook")}
                    {fieldInput("twitter", "Twitter")}
                    {fieldInput("instagram", "Instagram")}
                </div>
            );
            case 2: return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">{fieldSwitch("estudia", "¿Estudia actualmente?")}</div>
                    {fieldSelect("nivel_escolaridad_id", "Nivel de escolaridad", nivelEscolaridades.map((n: any) => ({ value: n.id.toString(), label: n.nombre })))}
                    <div className="md:col-span-2">
                        <Label className="mb-1 font-medium text-default-600">Hoja de vida</Label>
                        {existingPdf && !pendingFile ? (
                            <div className="flex items-center gap-2 mt-1 p-3 border rounded-lg bg-muted/30">
                                <FileText className="h-5 w-5 text-primary shrink-0" />
                                <button type="button" onClick={downloadPdf} className="text-sm text-primary underline truncate">Ver archivo actual</button>
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
                    {fieldInput("numero_dep", "No. de dependientes", { required: true, placeholder: "0" })}
                    <div className="md:col-span-2">{fieldSwitch("tiene_hijos", "¿Tiene hijos?")}</div>
                    {!!form.tiene_hijos && fieldInput("cuantos_hijos", "¿Cuántos hijos?", { type: "number" })}
                    {fieldInput("vivienda", "Tipo de vivienda")}
                    {fieldInput("cantidad_viven", "Cantidad que viven en el hogar", { type: "number" })}
                    {fieldInput("cantidad_trabajan_viven", "Cantidad que trabajan", { type: "number" })}
                    {fieldInput("cantidad_notrabajan_viven", "Cantidad que no trabajan", { type: "number" })}
                    {fieldInput("ingreso_promedio", "Ingreso promedio", { type: "number" })}
                </div>
            );
            case 3: return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">{fieldSwitch("trabajo_actual", "¿Trabaja actualmente?")}</div>
                    {!!form.trabajo_actual && <>
                        {fieldInput("donde_trabaja", "¿Dónde trabaja?")}
                        {fieldInput("puesto", "Puesto")}
                    </>}
                    <div className="md:col-span-2">{fieldSwitch("trabajado_ant", "¿Ha trabajado antes?")}</div>
                    {!!form.trabajado_ant && fieldInput("tiempo_ant", "Tiempo trabajado")}
                    {fieldInput("tipo_contrato_ant", "Tipo de contrato")}
                    {fieldInput("beneficios_empleo", "Beneficios del empleo")}
                    {fieldInput("beneficios_empleo_otro", "Otros beneficios")}
                    <div className="md:col-span-2">{fieldSwitch("autoempleo", "¿Autoempleo?")}</div>
                    {!!form.autoempleo && <>
                        {fieldInput("autoempleo_dedicacion", "Dedicación")}
                        {fieldInput("autoempleo_otro", "Otro autoempleo")}
                        {fieldInput("autoempleo_tiempo", "Tiempo en autoempleo")}
                    </>}
                    {fieldInput("dias_semana_trabajo", "Días por semana que trabaja")}
                    {fieldInput("horas_dia_trabajo", "Horas por día que trabaja")}
                    <div className="md:col-span-2">{fieldSwitch("socios", "¿Tiene socios?")}</div>
                    {!!form.socios && fieldInput("socios_cantidad", "Cantidad de socios", { type: "number" })}
                </div>
            );
            case 4: return (
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
                    <div className="md:col-span-2">
                        {fieldInput("adicional_r", "Información adicional")}
                    </div>
                </div>
            );
            default: return null;
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => { if (!submitting && !pdfUploading) setIsOpen(open); }}>
            <DialogContent size="2xl" className="max-h-[90vh] overflow-y-auto">
                <DialogTitle>{isEdit ? "Editar Estudiante" : "Crear Estudiante"}</DialogTitle>

                <div className="flex items-center justify-between gap-1 mb-6 mt-2 px-2">
                    {STEPS.map((step, i) => (
                        <div key={step.key} className="flex items-center flex-1">
                            <button type="button" onClick={() => { if (i < currentStep) setCurrentStep(i); }}
                                className={cn("flex flex-col items-center gap-1 w-full transition-colors",
                                    i <= currentStep ? "text-primary" : "text-muted-foreground",
                                    i < currentStep && "cursor-pointer hover:text-primary/80")}>
                                <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors",
                                    i < currentStep ? "bg-primary border-primary text-primary-foreground" :
                                    i === currentStep ? "border-primary text-primary" : "border-muted-foreground/30 text-muted-foreground")}>
                                    {i < currentStep ? <Check className="h-4 w-4" /> : i + 1}
                                </div>
                                <span className="text-[10px] font-medium leading-tight text-center hidden sm:block">{step.label}</span>
                            </button>
                            {i < STEPS.length - 1 && (
                                <div className={cn("h-0.5 flex-1 mx-1 rounded-full transition-colors", i < currentStep ? "bg-primary" : "bg-muted-foreground/20")} />
                            )}
                        </div>
                    ))}
                </div>

                {renderStep()}

                <DialogFooter className="mt-6">
                    {currentStep > 0 && (
                        <Button type="button" variant="outline" onClick={goBack} disabled={submitting}>Anterior</Button>
                    )}
                    {currentStep < STEPS.length - 1 ? (
                        <Button type="button" onClick={goNext} disabled={submitting}>Siguiente</Button>
                    ) : (
                        <Button type="button" onClick={onSubmit} disabled={submitting || pdfUploading}>
                            {(submitting || pdfUploading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Guardar
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
