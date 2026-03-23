"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Breadcrumbs, BreadcrumbItem } from "@/components/ui/breadcrumbs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import SkeletonTable from "@/components/skeleton-table";
import KPIBlock from "@/components/project/KPIBlock";
import InfoSection from "@/components/project/InfoSection";
import toast from "react-hot-toast";
import { useSession } from "next-auth/react";
import {
    Award, BookOpen, Building2, Calendar, FileText, GraduationCap, Loader2, Pencil,
    Trash2, User, Users,
} from "lucide-react";
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

    const [processes, setProcesses] = useState<any[]>([]);
    const [processesLoading, setProcessesLoading] = useState(false);

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

    const fetchProcesses = useCallback(async () => {
        if (!instructor?.id) return;
        setProcessesLoading(true);
        try {
            const res = await fetch(`${apiBase}/api/centros/processes?limit=100&offset=0&instructor_id=${instructor.id}`, { headers: authHeaders });
            if (res.ok) {
                const d = await res.json();
                setProcesses(d.data ?? []);
            }
        } catch { /* silent */ }
        setProcessesLoading(false);
    }, [instructor?.id, session?.user?.session]);

    useEffect(() => {
        if (session && instructorId) {
            fetchInstructor();
            fetchCentros();
        }
    }, [session, instructorId]);

    useEffect(() => {
        if (instructor?.id) fetchProcesses();
    }, [instructor?.id]);

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

    const fieldView = (label: string, value: any, icon?: React.ReactNode) => (
        <div className="flex items-start gap-3">
            {icon && <div className="mt-0.5 text-muted-foreground">{icon}</div>}
            <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">{label}</p>
                <p className="text-sm text-foreground font-medium">{value || "-"}</p>
            </div>
        </div>
    );

    if (loading) {
        return (
            <div className="mb-4">
                <Breadcrumbs>
                    <BreadcrumbItem>Plataforma</BreadcrumbItem>
                    <BreadcrumbItem>Centros</BreadcrumbItem>
                    <BreadcrumbItem asChild><Link href="/dashboard/centros/instructores">Instructores</Link></BreadcrumbItem>
                    <BreadcrumbItem className="text-primary">Instructor</BreadcrumbItem>
                </Breadcrumbs>
                <div className="mt-4"><SkeletonTable /></div>
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
    const i = instructor;

    return (
        <div className="mb-4">
            <Breadcrumbs>
                <BreadcrumbItem>Plataforma</BreadcrumbItem>
                <BreadcrumbItem>Centros</BreadcrumbItem>
                <BreadcrumbItem asChild><Link href="/dashboard/centros/instructores">Instructores</Link></BreadcrumbItem>
                <BreadcrumbItem className="text-primary">{fullName || "Instructor"}</BreadcrumbItem>
            </Breadcrumbs>

            {/* Header */}
            <Card className="mt-5">
                <CardContent className="p-6 pb-2">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4">
                            <div className="rounded-full bg-primary/10 p-3">
                                <User className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <h2 className="text-2xl font-bold tracking-tight text-primary">{fullName || "Sin nombre"}</h2>
                                </div>
                                <div className="flex flex-wrap gap-x-5 gap-y-1 mt-2 text-sm text-muted-foreground">
                                    {i.centro_nombre && <span className="flex items-center gap-1.5"><Building2 className="h-4 w-4" />{i.centro_nombre}</span>}
                                    {i.titulo_obtenido && <span className="flex items-center gap-1.5"><GraduationCap className="h-4 w-4" />{i.titulo_obtenido}</span>}
                                </div>
                            </div>
                        </div>
                        {isSupervisor && (
                            <div className="flex items-center gap-2">
                                <Button size="sm" variant="outline" onClick={() => setModalOpen(true)}>
                                    <Pencil className="h-3.5 w-3.5 mr-1.5" />Editar
                                </Button>
                                <Button color="destructive" size="sm" onClick={() => setDeleteOpen(true)}>
                                    <Trash2 className="h-4 w-4 mr-1.5" />Eliminar
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* KPI Grid */}
                    <div className="mt-5 pb-2">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            <KPIBlock icon={GraduationCap} label="Título" value={i.titulo_obtenido || "Sin título"} iconColor="text-primary" index={0} />
                            <KPIBlock icon={BookOpen} label="Procesos Asignados" value={String(i.process_count ?? processes.length)} iconColor="text-success" index={1} />
                            <KPIBlock icon={FileText} label="Hoja de Vida" value={i.pdf ? "Disponible" : "No cargada"} iconColor={i.pdf ? "text-info" : "text-muted-foreground"} index={2} />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Tabs */}
            <Card className="mt-4">
                <Tabs defaultValue="general" className="w-full">
                    <TabsList className="w-full justify-start gap-8 border-b border-default-200 rounded-none bg-transparent p-0 h-auto min-h-0 px-6 pt-4 pb-0">
                        <TabsTrigger value="general" className={TAB_CLASS}>General</TabsTrigger>
                        <TabsTrigger value="processes" className={TAB_CLASS}>Procesos{processes.length > 0 ? ` (${processes.length})` : ""}</TabsTrigger>
                    </TabsList>

                    {/* Tab: General */}
                    <TabsContent value="general" className="mt-0 px-6 pt-6 pb-6">
                        <div className="space-y-6">
                            <InfoSection title="Información Personal">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
                                    {fieldView("Nombres", i.nombres, <User className="h-4 w-4" />)}
                                    {fieldView("Apellidos", i.apellidos, <User className="h-4 w-4" />)}
                                    {fieldView("Centro", i.centro_nombre, <Building2 className="h-4 w-4" />)}
                                </div>
                            </InfoSection>
                            <InfoSection title="Formación Académica">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
                                    {fieldView("Título obtenido", i.titulo_obtenido, <GraduationCap className="h-4 w-4" />)}
                                    {fieldView("Otros títulos", i.otros_titulos, <Award className="h-4 w-4" />)}
                                </div>
                            </InfoSection>
                            <InfoSection title="Documentos">
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Hoja de vida</p>
                                    {i.pdf ? (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={openPdfInNewTab}
                                        >
                                            <FileText className="h-4 w-4 mr-2" />Ver hoja de vida
                                        </Button>
                                    ) : (
                                        <p className="text-sm text-muted-foreground">No se ha cargado hoja de vida.</p>
                                    )}
                                </div>
                            </InfoSection>
                        </div>
                    </TabsContent>

                    {/* Tab: Procesos */}
                    <TabsContent value="processes" className="mt-0 px-6 pt-6 pb-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-4">
                                <h3 className="text-base font-semibold">Procesos Educativos</h3>
                                {processes.length > 0 && (
                                    <span className="text-sm text-muted-foreground">{processes.length} proceso{processes.length !== 1 ? "s" : ""}</span>
                                )}
                            </div>
                        </div>
                        {processesLoading ? (
                            <SkeletonTable />
                        ) : processes.length === 0 ? (
                            <div className="py-12 text-center">
                                <BookOpen className="h-8 w-8 mx-auto text-muted-foreground/50 mb-3" />
                                <p className="text-muted-foreground">Este instructor no tiene procesos educativos asignados.</p>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Nombre</TableHead>
                                        <TableHead>Código</TableHead>
                                        <TableHead>Centro</TableHead>
                                        <TableHead>Curso</TableHead>
                                        <TableHead>Fecha Inicio</TableHead>
                                        <TableHead>Fecha Fin</TableHead>
                                        <TableHead>Matriculados</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {processes.map((proc: any) => (
                                        <TableRow key={proc.id} className="cursor-pointer" onClick={() => router.push(`/dashboard/centros/processes/${proc.id}`)}>
                                            <TableCell className="font-medium text-primary">{proc.nombre}</TableCell>
                                            <TableCell className="text-sm">{proc.codigo}</TableCell>
                                            <TableCell className="text-sm text-muted-foreground">{proc.centro_nombre}</TableCell>
                                            <TableCell className="text-sm text-muted-foreground">{proc.curso_nombre}</TableCell>
                                            <TableCell className="text-sm text-muted-foreground">{proc.fecha_inicial ?? "-"}</TableCell>
                                            <TableCell className="text-sm text-muted-foreground">{proc.fecha_final ?? "-"}</TableCell>
                                            <TableCell className="text-sm">
                                                <Badge variant="outline">{proc.enrolled_count ?? 0}</Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </TabsContent>
                </Tabs>
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
                            {deleting ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
                            {deleting ? "Eliminando..." : "Eliminar"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
