"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Breadcrumbs, BreadcrumbItem } from "@/components/ui/breadcrumbs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import SkeletonTable from "@/components/skeleton-table";
import { usePathname, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { useSession } from "next-auth/react";
import AreaModal from "@/components/area-modal";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Suspense } from "react";
import { Layers, Pencil, PlusCircle, Search, Trash2 } from "lucide-react";

const apiBase = process.env.NEXT_PUBLIC_API_PROXY;

function PageContent() {
    const searchParams: any = useSearchParams();
    const searchInit = (new URLSearchParams(searchParams)).get("search") ?? "";
    const pathname = usePathname();
    const { data: session } = useSession() as any;
    const userRole = session?.user?.role;
    const isSupervisor = userRole !== "USER";
    const authHeaders: any = { Authorization: `Bearer ${session?.user?.session}` };

    const [areas, setAreas] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState(searchInit);
    const [selectedArea, setSelectedArea] = useState<any>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [deleteArea, setDeleteArea] = useState<any>(null);
    const [deleting, setDeleting] = useState(false);

    const fetchAreas = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${apiBase}/centros/areas?offset=0&limit=100&sort=nombre&desc=asc&search=`, { headers: authHeaders });
            if (res.ok) { const d = await res.json(); setAreas(d.data ?? []); }
            else toast.error("Error al cargar áreas");
        } catch { toast.error("Error al cargar áreas"); }
        setLoading(false);
    };

    useEffect(() => { if (session) fetchAreas(); }, [session]);

    const filteredAreas = useMemo(() => {
        if (!search.trim()) return areas;
        const q = search.toLowerCase();
        return areas.filter(a => (a.nombre ?? "").toLowerCase().includes(q));
    }, [areas, search]);

    const onDeleteConfirm = async () => {
        if (!deleteArea) return;
        setDeleting(true);
        try {
            const res = await fetch(`${apiBase}/centros/areas/${deleteArea.id}`, { method: "DELETE", headers: authHeaders });
            if (res.ok) { toast.success("Área eliminada"); setDeleteArea(null); fetchAreas(); }
            else { const d = await res.json(); toast.error(d.message ?? "Error al eliminar"); }
        } catch { toast.error("Error al eliminar"); }
        setDeleting(false);
    };

    return (
        <div className="mb-4">
            <Breadcrumbs>
                <BreadcrumbItem>Plataforma</BreadcrumbItem>
                <BreadcrumbItem>Centros</BreadcrumbItem>
                <BreadcrumbItem className="text-primary">Áreas</BreadcrumbItem>
            </Breadcrumbs>

            <div className="flex items-center justify-between mt-5">
                <h2 className="text-2xl font-bold tracking-tight text-primary">Áreas</h2>
                {isSupervisor && (
                    <Button size="sm" onClick={() => { setSelectedArea(null); setIsModalOpen(true); }}>
                        <PlusCircle className="h-4 w-4 mr-1.5" />Crear Área
                    </Button>
                )}
            </div>

            <div className="mt-4">
                <div className="relative max-w-sm mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar área..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9"
                    />
                </div>

                {loading ? (
                    <SkeletonTable />
                ) : filteredAreas.length === 0 ? (
                    <div className="py-12 text-center">
                        <Layers className="h-8 w-8 mx-auto text-muted-foreground/50 mb-3" />
                        <p className="text-muted-foreground">{search ? `No se encontraron áreas para "${search}"` : "No hay áreas registradas."}</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filteredAreas.map((area) => (
                            <Card key={area.id} className="group hover:shadow-md hover:border-primary/20 transition-all">
                                <CardContent className="p-5">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="rounded-full bg-primary/10 p-2.5 shrink-0">
                                                <Layers className="h-5 w-5 text-primary" />
                                            </div>
                                            <h3 className="font-semibold text-sm text-foreground truncate">{area.nombre}</h3>
                                        </div>
                                        {isSupervisor && (
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setSelectedArea(area); setIsModalOpen(true); }}>
                                                    <Pencil className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteArea(area)}>
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                {!loading && filteredAreas.length > 0 && (
                    <p className="text-sm text-muted-foreground mt-4">Total: {filteredAreas.length} área{filteredAreas.length !== 1 ? "s" : ""}</p>
                )}
            </div>

            <AreaModal
                area={selectedArea}
                isOpen={isModalOpen}
                setIsOpen={(open) => { setIsModalOpen(open); if (!open) { setSelectedArea(null); fetchAreas(); } }}
                reloadList={fetchAreas}
            />
            <AlertDialog open={!!deleteArea} onOpenChange={(open) => !open && setDeleteArea(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar área?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Se eliminará &quot;{deleteArea?.nombre}&quot;. Esta acción no se puede deshacer.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={onDeleteConfirm} disabled={deleting} color="destructive">
                            {deleting ? "Eliminando..." : "Eliminar"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

export default function Page() {
    return (
        <Suspense fallback={<SkeletonTable />}>
            <PageContent />
        </Suspense>
    );
}
