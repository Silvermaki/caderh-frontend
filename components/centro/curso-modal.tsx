"use client";

import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import toast from "react-hot-toast";
import { useSession } from "next-auth/react";
import { Loader2 } from "lucide-react";

const schema = z.object({
    codigo: z.string().min(1, "Requerido"),
    nombre: z.string().min(2, "Mínimo 2 caracteres"),
    codigo_programa: z.string().min(1, "Requerido"),
    total_horas: z.string().min(1, "Requerido"),
    taller: z.string().optional(),
    objetivo: z.string().min(3, "Mínimo 3 caracteres"),
    departamento_id: z.string().optional(),
    municipio_id: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const CursoModal = ({
    curso,
    centroId,
    isOpen,
    setIsOpen,
    reloadList,
}: {
    curso: any;
    centroId: string | number;
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    reloadList: () => void;
}) => {
    const { data: session } = useSession() as any;
    const isEdit = !!curso;
    const [departamentos, setDepartamentos] = useState<any[]>([]);
    const [municipios, setMunicipios] = useState<any[]>([]);

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        watch,
        formState: { errors, isSubmitting },
    } = useForm<FormData>({
        resolver: zodResolver(schema),
        mode: "onSubmit",
        defaultValues: {
            codigo: "", nombre: "", codigo_programa: "", total_horas: "",
            taller: "1", objetivo: "", departamento_id: "", municipio_id: "",
        },
    });

    const watchDepartamento = watch("departamento_id");

    useEffect(() => {
        if (!isOpen || !session) return;
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/centros/departamentos`, {
            headers: { Authorization: `Bearer ${session?.user?.session}` },
        }).then(r => r.json()).then(d => setDepartamentos(d.data ?? []));
    }, [isOpen, session]);

    useEffect(() => {
        if (!watchDepartamento || !session) { setMunicipios([]); return; }
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/centros/municipios?departamento_id=${watchDepartamento}`, {
            headers: { Authorization: `Bearer ${session?.user?.session}` },
        }).then(r => r.json()).then(d => setMunicipios(d.data ?? []));
    }, [watchDepartamento, session]);

    useEffect(() => {
        if (curso) {
            reset({
                codigo: curso.codigo?.toString() ?? "",
                nombre: curso.nombre ?? "",
                codigo_programa: curso.codigo_programa ?? "",
                total_horas: curso.total_horas ?? "",
                taller: curso.taller?.toString() ?? "1",
                objetivo: curso.objetivo ?? "",
                departamento_id: curso.departamento_id?.toString() ?? "",
                municipio_id: curso.municipio_id?.toString() ?? "",
            });
        } else {
            reset({
                codigo: "", nombre: "", codigo_programa: "", total_horas: "",
                taller: "1", objetivo: "", departamento_id: "", municipio_id: "",
            });
        }
    }, [curso, reset, isOpen]);

    const onSubmit = async (data: FormData) => {
        try {
            const url = `${process.env.NEXT_PUBLIC_API_URL}/api/centros/centros/${centroId}/cursos`;
            const method = isEdit ? "PUT" : "POST";
            const body: any = {
                ...data,
                codigo: Number(data.codigo),
                taller: Number(data.taller ?? 1),
                departamento_id: data.departamento_id ? Number(data.departamento_id) : null,
                municipio_id: data.municipio_id ? Number(data.municipio_id) : null,
            };
            if (isEdit) body.id = curso.id;

            const request = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.user?.session}` },
                body: JSON.stringify(body),
            });

            if (request.ok) {
                toast.success(isEdit ? "Curso actualizado" : "Curso creado");
                setIsOpen(false);
                reloadList();
            } else {
                const response = await request.json();
                toast.error(response.message ?? "Error al guardar");
            }
        } catch (error: any) {
            toast.error("Error al guardar");
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => { if (!isSubmitting) { setIsOpen(open); } }}>
            <DialogContent size="2xl">
                <DialogTitle>{isEdit ? "Editar Curso" : "Crear Curso"}</DialogTitle>
                <form onSubmit={handleSubmit(onSubmit)} noValidate autoComplete="off">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                        <div>
                            <Label htmlFor="cur-codigo" className="mb-1 font-medium text-default-600">Código *</Label>
                            <Input disabled={isSubmitting} {...register("codigo")} id="cur-codigo" placeholder="Código numérico" type="number" />
                            {errors.codigo && <p className="text-destructive text-xs mt-1">{errors.codigo.message}</p>}
                        </div>
                        <div>
                            <Label htmlFor="cur-nombre" className="mb-1 font-medium text-default-600">Nombre *</Label>
                            <Input disabled={isSubmitting} {...register("nombre")} id="cur-nombre" placeholder="Nombre del curso" />
                            {errors.nombre && <p className="text-destructive text-xs mt-1">{errors.nombre.message}</p>}
                        </div>
                        <div>
                            <Label htmlFor="cur-codigo_programa" className="mb-1 font-medium text-default-600">Código programa *</Label>
                            <Input disabled={isSubmitting} {...register("codigo_programa")} id="cur-codigo_programa" placeholder="Código del programa" />
                            {errors.codigo_programa && <p className="text-destructive text-xs mt-1">{errors.codigo_programa.message}</p>}
                        </div>
                        <div>
                            <Label htmlFor="cur-total_horas" className="mb-1 font-medium text-default-600">Total horas *</Label>
                            <Input disabled={isSubmitting} {...register("total_horas")} id="cur-total_horas" placeholder="Ej: 120" />
                            {errors.total_horas && <p className="text-destructive text-xs mt-1">{errors.total_horas.message}</p>}
                        </div>
                        <div>
                            <Label className="mb-1 font-medium text-default-600">Taller</Label>
                            <Select value={watch("taller")} onValueChange={(v) => setValue("taller", v)} disabled={isSubmitting}>
                                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="1">Sí</SelectItem>
                                    <SelectItem value="0">No</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="md:col-span-1" />
                        <div>
                            <Label className="mb-1 font-medium text-default-600">Departamento</Label>
                            <Select value={watch("departamento_id") ?? ""} onValueChange={(v) => { setValue("departamento_id", v); setValue("municipio_id", ""); }} disabled={isSubmitting}>
                                <SelectTrigger><SelectValue placeholder="Opcional" /></SelectTrigger>
                                <SelectContent>
                                    {departamentos.map((d: any) => <SelectItem key={d.id} value={d.id.toString()}>{d.nombre}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label className="mb-1 font-medium text-default-600">Municipio</Label>
                            <Select value={watch("municipio_id") ?? ""} onValueChange={(v) => setValue("municipio_id", v)} disabled={isSubmitting || !watchDepartamento}>
                                <SelectTrigger><SelectValue placeholder={watchDepartamento ? "Opcional" : "Seleccione departamento"} /></SelectTrigger>
                                <SelectContent>
                                    {municipios.map((m: any) => <SelectItem key={m.id} value={m.id.toString()}>{m.nombre}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="md:col-span-2">
                            <Label htmlFor="cur-objetivo" className="mb-1 font-medium text-default-600">Objetivo *</Label>
                            <Textarea disabled={isSubmitting} {...register("objetivo")} id="cur-objetivo" placeholder="Objetivo del curso" className="min-h-[80px]" />
                            {errors.objetivo && <p className="text-destructive text-xs mt-1">{errors.objetivo.message}</p>}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={isSubmitting}>Cancelar</Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isEdit ? "Guardar" : "Crear"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default CursoModal;
