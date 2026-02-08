"use client";

import React, { useState, useEffect } from "react";
import { Breadcrumbs, BreadcrumbItem } from "@/components/ui/breadcrumbs";
import DataTable from "@/components/ui/service-datatable";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, MenuSquare, Pencil, Trash2 } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent } from "@/components/ui/card";
import { useMediaQuery } from "@/hooks/use-media-query";
import SkeletonTable from "@/components/skeleton-table";
import { usePathname, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { useSession } from "next-auth/react";
import { dateToString, prettifyNumber } from "@/app/libs/utils";
import FinancingSourceModal from "@/components/financing-source-modal";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Suspense } from "react";

function PageContent() {
    const searchParams: any = useSearchParams();
    const isMobile = useMediaQuery("(max-width: 1000px)");
    const [sources, setSources] = useState<any[]>([]);
    const [offset, setOffset] = useState<number>(0);
    const [limit, setLimit] = useState<number>(10);
    const [count, setCount] = useState<number>(0);
    const [desc, setDesc] = useState<boolean>(true);
    const [sort, setSort] = useState<string>("name");
    const searchInit = (new URLSearchParams(searchParams)).get("search") ?? "";
    const [search, setSearch] = useState<string>(searchInit ?? "");
    const [loading, setLoading] = useState<boolean>(true);
    const [isModalLoading, setIsModalLoading] = useState<boolean>(false);
    const [selectedSource, setSelectedSource] = useState<any>(null);
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [deleteSource, setDeleteSource] = useState<any>(null);
    const [deleting, setDeleting] = useState<boolean>(false);
    const pathname = usePathname();
    const { data: session } = useSession() as any;

    const columns: any[] = [
        {
            accessorKey: "name",
            header: ({ column }: any) => (
                <Button
                    variant="ghost"
                    color="dark"
                    className="p-2"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Nombre
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }: any) => (
                <div className="font-medium text-card-foreground/80">
                    <span className="text-sm text-card-foreground">{row.original.name ?? "-"}</span>
                </div>
            ),
        },
        {
            accessorKey: "description",
            header: "Descripción",
            cell: ({ row }: any) => (
                <div className="text-sm text-muted-foreground max-w-[300px]">
                    <span className="line-clamp-2">{row.original.description ?? "-"}</span>
                </div>
            ),
        },
        {
            accessorKey: "created_dt",
            header: ({ column }: any) => (
                <Button
                    variant="ghost"
                    color="dark"
                    className="p-2"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Fecha creación
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }: any) => (
                <div className="text-sm text-muted-foreground">
                    {row.original.created_dt
                        ? dateToString(new Date(row.original.created_dt))
                        : "-"}
                </div>
            ),
        },
        {
            id: "actions",
            enableHiding: false,
            cell: ({ row }: any) => (
                <div className="text-end">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0" color="dark">
                                <MenuSquare className="h-5 w-5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" side="bottom">
                            <DropdownMenuLabel>Opciones</DropdownMenuLabel>
                            <DropdownMenuItem
                                onClick={async () => {
                                    setSelectedSource(null);
                                    setIsModalLoading(true);
                                    setIsModalOpen(true);
                                    await getSource(row.original.id);
                                }}
                            >
                                <Pencil className="h-4 w-4 mr-2" />
                                Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => setDeleteSource(row.original)}
                                className="text-destructive"
                            >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Eliminar
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            ),
        },
    ];

    const mobileColumns: any[] = [
        {
            accessorKey: "name",
            header: ({ column }: any) => (
                <Button
                    variant="ghost"
                    color="dark"
                    className="p-2"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Nombre
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }: any) => (
                <div className="font-medium text-card-foreground/80">
                    <span className="text-sm text-card-foreground">{row.original.name ?? "-"}</span>
                </div>
            ),
        },
        {
            accessorKey: "created_dt",
            header: "Fecha creación",
            cell: ({ row }: any) => (
                <div className="text-sm text-muted-foreground">
                    {row.original.created_dt
                        ? dateToString(new Date(row.original.created_dt))
                        : "-"}
                </div>
            ),
        },
        {
            id: "actions",
            enableHiding: false,
            cell: ({ row }: any) => (
                <div className="text-end">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0" color="dark">
                                <MenuSquare className="h-5 w-5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" side="bottom">
                            <DropdownMenuLabel>Opciones</DropdownMenuLabel>
                            <DropdownMenuItem
                                onClick={async () => {
                                    setSelectedSource(null);
                                    setIsModalLoading(true);
                                    setIsModalOpen(true);
                                    await getSource(row.original.id);
                                }}
                            >
                                <Pencil className="h-4 w-4 mr-2" />
                                Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => setDeleteSource(row.original)}
                                className="text-destructive"
                            >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Eliminar
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            ),
        },
    ];

    const getSources = async (params: string) => {
        setLoading(true);
        try {
            const request = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/supervisor/financing-sources?${params}`,
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${session?.user?.session}`,
                    },
                }
            );
            if (request.ok) {
                const response = await request.json();
                setSources(response.data ?? []);
                setCount(response.count ?? 0);
            } else {
                const response = await request.json();
                toast.error(response.message ?? "Error al cargar fuentes");
            }
        } catch (error: any) {
            toast.error("Error al cargar fuentes");
        }
        setLoading(false);
    };

    const getSource = async (id: string) => {
        setIsModalLoading(true);
        try {
            const params = new URLSearchParams({ id });
            const request = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/supervisor/financing-source?${params}`,
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${session?.user?.session}`,
                    },
                }
            );
            if (request.ok) {
                const response = await request.json();
                setSelectedSource(response.data ?? null);
            } else {
                const response = await request.json();
                toast.error(response.message ?? "Error al cargar fuente");
                setIsModalOpen(false);
            }
        } catch (error: any) {
            toast.error("Error al cargar fuente");
            setIsModalOpen(false);
        }
        setIsModalLoading(false);
    };

    const getDataInit = async (searchValue: string) => {
        setSearch(searchValue);
        const params = new URLSearchParams({
            offset: "0",
            limit: limit + "",
            sort,
            desc: desc ? "desc" : "asc",
            search: searchValue,
        });
        await getSources(params.toString());
        setOffset(0);
    };

    const getDataSort = async (sorting: string) => {
        const params = new URLSearchParams({
            offset: offset * limit + "",
            limit: limit + "",
            sort: sorting,
            desc: desc ? "desc" : "asc",
            search,
        });
        setDesc(!desc);
        setSort(sorting);
        await getSources(params.toString());
    };

    const getDataSearch = async (searching: string) => {
        const params = new URLSearchParams({
            offset: "0",
            limit: limit + "",
            sort,
            desc: desc ? "desc" : "asc",
            search: searching,
        });
        setSearch(searching);
        await getSources(params.toString());
        setOffset(0);
    };

    const getDataPagination = async (offseting: number) => {
        setOffset(offseting);
        const params = new URLSearchParams({
            offset: offseting * limit + "",
            limit: limit + "",
            sort,
            desc: desc ? "desc" : "asc",
            search,
        });
        await getSources(params.toString());
    };

    const onSort = async (sorting: { id: string }) => {
        getDataSort(sorting.id);
    };

    const onSearch = async (value: string) => {
        if (value) {
            window.history.replaceState(null, "", `${pathname}?search=${value}`);
        } else {
            window.history.replaceState(null, "", pathname);
        }
        getDataSearch(value);
    };

    const onRefresh = () => {
        window.history.replaceState(null, "", pathname);
        getDataInit("");
    };

    const reloadList = () => {
        const params = new URLSearchParams({
            offset: offset * limit + "",
            limit: limit + "",
            sort,
            desc: desc ? "desc" : "asc",
            search,
        });
        getSources(params.toString());
    };

    const onDeleteConfirm = async () => {
        if (!deleteSource) return;
        setDeleting(true);
        try {
            const request = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/supervisor/financing-source`,
                {
                    method: "DELETE",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${session?.user?.session}`,
                    },
                    body: JSON.stringify({ id: deleteSource.id }),
                }
            );
            if (request.ok) {
                toast.success("Fuente eliminada");
                setDeleteSource(null);
                reloadList();
            } else {
                const response = await request.json();
                toast.error(response.message ?? "Error al eliminar");
            }
        } catch (error: any) {
            toast.error("Error al eliminar");
        }
        setDeleting(false);
    };

    useEffect(() => {
        if (session) {
            getDataInit(searchInit);
        }
    }, [session]);

    useEffect(() => {
        if (sources.length > 0) {
            getDataPagination(0);
        }
    }, [limit]);

    return (
        <div>
            <Breadcrumbs>
                <BreadcrumbItem>Plataforma</BreadcrumbItem>
                <BreadcrumbItem>Administración</BreadcrumbItem>
                <BreadcrumbItem className="text-primary">Fuentes de financiamiento</BreadcrumbItem>
            </Breadcrumbs>
            <div className="mt-5 text-sm font-bold">Listado de Fuentes de Financiamiento</div>
            <Card className="p-4 mt-4">
                <CardContent className="p-0">
                    {loading && <SkeletonTable />}
                    {!loading && (
                        <DataTable
                            insertString="Crear fuente"
                            onInsert={() => {
                                setSelectedSource(null);
                                setIsModalOpen(true);
                            }}
                            search={search}
                            setSearch={setSearch}
                            className={loading ? "hidden" : ""}
                            data={sources}
                            columns={isMobile ? mobileColumns : columns}
                            refresh={onRefresh}
                            searchPlaceholder="Buscar..."
                            onSort={onSort}
                            onSearch={onSearch}
                            offset={offset}
                            count={count}
                            limit={limit}
                            setLimit={setLimit}
                            showLimit={true}
                            onPagination={getDataPagination}
                        />
                    )}
                </CardContent>
            </Card>
            <FinancingSourceModal
                source={selectedSource}
                loading={isModalLoading}
                isOpen={isModalOpen}
                setIsOpen={(open) => {
                    setIsModalOpen(open);
                    if (!open) setSelectedSource(null);
                }}
                reloadList={reloadList}
            />
            <AlertDialog open={!!deleteSource} onOpenChange={(open) => !open && setDeleteSource(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar fuente de financiamiento?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Se eliminará &quot;{deleteSource?.name}&quot;. Esta acción no se puede
                            deshacer.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={onDeleteConfirm}
                            disabled={deleting}
                            color="destructive"
                        >
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
