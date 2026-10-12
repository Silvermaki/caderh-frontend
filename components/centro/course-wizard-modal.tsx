"use client";

import React, { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Stepper, Step, StepLabel } from "@/components/ui/steps";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import { Loader2, PlusCircle, Trash2, Upload, Download, Search, ChevronsUpDown } from "lucide-react";
import * as XLSX from "xlsx";
import { useDropzone } from "react-dropzone";
import { cn } from "@/lib/utils";

const apiBase = process.env.NEXT_PUBLIC_API_PROXY;

// ─── Standalone ExcelDropzone ───
const ExcelDropzone = ({
    disabled,
    onFile,
    importing,
}: {
    disabled: boolean;
    onFile: (file: File) => void;
    importing: boolean;
}) => {
    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        accept: { "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"] },
        maxFiles: 1,
        maxSize: 10 * 1024 * 1024,
        disabled,
        onDrop: (accepted) => { if (accepted[0]) onFile(accepted[0]); },
        onDropRejected: () => toast.error("Solo archivos .xlsx de hasta 10MB"),
    });
    return (
        <div
            {...getRootProps()}
            className={cn(
                "border-2 border-dashed rounded-lg py-6 px-4 text-center cursor-pointer transition-colors text-sm",
                isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/30 hover:border-primary/50"
            )}
        >
            <input {...getInputProps()} />
            {importing ? (
                <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span>Importando...</span>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                    <Upload className="h-6 w-6" />
                    <span>{isDragActive ? "Suelta el archivo aquí" : "Arrastra un Excel o haz clic para importar módulos"}</span>
                    <span className="text-xs">Solo archivos .xlsx</span>
                </div>
            )}
        </div>
    );
};

interface ModuleItem {
    codigo: string;
    nombre: string;
    horas_teoricas: string;
    horas_practicas: string;
    tipo_evaluacion: string;
    observaciones: string;
}

const emptyModule = (): ModuleItem => ({
    codigo: "", nombre: "", horas_teoricas: "", horas_practicas: "",
    tipo_evaluacion: "1", observaciones: "",
});

// Módulo de un curso existente → fila editable del paso 2
const toModuleItem = (m: any): ModuleItem => ({
    codigo: m.codigo != null ? String(m.codigo) : "",
    nombre: m.nombre ?? "",
    horas_teoricas: m.horas_teoricas != null ? String(m.horas_teoricas) : "",
    horas_practicas: m.horas_practicas != null ? String(m.horas_practicas) : "",
    tipo_evaluacion: ["1", "2", "3"].includes(String(m.tipo_evaluacion)) ? String(m.tipo_evaluacion) : "1",
    observaciones: m.observaciones ?? "",
});

// "Duplicar curso": datos del curso origen (el código no se copia)
export interface CourseWizardInitialData {
    centro_id?: number | string | null;
    nombre?: string | null;
    codigo_programa?: string | null;
    taller?: number | string | null;
    objetivo?: string | null;
    area_id?: number | string | null;
    modules?: any[];
}

interface CourseWizardModalProps {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    reloadList: () => void;
    centros: { id: number; nombre: string }[];
    initialData?: CourseWizardInitialData | null;
    onCreated?: (courseId: number) => void;
}

export default function CourseWizardModal({ isOpen, setIsOpen, reloadList, centros, initialData, onCreated }: CourseWizardModalProps) {
    const { data: session } = useSession() as any;
    const authHeaders: any = { Authorization: `Bearer ${session?.user?.session}` };

    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Step 1 - General info (stored locally, no API call)
    const [centroId, setCentroId] = useState("");
    const [centroOpen, setCentroOpen] = useState(false);
    const [centroSearch, setCentroSearch] = useState("");
    const [codigo, setCodigo] = useState("");
    const [nombre, setNombre] = useState("");
    const [codigoPrograma, setCodigoPrograma] = useState("");
    const [taller, setTaller] = useState("1");
    const [objetivo, setObjetivo] = useState("");
    const [areaId, setAreaId] = useState("");
    const [areas, setAreas] = useState<{ id: number; nombre: string }[]>([]);
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    // true cuando el usuario escribió el código: ya no se reemplaza por el sugerido
    const codigoManualRef = useRef(false);

    // Step 2 - Modules (stored locally, no API call until final submit)
    const [moduleItems, setModuleItems] = useState<ModuleItem[]>([emptyModule()]);
    const [excelImporting, setExcelImporting] = useState(false);
    const modulesEndRef = useRef<HTMLDivElement>(null);

    const selectedCentro = centros.find((c) => c.id.toString() === centroId);
    const filteredCentros = centroSearch.trim()
        ? centros.filter((c) => c.nombre.toLowerCase().includes(centroSearch.toLowerCase()))
        : centros;

    const fetchAreas = async () => {
        try {
            const res = await fetch(`${apiBase}/centros/areas?all=true`, { headers: authHeaders });
            if (res.ok) {
                const d = await res.json();
                const list: { id: number; nombre: string }[] = d.data ?? [];
                setAreas(list);
                // Área del curso origen ya inactiva: se pide elegir otra
                setAreaId((prev) => (prev && !list.some((a) => a.id.toString() === prev) ? "" : prev));
            }
        } catch { /* silent */ }
    };

    // Reset on close/open (con initialData = duplicar: todo editable, sin código)
    useEffect(() => {
        if (isOpen) {
            setStep(1);
            setCentroId(initialData?.centro_id != null ? String(initialData.centro_id) : "");
            setCodigo("");
            codigoManualRef.current = false;
            setNombre(initialData?.nombre ? `${initialData.nombre} (copia)` : "");
            setCodigoPrograma(initialData?.codigo_programa ?? "");
            setTaller(initialData?.taller != null ? String(initialData.taller) : "1");
            setObjetivo(initialData?.objetivo ?? "");
            setAreaId(initialData?.area_id != null ? String(initialData.area_id) : "");
            setFormErrors({});
            setModuleItems(initialData?.modules?.length ? initialData.modules.map(toModuleItem) : [emptyModule()]);
            fetchAreas();
        }
    }, [isOpen]);

    // Código sugerido (menor libre del centro): se vuelve a pedir al cambiar
    // de centro y solo se aplica mientras el usuario no haya escrito uno.
    useEffect(() => {
        if (!isOpen || !centroId || !session) return;
        let cancelado = false;
        (async () => {
            try {
                const res = await fetch(`${apiBase}/centros/centros/${centroId}/cursos/next-code`, { headers: authHeaders });
                if (!res.ok) return;
                const d = await res.json();
                if (!cancelado && !codigoManualRef.current && d.data?.codigo != null) setCodigo(String(d.data.codigo));
            } catch { /* silent */ }
        })();
        return () => { cancelado = true; };
    }, [isOpen, centroId, session?.user?.session]);

    // ─── Step 1: local validation only, advance to step 2 ───
    const onStep1Next = () => {
        const errs: Record<string, string> = {};
        if (!centroId) errs.centro_id = "Selecciona un centro";
        if (!nombre.trim()) errs.nombre = "El nombre es requerido";
        if (!codigoPrograma.trim()) errs.codigo_programa = "El código de programa es requerido";
        if (!areaId) errs.area_id = "Selecciona un área técnica";
        if (!objetivo.trim()) errs.objetivo = "El objetivo es requerido";
        setFormErrors(errs);
        if (Object.keys(errs).length > 0) return;
        setStep(2);
    };

    // ─── Step 2 helpers ───
    const updateModuleItem = (idx: number, key: keyof ModuleItem, value: string) => {
        setModuleItems((prev) => prev.map((m, i) => (i === idx ? { ...m, [key]: value } : m)));
    };

    const addModuleItem = () => {
        setModuleItems((prev) => [...prev, emptyModule()]);
        setTimeout(() => modulesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    };

    const removeModuleItem = (idx: number) => {
        setModuleItems((prev) => prev.filter((_, i) => i !== idx));
    };

    // Excel download (blank template)
    const downloadModulesTemplate = async () => {
        if (!session) return;
        try {
            const res = await fetch(`${apiBase}/centros/courses/excel/modules-template`, { headers: authHeaders });
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

    // Excel local import (client-side parse, no server call)
    const EVAL_TYPE_MAP: Record<string, string> = {
        TEORICA: "1", "TEÓRICA": "1", PRACTICA: "2", "PRÁCTICA": "2", MIXTA: "3",
        "1": "1", "2": "2", "3": "3",
    };

    const importExcelLocal = async (file: File) => {
        setExcelImporting(true);
        try {
            const buffer = await file.arrayBuffer();
            const workbook = XLSX.read(buffer, { type: "array" });
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonRows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });

            let imported = 0;
            let errorCount = 0;
            const items: ModuleItem[] = [];

            for (const row of jsonRows) {
                const cod = String(row["Codigo"] ?? "").trim();
                const nom = String(row["Nombre"] ?? "").trim();
                const ht = String(row["Horas Teoricas"] ?? "").trim();
                const hp = String(row["Horas Practicas"] ?? "").trim();
                const rawEval = String(row["Tipo Evaluacion"] ?? "").trim().toUpperCase();
                const obs = String(row["Observaciones"] ?? "").trim();

                if (!cod || !nom || !ht || !hp) { errorCount++; continue; }

                items.push({
                    codigo: cod, nombre: nom,
                    horas_teoricas: ht, horas_practicas: hp,
                    tipo_evaluacion: EVAL_TYPE_MAP[rawEval] ?? "1",
                    observaciones: obs,
                });
                imported++;
            }

            if (items.length > 0) setModuleItems(items);
            const msg = `${imported} módulos importados${errorCount > 0 ? `, ${errorCount} con errores` : ""}`;
            if (errorCount > 0) toast.error(msg); else toast.success(msg);
        } catch {
            toast.error("Error al leer el archivo Excel");
        }
        setExcelImporting(false);
    };

    // ─── Final submit: create course + modules in one API call ───
    const onFinish = async () => {
        const validModules = moduleItems.filter((m) => m.codigo.trim() && m.nombre.trim() && m.horas_teoricas.trim() && m.horas_practicas.trim());
        if (validModules.length === 0) {
            toast.error("Agrega al menos un módulo válido");
            return;
        }

        setIsSubmitting(true);
        try {
            const body: any = {
                centro_id: Number(centroId),
                nombre: nombre.trim(),
                codigo_programa: codigoPrograma.trim(),
                taller: Number(taller),
                objetivo: objetivo.trim(),
                area_id: Number(areaId),
                modules: validModules.map((m) => ({
                    codigo: m.codigo.trim(),
                    nombre: m.nombre.trim(),
                    horas_teoricas: m.horas_teoricas.trim(),
                    horas_practicas: m.horas_practicas.trim(),
                    tipo_evaluacion: Number(m.tipo_evaluacion) || 1,
                    observaciones: m.observaciones.trim() || null,
                })),
            };
            if (codigo) body.codigo = Number(codigo);

            const res = await fetch(`${apiBase}/centros/courses/wizard`, {
                method: "POST",
                headers: { "Content-Type": "application/json", ...authHeaders },
                body: JSON.stringify(body),
            });

            if (res.ok) {
                const data = await res.json();
                toast.success(`Curso creado con ${data.modulesCreated ?? 0} módulo(s)`);
                setIsOpen(false);
                reloadList();
                if (data.id) onCreated?.(data.id);
            } else {
                const data = await res.json();
                toast.error(data.message ?? "Error al crear curso");
            }
        } catch {
            toast.error("Error al crear curso");
        }
        setIsSubmitting(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={(v) => { if (!isSubmitting) setIsOpen(v); }}>
            <DialogContent size="5xl" className="max-h-[90vh] flex flex-col">
                <DialogTitle>{initialData ? "Duplicar Curso" : "Crear Curso"}</DialogTitle>
                <Stepper direction="horizontal" current={step - 1} gap alternativeLabel>
                    <Step><StepLabel>Información General</StepLabel></Step>
                    <Step><StepLabel>Módulos</StepLabel></Step>
                </Stepper>
                <div className="w-full py-4 flex-1 min-h-0">
                    {/* ─── Step 1: General Info ─── */}
                    {step === 1 && (
                        <ScrollArea className="h-full max-h-[400px]">
                            <div className="px-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Centro selector */}
                                    <div className="md:col-span-2">
                                        <Label className="mb-1 font-medium text-default-600">Centro *</Label>
                                        <Popover open={centroOpen} onOpenChange={(o) => { setCentroOpen(o); if (!o) setCentroSearch(""); }}>
                                            <PopoverTrigger asChild>
                                                <Button type="button" variant="outline" disabled={isSubmitting} className="group w-full justify-between font-normal">
                                                    <span className={cn("truncate transition-colors", !selectedCentro && "text-muted-foreground group-hover:text-primary-foreground")}>
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
                                                        <button key={c.id} type="button"
                                                            className="w-full rounded-sm px-2 py-2 text-left text-sm text-foreground hover:bg-accent focus:bg-accent focus:outline-none"
                                                            onClick={() => { setCentroId(String(c.id)); setCentroOpen(false); setFormErrors((p) => { const n = { ...p }; delete n.centro_id; return n; }); }}>
                                                            {c.nombre}
                                                        </button>
                                                    ))}
                                                </div>
                                            </PopoverContent>
                                        </Popover>
                                        {formErrors.centro_id && <p className="text-destructive text-xs mt-1">{formErrors.centro_id}</p>}
                                    </div>

                                    <div>
                                        <Label className="mb-1 font-medium text-default-600">Código</Label>
                                        <Input type="number" disabled={isSubmitting} value={codigo} onChange={(e) => { setCodigo(e.target.value); codigoManualRef.current = e.target.value.trim() !== ""; }} placeholder="Código numérico" />
                                    </div>
                                    <div>
                                        <Label className="mb-1 font-medium text-default-600">Nombre *</Label>
                                        <Input disabled={isSubmitting} value={nombre} onChange={(e) => { setNombre(e.target.value); setFormErrors((p) => { const n = { ...p }; delete n.nombre; return n; }); }} placeholder="Nombre del curso" />
                                        {formErrors.nombre && <p className="text-destructive text-xs mt-1">{formErrors.nombre}</p>}
                                    </div>
                                    <div>
                                        <Label className="mb-1 font-medium text-default-600">Código de programa *</Label>
                                        <Input disabled={isSubmitting} value={codigoPrograma} onChange={(e) => { setCodigoPrograma(e.target.value); setFormErrors((p) => { const n = { ...p }; delete n.codigo_programa; return n; }); }} placeholder="Código del programa" />
                                        {formErrors.codigo_programa && <p className="text-destructive text-xs mt-1">{formErrors.codigo_programa}</p>}
                                    </div>
                                    <div>
                                        <Label className="mb-1 font-medium text-default-600">Área técnica *</Label>
                                        <Select value={areaId || undefined} disabled={isSubmitting}
                                            onValueChange={(v) => { setAreaId(v); setFormErrors((p) => { const n = { ...p }; delete n.area_id; return n; }); }}>
                                            <SelectTrigger className="h-9"><SelectValue placeholder="Seleccionar área técnica" /></SelectTrigger>
                                            <SelectContent>
                                                {areas.map((a) => <SelectItem key={a.id} value={a.id.toString()}>{a.nombre}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                        {formErrors.area_id && <p className="text-destructive text-xs mt-1">{formErrors.area_id}</p>}
                                    </div>
                                    <div>
                                        <Label className="mb-1 font-medium text-default-600">Taller</Label>
                                        <Select value={taller} onValueChange={setTaller} disabled={isSubmitting}>
                                            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="1">Sí</SelectItem>
                                                <SelectItem value="0">No</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="md:col-span-2">
                                        <Label className="mb-1 font-medium text-default-600">Objetivo *</Label>
                                        <Textarea disabled={isSubmitting} value={objetivo} rows={3}
                                            onChange={(e) => { setObjetivo(e.target.value); setFormErrors((p) => { const n = { ...p }; delete n.objetivo; return n; }); }} placeholder="Objetivo del curso" />
                                        {formErrors.objetivo && <p className="text-destructive text-xs mt-1">{formErrors.objetivo}</p>}
                                    </div>
                                </div>
                            </div>
                        </ScrollArea>
                    )}

                    {/* ─── Step 2: Modules ─── */}
                    {step === 2 && (
                        <ScrollArea className="h-full max-h-[400px]">
                            <div className="px-4">
                                {moduleItems.map((item, i) => (
                                    <div key={i} className="flex gap-2 items-end mb-4">
                                        <div className="min-w-[100px]">
                                            <Label className="mb-1 text-xs">Código *</Label>
                                            <Input value={item.codigo} onChange={(e) => updateModuleItem(i, "codigo", e.target.value)}
                                                placeholder="Código" disabled={isSubmitting} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <Label className="mb-1 text-xs">Nombre *</Label>
                                            <Input value={item.nombre} onChange={(e) => updateModuleItem(i, "nombre", e.target.value)}
                                                placeholder="Nombre del módulo" disabled={isSubmitting} />
                                        </div>
                                        <div className="min-w-[90px]">
                                            <Label className="mb-1 text-xs">H. Teóricas *</Label>
                                            <Input type="number" value={item.horas_teoricas} onChange={(e) => updateModuleItem(i, "horas_teoricas", e.target.value)}
                                                placeholder="0" disabled={isSubmitting} />
                                        </div>
                                        <div className="min-w-[90px]">
                                            <Label className="mb-1 text-xs">H. Prácticas *</Label>
                                            <Input type="number" value={item.horas_practicas} onChange={(e) => updateModuleItem(i, "horas_practicas", e.target.value)}
                                                placeholder="0" disabled={isSubmitting} />
                                        </div>
                                        <div className="min-w-[110px]">
                                            <Label className="mb-1 text-xs">Evaluación</Label>
                                            <Select value={item.tipo_evaluacion} onValueChange={(v) => updateModuleItem(i, "tipo_evaluacion", v)} disabled={isSubmitting}>
                                                <SelectTrigger size="md"><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="1">Teórica</SelectItem>
                                                    <SelectItem value="2">Práctica</SelectItem>
                                                    <SelectItem value="3">Mixta</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <Button type="button" variant="ghost" size="icon"
                                            onClick={() => removeModuleItem(i)} disabled={moduleItems.length === 1 || isSubmitting}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}

                                <div className="flex items-center justify-between mr-3 mb-3">
                                    <Button type="button" variant="outline" size="sm" onClick={addModuleItem} disabled={isSubmitting}>
                                        <PlusCircle className="h-4 w-4 mr-2" />Agregar más
                                    </Button>
                                    <Button type="button" variant="outline" size="sm" onClick={downloadModulesTemplate}>
                                        <Download className="h-4 w-4 mr-2" />Descargar Formato
                                    </Button>
                                </div>
                                <ExcelDropzone disabled={excelImporting} onFile={importExcelLocal} importing={excelImporting} />
                                <div ref={modulesEndRef} />
                            </div>
                        </ScrollArea>
                    )}
                </div>

                <DialogFooter className="gap-2">
                    {step === 1 && (
                        <>
                            <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={isSubmitting}>Cancelar</Button>
                            <Button type="button" onClick={onStep1Next} disabled={isSubmitting}>Siguiente</Button>
                        </>
                    )}
                    {step === 2 && (
                        <>
                            <Button type="button" variant="outline" onClick={() => setStep(1)} disabled={isSubmitting}>Anterior</Button>
                            <Button type="button" onClick={onFinish} disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Crear Curso
                            </Button>
                        </>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
