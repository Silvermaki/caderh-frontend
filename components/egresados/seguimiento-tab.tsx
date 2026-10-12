"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { AlertTriangle, ClipboardList, Download, Loader2, Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import SkeletonTable from "@/components/skeleton-table";
import { KpiCard, type KpiColor } from "@/components/report/variants/kpi-card";
import { ImportResultModal, type ImportResult } from "@/components/centro/import-result-modal";
import {
    ESTATUS_SEGUIMIENTO, GRUPOS_ESTATUS, RESULTADOS_PASANTIA,
    type EstatusSeguimiento, type GrupoEstatus, type ResultadoPasantia,
} from "@/lib/egresados-catalogos";
import { ApiError, fechaCorta, type Api } from "./api";
import { filtrosAParams, type FiltrosEgresados } from "./filtros";
import { TablaSeleccion, type Columna } from "./tabla-seleccion";
import { BarraSeleccion } from "./cierre-tab";
import { DialogoSeguimiento, DialogoSubirExcel } from "./dialogos";
import { detalleAPayload, detalleCorte } from "./campos-seguimiento";
import { HistorialSheet } from "./historial-sheet";

type Filtro = GrupoEstatus | "TODOS";

interface FilaSeguimiento {
    matricula_id: number;
    identidad: string;
    nombre: string;
    fecha_resultado: string;
    proceso_codigo: string;
    centro_nombre: string;
    curso_nombre: string;
    total_seguimientos: number;
    ultimo: {
        fecha_corte: string;
        estatus: EstatusSeguimiento;
        [k: string]: any;
    } | null;
    pasantia: {
        empresa: string | null;
        resultado: ResultadoPasantia;
        porcentaje_avance: number | null;
    } | null;
}

type Resumen = Record<GrupoEstatus, number> & { egresados: number; pendientes_cierre: number };

const TARJETAS: Array<{ grupo: Filtro; label: string; color: KpiColor }> = [
    { grupo: "TODOS", label: "Egresados", color: "info" },
    { grupo: "TRABAJANDO", label: GRUPOS_ESTATUS.TRABAJANDO, color: "success" },
    { grupo: "EMPRENDIENDO", label: GRUPOS_ESTATUS.EMPRENDIENDO, color: "accent" },
    { grupo: "ESTUDIANDO", label: GRUPOS_ESTATUS.ESTUDIANDO, color: "info" },
    { grupo: "BUSQUEDA_EMPLEO", label: GRUPOS_ESTATUS.BUSQUEDA_EMPLEO, color: "warning" },
    { grupo: "EN_PASANTIA", label: GRUPOS_ESTATUS.EN_PASANTIA, color: "info" },
    { grupo: "OTRO", label: GRUPOS_ESTATUS.OTRO, color: "warning" },
    { grupo: "SIN_SEGUIMIENTO", label: GRUPOS_ESTATUS.SIN_SEGUIMIENTO, color: "destructive" },
];

export function SeguimientoTab({
    api, filtros, puedeEditar, version, onIrACierre,
}: {
    api: Api;
    filtros: FiltrosEgresados;
    puedeEditar: boolean;
    /** Cambia cuando el cierre se modificó en la otra pestaña. */
    version: number;
    onIrACierre: () => void;
}) {
    const [filtro, setFiltro] = useState<Filtro>("TODOS");
    const [rows, setRows] = useState<FilaSeguimiento[]>([]);
    const [resumen, setResumen] = useState<Resumen | null>(null);
    const [truncado, setTruncado] = useState(false);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState<Set<number>>(new Set());
    const [dialogo, setDialogo] = useState<"registrar" | "subir" | null>(null);
    const [descargando, setDescargando] = useState(false);
    const [resultado, setResultado] = useState<ImportResult | null>(null);
    const [resultadoTitulo, setResultadoTitulo] = useState("");
    const [abierto, setAbierto] = useState<number | null>(null);

    const params = useMemo(() => ({
        ...filtrosAParams(filtros),
        estatus: filtro === "TODOS" ? null : filtro,
    }), [filtros, filtro]);
    const paramsKey = JSON.stringify(params);

    const cargar = useCallback(async (silencioso = false) => {
        if (!api.ready) return;
        if (!silencioso) setLoading(true);
        try {
            const d = await api.get("/egresados/seguimiento", params);
            setRows(d.data ?? []);
            setResumen(d.resumen ?? null);
            setTruncado(!!d.truncado);
        } catch (e) {
            toast.error(e instanceof ApiError ? e.message : "Error al cargar la lista");
        }
        setLoading(false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [api, paramsKey]);

    useEffect(() => { cargar(); }, [cargar, version]);
    useEffect(() => { setSelected(new Set()); }, [paramsKey]);

    // El corte no puede ser anterior al egreso de ninguno de los seleccionados.
    const minFecha = useMemo(() => {
        let max = "";
        for (const r of rows) if (selected.has(r.matricula_id) && r.fecha_resultado > max) max = r.fecha_resultado;
        return max || undefined;
    }, [rows, selected]);

    const mostrarResultado = (r: ImportResult, titulo: string) => {
        const total = (r.created ?? 0) + (r.updated ?? 0);
        if ((r.errors?.length ?? 0) > 0 || (r.warnings?.length ?? 0) > 0) {
            setResultado(r);
            setResultadoTitulo(titulo);
        } else {
            toast.success(total ? `Seguimiento registrado para ${total} egresado(s)` : "Sin cambios");
        }
        setSelected(new Set());
        cargar(true);
    };

    const registrar = async ({ fecha_corte, detalle }: { fecha_corte: string; detalle: any }) => {
        try {
            const r = await api.send("POST", "/egresados/seguimiento", {
                fecha_corte, matricula_ids: Array.from(selected), ...detalleAPayload(detalle),
            });
            setDialogo(null);
            mostrarResultado(r, "Resultado del registro de seguimiento");
        } catch (e) {
            toast.error(e instanceof ApiError ? e.message : "Error al guardar");
        }
    };

    const descargar = async () => {
        setDescargando(true);
        try { await api.download("/egresados/seguimiento/excel", params, "seguimiento-egresados.xlsx"); }
        catch (e) { toast.error(e instanceof ApiError ? e.message : "Error al descargar la lista"); }
        setDescargando(false);
    };

    const subir = async (file: File, fechaCorte: string | null) => {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("fecha_corte", fechaCorte ?? "");
        try {
            const r = await api.upload("/egresados/seguimiento/excel", fd);
            setDialogo(null);
            mostrarResultado(r, "Resultado de la carga del corte de seguimiento");
        } catch (e) {
            toast.error(e instanceof ApiError ? e.message : "Error al subir la lista");
        }
    };

    const columnas: Columna<FilaSeguimiento>[] = [
        {
            key: "nombre", header: "Egresado",
            cell: (r) => (
                <div className="min-w-[150px]">
                    <span className="text-sm font-medium text-primary block">{r.nombre}</span>
                    <span className="text-xs text-muted-foreground">{r.identidad}</span>
                </div>
            ),
        },
        {
            key: "curso", header: "Curso",
            cell: (r) => (
                <div className="min-w-[160px] max-w-[15rem]">
                    <span className="text-sm block truncate" title={r.curso_nombre}>{r.curso_nombre}</span>
                    <span className="text-xs text-muted-foreground block truncate" title={r.centro_nombre}>{r.proceso_codigo} · {r.centro_nombre}</span>
                </div>
            ),
        },
        {
            key: "egreso", header: "Egresó",
            cell: (r) => <span className="text-xs whitespace-nowrap">{fechaCorta(r.fecha_resultado)}</span>,
        },
        {
            key: "estatus", header: "Último estatus",
            cell: (r) => r.ultimo ? (
                <div className="min-w-[130px]">
                    <Badge color="info" variant="soft" className="whitespace-nowrap">{ESTATUS_SEGUIMIENTO[r.ultimo.estatus] ?? r.ultimo.estatus}</Badge>
                    <span className="text-xs text-muted-foreground block mt-1">al {fechaCorta(r.ultimo.fecha_corte)}</span>
                </div>
            ) : <Badge color="secondary" className="whitespace-nowrap">Sin seguimiento</Badge>,
        },
        {
            key: "detalle", header: "Detalle",
            cell: (r) => {
                const t = detalleCorte(r.ultimo);
                return t
                    ? <span className="text-xs block max-w-[14rem] truncate" title={t}>{t}</span>
                    : <span className="text-xs text-muted-foreground">—</span>;
            },
        },
        {
            key: "pasantia", header: "Pasantía",
            cell: (r) => r.pasantia ? (
                <span className="text-xs block max-w-[10rem] truncate" title={[r.pasantia.empresa, RESULTADOS_PASANTIA[r.pasantia.resultado]].filter(Boolean).join(" · ")}>
                    {[r.pasantia.empresa, RESULTADOS_PASANTIA[r.pasantia.resultado]].filter(Boolean).join(" · ")}
                    {r.pasantia.porcentaje_avance != null ? ` (${r.pasantia.porcentaje_avance}%)` : ""}
                </span>
            ) : <span className="text-xs text-muted-foreground">—</span>,
        },
        {
            key: "cortes", header: "Cortes", className: "text-right",
            cell: (r) => <span className="text-xs tabular-nums">{r.total_seguimientos}</span>,
        },
    ];

    return (
        <div>
            {resumen && resumen.pendientes_cierre > 0 && (
                <div className="mb-4 flex flex-wrap items-center gap-3 rounded-lg border border-warning/40 bg-warning/5 px-4 py-3">
                    <AlertTriangle className="h-5 w-5 text-warning shrink-0" />
                    <p className="text-sm flex-1 min-w-[16rem]">
                        Hay <b>{resumen.pendientes_cierre.toLocaleString("es-HN")}</b> matrícula(s) de cursos terminados sin cierre
                        con estos filtros. Aquí solo aparecen los egresados: registre primero el resultado del curso.
                    </p>
                    <Button size="sm" variant="outline" onClick={onIrACierre}>Ir al cierre</Button>
                </div>
            )}

            {resumen && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                    {TARJETAS.map((t, i) => {
                        const n = t.grupo === "TODOS" ? resumen.egresados : resumen[t.grupo] ?? 0;
                        const pct = t.grupo !== "TODOS" && resumen.egresados > 0
                            ? `${Math.round((n / resumen.egresados) * 100)}% de los egresados` : undefined;
                        return (
                            <KpiCard
                                key={t.grupo} index={i} label={t.label} value={n} sub={pct} color={t.color}
                                selected={filtro === t.grupo} onClick={() => setFiltro(t.grupo)}
                            />
                        );
                    })}
                </div>
            )}

            <Card className="p-4">
                <CardContent className="p-0">
                    <div className="flex flex-wrap items-end gap-4 mb-4">
                        <div className="w-[200px]">
                            <Label className="mb-1 text-xs font-medium text-muted-foreground">Último estatus</Label>
                            <Select value={filtro} onValueChange={(v) => setFiltro(v as Filtro)}>
                                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="TODOS">Todos</SelectItem>
                                    {(Object.keys(GRUPOS_ESTATUS) as GrupoEstatus[]).map((g) => (
                                        <SelectItem key={g} value={g}>{GRUPOS_ESTATUS[g]}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex-1" />
                        <Button variant="outline" size="sm" onClick={descargar} disabled={descargando || rows.length === 0}>
                            {descargando ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
                            Descargar lista
                        </Button>
                        {puedeEditar && (
                            <Button variant="outline" size="sm" onClick={() => setDialogo("subir")}>
                                <Upload className="h-4 w-4 mr-2" /> Subir corte
                            </Button>
                        )}
                    </div>

                    {truncado && (
                        <p className="mb-3 rounded-md bg-warning/10 px-3 py-2 text-xs text-warning">
                            La lista muestra los primeros 5,000 egresados. Use los filtros para ver el resto.
                        </p>
                    )}

                    {puedeEditar && (
                        <BarraSeleccion cantidad={selected.size} onLimpiar={() => setSelected(new Set())}>
                            <Button size="sm" onClick={() => setDialogo("registrar")}>
                                <ClipboardList className="h-4 w-4 mr-1" /> Registrar seguimiento
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
                            onRowClick={(r) => setAbierto(r.matricula_id)}
                            empty={
                                <div className="text-sm text-muted-foreground">
                                    {resumen?.egresados === 0
                                        ? "Todavía no hay egresados con estos filtros. Registre el egreso en la pestaña Cierre de cursos."
                                        : "No hay egresados con este estatus."}
                                </div>
                            }
                        />
                    )}
                </CardContent>
            </Card>

            <DialogoSeguimiento
                open={dialogo === "registrar"}
                onOpenChange={(o) => setDialogo(o ? "registrar" : null)}
                titulo="Registrar seguimiento"
                descripcion={
                    <>
                        Se registrará el mismo estatus y detalle para <b>{selected.size.toLocaleString("es-HN")}</b> egresado(s);
                        si alguno ya tiene un registro con esa fecha de corte, se reemplaza. Para datos distintos por
                        joven use <b>Descargar lista</b> y <b>Subir corte</b>.
                    </>
                }
                minFecha={minFecha}
                textoBoton="Registrar"
                onConfirm={registrar}
            />
            <DialogoSubirExcel
                open={dialogo === "subir"}
                onOpenChange={(o) => setDialogo(o ? "subir" : null)}
                titulo="Subir corte de seguimiento"
                descripcion={
                    <>
                        Use la lista descargada con <b>Descargar lista</b>: trae el último estatus de cada egresado para que
                        solo cambie lo que se movió. Las filas con <b>Estatus</b> vacío se omiten; nada se borra.
                    </>
                }
                pedirFechaCorte
                onUpload={subir}
            />
            <ImportResultModal
                open={!!resultado}
                onOpenChange={(o) => { if (!o) setResultado(null); }}
                entityLabel="seguimientos"
                title={resultadoTitulo}
                errorIntro="Estas filas no se registraron. Corrija el dato y vuelva a intentarlo; las demás sí se guardaron."
                result={resultado}
            />
            <HistorialSheet
                api={api}
                matriculaId={abierto}
                onClose={() => setAbierto(null)}
                puedeEditar={puedeEditar}
                onCambio={() => cargar(true)}
            />
        </div>
    );
}
