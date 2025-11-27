import React, { useState } from 'react';
import dynamic from "next/dynamic";
import { Dialog, DialogContent, DialogFooter, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Icon } from "@iconify/react";
import toast from "react-hot-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowUpDown, MenuSquare, Loader2, CheckCircle2, UserPlus } from "lucide-react";
import { datetimeToString, dateToString } from '@/app/libs/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useSession } from "next-auth/react";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

const NewUserModal = ({ isOpen, setIsOpen, reloadList }: { isOpen: boolean, setIsOpen: (input: any) => void, reloadList: () => void }) => {
    const [view, setView] = useState<number>(1);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const { data: session } = useSession() as any;

    const newUserSchema = z.object({
        email: z.string().email({ message: "Formato de correo inválido" }),
        name: z.string().min(2, { message: "Nombre muy corto" }),
        role: z.string({ message: "Requerido" }).min(1, { message: "Requerido" })
    });

    const {
        register: newUserRegister,
        handleSubmit: newUserHandleSubmit,
        reset: newUserReset,
        watch: newUserGetValues,
        setValue: newUserSetValue,
        formState: { errors: newUserErrors, dirtyFields: newUserIsDirty },
    } = useForm({
        resolver: zodResolver(newUserSchema),
        mode: "onSubmit",
        defaultValues: {
            email: "",
            name: "",
            role: "USER"
        },
    });

    const onNewUser = async (data: any) => {
        try {
            setIsSubmitting(true);
            const request = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/user`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.user?.session}`
                },
                body: JSON.stringify({
                    email: data.email,
                    name: data.name,
                    role: data.role
                })
            });
            if (request.ok) {
                setView(2);
                newUserReset();
            } else {
                let response = await request.json();
                toast.error(response.message);
            }
            setIsSubmitting(false);
        } catch (error) {
            toast.error('¡Algo salió mal!');
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(value: boolean) => {
            setIsOpen(value);
            setView(1);
            setIsSubmitting(false);
            newUserReset();
            reloadList();
        }}
        >
            <DialogContent size="5xl" className="overflow-y-auto max-h-screen" aria-describedby="new-user-modal" aria-description='new-user-modal'
                onInteractOutside={(e) => {
                    e.preventDefault();
                }}
                onEscapeKeyDown={(e) => {
                    e.preventDefault();
                }}
            >
                <form onSubmit={newUserHandleSubmit(onNewUser)} noValidate autoComplete='off'>
                    <DialogTitle className='px-2 underline'>
                        Crear nuevo usuario
                    </DialogTitle>
                    <div className="w-full py-8">
                        {view === 1 && (
                            <ScrollArea className="h-full">
                                <div className="relative mt-4">
                                    <div className="px-2">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div>
                                                <div className="relative">
                                                    <Label
                                                        htmlFor="email"
                                                        className="mb-2 font-medium text-default-600"
                                                    >
                                                        Correo Electrónico
                                                    </Label>
                                                    <div className="relative">
                                                        <Input
                                                            disabled={isSubmitting}
                                                            {...newUserRegister("email")}
                                                            type="text"
                                                            id="email"
                                                            autoComplete="new-password"
                                                            className="peer lowercase"
                                                            placeholder=" "
                                                        />
                                                    </div>
                                                </div>
                                                {newUserErrors.email && (
                                                    <div className=" text-destructive mt-2">
                                                        {newUserErrors.email.message}
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <div className="relative">
                                                    <Label
                                                        htmlFor="name"
                                                        className="mb-2 font-medium text-default-600"
                                                    >
                                                        Nombre Completo
                                                    </Label>
                                                    <div className="relative">
                                                        <Input
                                                            disabled={isSubmitting}
                                                            {...newUserRegister("name")}
                                                            type="text"
                                                            id="name"
                                                            autoComplete="new-password"
                                                            className="peer"
                                                            placeholder=" "
                                                        />
                                                    </div>
                                                </div>
                                                {newUserErrors.name && (
                                                    <div className=" text-destructive mt-2">
                                                        {newUserErrors.name.message}
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <div className="">
                                                    <Label
                                                        htmlFor="role"
                                                        className="mb-2 font-medium text-default-600"
                                                    >
                                                        Rol
                                                    </Label>
                                                    <Select disabled={isSubmitting} value={newUserGetValues('role')} onValueChange={(data) => {
                                                        newUserSetValue('role', data);
                                                    }} name='role'>
                                                        <SelectTrigger size='md'>
                                                            <SelectValue placeholder="Select" />
                                                        </SelectTrigger>
                                                        <SelectContent className='z-[99990]'>
                                                            <SelectItem value="USER">Agente</SelectItem>
                                                            <SelectItem value="ADMIN">Administrador</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                {newUserErrors.role && (
                                                    <div className=" text-destructive mt-2">
                                                        {newUserErrors.role.message}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className='hidden sm:block '>
                                            {newUserGetValues('role') === 'ADMIN' &&
                                                <Alert color="warning" variant="soft" className="mb-4 mt-6">
                                                    <AlertDescription className="text-center">
                                                        Los usuarios administradores poseen acceso a todas las funcionalidades del sistema, incluyendo la edición de usuarios existentes y la creación de nuevos usuarios.
                                                    </AlertDescription>
                                                </Alert>
                                            }
                                            <Alert color="info" variant="soft" className="mb-4 mt-6">
                                                <AlertDescription className="text-center">
                                                    Al crear el nuevo usuario se generará un correo electrónico con las credenciales de acceso. El usuario final <span className='font-bold'>DEBE</span> tener acceso a su correo electrónico para poder autenticarse al sistema.
                                                </AlertDescription>
                                            </Alert>
                                        </div>
                                    </div>
                                </div>
                            </ScrollArea>
                        )}
                        {view === 2 && (
                            <ScrollArea className="h-full">
                                <Alert color="success" variant="soft" className="mb-4 mt-8">
                                    <AlertDescription className="text-center">
                                        <CheckCircle2 className="h-20 w-20 color-primary mx-auto mb-4" />
                                        <div>Usuario Creado Exitosamente</div>
                                        <div>Notificar al usuario final que revise su bandeja de correo electrónico para continuar el proceso de autenticación</div>
                                    </AlertDescription>
                                </Alert>
                            </ScrollArea>
                        )}
                    </div>
                    <DialogFooter className="min-h-[40px]">
                        <>
                            {view === 2 && (
                                <DialogClose asChild>
                                    <Button color="dark">
                                        Cerrar
                                    </Button>
                                </DialogClose>

                            )}
                            {view === 1 && (
                                <>

                                    <Button type='button' disabled={isSubmitting} color="dark" onClick={() => {
                                        setIsOpen(false);
                                        setView(1);
                                        setIsSubmitting(false);
                                        newUserReset();
                                    }}>
                                        Cancelar
                                    </Button>
                                    <Button type='submit' disabled={isSubmitting} color="success">
                                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Crear Usuario
                                    </Button>
                                </>
                            )}
                        </>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog >
    );
};

export default NewUserModal;