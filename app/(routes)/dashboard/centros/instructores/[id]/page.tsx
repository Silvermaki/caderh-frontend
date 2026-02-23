"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Breadcrumbs, BreadcrumbItem } from "@/components/ui/breadcrumbs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import SkeletonTable from "@/components/skeleton-table";
import toast from "react-hot-toast";
import { useSession } from "next-auth/react";
import { Building2, FileText, Pencil, Trash2, Loader2 } from "lucide-react";
import InstructorModal from "@/components/centro/instructor-modal";

const apiBase = process.env.NEXT_PUBLIC_API_URL;

const TAB_CLASS = "rounded-none border-b-2 border-transparent bg-transparent px-0 pb-3 -mb-px shadow-none data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none";

export default function InstructorDetailPage() {
    const params = useParams();
    const router = useRouter();
    const instructorId = params?.id as string;
    const { data: session } = useSession() as any;
    const userRole = session?.user?.role;
    const isSupervisor = userRole === "ADMIN" || userRole === "MANAGER";
    const authHeaders: any = { Authorization: `Bearer ${session?.user?.session}` };

    const [instructor, setInstructor] = useState<any>(null);
    const [centros, setCentros] = useState<{ id: number; nombre: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const fetchInstructor = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${apiBase}/api/centros/instructors/${instructorId}`, { headers: authHeaders });
            if (res.ok) {
                const d = await res.json();
                setInstructor(d.data ?? null);
            } else {
                toast.error("Error al cargar instructor");
            }
        } catch {
            toast.error("Error al cargar instructor");
        }
        setLoading(false);
    };

    const fetchCentros = async () => {
        try {
            const res = await fetch(`${apiBase}/api/centros/centros?all=true`, { headers: authHeaders });
            if (res.ok) {
                const d = await res.json();
                setCentros(d.data ?? []);
            }
        } catch { /* silent */ }
    };

    useEffect(() => {
        if (session && instructorId) {
            fetchInstructor();
            fetchCentros();
        }
    }, [session, instructorId]);

    const openPdfInNewTab = async () => {
        if (!instructor?.pdf) return;
        try {
            const res = await fetch(`${apiBase}/api/centros/instructors/${instructorId}/pdf`, { headers: authHeaders });
            if (!res.ok) {
                toast.error("Error al abrir");
                return;
            }
            const blob = await res.blob();
            window.open(URL.createObjectURL(blob), "_blank", "noopener,noreferrer");
        } catch {
            toast.error("Error al abrir");
        }
    };

    const deleteInstructor = async () => {
        setDeleting(true);
        try {
            const res = await fetch(`${apiBase}/api/centros/instructors/${instructorId}`, { method: "DELETE", headers: authHeaders });
            if (res.ok) {
                toast.success("Instructor eliminado");
                router.push("/dashboard/centros/instructores");
            } else {
                const d = await res.json();
                toast.error(d.message ?? "Error al eliminar");
            }
        } catch {
            toast.error("Error al eliminar");
        }
        setDeleting(false);
    };

    const reloadList = () => fetchInstructor();

    if (loading) {
        return (
            <div className="mb-4">
                <Breadcrumbs>
                    <BreadcrumbItem>Plataforma</BreadcrumbItem>
                    <BreadcrumbItem>Centros</BreadcrumbItem>
                    <BreadcrumbItem asChild><Link href="/dashboard/centros/instructores">Instructores</Link></BreadcrumbItem>
                    <BreadcrumbItem className="text-primary">Instructor</BreadcrumbItem>
                </Breadcrumbs>
                <div className="mt-4">
                    <SkeletonTable />
                </div>
            </div>
        );
    }

    if (!instructor) {
        return (
            <div className="mb-4">
                <Breadcrumbs>
                    <BreadcrumbItem>Plataforma</BreadcrumbItem>
                    <BreadcrumbItem>Centros</BreadcrumbItem>
                    <BreadcrumbItem asChild><Link href="/dashboard/centros/instructores">Instructores</Link></BreadcrumbItem>
                    <BreadcrumbItem className="text-primary">Instructor</BreadcrumbItem>
                </Breadcrumbs>
                <Card className="mt-4 p-6">
                    <p className="text-sm text-muted-foreground">Instructor no encontrado.</p>
                    <Button variant="outline" className="mt-4" onClick={() => router.push("/dashboard/centros/instructores")}>
                        Volver a instructores
                    </Button>
                </Card>
            </div>
        );
    }

    const fullName = [instructor.nombres, instructor.apellidos].filter(Boolean).join(" ");

    return (
        <div className="mb-4">
            <Breadcrumbs>
                <BreadcrumbItem>Plataforma</BreadcrumbItem>
                <BreadcrumbItem>Centros</BreadcrumbItem>
                <BreadcrumbItem asChild><Link href="/dashboard/centros/instructores">Instructores</Link></BreadcrumbItem>
                <BreadcrumbItem className="text-primary">{fullName || "Instructor"}</BreadcrumbItem>
            </Breadcrumbs>

            <Card className="mt-4 shadow-sm">
                <CardContent className="p-0">
                    <div className="p-6 border-b">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                            <div>
                                <h1 className="text-xl font-semibold text-foreground">{fullName || "Sin nombre"}</h1>
                                {instructor.centro_nombre && (
                                    <div className="flex items-center gap-1.5 mt-1 text-sm text-muted-foreground">
                                        <Building2 className="h-4 w-4" />
                                        {instructor.centro_nombre}
                                    </div>
                                )}
                            </div>
                            {isSupervisor && (
                                <div className="flex items-center gap-2">
                                    <Button size="sm" variant="outline" onClick={() => setModalOpen(true)}>
                                        <Pencil className="h-3.5 w-3.5 mr-1.5" />Editar
                                    </Button>
                                    <Button size="sm" variant="outline" color="destructive" onClick={() => setDeleteOpen(true)}>
                                        <Trash2 className="h-3.5 w-3.5 mr-1.5" />Eliminar
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>

                    <Tabs defaultValue="general" className="w-full">
                        <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0 h-auto gap-6 pl-6">
                            <TabsTrigger value="general" className={TAB_CLASS}>General</TabsTrigger>
                        </TabsList>
                        <TabsContent value="general" id="content-general" className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                                <div>
                                    <p className="text-xs text-muted-foreground mb-0.5">Nombre completo</p>
                                    <p className="text-sm text-foreground">{fullName || "-"}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground mb-0.5">Centro</p>
                                    <p className="text-sm text-foreground">{instructor.centro_nombre ?? "-"}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground mb-0.5">Título obtenido</p>
                                    <p className="text-sm text-foreground">{instructor.titulo_obtenido || "-"}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground mb-0.5">Otros títulos</p>
                                    <p className="text-sm text-foreground">{instructor.otros_titulos || "-"}</p>
                                </div>
                                <div className="md:col-span-2">
                                    <p className="text-xs text-muted-foreground mb-0.5">Hoja de vida</p>
                                    {instructor.pdf ? (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 bg-transparent text-primary hover:bg-primary/80 hover:text-primary-foreground rounded-md px-3 font-semibold"
                                            onClick={openPdfInNewTab}
                                        >
                                            <FileText className="h-4 w-4 mr-2" />Ver
                                        </Button>
                                    ) : (
                                        <p className="text-sm text-muted-foreground">-</p>
                                    )}
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>

            <InstructorModal
                instructor={instructor}
                centros={centros}
                isOpen={modalOpen}
                setIsOpen={(open) => { setModalOpen(open); if (!open) fetchInstructor(); }}
                reloadList={reloadList}
            />

            <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar instructor?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Se eliminará a &quot;{instructor.nombres} {instructor.apellidos}&quot;. Esta acción no se puede deshacer.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={deleteInstructor} disabled={deleting} color="destructive">
                            {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                            {deleting ? "Eliminando..." : "Eliminar"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
