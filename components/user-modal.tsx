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
import { ArrowUpDown, MenuSquare, Loader2, CheckCircle2, PlayCircle, Trash } from "lucide-react";
import { datetimeToString, dateToString, prettifyNumber } from '@/app/libs/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useRouter } from 'next/navigation';
import { useSession } from "next-auth/react";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

const UserModal = ({ user, users, setUsers, loading, isOpen, setIsOpen, reload }: { user: any, users: any[], setUsers: (input: any) => void, loading: boolean, isOpen: boolean, setIsOpen: (input: any) => void, reload: (input: any) => void }) => {
    const [selectedView, setSelectedView] = useState<string>('profile');
    const [userView, setUserView] = useState<number>(1);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const { data: session } = useSession() as any;

    const editSchema = z.object({
        name: z.string().min(2, { message: "Nombre muy corto" }),
        role: z.string({ message: "Requerido" }).min(1, { message: "Requerido" }),
        disabled: z.string({ message: "Requerido" }).min(1, { message: "Requerido" }),
    });

    const {
        register: editRegister,
        handleSubmit: editHandleSubmit,
        reset: editReset,
        formState: { errors: editErrors },
        setValue: editSetValue,
        watch: editGetVaues,
    } = useForm({
        resolver: zodResolver(editSchema),
        mode: "onSubmit",
        defaultValues: {
            name: "",
            role: "",
            disabled: ""
        },
    });

    const onEdit = async (data: any) => {
        try {
            setIsSubmitting(true);
            const request = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/user`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.user?.session}`
                },
                body: JSON.stringify({
                    id: user.id,
                    name: data.name,
                    role: data.role,
                    disabled: data.disabled
                })
            });
            if (request.ok) {
                setUserView(1);
                users.forEach((row) => {
                    if (row.id === user.id) {
                        console.log(data.disabled);
                        row.name = data.name;
                        row.role = data.role;
                        row.disabled = data.disabled === 'ACTIVE' ? false : true;
                    }
                })
                setUsers(users);
                await reload(user.id);
            } else {
                let response = await request.json();
                toast.error(response.message);
            }
            setIsSubmitting(false);
        } catch (error) {
            toast.error('¡Algo salió mal!');
            setIsSubmitting(false);
        }
    }

    const changePass = async () => {
        try {
            setIsSubmitting(true);
            const request = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/user/reset-password`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.user?.session}`
                },
                body: JSON.stringify({
                    id: user.id,
                    name: user.name,
                    role: user.role,
                    email: user.email
                })
            });
            if (request.ok) {
                setUserView(3);
            } else {
                let response = await request.json();
                toast.error(response.message);
            }
            setIsSubmitting(false);
        } catch (error) {
            toast.error('¡Algo salió mal!');
            setIsSubmitting(false);
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={(value: boolean) => {
            setIsOpen(value);
            setUserView(1);
            setSelectedView('profile');
            setIsSubmitting(false);
            editReset();
        }}
        >
            <DialogContent size="5xl" className="overflow-y-auto max-h-screen" aria-describedby="user-modal" aria-description='user-modal'
                onInteractOutside={(e) => {
                    e.preventDefault();
                }}
                onEscapeKeyDown={(e) => {
                    e.preventDefault();
                }}
            >
                <form onSubmit={editHandleSubmit(onEdit)} noValidate autoComplete='off'>
                    <DialogTitle className="hidden">

                    </DialogTitle>
                    {(!user || loading) && (
                        <div className="w-full">
                            <Skeleton className="w-1/3 mb-4 h-6" />
                            <Skeleton className="w-full mb-4 h-8" />
                            <Skeleton className="w-full mb-4 h-8" />
                        </div>
                    )}
                    {user && !loading && (
                        <div className="text-sm">
                            <div>
                                <Tabs value={selectedView} onValueChange={(value: string) => {
                                    setUserView(1);
                                    setSelectedView(value);
                                    setIsSubmitting(false);
                                }}>
                                    <TabsList className="border bg-background">
                                        <TabsTrigger
                                            className="data-[state=active]:bg-muted data-[state=active]:text-primary-foreground"
                                            value="profile"
                                        >
                                            <Icon icon="ph:user-circle" className="h-5 w-5  mr-2 " />
                                            Perfil
                                        </TabsTrigger>
                                    </TabsList>
                                    <TabsContent value="profile" className="py-4 w-full">
                                        {userView === 1 && (
                                            <ScrollArea className="h-full">
                                                <div className="flex flex-col gap-4">
                                                    <div className="flex flex-row justify-between px-2">
                                                        <div className="flex-1 flex flex-row gap-4 mt-3 flex-wrap mb-4">
                                                            <div className="flex flex-row items-center justify-center">
                                                                <Label className="font-medium text-default-600 mr-2">
                                                                    Rol:
                                                                </Label>
                                                                <Badge color={`${user.role === 'ADMIN' ? "dark" : "default"}`}>{user.role === 'ADMIN' ? "Administrador" : "Agente"}</Badge>
                                                            </div>
                                                            <div className="flex flex-row items-center justify-center">
                                                                <Label className="font-medium text-default-600 mr-2">
                                                                    Estado:
                                                                </Label>
                                                                <Badge color={`${!user.disabled ? "success" : "destructive"}`}>{user.disabled ? 'Deshabilitado' : 'Activo'}</Badge>
                                                            </div>
                                                        </div>
                                                        {user.email !== 'superadmin@caderh.hn' &&
                                                            <div>
                                                                <Button variant="ghost" color="warning" size="sm" className="px-2" onClick={() => {
                                                                    setUserView(2);
                                                                    setIsSubmitting(false);
                                                                    editReset();
                                                                    editSetValue('name', user.name);
                                                                    editSetValue('role', user.role);
                                                                    if (user.disabled) {
                                                                        editSetValue('disabled', "DISABLED");
                                                                    } else {
                                                                        editSetValue('disabled', "ACTIVE");
                                                                    }
                                                                }}>
                                                                    Editar Usuario
                                                                </Button>
                                                            </div>
                                                        }
                                                    </div>
                                                    <div className="px-2">
                                                        <div className="flex gap-4 flex-col">
                                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                                                <div>
                                                                    <Label className="mb-2 font-medium text-default-600">
                                                                        Correo Electrónico
                                                                    </Label>
                                                                    <Input
                                                                        readOnly={true}
                                                                        placeholder=""
                                                                        value={user.email}
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <Label className="mb-2 font-medium text-default-600">
                                                                        Nombre
                                                                    </Label>
                                                                    <Input
                                                                        readOnly={true}
                                                                        placeholder=""
                                                                        value={user.name}
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <Label className="mb-2 font-medium text-default-600">
                                                                        Creado
                                                                    </Label>
                                                                    <Input
                                                                        readOnly={true}
                                                                        placeholder=""
                                                                        value={datetimeToString(new Date(user.created_dt))}
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </ScrollArea>
                                        )}
                                        {userView === 2 && (
                                            <ScrollArea className="h-full">
                                                <div className="px-2">
                                                    <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-4">
                                                        <div>
                                                            <Label className="mb-2 font-medium text-default-600">
                                                                Correo Electrónico
                                                            </Label>
                                                            <Input
                                                                className='opacity-[0.5]'
                                                                style={{ backgroundColor: 'rgb(226, 232, 240)' }}
                                                                readOnly={true}
                                                                placeholder=""
                                                                value={user.email}
                                                            />
                                                        </div>
                                                        <div>
                                                            <div className="relative">
                                                                <Label
                                                                    htmlFor="name"
                                                                    className="mb-2 font-medium text-default-600"
                                                                >
                                                                    Nombre
                                                                </Label>
                                                                <div className="relative">
                                                                    <Input
                                                                        disabled={isSubmitting}
                                                                        {...editRegister("name")}
                                                                        type="text"
                                                                        id="name"
                                                                        className="peer "
                                                                        placeholder=" "
                                                                    />
                                                                </div>
                                                            </div>
                                                            {editErrors.name && (
                                                                <div className=" text-destructive mt-2">
                                                                    {editErrors.name.message}
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
                                                                <Select disabled={isSubmitting} value={editGetVaues('role')} onValueChange={(data) => {
                                                                    editSetValue('role', data);
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
                                                            {editErrors.role && (
                                                                <div className=" text-destructive mt-2">
                                                                    {editErrors.role.message}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <div className="">
                                                                <Label
                                                                    htmlFor="status"
                                                                    className="mb-2 font-medium text-default-600"
                                                                >
                                                                    Estado
                                                                </Label>
                                                                <Select disabled={isSubmitting} value={editGetVaues('disabled')} onValueChange={(data) => {
                                                                    editSetValue('disabled', data);
                                                                }} name='status'>
                                                                    <SelectTrigger size='md'>
                                                                        <SelectValue placeholder="Select" />
                                                                    </SelectTrigger>
                                                                    <SelectContent className='z-[99990]'>
                                                                        <SelectItem value="ACTIVE">Activo</SelectItem>
                                                                        <SelectItem value="DISABLED">Deshabilitado</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>
                                                            {editErrors.disabled && (
                                                                <div className=" text-destructive mt-2">
                                                                    {editErrors.disabled.message}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <Label className="mb-2 font-medium text-default-600">
                                                                Creado
                                                            </Label>
                                                            <Input
                                                                className='opacity-[0.5]'
                                                                style={{ backgroundColor: 'rgb(226, 232, 240)' }}
                                                                readOnly={true}
                                                                placeholder=""
                                                                value={datetimeToString(new Date(user.created_dt))}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </ScrollArea>
                                        )}
                                        {userView === 3 && (
                                            <ScrollArea className="h-full">
                                                <Alert color="success" variant="soft" className="mb-4 mt-4">
                                                    <AlertDescription className="text-center">
                                                        <CheckCircle2 className="h-20 w-20 color-primary mx-auto mb-4" />
                                                        <div>Nueva Contraseña Generada</div>
                                                        <div>Notificar al usuario final que revise su bandeja de correo electrónico para continuar el proceso de autenticación</div>
                                                    </AlertDescription>
                                                </Alert>
                                            </ScrollArea>
                                        )}
                                    </TabsContent>
                                </Tabs>
                            </div>
                        </div>
                    )}

                    <DialogFooter className="min-h-[40px]">
                        <>
                            {selectedView === 'profile' && userView === 2 && (
                                <div className='flex flex-row gap-2 justify-between w-full px-2 mt-6'>
                                    <Button type='button' disabled={isSubmitting} color="info" onClick={() => { changePass(); }}>
                                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Generar Nueva Contraseña
                                    </Button>
                                    <div className='flex flex-row gap-2'>
                                        <Button type='button' disabled={isSubmitting} color="dark" onClick={() => { setUserView(1); }}>
                                            Cancelar
                                        </Button>
                                        <Button type='submit' disabled={isSubmitting} color="warning">
                                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Aplicar Cambios
                                        </Button>
                                    </div>
                                </div>
                            )}
                            {selectedView === 'profile' && userView === 3 && (
                                <DialogClose asChild>
                                    <Button color="dark">
                                        Cerrar
                                    </Button>
                                </DialogClose>
                            )}
                        </>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog >
    );
};

export default UserModal;