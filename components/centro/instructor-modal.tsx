"use client";

import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import toast from "react-hot-toast";
import { useSession } from "next-auth/react";
import { Loader2 } from "lucide-react";

const schema = z.object({
    identidad: z.string().min(1, "Requerido"),
    nombres: z.string().min(2, "Mínimo 2 caracteres"),
    apellidos: z.string().min(2, "Mínimo 2 caracteres"),
    departamento_id: z.string().min(1, "Requerido"),
    municipio_id: z.string().min(1, "Requerido"),
    email: z.string().optional(),
    telefono: z.string().optional(),
    celular: z.string().optional(),
    sexo: z.string().min(1, "Requerido"),
    estado_civil: z.string().min(1, "Requerido"),
    nivel_escolaridad_id: z.string().optional(),
    titulo_obtenido: z.string().optional(),
    fecha_nacimiento: z.string().optional(),
    direccion: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const InstructorModal = ({
    instructor,
    centroId,
    isOpen,
    setIsOpen,
    reloadList,
}: {
    instructor: any;
    centroId: string | number;
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    reloadList: () => void;
}) => {
    const { data: session } = useSession() as any;
    const isEdit = !!instructor;
    const [departamentos, setDepartamentos] = useState<any[]>([]);
    const [municipios, setMunicipios] = useState<any[]>([]);
    const [nivelEscolaridades, setNivelEscolaridades] = useState<any[]>([]);

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
            identidad: "", nombres: "", apellidos: "", departamento_id: "", municipio_id: "",
            email: "", telefono: "", celular: "", sexo: "", estado_civil: "",
            nivel_escolaridad_id: "", titulo_obtenido: "", fecha_nacimiento: "", direccion: "",
        },
    });

    const watchDepartamento = watch("departamento_id");

    useEffect(() => {
        if (!isOpen || !session) return;
        const headers = { Authorization: `Bearer ${session?.user?.session}` };
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/centros/departamentos`, { headers })
            .then(r => r.json()).then(d => setDepartamentos(d.data ?? []));
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/centros/nivel-escolaridades`, { headers })
            .then(r => r.json()).then(d => setNivelEscolaridades(d.data ?? []));
    }, [isOpen, session]);

    useEffect(() => {
        if (!watchDepartamento || !session) { setMunicipios([]); return; }
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/centros/municipios?departamento_id=${watchDepartamento}`, {
            headers: { Authorization: `Bearer ${session?.user?.session}` },
        }).then(r => r.json()).then(d => setMunicipios(d.data ?? []));
    }, [watchDepartamento, session]);

    useEffect(() => {
        if (instructor) {
            reset({
                identidad: instructor.identidad ?? "",
                nombres: instructor.nombres ?? "",
                apellidos: instructor.apellidos ?? "",
                departamento_id: instructor.departamento_id?.toString() ?? "",
                municipio_id: instructor.municipio_id?.toString() ?? "",
                email: instructor.email ?? "",
                telefono: instructor.telefono ?? "",
                celular: instructor.celular ?? "",
                sexo: instructor.sexo ?? "",
                estado_civil: instructor.estado_civil ?? "",
                nivel_escolaridad_id: instructor.nivel_escolaridad_id?.toString() ?? "",
                titulo_obtenido: instructor.titulo_obtenido ?? "",
                fecha_nacimiento: instructor.fecha_nacimiento ?? "",
                direccion: instructor.direccion ?? "",
            });
        } else {
            reset({
                identidad: "", nombres: "", apellidos: "", departamento_id: "", municipio_id: "",
                email: "", telefono: "", celular: "", sexo: "", estado_civil: "",
                nivel_escolaridad_id: "", titulo_obtenido: "", fecha_nacimiento: "", direccion: "",
            });
        }
    }, [instructor, reset, isOpen]);

    const onSubmit = async (data: FormData) => {
        try {
            const url = `${process.env.NEXT_PUBLIC_API_URL}/api/centros/centros/${centroId}/instructors`;
            const method = isEdit ? "PUT" : "POST";
            const body: any = {
                ...data,
                departamento_id: Number(data.departamento_id),
                municipio_id: Number(data.municipio_id),
                nivel_escolaridad_id: data.nivel_escolaridad_id ? Number(data.nivel_escolaridad_id) : 0,
            };
            if (isEdit) body.id = instructor.id;

            const request = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.user?.session}` },
                body: JSON.stringify(body),
            });

            if (request.ok) {
                toast.success(isEdit ? "Instructor actualizado" : "Instructor creado");
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
                <DialogTitle>{isEdit ? "Editar Instructor" : "Crear Instructor"}</DialogTitle>
                <form onSubmit={handleSubmit(onSubmit)} noValidate autoComplete="off">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                        <div>
                            <Label htmlFor="identidad" className="mb-1 font-medium text-default-600">Identidad *</Label>
                            <Input disabled={isSubmitting} {...register("identidad")} id="identidad" placeholder="Número de identidad" />
                            {errors.identidad && <p className="text-destructive text-xs mt-1">{errors.identidad.message}</p>}
                        </div>
                        <div>
                            <Label htmlFor="fecha_nacimiento" className="mb-1 font-medium text-default-600">Fecha nacimiento</Label>
                            <Input disabled={isSubmitting} {...register("fecha_nacimiento")} id="fecha_nacimiento" placeholder="DD/MM/AAAA" />
                        </div>
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
                            <Label className="mb-1 font-medium text-default-600">Sexo *</Label>
                            <Select value={watch("sexo")} onValueChange={(v) => setValue("sexo", v)} disabled={isSubmitting}>
                                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="M">Masculino</SelectItem>
                                    <SelectItem value="F">Femenino</SelectItem>
                                </SelectContent>
                            </Select>
                            {errors.sexo && <p className="text-destructive text-xs mt-1">{errors.sexo.message}</p>}
                        </div>
                        <div>
                            <Label className="mb-1 font-medium text-default-600">Estado civil *</Label>
                            <Select value={watch("estado_civil")} onValueChange={(v) => setValue("estado_civil", v)} disabled={isSubmitting}>
                                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Soltero(a)">Soltero(a)</SelectItem>
                                    <SelectItem value="Casado(a)">Casado(a)</SelectItem>
                                    <SelectItem value="Divorciado(a)">Divorciado(a)</SelectItem>
                                    <SelectItem value="Viudo(a)">Viudo(a)</SelectItem>
                                    <SelectItem value="Unión libre">Unión libre</SelectItem>
                                </SelectContent>
                            </Select>
                            {errors.estado_civil && <p className="text-destructive text-xs mt-1">{errors.estado_civil.message}</p>}
                        </div>
                        <div>
                            <Label className="mb-1 font-medium text-default-600">Departamento *</Label>
                            <Select value={watch("departamento_id")} onValueChange={(v) => { setValue("departamento_id", v); setValue("municipio_id", ""); }} disabled={isSubmitting}>
                                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                                <SelectContent>
                                    {departamentos.map((d: any) => <SelectItem key={d.id} value={d.id.toString()}>{d.nombre}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            {errors.departamento_id && <p className="text-destructive text-xs mt-1">{errors.departamento_id.message}</p>}
                        </div>
                        <div>
                            <Label className="mb-1 font-medium text-default-600">Municipio *</Label>
                            <Select value={watch("municipio_id")} onValueChange={(v) => setValue("municipio_id", v)} disabled={isSubmitting || !watchDepartamento}>
                                <SelectTrigger><SelectValue placeholder={watchDepartamento ? "Seleccionar" : "Seleccione departamento"} /></SelectTrigger>
                                <SelectContent>
                                    {municipios.map((m: any) => <SelectItem key={m.id} value={m.id.toString()}>{m.nombre}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            {errors.municipio_id && <p className="text-destructive text-xs mt-1">{errors.municipio_id.message}</p>}
                        </div>
                        <div>
                            <Label htmlFor="email" className="mb-1 font-medium text-default-600">Email</Label>
                            <Input disabled={isSubmitting} {...register("email")} id="email" placeholder="correo@ejemplo.com" />
                        </div>
                        <div>
                            <Label htmlFor="telefono" className="mb-1 font-medium text-default-600">Teléfono</Label>
                            <Input disabled={isSubmitting} {...register("telefono")} id="telefono" placeholder="Teléfono" />
                        </div>
                        <div>
                            <Label htmlFor="celular" className="mb-1 font-medium text-default-600">Celular</Label>
                            <Input disabled={isSubmitting} {...register("celular")} id="celular" placeholder="Celular" />
                        </div>
                        <div>
                            <Label htmlFor="direccion" className="mb-1 font-medium text-default-600">Dirección</Label>
                            <Input disabled={isSubmitting} {...register("direccion")} id="direccion" placeholder="Dirección" />
                        </div>
                        <div>
                            <Label className="mb-1 font-medium text-default-600">Nivel escolaridad</Label>
                            <Select value={watch("nivel_escolaridad_id")} onValueChange={(v) => setValue("nivel_escolaridad_id", v)} disabled={isSubmitting}>
                                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                                <SelectContent>
                                    {nivelEscolaridades.map((n: any) => <SelectItem key={n.id} value={n.id.toString()}>{n.nombre}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label htmlFor="titulo_obtenido" className="mb-1 font-medium text-default-600">Título obtenido</Label>
                            <Input disabled={isSubmitting} {...register("titulo_obtenido")} id="titulo_obtenido" placeholder="Título obtenido" />
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

export default InstructorModal;
