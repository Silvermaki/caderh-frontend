"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Download, Upload, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { useSession } from "next-auth/react";

const apiBase = process.env.NEXT_PUBLIC_API_PROXY;

type EntityType = "instructors" | "students" | "courses" | "processes";

const ENTITY_LABELS: Record<EntityType, { filename: string; label: string }> = {
    instructors: { filename: "plantilla-instructores", label: "instructores" },
    students: { filename: "plantilla-estudiantes", label: "estudiantes" },
    courses: { filename: "plantilla-cursos", label: "cursos" },
    processes: { filename: "plantilla-procesos", label: "procesos" },
};

interface ExcelActionsProps {
    centroId: string | number | null;
    entity: EntityType;
    onSuccess?: () => void;
    disabled?: boolean;
}

export default function ExcelActions({ centroId, entity, onSuccess, disabled }: ExcelActionsProps) {
    const { data: session } = useSession() as any;
    const [importing, setImporting] = useState(false);

    const meta = ENTITY_LABELS[entity];
    const isDisabled = disabled || !centroId;
    const authHeaders = { Authorization: `Bearer ${session?.user?.session}` };

    const download = async () => {
        if (!centroId || !session) return;
        try {
            const res = await fetch(
                `${apiBase}/centros/centros/${centroId}/excel/${entity}`,
                { headers: authHeaders },
            );
            if (!res.ok) { toast.error("Error al descargar plantilla"); return; }
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${meta.filename}.xlsx`;
            a.click();
            URL.revokeObjectURL(url);
        } catch {
            toast.error("Error al descargar plantilla");
        }
    };

    const importFile = async (file: File) => {
        if (!centroId || !session) return;
        setImporting(true);
        try {
            const fd = new FormData();
            fd.append("file", file);
            const res = await fetch(
                `${apiBase}/centros/centros/${centroId}/excel/${entity}`,
                { method: "POST", headers: authHeaders, body: fd },
            );
            const json = await res.json();
            if (res.ok) {
                const parts: string[] = [];
                if (json.created > 0) parts.push(`${json.created} creados`);
                if (json.updated > 0) parts.push(`${json.updated} actualizados`);
                if (json.deleted > 0) parts.push(`${json.deleted} eliminados`);
                const summary = parts.length ? parts.join(", ") : "Sin cambios";

                if (json.warnings?.length > 0) {
                    toast(`${summary}. ${json.warnings.length} registro(s) protegido(s) no eliminado(s).`, { icon: "⚠️", duration: 6000 });
                } else if (json.errors?.length > 0) {
                    toast.error(`${summary}. ${json.errors.length} error(es) encontrado(s).`, { duration: 6000 });
                } else {
                    toast.success(summary);
                }
                onSuccess?.();
            } else {
                toast.error(json.message ?? "Error al importar");
            }
        } catch {
            toast.error("Error al importar archivo");
        }
        setImporting(false);
    };

    const triggerFileInput = () => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".xlsx";
        input.onchange = (e: any) => {
            const file = e.target.files?.[0];
            if (file) importFile(file);
        };
        input.click();
    };

    if (isDisabled) {
        return (
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <span className="inline-flex gap-2">
                            <Button variant="outline" size="sm" disabled>
                                <Download className="h-4 w-4 mr-2" />
                                Descargar Formato
                            </Button>
                            <Button variant="outline" size="sm" disabled>
                                <Upload className="h-4 w-4 mr-2" />
                                Importar Excel
                            </Button>
                        </span>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Seleccione un centro primero</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
    }

    return (
        <span className="inline-flex gap-2">
            <Button variant="outline" size="sm" onClick={download}>
                <Download className="h-4 w-4 mr-2" />
                Descargar Formato
            </Button>
            <Button variant="outline" size="sm" onClick={triggerFileInput} disabled={importing}>
                {importing
                    ? <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    : <Upload className="h-4 w-4 mr-2" />}
                Importar Excel
            </Button>
        </span>
    );
}
