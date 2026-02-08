"use client";

import React, { useEffect } from "react";
import { Dialog, DialogContent, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import toast from "react-hot-toast";
import { useSession } from "next-auth/react";
import { Loader2 } from "lucide-react";

const schema = z.object({
    name: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres" }),
    description: z.string().min(5, { message: "La descripción debe tener al menos 5 caracteres" }),
});

type FormData = z.infer<typeof schema>;

const FinancingSourceModal = ({
    source,
    loading,
    isOpen,
    setIsOpen,
    reloadList,
}: {
    source: any;
    loading: boolean;
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    reloadList: () => void;
}) => {
    const { data: session } = useSession() as any;
    const isEdit = !!source;

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<FormData>({
        resolver: zodResolver(schema),
        mode: "onSubmit",
        defaultValues: {
            name: "",
            description: "",
        },
    });

    useEffect(() => {
        if (source) {
            reset({
                name: source.name ?? "",
                description: source.description ?? "",
            });
        } else {
            reset({
                name: "",
                description: "",
            });
        }
    }, [source, reset, isOpen]);

    const onSubmit = async (data: FormData) => {
        try {
            const url = `${process.env.NEXT_PUBLIC_API_URL}/api/supervisor/financing-source`;
            const method = isEdit ? "PUT" : "POST";
            const body = isEdit
                ? { id: source.id, name: data.name.trim(), description: data.description.trim() }
                : { name: data.name.trim(), description: data.description.trim() };

            const request = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session?.user?.session}`,
                },
                body: JSON.stringify(body),
            });

            if (request.ok) {
                toast.success(isEdit ? "Fuente actualizada" : "Fuente creada");
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
                <DialogTitle>{isEdit ? "Editar fuente de financiamiento" : "Crear fuente de financiamiento"}</DialogTitle>
                {loading ? (
                    <div className="space-y-4 py-4">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-24 w-full" />
                    </div>
                ) : (
                    <form onSubmit={handleSubmit(onSubmit)} noValidate autoComplete="off">
                        <div className="space-y-4 py-4">
                            <div>
                                <Label htmlFor="name" className="mb-2 font-medium text-default-600">
                                    Nombre *
                                </Label>
                                <Input
                                    disabled={isSubmitting}
                                    {...register("name")}
                                    id="name"
                                    placeholder="Nombre de la fuente"
                                    className="mt-1"
                                />
                                {errors.name && (
                                    <p className="text-destructive text-sm mt-1">{errors.name.message}</p>
                                )}
                            </div>
                            <div>
                                <Label htmlFor="description" className="mb-2 font-medium text-default-600">
                                    Descripción *
                                </Label>
                                <Textarea
                                    disabled={isSubmitting}
                                    {...register("description")}
                                    id="description"
                                    placeholder="Descripción de la fuente de financiamiento"
                                    className="mt-1 min-h-[100px]"
                                />
                                {errors.description && (
                                    <p className="text-destructive text-sm mt-1">{errors.description.message}</p>
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
                )}
            </DialogContent>
        </Dialog>
    );
};

export default FinancingSourceModal;
