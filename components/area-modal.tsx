"use client";

import React, { useEffect } from "react";
import { Dialog, DialogContent, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import toast from "react-hot-toast";
import { useSession } from "next-auth/react";
import { Loader2 } from "lucide-react";

const schema = z.object({
    nombre: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres" }),
});

type FormData = z.infer<typeof schema>;

const AreaModal = ({
    area,
    isOpen,
    setIsOpen,
    reloadList,
}: {
    area: any;
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    reloadList: () => void;
}) => {
    const { data: session } = useSession() as any;
    const isEdit = !!area;

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<FormData>({
        resolver: zodResolver(schema),
        mode: "onSubmit",
        defaultValues: { nombre: "" },
    });

    useEffect(() => {
        if (area) {
            reset({ nombre: area.nombre ?? "" });
        } else {
            reset({ nombre: "" });
        }
    }, [area, reset, isOpen]);

    const onSubmit = async (data: FormData) => {
        try {
            const url = `${process.env.NEXT_PUBLIC_API_URL}/api/centros/areas`;
            const method = isEdit ? "PUT" : "POST";
            const body = isEdit
                ? { id: area.id, nombre: data.nombre.trim() }
                : { nombre: data.nombre.trim() };

            const request = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session?.user?.session}`,
                },
                body: JSON.stringify(body),
            });

            if (request.ok) {
                toast.success(isEdit ? "Área actualizada" : "Área creada");
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
        <Dialog
            open={isOpen}
            onOpenChange={(open) => {
                if (!isSubmitting) {
                    setIsOpen(open);
                    if (!open) reloadList();
                }
            }}
        >
            <DialogContent size="lg">
                <DialogTitle>{isEdit ? "Editar área" : "Crear área"}</DialogTitle>
                <form onSubmit={handleSubmit(onSubmit)} noValidate autoComplete="off">
                    <div className="space-y-4 py-4">
                        <div>
                            <Label htmlFor="nombre" className="mb-2 font-medium text-default-600">
                                Nombre *
                            </Label>
                            <Input
                                disabled={isSubmitting}
                                {...register("nombre")}
                                id="nombre"
                                placeholder="Nombre del área"
                                className="mt-1"
                            />
                            {errors.nombre && (
                                <p className="text-destructive text-sm mt-1">{errors.nombre.message}</p>
                            )}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsOpen(false)}
                            disabled={isSubmitting}
                        >
                            Cancelar
                        </Button>
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

export default AreaModal;
