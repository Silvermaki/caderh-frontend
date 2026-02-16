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
    fecha_nacimiento: z.string().optional(),
    sangre: z.string().min(1, "Requerido"),
    vive: z.string().min(1, "Requerido"),
    numero_dep: z.string().min(1, "Requerido"),
    direccion: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const EstudianteModal = ({
    estudiante,
    centroId,
    isOpen,
    setIsOpen,
    reloadList,
}: {
    estudiante: any;
    centroId: string | number;
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    reloadList: () => void;
}) => {
    const { data: session } = useSession() as any;
    const isEdit = !!estudiante;
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
            identidad: "", nombres: "", apellidos: "", departamento_id: "", municipio_id: "",
            email: "", telefono: "", celular: "", sexo: "", estado_civil: "",
            fecha_nacimiento: "", sangre: "", vive: "", numero_dep: "", direccion: "",
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
        if (estudiante) {
            reset({
                identidad: estudiante.identidad ?? "",
                nombres: estudiante.nombres ?? "",
                apellidos: estudiante.apellidos ?? "",
                departamento_id: estudiante.departamento_id?.toString() ?? "",
                municipio_id: estudiante.municipio_id?.toString() ?? "",
                email: estudiante.email ?? "",
                telefono: estudiante.telefono ?? "",
                celular: estudiante.celular ?? "",
                sexo: estudiante.sexo ?? "",
                estado_civil: estudiante.estado_civil ?? "",
                fecha_nacimiento: estudiante.fecha_nacimiento ?? "",
                sangre: estudiante.sangre ?? "",
                vive: estudiante.vive ?? "",
                numero_dep: estudiante.numero_dep ?? "",
                direccion: estudiante.direccion ?? "",
            });
        } else {
            reset({
                identidad: "", nombres: "", apellidos: "", departamento_id: "", municipio_id: "",
                email: "", telefono: "", celular: "", sexo: "", estado_civil: "",
                fecha_nacimiento: "", sangre: "", vive: "", numero_dep: "", direccion: "",
            });
        }
    }, [estudiante, reset, isOpen]);

    const onSubmit = async (data: FormData) => {
        try {
            const url = `${process.env.NEXT_PUBLIC_API_URL}/api/centros/centros/${centroId}/estudiantes`;
            const method = isEdit ? "PUT" : "POST";
            const body: any = {
                ...data,
                departamento_id: Number(data.departamento_id),
                municipio_id: Number(data.municipio_id),
            };
            if (isEdit) body.id = estudiante.id;

            const request = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.user?.session}` },
                body: JSON.stringify(body),
            });

            if (request.ok) {
                toast.success(isEdit ? "Estudiante actualizado" : "Estudiante creado");
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
                <DialogTitle>{isEdit ? "Editar Estudiante" : "Crear Estudiante"}</DialogTitle>
                <form onSubmit={handleSubmit(onSubmit)} noValidate autoComplete="off">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                        <div>
                            <Label htmlFor="est-identidad" className="mb-1 font-medium text-default-600">Identidad *</Label>
                            <Input disabled={isSubmitting} {...register("identidad")} id="est-identidad" placeholder="Número de identidad" />
                            {errors.identidad && <p className="text-destructive text-xs mt-1">{errors.identidad.message}</p>}
                        </div>
                        <div>
                            <Label htmlFor="est-fecha_nacimiento" className="mb-1 font-medium text-default-600">Fecha nacimiento</Label>
                            <Input disabled={isSubmitting} {...register("fecha_nacimiento")} id="est-fecha_nacimiento" placeholder="DD/MM/AAAA" />
                        </div>
                        <div>
                            <Label htmlFor="est-nombres" className="mb-1 font-medium text-default-600">Nombres *</Label>
                            <Input disabled={isSubmitting} {...register("nombres")} id="est-nombres" placeholder="Nombres" />
                            {errors.nombres && <p className="text-destructive text-xs mt-1">{errors.nombres.message}</p>}
                        </div>
                        <div>
                            <Label htmlFor="est-apellidos" className="mb-1 font-medium text-default-600">Apellidos *</Label>
                            <Input disabled={isSubmitting} {...register("apellidos")} id="est-apellidos" placeholder="Apellidos" />
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
                            <Label htmlFor="est-email" className="mb-1 font-medium text-default-600">Email</Label>
                            <Input disabled={isSubmitting} {...register("email")} id="est-email" placeholder="correo@ejemplo.com" />
                        </div>
                        <div>
                            <Label htmlFor="est-telefono" className="mb-1 font-medium text-default-600">Teléfono</Label>
                            <Input disabled={isSubmitting} {...register("telefono")} id="est-telefono" placeholder="Teléfono" />
                        </div>
                        <div>
                            <Label htmlFor="est-celular" className="mb-1 font-medium text-default-600">Celular</Label>
                            <Input disabled={isSubmitting} {...register("celular")} id="est-celular" placeholder="Celular" />
                        </div>
                        <div>
                            <Label htmlFor="est-direccion" className="mb-1 font-medium text-default-600">Dirección</Label>
                            <Input disabled={isSubmitting} {...register("direccion")} id="est-direccion" placeholder="Dirección" />
                        </div>
                        <div>
                            <Label className="mb-1 font-medium text-default-600">Tipo de sangre *</Label>
                            <Select value={watch("sangre")} onValueChange={(v) => setValue("sangre", v)} disabled={isSubmitting}>
                                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="A+">A+</SelectItem>
                                    <SelectItem value="A-">A-</SelectItem>
                                    <SelectItem value="B+">B+</SelectItem>
                                    <SelectItem value="B-">B-</SelectItem>
                                    <SelectItem value="AB+">AB+</SelectItem>
                                    <SelectItem value="AB-">AB-</SelectItem>
                                    <SelectItem value="O+">O+</SelectItem>
                                    <SelectItem value="O-">O-</SelectItem>
                                </SelectContent>
                            </Select>
                            {errors.sangre && <p className="text-destructive text-xs mt-1">{errors.sangre.message}</p>}
                        </div>
                        <div>
                            <Label className="mb-1 font-medium text-default-600">¿Con quién vive? *</Label>
                            <Select value={watch("vive")} onValueChange={(v) => setValue("vive", v)} disabled={isSubmitting}>
                                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Padres">Padres</SelectItem>
                                    <SelectItem value="Solo(a)">Solo(a)</SelectItem>
                                    <SelectItem value="Pareja">Pareja</SelectItem>
                                    <SelectItem value="Familiares">Familiares</SelectItem>
                                    <SelectItem value="Otros">Otros</SelectItem>
                                </SelectContent>
                            </Select>
                            {errors.vive && <p className="text-destructive text-xs mt-1">{errors.vive.message}</p>}
                        </div>
                        <div>
                            <Label htmlFor="est-numero_dep" className="mb-1 font-medium text-default-600">No. de dependientes *</Label>
                            <Input disabled={isSubmitting} {...register("numero_dep")} id="est-numero_dep" placeholder="0" />
                            {errors.numero_dep && <p className="text-destructive text-xs mt-1">{errors.numero_dep.message}</p>}
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

export default EstudianteModal;
