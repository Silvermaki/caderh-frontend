"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Breadcrumbs, BreadcrumbItem } from "@/components/ui/breadcrumbs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import SkeletonTable from "@/components/skeleton-table";
import toast from "react-hot-toast";
import { useSession } from "next-auth/react";
import { MapPin, Phone, Mail, User, Building2 } from "lucide-react";

export default function CentroDetailPage() {
    const params = useParams();
    const centroId = params?.id;
    const { data: session } = useSession() as any;
    const [centro, setCentro] = useState<any>(null);
    const [loading, setLoading] = useState<boolean>(true);

    const fetchCentro = async () => {
        setLoading(true);
        try {
            const request = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/centros/centros/${centroId}`,
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${session?.user?.session}`,
                    },
                }
            );
            if (request.ok) {
                const response = await request.json();
                setCentro(response.data ?? null);
            } else {
                const response = await request.json();
                toast.error(response.message ?? "Error al cargar centro");
            }
        } catch (error: any) {
            toast.error("Error al cargar centro");
        }
        setLoading(false);
    };

    useEffect(() => {
        if (session && centroId) {
            fetchCentro();
        }
    }, [session, centroId]);

    if (loading) {
        return (
            <div className="mb-4">
                <Breadcrumbs>
                    <BreadcrumbItem>Plataforma</BreadcrumbItem>
                    <BreadcrumbItem>Centros</BreadcrumbItem>
                    <BreadcrumbItem>Gestionar Centros</BreadcrumbItem>
                    <BreadcrumbItem className="text-primary">Detalle</BreadcrumbItem>
                </Breadcrumbs>
                <div className="mt-5">
                    <SkeletonTable />
                </div>
            </div>
        );
    }

    if (!centro) {
        return (
            <div className="mb-4">
                <Breadcrumbs>
                    <BreadcrumbItem>Plataforma</BreadcrumbItem>
                    <BreadcrumbItem>Centros</BreadcrumbItem>
                    <BreadcrumbItem>Gestionar Centros</BreadcrumbItem>
                    <BreadcrumbItem className="text-primary">Detalle</BreadcrumbItem>
                </Breadcrumbs>
                <div className="mt-5 py-12 text-center text-muted-foreground">
                    Centro no encontrado.
                </div>
            </div>
        );
    }

    return (
        <div className="mb-4">
            <Breadcrumbs>
                <BreadcrumbItem>Plataforma</BreadcrumbItem>
                <BreadcrumbItem>Centros</BreadcrumbItem>
                <BreadcrumbItem>Gestionar Centros</BreadcrumbItem>
                <BreadcrumbItem className="text-primary">{centro.nombre}</BreadcrumbItem>
            </Breadcrumbs>

            <Card className="mt-5">
                <CardContent className="p-6">
                    <div className="flex flex-col gap-4">
                        <div className="flex items-start justify-between gap-2">
                            <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <Building2 className="h-5 w-5 text-primary" />
                                    <h2 className="text-lg font-semibold">{centro.nombre}</h2>
                                    {centro.siglas && (
                                        <Badge variant="secondary">{centro.siglas}</Badge>
                                    )}
                                    {centro.codigo && (
                                        <Badge variant="outline">{centro.codigo}</Badge>
                                    )}
                                </div>
                                {centro.descripcion && (
                                    <p className="text-muted-foreground text-sm mt-2">{centro.descripcion}</p>
                                )}
                            </div>
                            <Badge
                                variant={centro.estatus === 1 ? "soft" : "secondary"}
                                color={centro.estatus === 1 ? "success" : "secondary"}
                            >
                                {centro.estatus === 1 ? "Activo" : "Inactivo"}
                            </Badge>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                            <div className="space-y-2">
                                <h3 className="text-sm font-semibold text-muted-foreground">Información general</h3>
                                {(centro.departamento_nombre || centro.municipio_nombre) && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <MapPin className="h-4 w-4 text-muted-foreground" />
                                        <span>{[centro.municipio_nombre, centro.departamento_nombre].filter(Boolean).join(", ")}</span>
                                    </div>
                                )}
                                {centro.direccion && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <MapPin className="h-4 w-4 text-muted-foreground" />
                                        <span>{centro.direccion}</span>
                                    </div>
                                )}
                                {centro.telefono && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <Phone className="h-4 w-4 text-muted-foreground" />
                                        <span>{centro.telefono}</span>
                                    </div>
                                )}
                                {centro.email && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <Mail className="h-4 w-4 text-muted-foreground" />
                                        <span>{centro.email}</span>
                                    </div>
                                )}
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-sm font-semibold text-muted-foreground">Director</h3>
                                {centro.nombre_director && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <User className="h-4 w-4 text-muted-foreground" />
                                        <span>{centro.nombre_director}</span>
                                    </div>
                                )}
                                {centro.telefono_director && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <Phone className="h-4 w-4 text-muted-foreground" />
                                        <span>{centro.telefono_director}</span>
                                    </div>
                                )}
                                {centro.email_director && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <Mail className="h-4 w-4 text-muted-foreground" />
                                        <span>{centro.email_director}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="mt-4 p-4 rounded-lg border bg-muted/30 text-center text-muted-foreground text-sm">
                            La gestión de instructores, cursos, estudiantes y procesos se implementará en la siguiente fase.
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
