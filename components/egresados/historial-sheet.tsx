"use client";

import React, { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
    AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    ESTATUS_SEGUIMIENTO, MOTIVOS_DESERCION, RESULTADOS_PASANTIA, asOptions,
    type EstatusSeguimiento, type ResultadoPasantia,
} from "@/lib/egresados-catalogos";
import { ApiError, fechaCorta, hoyIso, type Api } from "./api";
import { DialogoSeguimiento } from "./dialogos";
import { detalleAPayload, detalleCorte, detalleDesdeRegistro } from "./campos-seguimiento";

interface Pasantia {
    empresa: string;
    fecha_inicio: string;
    fecha_fin: string;
    resultado: ResultadoPasantia;
    motivo_desercion: string;
    porcentaje_avance: string;
    beneficio: string;
    beneficio_otorgado_por: string;
    observaciones: string;
}

const PASANTIA_VACIA: Pasantia = {
    empresa: "", fecha_inicio: "", fecha_fin: "", resultado: "EN_CURSO", motivo_desercion: "",
    porcentaje_avance: "", beneficio: "", beneficio_otorgado_por: "", observaciones: "",
};

function pasantiaDesde(p: any): Pasantia {
    if (!p) return PASANTIA_VACIA;
    return {
        empresa: p.empresa ?? "",
        fecha_inicio: p.fecha_inicio ?? "",
        fecha_fin: p.fecha_fin ?? "",
        resultado: p.resultado ?? "EN_CURSO",
        motivo_desercion: p.motivo_desercion ?? "",
        porcentaje_avance: p.porcentaje_avance != null ? String(p.porcentaje_avance) : "",
        beneficio: p.beneficio ?? "",
        beneficio_otorgado_por: p.beneficio_otorgado_por ?? "",
        observaciones: p.observaciones ?? "",
    };
}

function Dato({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div>
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
            <p className="text-sm text-foreground break-words">{children || "—"}</p>
        </div>
    );
}

/**
 * Panel lateral de un egresado: historial de cortes (corregir o borrar uno),
 * registrar un corte nuevo y su pasantía.
 */
export function HistorialSheet({
    api, matriculaId, onClose, puedeEditar, onCambio,
}: {
    api: Api;
    matriculaId: number | null;
    onClose: () => void;
    puedeEditar: boolean;
    /** La lista debe recargarse (cambió el último estatus o la pasantía). */
    onCambio: () => void;
}) {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [editando, setEditando] = useState<any | "nuevo" | null>(null);
    const [borrando, setBorrando] = useState<any | null>(null);
    const [borrandoBusy, setBorrandoBusy] = useState(false);
    const [pasantia, setPasantia] = useState<Pasantia>(PASANTIA_VACIA);
    const [conPasantia, setConPasantia] = useState(false);
    const [guardandoPasantia, setGuardandoPasantia] = useState(false);

    const cargar = useCallback(async () => {
        if (matriculaId == null) return;
        setLoading(true);
        try {
            const d = await api.get(`/egresados/seguimiento/${matriculaId}`);
            setData(d.data);
            setPasantia(pasantiaDesde(d.data?.pasantia));
            setConPasantia(!!d.data?.pasantia);
        } catch (e) {
            toast.error(e instanceof ApiError ? e.message : "Error al cargar el historial");
        }
        setLoading(false);
    }, [api, matriculaId]);

    useEffect(() => { setData(null); cargar(); }, [cargar]);

    const guardarCorte = async ({ fecha_corte, detalle }: { fecha_corte: string; detalle: any }) => {
        try {
            if (editando === "nuevo") {
                const r = await api.send("POST", "/egresados/seguimiento", {
                    fecha_corte, matricula_ids: [matriculaId], ...detalleAPayload(detalle),
                });
                if (r.errors?.length) { toast.error(r.errors[0].message); return; }
                toast.success(r.updated ? "Se reemplazó el registro de esa fecha de corte" : "Seguimiento registrado");
            } else {
                await api.send("PUT", `/egresados/seguimiento/registro/${editando.id}`, { fecha_corte, ...detalleAPayload(detalle) });
                toast.success("Registro actualizado");
            }
            setEditando(null);
            cargar();
            onCambio();
        } catch (e) {
            toast.error(e instanceof ApiError ? e.message : "Error al guardar");
        }
    };

    const borrar = async () => {
        if (!borrando) return;
        setBorrandoBusy(true);
        try {
            await api.send("DELETE", `/egresados/seguimiento/registro/${borrando.id}`);
            toast.success("Registro eliminado");
            setBorrando(null);
            cargar();
            onCambio();
        } catch (e) {
            toast.error(e instanceof ApiError ? e.message : "Error al eliminar");
        }
        setBorrandoBusy(false);
    };

    const guardarPasantia = async (quitar = false) => {
        if (!quitar && pasantia.resultado === "DESERTO" && !pasantia.motivo_desercion) {
            toast.error("Indique el motivo por el que dejó la pasantía");
            return;
        }
        setGuardandoPasantia(true);
        try {
            const body = quitar ? {} : {
                ...pasantia,
                motivo_desercion: pasantia.resultado === "DESERTO" ? pasantia.motivo_desercion : "",
            };
            await api.send("PUT", `/egresados/pasantia/${matriculaId}`, body);
            toast.success(quitar ? "Pasantía eliminada" : "Pasantía guardada");
            if (quitar) { setPasantia(PASANTIA_VACIA); setConPasantia(false); }
            onCambio();
        } catch (e) {
            toast.error(e instanceof ApiError ? e.message : "Error al guardar la pasantía");
        }
        setGuardandoPasantia(false);
    };

    const setP = <K extends keyof Pasantia>(k: K, v: Pasantia[K]) => setPasantia((p) => ({ ...p, [k]: v }));
    const seguimientos: any[] = data?.seguimientos ?? [];

    return (
        <Sheet open={matriculaId != null} onOpenChange={(o) => { if (!o) onClose(); }}>
            <SheetContent side="right" className="w-full sm:max-w-xl md:max-w-2xl overflow-y-auto" aria-describedby={undefined}>
                <SheetHeader>
                    <SheetTitle>{data?.nombre ?? "Egresado"}</SheetTitle>
                </SheetHeader>

                {loading && !data && (
                    <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
                )}

                {data && (
                    <div className="space-y-6 mt-2">
                        <div className="grid grid-cols-2 gap-3 rounded-lg border border-border p-3">
                            <Dato label="DNI">{data.identidad}</Dato>
                            <Dato label="Contacto">{[data.celular, data.email].filter(Boolean).join(" · ")}</Dato>
                            <Dato label="Curso">{data.curso_nombre}</Dato>
                            <Dato label="Proceso">{data.proceso_codigo} · {data.centro_nombre}</Dato>
                            <Dato label="Período">{fechaCorta(data.fecha_inicial)} – {fechaCorta(data.fecha_final)}</Dato>
                            <Dato label="Egresó">{fechaCorta(data.fecha_resultado)}</Dato>
                        </div>

                        <section>
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-sm font-semibold">Seguimiento ({seguimientos.length})</h3>
                                {puedeEditar && data.resultado === "EGRESADO" && (
                                    <Button size="sm" onClick={() => setEditando("nuevo")}>
                                        <Plus className="h-4 w-4 mr-1" /> Registrar seguimiento
                                    </Button>
                                )}
                            </div>
                            {seguimientos.length === 0 && (
                                <p className="text-sm text-muted-foreground rounded-md border border-dashed p-4 text-center">
                                    Aún no tiene seguimiento registrado.
                                </p>
                            )}
                            <ol className="space-y-3">
                                {seguimientos.map((s) => (
                                    <li key={s.id} className="rounded-lg border border-border p-3">
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <Badge color="info" variant="soft">{ESTATUS_SEGUIMIENTO[s.estatus as EstatusSeguimiento] ?? s.estatus}</Badge>
                                                    <span className="text-xs text-muted-foreground">al {fechaCorta(s.fecha_corte)}</span>
                                                </div>
                                                {detalleCorte(s) && <p className="text-sm mt-1.5">{detalleCorte(s)}</p>}
                                                {s.observaciones && <p className="text-xs text-muted-foreground mt-1 whitespace-pre-line">{s.observaciones}</p>}
                                                {s.registrado_por_nombre && (
                                                    <p className="text-[11px] text-muted-foreground mt-1.5">Registró: {s.registrado_por_nombre}</p>
                                                )}
                                            </div>
                                            {puedeEditar && (
                                                <div className="flex gap-1 shrink-0">
                                                    <Button size="icon" variant="ghost" className="h-8 w-8" aria-label="Corregir registro" onClick={() => setEditando(s)}>
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" aria-label="Eliminar registro" onClick={() => setBorrando(s)}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    </li>
                                ))}
                            </ol>
                        </section>

                        <section>
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-sm font-semibold">Pasantía</h3>
                                {puedeEditar && !conPasantia && (
                                    <Button size="sm" variant="outline" onClick={() => setConPasantia(true)}>
                                        <Plus className="h-4 w-4 mr-1" /> Agregar pasantía
                                    </Button>
                                )}
                            </div>
                            {!conPasantia && <p className="text-sm text-muted-foreground">Sin pasantía registrada.</p>}
                            {conPasantia && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-lg border border-border p-3">
                                    <div className="md:col-span-2">
                                        <Label className="mb-1 font-medium text-default-600">Empresa</Label>
                                        <Input disabled={!puedeEditar} value={pasantia.empresa} maxLength={300} onChange={(e) => setP("empresa", e.target.value)} />
                                    </div>
                                    <div>
                                        <Label className="mb-1 font-medium text-default-600">Inicio</Label>
                                        <DatePicker disabled={!puedeEditar} value={pasantia.fecha_inicio} onChange={(v) => setP("fecha_inicio", v ?? "")} clearable placeholder="Opcional" />
                                    </div>
                                    <div>
                                        <Label className="mb-1 font-medium text-default-600">Fin</Label>
                                        <DatePicker disabled={!puedeEditar} value={pasantia.fecha_fin} onChange={(v) => setP("fecha_fin", v ?? "")} minDate={pasantia.fecha_inicio || undefined} clearable placeholder="Opcional" />
                                    </div>
                                    <div>
                                        <Label className="mb-1 font-medium text-default-600">Estado</Label>
                                        <Select disabled={!puedeEditar} value={pasantia.resultado} onValueChange={(v) => setP("resultado", v as ResultadoPasantia)}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                {asOptions(RESULTADOS_PASANTIA).map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label className="mb-1 font-medium text-default-600">% de avance</Label>
                                        <Input disabled={!puedeEditar} inputMode="numeric" value={pasantia.porcentaje_avance} onChange={(e) => setP("porcentaje_avance", e.target.value.replace(/[^\d]/g, "").slice(0, 3))} placeholder="0 a 100" />
                                    </div>
                                    {pasantia.resultado === "DESERTO" && (
                                        <div className="md:col-span-2">
                                            <Label className="mb-1 font-medium text-default-600">Motivo *</Label>
                                            <Select disabled={!puedeEditar} value={pasantia.motivo_desercion || undefined} onValueChange={(v) => setP("motivo_desercion", v)}>
                                                <SelectTrigger><SelectValue placeholder="Seleccionar motivo" /></SelectTrigger>
                                                <SelectContent>
                                                    {asOptions(MOTIVOS_DESERCION).map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}
                                    <div>
                                        <Label className="mb-1 font-medium text-default-600">Beneficio</Label>
                                        <Input disabled={!puedeEditar} value={pasantia.beneficio} maxLength={300} onChange={(e) => setP("beneficio", e.target.value)} placeholder="Ej. estipendio, transporte" />
                                    </div>
                                    <div>
                                        <Label className="mb-1 font-medium text-default-600">Otorgado por</Label>
                                        <Input disabled={!puedeEditar} value={pasantia.beneficio_otorgado_por} maxLength={300} onChange={(e) => setP("beneficio_otorgado_por", e.target.value)} placeholder="Empresa o proyecto" />
                                    </div>
                                    <div className="md:col-span-2">
                                        <Label className="mb-1 font-medium text-default-600">Observaciones</Label>
                                        <Textarea disabled={!puedeEditar} value={pasantia.observaciones} maxLength={1000} onChange={(e) => setP("observaciones", e.target.value)} className="min-h-[60px]" />
                                    </div>
                                    {puedeEditar && (
                                        <div className="md:col-span-2 flex justify-between gap-2">
                                            {data.pasantia ? (
                                                <Button type="button" variant="ghost" className="text-destructive" disabled={guardandoPasantia} onClick={() => guardarPasantia(true)}>
                                                    Quitar pasantía
                                                </Button>
                                            ) : (
                                                <Button type="button" variant="ghost" disabled={guardandoPasantia} onClick={() => { setConPasantia(false); setPasantia(PASANTIA_VACIA); }}>
                                                    Cancelar
                                                </Button>
                                            )}
                                            <Button type="button" disabled={guardandoPasantia} onClick={() => guardarPasantia(false).then(cargar)}>
                                                {guardandoPasantia && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                Guardar pasantía
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </section>
                    </div>
                )}

                <DialogoSeguimiento
                    open={editando != null}
                    onOpenChange={(o) => { if (!o) setEditando(null); }}
                    titulo={editando === "nuevo" ? "Registrar seguimiento" : "Corregir registro"}
                    descripcion={data?.nombre}
                    // Un corte nuevo parte del último (lo usual es actualizar fecha y algún dato).
                    inicial={editando === "nuevo"
                        ? (seguimientos[0] ? detalleDesdeRegistro(seguimientos[0]) : undefined)
                        : editando ? detalleDesdeRegistro(editando) : undefined}
                    fechaInicial={editando && editando !== "nuevo" ? editando.fecha_corte : hoyIso()}
                    minFecha={data?.fecha_resultado ?? undefined}
                    textoBoton={editando === "nuevo" ? "Registrar" : "Guardar cambios"}
                    onConfirm={guardarCorte}
                />

                <AlertDialog open={!!borrando} onOpenChange={(o) => { if (!o && !borrandoBusy) setBorrando(null); }}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>¿Eliminar este registro?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Se borrará el seguimiento al {fechaCorta(borrando?.fecha_corte)}. Esta acción no se puede deshacer.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel disabled={borrandoBusy}>Cancelar</AlertDialogCancel>
                            <AlertDialogAction color="destructive" disabled={borrandoBusy} onClick={(e) => { e.preventDefault(); borrar(); }}>
                                {borrandoBusy ? "Eliminando..." : "Eliminar"}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </SheetContent>
        </Sheet>
    );
}
