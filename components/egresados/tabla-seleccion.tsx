"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Icon } from "@iconify/react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

export interface Columna<T> {
    key: string;
    header: React.ReactNode;
    className?: string;
    cell: (row: T) => React.ReactNode;
}

/**
 * Tabla de las listas de egresados: paginación en el cliente (el backend
 * devuelve la lista filtrada completa) y selección múltiple que sobrevive al
 * cambio de página, para aplicar acciones masivas.
 */
export function TablaSeleccion<T>({
    rows, getId, columns, selectable, selected, onSelectedChange, onRowClick, empty,
}: {
    rows: T[];
    getId: (row: T) => number;
    columns: Columna<T>[];
    selectable: boolean;
    selected: Set<number>;
    onSelectedChange: (s: Set<number>) => void;
    onRowClick?: (row: T) => void;
    empty: React.ReactNode;
}) {
    const [page, setPage] = useState(0);
    const [size, setSize] = useState(25);
    useEffect(() => { setPage(0); }, [rows]);

    const pages = Math.max(1, Math.ceil(rows.length / size));
    const visibles = useMemo(() => rows.slice(page * size, (page + 1) * size), [rows, page, size]);
    const idsPagina = visibles.map(getId);
    const marcadosPagina = idsPagina.filter((id) => selected.has(id)).length;
    const paginaCompleta = idsPagina.length > 0 && marcadosPagina === idsPagina.length;

    const toggle = (id: number, on: boolean) => {
        const s = new Set(selected);
        if (on) s.add(id); else s.delete(id);
        onSelectedChange(s);
    };
    const togglePagina = (on: boolean) => {
        const s = new Set(selected);
        idsPagina.forEach((id) => (on ? s.add(id) : s.delete(id)));
        onSelectedChange(s);
    };

    if (rows.length === 0) return <div className="py-12 text-center">{empty}</div>;

    return (
        <div>
            {/* Selección de toda la lista (patrón Gmail): marcar la página ofrece marcar todo. */}
            {selectable && paginaCompleta && rows.length > visibles.length && selected.size < rows.length && (
                <div className="mb-2 rounded-md bg-primary/5 px-3 py-2 text-sm text-center">
                    Están marcados los {marcadosPagina} de esta página.{" "}
                    <button type="button" className="font-semibold text-primary hover:underline"
                        onClick={() => onSelectedChange(new Set(rows.map(getId)))}>
                        Marcar los {rows.length.toLocaleString("es-HN")} de la lista
                    </button>
                </div>
            )}
            {selectable && selected.size === rows.length && rows.length > visibles.length && (
                <div className="mb-2 rounded-md bg-primary/5 px-3 py-2 text-sm text-center">
                    Están marcados los {rows.length.toLocaleString("es-HN")} de la lista.{" "}
                    <button type="button" className="font-semibold text-primary hover:underline"
                        onClick={() => onSelectedChange(new Set())}>
                        Quitar la selección
                    </button>
                </div>
            )}

            <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            {selectable && (
                                <TableHead className="w-10 px-2">
                                    <Checkbox
                                        size="sm"
                                        aria-label="Marcar la página"
                                        checked={paginaCompleta ? true : marcadosPagina > 0 ? "indeterminate" : false}
                                        onCheckedChange={(v) => togglePagina(v === true)}
                                    />
                                </TableHead>
                            )}
                            {columns.map((c) => (
                                <TableHead key={c.key} className={cn("px-2 text-xs font-semibold", c.className)}>{c.header}</TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {visibles.map((row) => {
                            const id = getId(row);
                            const marcado = selected.has(id);
                            return (
                                <TableRow
                                    key={id}
                                    data-state={marcado ? "selected" : undefined}
                                    className={cn(onRowClick && "cursor-pointer")}
                                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                                >
                                    {selectable && (
                                        <TableCell className="w-10 px-2" onClick={(e) => e.stopPropagation()}>
                                            <Checkbox
                                                size="sm"
                                                aria-label="Marcar fila"
                                                checked={marcado}
                                                onCheckedChange={(v) => toggle(id, v === true)}
                                            />
                                        </TableCell>
                                    )}
                                    {columns.map((c) => (
                                        <TableCell key={c.key} className={cn("p-2 align-top", c.className)}>{c.cell(row)}</TableCell>
                                    ))}
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 mt-4 pt-4 border-t">
                <div className="flex items-center gap-4">
                    <Select value={String(size)} onValueChange={(v) => { setSize(Number(v)); setPage(0); }}>
                        <SelectTrigger size="sm" className="w-[90px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {[25, 50, 100].map((n) => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <span className="text-xs text-muted-foreground">
                        {(page * size + 1).toLocaleString("es-HN")}–{Math.min((page + 1) * size, rows.length).toLocaleString("es-HN")} de{" "}
                        <b className="text-foreground">{rows.length.toLocaleString("es-HN")}</b>
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" className="h-8 w-8" disabled={page === 0}
                        onClick={() => setPage((p) => p - 1)} aria-label="Página anterior">
                        <Icon icon="heroicons:chevron-left" className="w-5 h-5" />
                    </Button>
                    <span className="text-xs text-muted-foreground tabular-nums">Página {page + 1} de {pages}</span>
                    <Button variant="outline" size="icon" className="h-8 w-8" disabled={page + 1 >= pages}
                        onClick={() => setPage((p) => p + 1)} aria-label="Página siguiente">
                        <Icon icon="heroicons:chevron-right" className="w-5 h-5" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
