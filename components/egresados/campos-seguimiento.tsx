"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    ESTATUS_SEGUIMIENTO, RANGOS_INGRESO, asOptions, detallePorEstatus, type EstatusSeguimiento,
} from "@/lib/egresados-catalogos";
import { fechaCorta, hoyIso } from "./api";

/** Estatus de un corte y su detalle, como lo edita el formulario. */
export interface DetalleSeguimiento {
    estatus: EstatusSeguimiento | "";
    empresa: string;
    puesto: string;
    rango_salario: string;
    negocio: string;
    rubro: string;
    rango_ingreso: string;
    kit_entregado: "" | "Sí" | "No";
    /** Lempiras, como texto del input. */
    kit_monto: string;
    institucion: string;
    carrera: string;
    fecha_inicio: string;
    observaciones: string;
}

export const DETALLE_VACIO: DetalleSeguimiento = {
    estatus: "", empresa: "", puesto: "", rango_salario: "", negocio: "", rubro: "", rango_ingreso: "",
    kit_entregado: "", kit_monto: "", institucion: "", carrera: "", fecha_inicio: "", observaciones: "",
};

/** Registro guardado → valores del formulario (para corregirlo). */
export function detalleDesdeRegistro(r: any): DetalleSeguimiento {
    return {
        estatus: r?.estatus ?? "",
        empresa: r?.empresa ?? "",
        puesto: r?.puesto ?? "",
        rango_salario: r?.rango_salario ?? "",
        negocio: r?.negocio ?? "",
        rubro: r?.rubro ?? "",
        rango_ingreso: r?.rango_ingreso ?? "",
        kit_entregado: r?.kit_entregado === true ? "Sí" : r?.kit_entregado === false ? "No" : "",
        kit_monto: r?.kit_monto_cents != null ? String(Number(r.kit_monto_cents) / 100) : "",
        institucion: r?.institucion ?? "",
        carrera: r?.carrera ?? "",
        fecha_inicio: r?.fecha_inicio ?? "",
        observaciones: r?.observaciones ?? "",
    };
}

/** Valores del formulario → cuerpo de la petición (el backend descarta lo que no aplica al estatus). */
export function detalleAPayload(d: DetalleSeguimiento) {
    return {
        estatus: d.estatus,
        empresa: d.empresa, puesto: d.puesto, rango_salario: d.rango_salario,
        negocio: d.negocio, rubro: d.rubro, rango_ingreso: d.rango_ingreso,
        kit_entregado: d.kit_entregado, kit_monto: d.kit_entregado === "Sí" ? d.kit_monto : "",
        institucion: d.institucion, carrera: d.carrera,
        fecha_inicio: d.fecha_inicio, observaciones: d.observaciones,
    };
}

/** Resumen de una línea del detalle de un corte (empresa · puesto · rango…). */
export function detalleCorte(s: any): string {
    if (!s) return "";
    const desde = s.fecha_inicio ? `desde ${fechaCorta(s.fecha_inicio)}` : null;
    switch (detallePorEstatus(s.estatus)) {
        case "empleo":
            return [s.empresa, s.puesto, s.rango_salario, desde].filter(Boolean).join(" · ");
        case "emprendimiento": {
            const kit = s.kit_entregado === true
                ? `Kit: sí${s.kit_monto_cents != null ? ` (L ${(Number(s.kit_monto_cents) / 100).toLocaleString("es-HN", { minimumFractionDigits: 2 })})` : ""}`
                : s.kit_entregado === false ? "Kit: no" : null;
            return [s.negocio, s.rubro, s.rango_ingreso, kit, desde].filter(Boolean).join(" · ");
        }
        case "estudio":
            return [s.institucion, s.carrera, desde].filter(Boolean).join(" · ");
        default:
            return "";
    }
}

/** Mensaje de validación del lado del cliente ('' si está bien). */
export function validarDetalle(d: DetalleSeguimiento): string {
    if (!d.estatus) return "Seleccione el estatus";
    if (d.kit_entregado === "Sí" && d.kit_monto.trim() !== "") {
        const n = Number(d.kit_monto.replace(/,/g, ""));
        if (!Number.isFinite(n) || n < 0) return "El monto del kit debe ser un número (ej. 2500)";
    }
    return "";
}

const NINGUNO = "__none__";
const ESTATUS_OPCIONES = asOptions(ESTATUS_SEGUIMIENTO);

function Campo({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
    return (
        <div className={className}>
            <Label className="mb-1 font-medium text-default-600">{label}</Label>
            {children}
        </div>
    );
}

function SelectRango({ value, onChange, disabled }: { value: string; onChange: (v: string) => void; disabled?: boolean }) {
    return (
        <Select value={value || NINGUNO} onValueChange={(v) => onChange(v === NINGUNO ? "" : v)} disabled={disabled}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
                <SelectItem value={NINGUNO}>Sin dato</SelectItem>
                {RANGOS_INGRESO.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
            </SelectContent>
        </Select>
    );
}

/** Estatus del corte + el detalle que corresponde (empleo, emprendimiento o estudio). */
export function CamposSeguimiento({
    value, onChange, disabled,
}: {
    value: DetalleSeguimiento;
    onChange: (v: DetalleSeguimiento) => void;
    disabled?: boolean;
}) {
    const set = <K extends keyof DetalleSeguimiento>(k: K, v: DetalleSeguimiento[K]) => onChange({ ...value, [k]: v });
    const tipo = detallePorEstatus(value.estatus);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Campo label="Estatus *" className="md:col-span-2">
                <Select value={value.estatus || undefined} onValueChange={(v) => set("estatus", v as EstatusSeguimiento)} disabled={disabled}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar estatus" /></SelectTrigger>
                    <SelectContent>
                        {ESTATUS_OPCIONES.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                    </SelectContent>
                </Select>
            </Campo>

            {tipo === "empleo" && (
                <>
                    <Campo label="Empresa">
                        <Input disabled={disabled} value={value.empresa} maxLength={300} onChange={(e) => set("empresa", e.target.value)} placeholder="Dónde trabaja" />
                    </Campo>
                    <Campo label="Puesto">
                        <Input disabled={disabled} value={value.puesto} maxLength={300} onChange={(e) => set("puesto", e.target.value)} placeholder="Cargo u oficio" />
                    </Campo>
                    <Campo label="Rango de salario">
                        <SelectRango value={value.rango_salario} onChange={(v) => set("rango_salario", v)} disabled={disabled} />
                    </Campo>
                    <Campo label="Fecha de inicio en el empleo">
                        <DatePicker value={value.fecha_inicio} onChange={(v) => set("fecha_inicio", v ?? "")} maxDate={hoyIso()} clearable disabled={disabled} placeholder="Opcional" />
                    </Campo>
                </>
            )}

            {tipo === "emprendimiento" && (
                <>
                    <Campo label="Nombre del negocio">
                        <Input disabled={disabled} value={value.negocio} maxLength={300} onChange={(e) => set("negocio", e.target.value)} />
                    </Campo>
                    <Campo label="Rubro">
                        <Input disabled={disabled} value={value.rubro} maxLength={300} onChange={(e) => set("rubro", e.target.value)} placeholder="Ej. Panadería, reparación de celulares" />
                    </Campo>
                    <Campo label="Rango de ingreso mensual">
                        <SelectRango value={value.rango_ingreso} onChange={(v) => set("rango_ingreso", v)} disabled={disabled} />
                    </Campo>
                    <Campo label="Inicio del negocio">
                        <DatePicker value={value.fecha_inicio} onChange={(v) => set("fecha_inicio", v ?? "")} maxDate={hoyIso()} clearable disabled={disabled} placeholder="Opcional" />
                    </Campo>
                    <Campo label="¿Recibió kit de emprendimiento?">
                        <Select value={value.kit_entregado || NINGUNO} onValueChange={(v) => set("kit_entregado", (v === NINGUNO ? "" : v) as DetalleSeguimiento["kit_entregado"])} disabled={disabled}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value={NINGUNO}>Sin dato</SelectItem>
                                <SelectItem value="Sí">Sí</SelectItem>
                                <SelectItem value="No">No</SelectItem>
                            </SelectContent>
                        </Select>
                    </Campo>
                    {value.kit_entregado === "Sí" && (
                        <Campo label="Monto del kit (L)">
                            <Input disabled={disabled} inputMode="decimal" value={value.kit_monto} onChange={(e) => set("kit_monto", e.target.value)} placeholder="Ej. 2500" />
                        </Campo>
                    )}
                </>
            )}

            {tipo === "estudio" && (
                <>
                    <Campo label="Institución">
                        <Input disabled={disabled} value={value.institucion} maxLength={300} onChange={(e) => set("institucion", e.target.value)} placeholder="Centro educativo" />
                    </Campo>
                    <Campo label="Carrera o programa">
                        <Input disabled={disabled} value={value.carrera} maxLength={300} onChange={(e) => set("carrera", e.target.value)} />
                    </Campo>
                    <Campo label="Fecha de inicio de los estudios">
                        <DatePicker value={value.fecha_inicio} onChange={(v) => set("fecha_inicio", v ?? "")} maxDate={hoyIso()} clearable disabled={disabled} placeholder="Opcional" />
                    </Campo>
                </>
            )}

            <Campo label="Observaciones" className="md:col-span-2">
                <Textarea disabled={disabled} value={value.observaciones} maxLength={1000} onChange={(e) => set("observaciones", e.target.value)} className="min-h-[70px]" placeholder="Opcional" />
                <p className="text-[11px] text-muted-foreground text-right mt-0.5">{value.observaciones.length}/1000</p>
            </Campo>
        </div>
    );
}
