"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import toast from "react-hot-toast";
import { useSession } from "next-auth/react";
import { ChevronsUpDown, FileText, Loader2, Search, Trash2, Upload, X } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { cn } from "@/lib/utils";

const schema = z.object({
    nombres: z.string().min(2, "Mínimo 2 caracteres"),
    apellidos: z.string().min(2, "Mínimo 2 caracteres"),
    titulo_obtenido: z.string().optional(),
    otros_titulos: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const apiBase = process.env.NEXT_PUBLIC_API_URL;

const InstructorModal = ({
    instructor,
    centroId,
    centros,
    isOpen,
    setIsOpen,
    reloadList,
}: {
    instructor: any;
    centroId?: string | number;
    centros?: { id: number; nombre: string }[];
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    reloadList: () => void;
}) => {
    const { data: session } = useSession() as any;
    const isEdit = !!instructor;
    const authHeaders: any = { Authorization: `Bearer ${session?.user?.session}` };
    const showCentroSelect = !centroId && !!centros;

    const [selectedCentroId, setSelectedCentroId] = useState<string>("");
    const [centroOpen, setCentroOpen] = useState(false);
    const [centroSearch, setCentroSearch] = useState("");
    const [centrosLocal, setCentrosLocal] = useState<{ id: number; nombre: string }[]>([]);
    const [pendingFile, setPendingFile] = useState<File | null>(null);
    const [existingPdf, setExistingPdf] = useState<string | null>(null);
    const [pdfUploading, setPdfUploading] = useState(false);
    const [pdfDeleting, setPdfDeleting] = useState(false);

    const centrosList = (centros?.length ? centros : centrosLocal).map((c) => ({ id: Number(c.id), nombre: String(c.nombre) }));
    const selectedCentro = useMemo(() => centrosList.find((c) => c.id.toString() === selectedCentroId), [centrosList, selectedCentroId]);
    const filteredCentros = useMemo(
        () =>
            centroSearch.trim()
                ? centrosList.filter((c) => c.nombre.toLowerCase().includes(centroSearch.toLowerCase()))
                : centrosList,
        [centrosList, centroSearch]
    );

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<FormData>({
        resolver: zodResolver(schema),
        mode: "onSubmit",
        defaultValues: { nombres: "", apellidos: "", titulo_obtenido: "", otros_titulos: "" },
    });

    const onDrop = useCallback((accepted: File[]) => {
        if (accepted[0]) setPendingFile(accepted[0]);
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        maxFiles: 1,
        maxSize: 10 * 1024 * 1024,
        disabled: isSubmitting || pdfUploading,
        onDropRejected: (rejections) => {
            const err = rejections[0]?.errors[0];
            if (err?.code === "file-too-large") toast.error("El archivo excede 10MB");
            else toast.error(err?.message ?? "Archivo rechazado");
        },
    });

    useEffect(() => {
        if (instructor) {
            reset({
                nombres: instructor.nombres ?? "",
                apellidos: instructor.apellidos ?? "",
                titulo_obtenido: instructor.titulo_obtenido ?? "",
                otros_titulos: instructor.otros_titulos ?? "",
            });
            setExistingPdf(instructor.pdf || null);
            setSelectedCentroId(instructor.centro_id != null ? String(instructor.centro_id) : "");
        } else {
            reset({ nombres: "", apellidos: "", titulo_obtenido: "", otros_titulos: "" });
            setExistingPdf(null);
            setSelectedCentroId(centroId != null ? String(centroId) : "");
        }
        setPendingFile(null);
    }, [instructor, reset, isOpen, centroId]);

    useEffect(() => {
        if (!isOpen || !showCentroSelect || centros?.length || !session?.user?.session) return;
        const token = (session as any)?.user?.session;
        fetch(`${apiBase}/api/centros/centros?all=true`, { headers: { Authorization: `Bearer ${token}` } })
            .then((r) => r.json())
            .then((d) => setCentrosLocal(d.data ?? []))
            .catch(() => setCentrosLocal([]));
    }, [isOpen, showCentroSelect, centros?.length, session?.user?.session]);

    const uploadPdf = async (instructorId: number | string) => {
        if (!pendingFile) return;
        setPdfUploading(true);
        try {
            const fd = new FormData();
            fd.append("file", pendingFile);
            const res = await fetch(`${apiBase}/api/centros/instructors/${instructorId}/pdf`, {
                method: "POST",
                headers: authHeaders,
                body: fd,
            });
            if (!res.ok) {
                const d = await res.json();
                toast.error(d.message ?? "Error al subir hoja de vida");
            }
        } catch {
            toast.error("Error al subir hoja de vida");
        }
        setPdfUploading(false);
    };

    const deletePdf = async () => {
        if (!instructor?.id) return;
        setPdfDeleting(true);
        try {
            const res = await fetch(`${apiBase}/api/centros/instructors/${instructor.id}/pdf`, {
                method: "DELETE",
                headers: authHeaders,
            });
            if (res.ok) {
                setExistingPdf(null);
                toast.success("Hoja de vida eliminada");
            } else {
                const d = await res.json();
                toast.error(d.message ?? "Error al eliminar");
            }
        } catch {
            toast.error("Error al eliminar hoja de vida");
        }
        setPdfDeleting(false);
    };

    const downloadPdf = async () => {
        if (!instructor?.id) return;
        try {
            const res = await fetch(`${apiBase}/api/centros/instructors/${instructor.id}/pdf`, {
                headers: authHeaders,
            });
            if (!res.ok) { toast.error("Error al descargar"); return; }
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `hoja_de_vida_${instructor.nombres}_${instructor.apellidos}`.replace(/\s+/g, "_");
            a.click();
            URL.revokeObjectURL(url);
        } catch {
            toast.error("Error al descargar");
        }
    };

    const onSubmit = async (data: FormData) => {
        try {
            const effectiveCentroId = centroId || selectedCentroId;
            if (showCentroSelect && !selectedCentroId) {
                toast.error("Selecciona un centro");
                return;
            }

            const useGlobal = !centroId;
            const url = useGlobal
                ? `${apiBase}/api/centros/instructors`
                : `${apiBase}/api/centros/centros/${effectiveCentroId}/instructors`;
            const method = isEdit ? "PUT" : "POST";
            const body: any = { ...data };
            if (isEdit) body.id = instructor.id;
            if (!centroId) body.centro_id = Number(effectiveCentroId);

            const request = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json", ...authHeaders },
                body: JSON.stringify(body),
            });

            if (request.ok) {
                const response = await request.json();
                const newId = isEdit ? instructor.id : response.id;

                if (pendingFile && newId) {
                    await uploadPdf(newId);
                }

                toast.success(isEdit ? "Instructor actualizado" : "Instructor creado");
                setIsOpen(false);
                reloadList();
            } else {
                const response = await request.json();
                toast.error(response.message ?? "Error al guardar");
            }
        } catch {
            toast.error("Error al guardar");
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => { if (!isSubmitting && !pdfUploading) setIsOpen(open); }}>
            <DialogContent size="lg">
                <DialogTitle>{isEdit ? "Editar Instructor" : "Crear Instructor"}</DialogTitle>
                <form onSubmit={handleSubmit(onSubmit)} noValidate autoComplete="off">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                        {showCentroSelect && (
                            <div className="md:col-span-2">
                                <Label className="mb-1 font-medium text-default-600">Centro *</Label>
                                <Popover open={centroOpen} onOpenChange={(open) => { setCentroOpen(open); if (!open) setCentroSearch(""); }}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            disabled={isSubmitting || isEdit}
                                            className="w-full justify-between font-normal"
                                        >
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
                                                <input
                                                    type="text"
                                                    placeholder="Buscar centro..."
                                                    value={centroSearch}
                                                    onChange={(e) => setCentroSearch(e.target.value)}
                                                    className="flex h-9 w-full bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground"
                                                />
                                            </div>
                                        </div>
                                        <div className="max-h-[260px] overflow-y-auto p-1">
                                            {filteredCentros.length === 0 ? (
                                                <p className="py-4 text-center text-sm text-muted-foreground">No se encontraron centros.</p>
                                            ) : (
                                                filteredCentros.map((c) => (
                                                    <button
                                                        key={c.id}
                                                        type="button"
                                                        className="w-full rounded-sm px-2 py-2 text-left text-sm text-foreground hover:bg-accent hover:text-foreground focus:bg-accent focus:text-foreground focus:outline-none"
                                                        onClick={() => {
                                                            setSelectedCentroId(String(c.id));
                                                            setCentroOpen(false);
                                                        }}
                                                    >
                                                        {c.nombre}
                                                    </button>
                                                ))
                                            )}
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            </div>
                        )}
                        <div>
                            <Label htmlFor="nombres" className="mb-1 font-medium text-default-600">Nombres *</Label>
                            <Input disabled={isSubmitting} {...register("nombres")} id="nombres" placeholder="Nombres" />
                            {errors.nombres && <p className="text-destructive text-xs mt-1">{errors.nombres.message}</p>}
                        </div>
                        <div>
                            <Label htmlFor="apellidos" className="mb-1 font-medium text-default-600">Apellidos *</Label>
                            <Input disabled={isSubmitting} {...register("apellidos")} id="apellidos" placeholder="Apellidos" />
                            {errors.apellidos && <p className="text-destructive text-xs mt-1">{errors.apellidos.message}</p>}
                        </div>
                        <div>
                            <Label htmlFor="titulo_obtenido" className="mb-1 font-medium text-default-600">Título obtenido</Label>
                            <Input disabled={isSubmitting} {...register("titulo_obtenido")} id="titulo_obtenido" placeholder="Título obtenido" />
                        </div>
                        <div>
                            <Label htmlFor="otros_titulos" className="mb-1 font-medium text-default-600">Otros títulos</Label>
                            <Input disabled={isSubmitting} {...register("otros_titulos")} id="otros_titulos" placeholder="Otros títulos" />
                        </div>
                        <div className="md:col-span-2">
                            <Label className="mb-1 font-medium text-default-600">Hoja de vida</Label>
                            {existingPdf && !pendingFile ? (
                                <div className="flex items-center gap-2 mt-1 p-3 border rounded-lg bg-muted/30">
                                    <FileText className="h-5 w-5 text-primary shrink-0" />
                                    <button type="button" onClick={downloadPdf} className="text-sm text-primary underline truncate">
                                        Descargar archivo actual
                                    </button>
                                    <Button type="button" variant="ghost" size="icon" className="ml-auto text-destructive shrink-0" onClick={deletePdf} disabled={pdfDeleting}>
                                        {pdfDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                    </Button>
                                </div>
                            ) : pendingFile ? (
                                <div className="flex items-center gap-2 mt-1 p-3 border rounded-lg bg-muted/30">
                                    <FileText className="h-5 w-5 text-primary shrink-0" />
                                    <span className="text-sm truncate">{pendingFile.name}</span>
                                    <Button type="button" variant="ghost" size="icon" className="ml-auto shrink-0" onClick={() => setPendingFile(null)}>
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            ) : (
                                <div
                                    {...getRootProps()}
                                    className={cn(
                                        "mt-1 border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
                                        isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/30 hover:border-primary/50",
                                    )}
                                >
                                    <input {...getInputProps()} />
                                    <Upload className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
                                    <p className="text-sm text-muted-foreground">
                                        {isDragActive ? "Suelta el archivo aquí" : "Arrastra un archivo o haz clic para subir"}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">pdf, docx, xlsx, jpg, png · Máx. 10MB</p>
                                </div>
                            )}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={isSubmitting || pdfUploading}>Cancelar</Button>
                        <Button type="submit" disabled={isSubmitting || pdfUploading}>
                            {(isSubmitting || pdfUploading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isEdit ? "Guardar" : "Crear"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default InstructorModal;
