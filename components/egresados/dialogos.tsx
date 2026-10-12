"use client";

import React, { useEffect, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
import toast from "react-hot-toast";
import { FileSpreadsheet, Loader2, Upload } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { MOTIVOS_DESERCION, asOptions, type MotivoDesercion } from "@/lib/egresados-catalogos";
import { hoyIso } from "./api";
import { CamposSeguimiento, DETALLE_VACIO, validarDetalle, type DetalleSeguimiento } from "./campos-seguimiento";

const plural = (n: number, uno: string, varios: string) => `${n.toLocaleString("es-HN")} ${n === 1 ? uno : varios}`;

// ─── Marcar egresados ────────────────────────────────────────────────────────

export function DialogoEgreso({
    open, onOpenChange, cantidad, enCurso, onConfirm,
}: {
    open: boolean;
    onOpenChange: (o: boolean) => void;
    cantidad: number;
    /** Seleccionados cuyo curso aún no termina (necesitan fecha real). */
    enCurso: number;
    onConfirm: (v: { fecha: string | null; observacion: string }) => Promise<void>;
}) {
    const [fecha, setFecha] = useState("");
    const [observacion, setObservacion] = useState("");
    const [saving, setSaving] = useState(false);
    useEffect(() => { if (open) { setFecha(""); setObservacion(""); } }, [open]);

    const submit = async () => {
        setSaving(true);
        try { await onConfirm({ fecha: fecha || null, observacion }); } finally { setSaving(false); }
    };

    return (
        <Dialog open={open} onOpenChange={(o) => { if (!saving) onOpenChange(o); }}>
            <DialogContent size="lg">
                <DialogTitle>Registrar egreso</DialogTitle>
                <DialogDescription>Se marcará como egresados a {plural(cantidad, "estudiante", "estudiantes")}.</DialogDescription>
                <div className="space-y-4 py-2">
                    <div>
                        <Label className="mb-1 font-medium text-default-600">Fecha de egreso</Label>
                        <DatePicker value={fecha} onChange={(v) => setFecha(v ?? "")} maxDate={hoyIso()} clearable placeholder="Fecha de fin de cada curso" />
                        <p className="text-xs text-muted-foreground mt-1">Si la deja vacía se usa la fecha de fin de cada curso.</p>
                    </div>
                    {enCurso > 0 && !fecha && (
                        <p className="rounded-md bg-warning/10 px-3 py-2 text-xs text-warning">
                            {plural(enCurso, "seleccionado pertenece", "seleccionados pertenecen")} a cursos que aún no terminan:
                            indique la fecha real de egreso o quítelos de la selección.
                        </p>
                    )}
                    <div>
                        <Label className="mb-1 font-medium text-default-600">Observación</Label>
                        <Textarea value={observacion} maxLength={1000} onChange={(e) => setObservacion(e.target.value)} placeholder="Opcional" className="min-h-[60px]" />
                    </div>
                </div>
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancelar</Button>
                    <Button type="button" color="success" onClick={submit} disabled={saving}>
                        {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Registrar egreso
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ─── Marcar desertores ───────────────────────────────────────────────────────

const MOTIVOS = asOptions(MOTIVOS_DESERCION);

export function DialogoDesercion({
    open, onOpenChange, cantidad, onConfirm,
}: {
    open: boolean;
    onOpenChange: (o: boolean) => void;
    cantidad: number;
    onConfirm: (v: { fecha: string; motivo: MotivoDesercion; observacion: string }) => Promise<void>;
}) {
    const [fecha, setFecha] = useState("");
    const [motivo, setMotivo] = useState<MotivoDesercion | "">("");
    const [observacion, setObservacion] = useState("");
    const [intentado, setIntentado] = useState(false);
    const [saving, setSaving] = useState(false);
    useEffect(() => { if (open) { setFecha(""); setMotivo(""); setObservacion(""); setIntentado(false); } }, [open]);

    const submit = async () => {
        setIntentado(true);
        if (!fecha || !motivo) return;
        setSaving(true);
        try { await onConfirm({ fecha, motivo, observacion }); } finally { setSaving(false); }
    };

    return (
        <Dialog open={open} onOpenChange={(o) => { if (!saving) onOpenChange(o); }}>
            <DialogContent size="lg">
                <DialogTitle>Registrar deserción</DialogTitle>
                <DialogDescription>Se marcará como desertores a {plural(cantidad, "estudiante", "estudiantes")}.</DialogDescription>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
                    <div>
                        <Label className="mb-1 font-medium text-default-600">Fecha de deserción *</Label>
                        <DatePicker value={fecha} onChange={(v) => setFecha(v ?? "")} maxDate={hoyIso()} placeholder="Seleccionar fecha" />
                        {intentado && !fecha && <p className="text-destructive text-xs mt-1">Requerido</p>}
                    </div>
                    <div>
                        <Label className="mb-1 font-medium text-default-600">Motivo *</Label>
                        <Select value={motivo || undefined} onValueChange={(v) => setMotivo(v as MotivoDesercion)}>
                            <SelectTrigger><SelectValue placeholder="Seleccionar motivo" /></SelectTrigger>
                            <SelectContent>
                                {MOTIVOS.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        {intentado && !motivo && <p className="text-destructive text-xs mt-1">Requerido</p>}
                    </div>
                    <div className="md:col-span-2">
                        <Label className="mb-1 font-medium text-default-600">Observación</Label>
                        <Textarea value={observacion} maxLength={1000} onChange={(e) => setObservacion(e.target.value)} placeholder="Opcional" className="min-h-[60px]" />
                    </div>
                </div>
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancelar</Button>
                    <Button type="button" color="destructive" onClick={submit} disabled={saving}>
                        {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Registrar deserción
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ─── Registrar o corregir un corte de seguimiento ────────────────────────────

export function DialogoSeguimiento({
    open, onOpenChange, titulo, descripcion, inicial, fechaInicial, minFecha, textoBoton, onConfirm,
}: {
    open: boolean;
    onOpenChange: (o: boolean) => void;
    titulo: string;
    descripcion?: React.ReactNode;
    inicial?: DetalleSeguimiento;
    fechaInicial?: string;
    /** No se admite un corte anterior al egreso. */
    minFecha?: string;
    textoBoton: string;
    onConfirm: (v: { fecha_corte: string; detalle: DetalleSeguimiento }) => Promise<void>;
}) {
    const [fecha, setFecha] = useState("");
    const [detalle, setDetalle] = useState<DetalleSeguimiento>(DETALLE_VACIO);
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);
    // Los valores iniciales se toman SOLO al abrir: un re-render del padre no
    // debe borrar lo que el usuario lleva escrito.
    const iniciales = useRef({ inicial, fechaInicial });
    iniciales.current = { inicial, fechaInicial };
    useEffect(() => {
        if (!open) return;
        setFecha(iniciales.current.fechaInicial ?? hoyIso());
        setDetalle(iniciales.current.inicial ?? DETALLE_VACIO);
        setError("");
    }, [open]);

    const submit = async () => {
        const msg = !fecha ? "Indique la fecha de corte" : validarDetalle(detalle);
        setError(msg);
        if (msg) return;
        setSaving(true);
        try { await onConfirm({ fecha_corte: fecha, detalle }); } finally { setSaving(false); }
    };

    return (
        <Dialog open={open} onOpenChange={(o) => { if (!saving) onOpenChange(o); }}>
            <DialogContent size="2xl">
                <DialogTitle>{titulo}</DialogTitle>
                {descripcion && <DialogDescription>{descripcion}</DialogDescription>}
                <div className="max-h-[65vh] overflow-y-auto space-y-4 py-2 pr-1">
                    <div className="md:w-1/2 md:pr-2">
                        <Label className="mb-1 font-medium text-default-600">Fecha de corte *</Label>
                        <DatePicker value={fecha} onChange={(v) => setFecha(v ?? "")} minDate={minFecha} maxDate={hoyIso()} />
                        <p className="text-xs text-muted-foreground mt-1">Fecha a la que corresponde la información (la del levantamiento).</p>
                    </div>
                    <CamposSeguimiento value={detalle} onChange={setDetalle} disabled={saving} />
                    {error && <p className="text-destructive text-sm">{error}</p>}
                </div>
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancelar</Button>
                    <Button type="button" onClick={submit} disabled={saving}>
                        {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {textoBoton}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ─── Subir una lista de Excel ────────────────────────────────────────────────

export function DialogoSubirExcel({
    open, onOpenChange, titulo, descripcion, pedirFechaCorte, onUpload,
}: {
    open: boolean;
    onOpenChange: (o: boolean) => void;
    titulo: string;
    descripcion: React.ReactNode;
    /** El corte de seguimiento necesita la fecha a la que corresponde el archivo. */
    pedirFechaCorte?: boolean;
    onUpload: (file: File, fechaCorte: string | null) => Promise<void>;
}) {
    const [file, setFile] = useState<File | null>(null);
    const [fecha, setFecha] = useState("");
    const [intentado, setIntentado] = useState(false);
    const [saving, setSaving] = useState(false);
    useEffect(() => { if (open) { setFile(null); setFecha(hoyIso()); setIntentado(false); } }, [open]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        accept: { "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"] },
        maxFiles: 1, maxSize: 10 * 1024 * 1024, disabled: saving,
        onDrop: (accepted) => { if (accepted[0]) setFile(accepted[0]); },
        onDropRejected: () => toast.error("Solo archivos .xlsx de hasta 10MB"),
    });

    const submit = async () => {
        setIntentado(true);
        if (!file || (pedirFechaCorte && !fecha)) return;
        setSaving(true);
        try { await onUpload(file, pedirFechaCorte ? fecha : null); } finally { setSaving(false); }
    };

    return (
        <Dialog open={open} onOpenChange={(o) => { if (!saving) onOpenChange(o); }}>
            <DialogContent size="lg">
                <DialogTitle>{titulo}</DialogTitle>
                <DialogDescription>{descripcion}</DialogDescription>
                <div className="space-y-4 py-2">
                    {pedirFechaCorte && (
                        <div>
                            <Label className="mb-1 font-medium text-default-600">Fecha de corte *</Label>
                            <DatePicker value={fecha} onChange={(v) => setFecha(v ?? "")} maxDate={hoyIso()} />
                            <p className="text-xs text-muted-foreground mt-1">Todas las filas del archivo se registran con esta fecha.</p>
                            {intentado && !fecha && <p className="text-destructive text-xs mt-1">Requerido</p>}
                        </div>
                    )}
                    <div {...getRootProps()} className={cn("border-2 border-dashed rounded-lg py-8 px-4 text-center cursor-pointer transition-colors text-sm",
                        isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/30 hover:border-primary/50")}>
                        <input {...getInputProps()} />
                        {file ? (
                            <>
                                <FileSpreadsheet className="h-6 w-6 mx-auto text-success mb-2" />
                                <span className="font-medium text-foreground">{file.name}</span>
                                <p className="text-xs text-muted-foreground mt-1">Haga clic o arrastre otro archivo para cambiarlo</p>
                            </>
                        ) : (
                            <>
                                <Upload className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
                                <span className="text-muted-foreground">{isDragActive ? "Suelte el archivo aquí" : "Arrastre el Excel o haga clic para elegirlo"}</span>
                                <p className="text-xs text-muted-foreground mt-1">Solo archivos .xlsx</p>
                            </>
                        )}
                    </div>
                    {intentado && !file && <p className="text-destructive text-xs">Elija el archivo</p>}
                </div>
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancelar</Button>
                    <Button type="button" onClick={submit} disabled={saving}>
                        {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Subir lista
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
