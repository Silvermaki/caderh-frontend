"use client";

import React, { Suspense, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Breadcrumbs, BreadcrumbItem } from "@/components/ui/breadcrumbs";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SkeletonTable from "@/components/skeleton-table";
import { useApi } from "@/components/egresados/api";
import { BarraFiltros, FILTROS_INICIALES, type FiltrosEgresados } from "@/components/egresados/filtros";
import { CierreTab } from "@/components/egresados/cierre-tab";
import { SeguimientoTab } from "@/components/egresados/seguimiento-tab";

const TAB_CLASS =
    "rounded-none border-b-2 border-transparent bg-transparent px-0 pb-3 -mb-px shadow-none data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none";

function PageContent() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { data: session } = useSession() as any;
    const role = session?.user?.role;
    // Mismo criterio que el resto de Centros: Administrador y Supervisor editan.
    const puedeEditar = role === "ADMIN" || role === "MANAGER";
    const api = useApi();

    const tab = searchParams.get("tab") === "seguimiento" ? "seguimiento" : "cierre";
    const [filtros, setFiltros] = useState<FiltrosEgresados>(FILTROS_INICIALES);
    const [version, setVersion] = useState(0);

    const cambiarTab = (t: string) => {
        router.replace(t === "seguimiento" ? `${pathname}?tab=seguimiento` : pathname, { scroll: false });
    };

    return (
        <div className="mb-4">
            <Breadcrumbs>
                <BreadcrumbItem>Plataforma</BreadcrumbItem>
                <BreadcrumbItem>Centros</BreadcrumbItem>
                <BreadcrumbItem className="text-primary">Egresados y seguimiento</BreadcrumbItem>
            </Breadcrumbs>
            <div className="mt-5 text-sm font-bold">Egresados y seguimiento</div>
            <p className="text-sm text-muted-foreground mt-1 max-w-3xl">
                Registre por listas quién egresó o desertó de cada curso y, después, la situación de los egresados
                en cada corte de seguimiento. Marque varios a la vez o trabaje la lista en Excel.
            </p>

            <div className="mt-4 mb-4">
                <BarraFiltros api={api} filtros={filtros} onChange={setFiltros} />
            </div>

            <Tabs value={tab} onValueChange={cambiarTab} className="w-full">
                <TabsList className="w-full justify-start gap-8 border-b border-default-200 rounded-none bg-transparent p-0 h-auto min-h-0 mb-4">
                    <TabsTrigger value="cierre" className={TAB_CLASS}>Cierre de cursos</TabsTrigger>
                    <TabsTrigger value="seguimiento" className={TAB_CLASS}>Seguimiento de egresados</TabsTrigger>
                </TabsList>
                <TabsContent value="cierre">
                    <CierreTab
                        api={api}
                        filtros={filtros}
                        puedeEditar={puedeEditar}
                        recargarResumen={() => setVersion((v) => v + 1)}
                    />
                </TabsContent>
                <TabsContent value="seguimiento">
                    <SeguimientoTab
                        api={api}
                        filtros={filtros}
                        puedeEditar={puedeEditar}
                        version={version}
                        onIrACierre={() => cambiarTab("cierre")}
                    />
                </TabsContent>
            </Tabs>
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
