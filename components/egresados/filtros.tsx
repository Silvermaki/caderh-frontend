"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ChevronsUpDown, Loader2, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { fechaCorta, type Api } from "./api";

export interface Opcion {
    value: string;
    label: string;
    /** Texto secundario (centro, fechas…). */
    detalle?: string;
}

export interface FiltrosEgresados {
    proyecto: string | null;
    centro: string | null;
    /** El proceso guarda también su etiqueta para pintarla sin volver a buscarla. */
    proceso: Opcion | null;
    anio: string | null;
    search: string;
}

export const FILTROS_INICIALES: FiltrosEgresados = {
    proyecto: null,
    centro: null,
    proceso: null,
    // Año en curso: el histórico del SGC trae miles de matrículas sin cierre.
    anio: String(new Date().getFullYear()),
    search: "",
};

/** Filtros → parámetros de las listas del backend (/egresados/*). */
export function filtrosAParams(f: FiltrosEgresados) {
    return {
        proyecto: f.proyecto,
        centro: f.centro,
        proceso: f.proceso?.value ?? null,
        anio: f.anio,
        search: f.search.trim() || null,
    };
}

const TRIGGER =
    "h-9 w-full min-w-0 justify-between font-normal px-3 bg-background border-default-300 text-default-500 hover:bg-transparent hover:text-default-500 hover:border-default-300";

// ─── Lista con buscador (mismo patrón que el filtro de centros de Estudiantes) ──

function ListaBuscable({
    value, opciones, onChange, todos, placeholder, cargando, buscar, onBuscar, vacio,
}: {
    value: string | null;
    opciones: Opcion[];
    onChange: (o: Opcion | null) => void;
    todos: string;
    placeholder: string;
    cargando?: boolean;
    /** Si se da, la búsqueda la resuelve el servidor (onBuscar) en vez de filtrar aquí. */
    buscar?: string;
    onBuscar?: (texto: string) => void;
    vacio?: string;
}) {
    const [open, setOpen] = useState(false);
    const [texto, setTexto] = useState("");
    const remoto = !!onBuscar;
    const visibles = useMemo(() => {
        if (remoto || !texto.trim()) return opciones;
        const q = texto.toLowerCase();
        return opciones.filter((o) => `${o.label} ${o.detalle ?? ""}`.toLowerCase().includes(q));
    }, [opciones, texto, remoto]);
    const actual = opciones.find((o) => o.value === value);

    return (
        <Popover open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setTexto(""); onBuscar?.(""); } }}>
            <PopoverTrigger asChild>
                <Button type="button" variant="outline" className={TRIGGER}>
                    <span className="truncate text-left">{actual?.label ?? (value ? "…" : todos)}</span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[min(26rem,90vw)] p-0" align="start">
                <div className="p-2 border-b">
                    <div className="flex items-center gap-2 rounded-md border bg-background px-2">
                        <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <input
                            type="text"
                            autoFocus
                            placeholder={placeholder}
                            value={remoto ? (buscar ?? texto) : texto}
                            onChange={(e) => { setTexto(e.target.value); onBuscar?.(e.target.value); }}
                            className="flex h-9 w-full bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground"
                        />
                        {cargando && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                    </div>
                </div>
                <div className="max-h-[280px] overflow-y-auto p-1">
                    <button
                        type="button"
                        className={cn("w-full text-left rounded-sm px-2 py-1.5 text-sm hover:bg-accent", !value && "bg-accent font-medium")}
                        onClick={() => { onChange(null); setOpen(false); }}
                    >
                        {todos}
                    </button>
                    {!cargando && visibles.length === 0 && (
                        <p className="p-2 text-sm text-muted-foreground text-center">{vacio ?? "Sin resultados"}</p>
                    )}
                    {visibles.map((o) => (
                        <button
                            key={o.value}
                            type="button"
                            className={cn("w-full text-left rounded-sm px-2 py-1.5 text-sm hover:bg-accent", value === o.value && "bg-accent font-medium")}
                            onClick={() => { onChange(o); setOpen(false); }}
                        >
                            <span className="block truncate">{o.label}</span>
                            {o.detalle && <span className="block truncate text-xs text-muted-foreground">{o.detalle}</span>}
                        </button>
                    ))}
                </div>
            </PopoverContent>
        </Popover>
    );
}

// ─── Barra de filtros compartida por las dos pestañas ─────────────────────────

export function BarraFiltros({
    api, filtros, onChange,
}: {
    api: Api;
    filtros: FiltrosEgresados;
    onChange: (f: FiltrosEgresados) => void;
}) {
    const [centros, setCentros] = useState<Opcion[]>([]);
    const [proyectos, setProyectos] = useState<Opcion[]>([]);
    const [procesos, setProcesos] = useState<Opcion[]>([]);
    const [buscarProceso, setBuscarProceso] = useState("");
    const [cargandoProcesos, setCargandoProcesos] = useState(false);
    const [texto, setTexto] = useState(filtros.search);

    useEffect(() => {
        if (!api.ready) return;
        api.get("/centros/centros", { all: "true" })
            .then((d) => setCentros((d.data ?? []).map((c: any) => ({
                value: String(c.id), label: c.nombre, detalle: c.siglas || undefined,
            }))))
            .catch(() => {});
        api.get("/supervisor/projects", { all: "true" })
            .then((d) => setProyectos((d.data ?? []).map((p: any) => ({ value: String(p.id), label: p.name }))))
            .catch(() => {});
    }, [api]);

    // Procesos: búsqueda en el servidor (hay cientos), acotada al centro elegido.
    useEffect(() => {
        if (!api.ready) return;
        let vivo = true;
        setCargandoProcesos(true);
        const t = setTimeout(() => {
            api.get("/centros/processes", {
                limit: 50, offset: 0, sort: "fecha_inicial", desc: "desc",
                search: buscarProceso.trim() || null, centro_id: filtros.centro,
            })
                .then((d) => {
                    if (!vivo) return;
                    setProcesos((d.data ?? []).map((p: any) => ({
                        value: String(p.id),
                        label: `${p.codigo} · ${p.curso_nombre ?? p.nombre}`,
                        detalle: `${p.centro_nombre ?? ""} · ${fechaCorta(p.fecha_inicial)} – ${fechaCorta(p.fecha_final)}`,
                    })));
                })
                .catch(() => { if (vivo) setProcesos([]); })
                .finally(() => { if (vivo) setCargandoProcesos(false); });
        }, 300);
        return () => { vivo = false; clearTimeout(t); };
    }, [api, buscarProceso, filtros.centro]);

    // Búsqueda por nombre/DNI con pausa (no una consulta por tecla).
    useEffect(() => { setTexto(filtros.search); }, [filtros.search]);
    useEffect(() => {
        if (texto === filtros.search) return;
        const t = setTimeout(() => onChange({ ...filtros, search: texto }), 400);
        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [texto]);

    const anioActual = new Date().getFullYear();
    const anios = Array.from({ length: anioActual - 2018 + 1 }, (_, i) => String(anioActual - i));
    const procesoOpciones = filtros.proceso && !procesos.some((p) => p.value === filtros.proceso!.value)
        ? [filtros.proceso, ...procesos]
        : procesos;
    const hayFiltros = !!(filtros.proyecto || filtros.centro || filtros.proceso || filtros.search ||
        filtros.anio !== FILTROS_INICIALES.anio);

    return (
        <div className="flex flex-wrap items-end gap-3">
            <div className="w-[220px]">
                <Label className="mb-1 text-xs font-medium text-muted-foreground">Centro</Label>
                <ListaBuscable
                    value={filtros.centro}
                    opciones={centros}
                    todos="Todos los centros"
                    placeholder="Buscar centro..."
                    // Al cambiar de centro el proceso elegido deja de aplicar.
                    onChange={(o) => onChange({ ...filtros, centro: o?.value ?? null, proceso: null })}
                />
            </div>
            <div className="w-[250px]">
                <Label className="mb-1 text-xs font-medium text-muted-foreground">Proceso educativo</Label>
                <ListaBuscable
                    value={filtros.proceso?.value ?? null}
                    opciones={procesoOpciones}
                    todos="Todos los procesos"
                    placeholder="Código, curso o centro..."
                    cargando={cargandoProcesos}
                    buscar={buscarProceso}
                    onBuscar={setBuscarProceso}
                    vacio="Sin procesos con ese texto"
                    // Un proceso es una cohorte concreta: el año deja de filtrar.
                    onChange={(o) => onChange({ ...filtros, proceso: o, anio: o ? null : filtros.anio })}
                />
            </div>
            <div className="w-[140px]">
                <Label className="mb-1 text-xs font-medium text-muted-foreground">Año de inicio</Label>
                <Select
                    value={filtros.anio ?? "all"}
                    onValueChange={(v) => onChange({ ...filtros, anio: v === "all" ? null : v })}
                >
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        {anios.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
            <div className="w-[220px]">
                <Label className="mb-1 text-xs font-medium text-muted-foreground">Proyecto</Label>
                <ListaBuscable
                    value={filtros.proyecto}
                    opciones={proyectos}
                    todos="Todos los proyectos"
                    placeholder="Buscar proyecto..."
                    onChange={(o) => onChange({ ...filtros, proyecto: o?.value ?? null })}
                />
            </div>
            <div className="w-[210px]">
                <Label className="mb-1 text-xs font-medium text-muted-foreground">Estudiante</Label>
                <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        value={texto}
                        onChange={(e) => setTexto(e.target.value)}
                        placeholder="Nombre o DNI"
                        className="h-9 pl-8"
                    />
                </div>
            </div>
            {hayFiltros && (
                <Button
                    type="button" variant="ghost" size="sm" className="h-9"
                    onClick={() => { setTexto(""); onChange(FILTROS_INICIALES); }}
                >
                    <X className="h-4 w-4 mr-1" /> Limpiar filtros
                </Button>
            )}
        </div>
    );
}
