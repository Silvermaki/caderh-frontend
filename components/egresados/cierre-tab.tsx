"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { CheckCircle2, Download, Loader2, RotateCcw, Upload, UserX, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
    AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import SkeletonTable from "@/components/skeleton-table";
import { KpiCard } from "@/components/report/variants/kpi-card";
import { ImportResultModal, type ImportResult } from "@/components/centro/import-result-modal";
import { MOTIVOS_DESERCION, type MotivoDesercion } from "@/lib/egresados-catalogos";
import { ApiError, fechaCorta, type Api } from "./api";
import { filtrosAParams, type FiltrosEgresados } from "./filtros";
import { TablaSeleccion, type Columna } from "./tabla-seleccion";
import { DialogoDesercion, DialogoEgreso, DialogoSubirExcel } from "./dialogos";

type Estado = "SIN_CIERRE" | "EGRESADO" | "DESERTOR" | "TODOS";

interface FilaCierre {
    matricula_id: number;
    resultado: "EGRESADO" | "DESERTOR" | null;
    fecha_resultado: string | null;
    motivo_desercion: MotivoDesercion | null;
    observacion_resultado: string | null;
    estudiante_id: number;
    identidad: string;
    nombre: string;
    proceso_codigo: string;
    fecha_inicial: string;
    fecha_final: string;
    terminado: boolean;
    centro_nombre: string;
    curso_nombre: string;
}

interface Resumen {
    total: number;
    sin_cierre: number;
    sin_cierre_terminados: number;
    egresados: number;
    desertores: number;
}

const ESTADOS: Array<{ value: Estado; label: string }> = [
    { value: "SIN_CIERRE", label: "Sin cierre" },
    { value: "EGRESADO", label: "Egresados" },
    { value: "DESERTOR", label: "Desertores" },
    { value: "TODOS", label: "Todos" },
];

export function ResultadoBadge({ resultado, terminado }: { resultado: string | null; terminado: boolean }) {
    if (resultado === "EGRESADO") return <Badge color="success" variant="soft" className="whitespace-nowrap">Egresó</Badge>;
    if (resultado === "DESERTOR") return <Badge color="destructive" variant="soft" className="whitespace-nowrap">Desertó</Badge>;
    if (terminado) return <Badge color="warning" variant="soft" className="whitespace-nowrap">Sin cierre</Badge>;
    return <Badge color="secondary" className="whitespace-nowrap">En curso</Badge>;
}

/** Barra que aparece al marcar filas: cuántas y qué se puede hacer con ellas. */
export function BarraSeleccion({ cantidad, onLimpiar, children }: { cantidad: number; onLimpiar: () => void; children: React.ReactNode }) {
    if (cantidad === 0) return null;
    return (
        <div className="sticky top-2 z-10 mb-3 flex flex-wrap items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 shadow-sm">
            <span className="text-sm font-semibold text-primary mr-2">
                {cantidad.toLocaleString("es-HN")} {cantidad === 1 ? "seleccionado" : "seleccionados"}
            </span>
            {children}
            <div className="flex-1" />
            <Button type="button" variant="ghost" size="sm" onClick={onLimpiar}>
                <X className="h-4 w-4 mr-1" /> Quitar selección
            </Button>
        </div>
    );
}

export function CierreTab({
    api, filtros, puedeEditar, recargarResumen, proceso,
}: {
    api: Api;
    filtros: FiltrosEgresados;
    puedeEditar: boolean;
    /** Avisa a la página que cambió el cierre (la pestaña de seguimiento depende de él). */
    recargarResumen: () => void;
    /**
     * Cierre de un solo proceso educativo (pestaña del proceso): todas sus
     * matrículas, sin las columnas de curso y período ni el filtro de cursos
     * terminados, que ahí no aplican.
     */
    proceso?: { codigo: string; terminado: boolean };
}) {
    const [estado, setEstado] = useState<Estado>(proceso ? "TODOS" : "SIN_CIERRE");
    const [terminados, setTerminados] = useState(!proceso);
    const [rows, setRows] = useState<FilaCierre[]>([]);
    const [resumen, setResumen] = useState<Resumen | null>(null);
    const [truncado, setTruncado] = useState(false);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState<Set<number>>(new Set());
    const [dialogo, setDialogo] = useState<"egreso" | "desercion" | "quitar" | "subir" | null>(null);
    const [quitando, setQuitando] = useState(false);
    const [descargando, setDescargando] = useState(false);
    const [resultado, setResultado] = useState<ImportResult | null>(null);
    const [resultadoTitulo, setResultadoTitulo] = useState("");

    const params = useMemo(() => ({
        ...filtrosAParams(filtros),
        estado: estado === "TODOS" ? null : estado,
        terminados: terminados ? 1 : null,
    }), [filtros, estado, terminados]);
    const paramsKey = JSON.stringify(params);

    const cargar = useCallback(async () => {
        if (!api.ready) return;
        setLoading(true);
        try {
            const d = await api.get("/egresados/cierre", params);
            setRows(d.data ?? []);
            setResumen(d.resumen ?? null);
            setTruncado(!!d.truncado);
        } catch (e) {
            toast.error(e instanceof ApiError ? e.message : "Error al cargar la lista");
        }
        setLoading(false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [api, paramsKey]);

    useEffect(() => { cargar(); }, [cargar]);
    // Otra lista: la selección anterior ya no aplica.
    useEffect(() => { setSelected(new Set()); }, [paramsKey]);

    const porId = useMemo(() => new Map(rows.map((r) => [r.matricula_id, r])), [rows]);
    const seleccionEnCurso = useMemo(
        () => Array.from(selected).filter((id) => porId.get(id) && !porId.get(id)!.terminado).length,
        [selected, porId],
    );

    // Resultado de una acción masiva o de una carga de Excel.
    const mostrarResultado = (r: ImportResult & { unchanged?: number }, titulo: string) => {
        const warnings = [...(r.warnings ?? [])];
        if (r.unchanged) warnings.push({ message: `${r.unchanged} sin cambios (ya tenían ese resultado o la fila no indicaba resultado)` });
        const res = { ...r, warnings };
        if ((res.errors?.length ?? 0) > 0 || warnings.length > 0) {
            setResultado(res);
            setResultadoTitulo(titulo);
        } else {
            toast.success(r.updated ? `${r.updated} matrícula(s) actualizada(s)` : "Sin cambios");
        }
        setSelected(new Set());
        cargar();
        recargarResumen();
    };

    const aplicar = async (body: Record<string, unknown>, titulo: string) => {
        try {
            const r = await api.send("PATCH", "/egresados/cierre", { matricula_ids: Array.from(selected), ...body });
            setDialogo(null);
            mostrarResultado(r, titulo);
        } catch (e) {
            toast.error(e instanceof ApiError ? e.message : "Error al guardar");
        }
    };

    const descargar = async () => {
        setDescargando(true);
        try { await api.download("/egresados/cierre/excel", params, proceso ? `cierre-${proceso.codigo}.xlsx` : "cierre-cursos.xlsx"); }
        catch (e) { toast.error(e instanceof ApiError ? e.message : "Error al descargar la lista"); }
        setDescargando(false);
    };

    const subir = async (file: File) => {
        const fd = new FormData();
        fd.append("file", file);
        try {
            const r = await api.upload("/egresados/cierre/excel", fd);
            setDialogo(null);
            mostrarResultado(r, "Resultado de la carga de la lista de cierre");
        } catch (e) {
            toast.error(e instanceof ApiError ? e.message : "Error al subir la lista");
        }
    };

    const todasLasColumnas: Columna<FilaCierre>[] = [
        {
            key: "nombre", header: "Estudiante",
            cell: (r) => (
                <div className="min-w-[180px]">
                    <span className="text-sm font-medium text-primary block">{r.nombre}</span>
                    <span className="text-xs text-muted-foreground">{r.identidad}</span>
                </div>
            ),
        },
        {
            key: "curso", header: "Curso",
            cell: (r) => (
                <div className="min-w-[200px] max-w-[22rem]">
                    <span className="text-sm block truncate" title={r.curso_nombre}>{r.curso_nombre}</span>
                    <span className="text-xs text-muted-foreground block truncate" title={r.centro_nombre}>
                        {r.proceso_codigo} · {r.centro_nombre}
                    </span>
                </div>
            ),
        },
        {
            key: "periodo", header: "Período",
            cell: (r) => <span className="text-xs whitespace-nowrap">{fechaCorta(r.fecha_inicial)} – {fechaCorta(r.fecha_final)}</span>,
        },
        {
            key: "resultado", header: "Resultado",
            cell: (r) => <ResultadoBadge resultado={r.resultado} terminado={r.terminado} />,
        },
        {
            key: "detalle", header: "Detalle",
            cell: (r) => r.resultado ? (
                <div className="min-w-[140px] max-w-[18rem]">
                    <span className="text-xs block">{fechaCorta(r.fecha_resultado)}</span>
                    {r.motivo_desercion && <span className="text-xs text-muted-foreground block">{MOTIVOS_DESERCION[r.motivo_desercion]}</span>}
                    {r.observacion_resultado && (
                        <span className="text-xs text-muted-foreground block truncate" title={r.observacion_resultado}>{r.observacion_resultado}</span>
                    )}
                </div>
            ) : <span className="text-xs text-muted-foreground">—</span>,
        },
    ];
    const columnas = proceso
        ? todasLasColumnas.filter((c) => c.key !== "curso" && c.key !== "periodo")
        : todasLasColumnas;

    const tarjetas: Array<{ estado: Estado; label: string; value: number; sub?: string; color: "info" | "warning" | "success" | "destructive" }> = resumen ? [
        { estado: "TODOS", label: "Matrículas", value: resumen.total, color: "info" },
        {
            estado: "SIN_CIERRE", label: proceso && !proceso.terminado ? "En curso" : "Sin cierre", value: resumen.sin_cierre, color: "warning",
            sub: proceso ? undefined : terminados ? "de cursos terminados" : `${resumen.sin_cierre_terminados.toLocaleString("es-HN")} de cursos terminados`,
        },
        { estado: "EGRESADO", label: "Egresados", value: resumen.egresados, color: "success" },
        { estado: "DESERTOR", label: "Desertores", value: resumen.desertores, color: "destructive" },
    ] : [];

    return (
        <div>
            {resumen && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                    {tarjetas.map((t, i) => (
                        <KpiCard
                            key={t.estado} index={i} label={t.label} value={t.value} sub={t.sub} color={t.color}
                            selected={estado === t.estado} onClick={() => setEstado(t.estado)}
                        />
                    ))}
                </div>
            )}

            <Card className="p-4">
                <CardContent className="p-0">
                    <div className="flex flex-wrap items-end gap-4 mb-4">
                        <div className="w-[170px]">
                            <Label className="mb-1 text-xs font-medium text-muted-foreground">Resultado</Label>
                            <Select value={estado} onValueChange={(v) => setEstado(v as Estado)}>
                                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {ESTADOS.map((e) => <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        {!proceso && (
                            <label className="flex items-center gap-2 pb-2 text-sm cursor-pointer select-none">
                                <Switch checked={terminados} onCheckedChange={setTerminados} />
                                Solo cursos terminados
                            </label>
                        )}
                        <div className="flex-1" />
                        <Button variant="outline" size="sm" onClick={descargar} disabled={descargando || rows.length === 0}>
                            {descargando ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
                            Descargar lista
                        </Button>
                        {puedeEditar && (
                            <Button variant="outline" size="sm" onClick={() => setDialogo("subir")}>
                                <Upload className="h-4 w-4 mr-2" /> Subir lista
                            </Button>
                        )}
                    </div>

                    {truncado && (
                        <p className="mb-3 rounded-md bg-warning/10 px-3 py-2 text-xs text-warning">
                            La lista muestra las primeras 5,000 matrículas. Use los filtros (centro, proceso o año) para ver el resto.
                        </p>
                    )}

                    {puedeEditar && (
                        <BarraSeleccion cantidad={selected.size} onLimpiar={() => setSelected(new Set())}>
                            <Button size="sm" color="success" onClick={() => setDialogo("egreso")}>
                                <CheckCircle2 className="h-4 w-4 mr-1" /> Marcar egresados
                            </Button>
                            <Button size="sm" color="destructive" onClick={() => setDialogo("desercion")}>
                                <UserX className="h-4 w-4 mr-1" /> Marcar desertores
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setDialogo("quitar")}>
                                <RotateCcw className="h-4 w-4 mr-1" /> Quitar resultado
                            </Button>
                        </BarraSeleccion>
                    )}

                    {loading ? <SkeletonTable /> : (
                        <TablaSeleccion
                            rows={rows}
                            getId={(r) => r.matricula_id}
                            columns={columnas}
                            selectable={puedeEditar}
                            selected={selected}
                            onSelectedChange={setSelected}
                            onRowClick={puedeEditar ? (r) => {
                                const s = new Set(selected);
                                if (s.has(r.matricula_id)) s.delete(r.matricula_id); else s.add(r.matricula_id);
                                setSelected(s);
                            } : undefined}
                            empty={
                                <div className="text-sm text-muted-foreground">
                                    {estado === "SIN_CIERRE"
                                        ? "No hay matrículas pendientes de cierre con estos filtros."
                                        : "No hay matrículas con estos filtros."}
                                    {estado !== "TODOS" && (
                                        <Button variant="ghost" size="sm" className="ml-2" onClick={() => setEstado("TODOS")}>Ver todas</Button>
                                    )}
                                </div>
                            }
                        />
                    )}
                </CardContent>
            </Card>

            <DialogoEgreso
                open={dialogo === "egreso"}
                onOpenChange={(o) => setDialogo(o ? "egreso" : null)}
                cantidad={selected.size}
                enCurso={seleccionEnCurso}
                onConfirm={({ fecha, observacion }) => aplicar(
                    { resultado: "EGRESADO", fecha_resultado: fecha, ...(observacion.trim() ? { observacion } : {}) },
                    "Resultado del registro de egreso",
                )}
            />
            <DialogoDesercion
                open={dialogo === "desercion"}
                onOpenChange={(o) => setDialogo(o ? "desercion" : null)}
                cantidad={selected.size}
                onConfirm={({ fecha, motivo, observacion }) => aplicar(
                    { resultado: "DESERTOR", fecha_resultado: fecha, motivo_desercion: motivo, ...(observacion.trim() ? { observacion } : {}) },
                    "Resultado del registro de deserción",
                )}
            />
            <AlertDialog open={dialogo === "quitar"} onOpenChange={(o) => { if (!quitando) setDialogo(o ? "quitar" : null); }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Quitar el resultado?</AlertDialogTitle>
                        <AlertDialogDescription>
                            {selected.size.toLocaleString("es-HN")} matrícula(s) volverán a quedar sin cierre. No se puede
                            quitar el egreso de quienes ya tienen seguimiento o pasantía registrados.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={quitando}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            color="destructive"
                            disabled={quitando}
                            onClick={async (e) => {
                                e.preventDefault();
                                setQuitando(true);
                                await aplicar({ resultado: null }, "Resultado de quitar el cierre");
                                setQuitando(false);
                            }}
                        >
                            {quitando ? "Quitando..." : "Quitar resultado"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            <DialogoSubirExcel
                open={dialogo === "subir"}
                onOpenChange={(o) => setDialogo(o ? "subir" : null)}
                titulo="Subir lista de cierre"
                descripcion={
                    <>
                        Use la lista descargada con <b>Descargar lista</b>: complete la columna <b>Resultado</b> (Egresó,
                        Desertó o Pendiente) y, para los desertores, la fecha y el motivo. Las filas sin resultado no se tocan.
                    </>
                }
                onUpload={(file) => subir(file)}
            />
            <ImportResultModal
                open={!!resultado}
                onOpenChange={(o) => { if (!o) setResultado(null); }}
                entityLabel="matrículas"
                title={resultadoTitulo}
                errorIntro="Estas matrículas no se actualizaron. Corrija el dato y vuelva a intentarlo; las demás sí se guardaron."
                result={resultado}
            />
        </div>
    );
}
