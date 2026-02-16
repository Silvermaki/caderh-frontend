"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Breadcrumbs, BreadcrumbItem } from "@/components/ui/breadcrumbs";
import { Button } from "@/components/ui/button";
import { useSearchParams } from "next/navigation";
import {
    Card,
    CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupButton } from "@/components/ui/input-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import SkeletonTable from "@/components/skeleton-table";
import { usePathname, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useSession } from "next-auth/react";
import { PlusCircle, RefreshCcw, MapPin, Phone, Mail, User } from "lucide-react";
import { Icon } from "@iconify/react";
import { prettifyNumber } from "@/app/libs/utils";
import { Suspense } from "react";

function PageContent() {
    const pathname = usePathname();
    const router = useRouter();
    const searchParams = useSearchParams();
    const searchInit = searchParams?.get("search") ?? "";
    const { data: session } = useSession() as any;
    const [centros, setCentros] = useState<any[]>([]);
    const [offset, setOffset] = useState<number>(0);
    const [limit, setLimit] = useState<number>(10);
    const [count, setCount] = useState<number>(0);
    const [desc, setDesc] = useState<boolean>(true);
    const [sort, setSort] = useState<string>("nombre");
    const [search, setSearch] = useState<string>(searchInit);
    const [searchInput, setSearchInput] = useState<string>(searchInit);
    const [loading, setLoading] = useState<boolean>(true);
    const [statusFilter, setStatusFilter] = useState<string>("1");
    const userRole = session?.user?.role;

    const getCentros = async (params: string) => {
        setLoading(true);
        try {
            const request = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/centros/centros?${params}`,
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${session?.user?.session}`,
                    },
                }
            );
            if (request.ok) {
                const response = await request.json();
                setCentros(response.data ?? []);
                setCount(response.count ?? 0);
            } else {
                const response = await request.json();
                toast.error(response.message ?? "Error al cargar centros");
            }
        } catch (error: any) {
            toast.error("Error al cargar centros");
        }
        setLoading(false);
    };

    const getDataInit = async (searchValue: string, estatus?: string) => {
        const activeStatus = estatus ?? statusFilter;
        setSearch(searchValue);
        const params = new URLSearchParams({
            offset: "0",
            limit: limit + "",
            sort,
            desc: desc ? "desc" : "asc",
            search: searchValue,
            estatus: activeStatus,
        });
        await getCentros(params.toString());
        setOffset(0);
    };

    const getDataSearch = async (searching: string) => {
        const params = new URLSearchParams({
            offset: "0",
            limit: limit + "",
            sort,
            desc: desc ? "desc" : "asc",
            search: searching,
            estatus: statusFilter,
        });
        setSearch(searching);
        await getCentros(params.toString());
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
            estatus: statusFilter,
        });
        await getCentros(params.toString());
    };

    const onSearch = () => {
        if (searchInput) {
            router.replace(`${pathname}?search=${searchInput}`);
        } else {
            router.replace(pathname);
        }
        if (searchInput) {
            getDataSearch(searchInput);
        } else {
            getDataInit("");
        }
    };

    const onRefresh = () => {
        router.replace(pathname);
        setSearchInput("");
        getDataInit("");
    };

    useEffect(() => {
        if (session) {
            getDataInit(searchInit);
        }
    }, [session]);

    const pages = count > 0 ? Math.ceil(count / limit) : 0;
    const pageIndices = Array.from({ length: pages }, (_, i) => i);

    const shouldShowPagination = (pageIdx: number) => {
        if (offset <= 2 && pageIdx <= 6) return true;
        if (offset >= pages - 3 && pageIdx >= pages - 7) return true;
        if (offset + 3 >= pageIdx && offset - 3 <= pageIdx) return true;
        return false;
    };

    return (
        <div className="mb-4">
            <Breadcrumbs>
                <BreadcrumbItem>Plataforma</BreadcrumbItem>
                <BreadcrumbItem>Centros</BreadcrumbItem>
                <BreadcrumbItem className="text-primary">Gestionar Centros</BreadcrumbItem>
            </Breadcrumbs>
            <div className="mt-5 text-sm font-bold">Listado de Centros</div>
            <Card className="p-4 mt-4">
                <CardContent className="p-0">
                    <div className="flex flex-row justify-between items-center gap-4 mb-4">
                        <div className="flex flex-row items-center gap-3">
                            <InputGroup className="max-w-sm shrink-0">
                                <Input
                                    placeholder="Buscar por nombre, siglas o código..."
                                    value={searchInput}
                                    onChange={(e) => setSearchInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") onSearch();
                                    }}
                                    className="h-10 rounded-r-none"
                                />
                                <InputGroupButton className="rounded-l-none border-l-0">
                                    <Button
                                        color="primary"
                                        size="sm"
                                        className="h-10 rounded-l-none"
                                        onClick={onSearch}
                                    >
                                        Buscar
                                    </Button>
                                </InputGroupButton>
                            </InputGroup>
                            <Select
                                value={statusFilter}
                                onValueChange={(v) => {
                                    setStatusFilter(v);
                                    setOffset(0);
                                    getDataInit(search, v);
                                }}
                            >
                                <SelectTrigger className="w-[160px] h-10">
                                    <SelectValue placeholder="Estado" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="1">Activo</SelectItem>
                                    <SelectItem value="0">Inactivo</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        {userRole !== "USER" && (
                            <Button
                                color="success"
                                onClick={() => {
                                    // TODO: Phase 2 - create centro modal
                                    toast("Crear centro se habilitará en la siguiente fase");
                                }}
                            >
                                Crear Centro
                                <PlusCircle className="h-4 w-4 ml-2" />
                            </Button>
                        )}
                    </div>
                    {loading && <SkeletonTable />}
                    {!loading && (
                        <div className="grid grid-cols-1 gap-4">
                            {centros.map((c) => (
                                <Link
                                    key={c.id}
                                    href={`/dashboard/centros/manage/${c.id}`}
                                    className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-md"
                                >
                                    <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                                        <CardContent className="p-4">
                                            <div className="flex flex-col gap-2">
                                                <div className="flex flex-row items-start justify-between gap-2">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <h3 className="font-semibold text-card-foreground text-sm leading-tight">
                                                                {c.nombre}
                                                            </h3>
                                                            {c.siglas && (
                                                                <Badge variant="secondary" className="text-xs">
                                                                    {c.siglas}
                                                                </Badge>
                                                            )}
                                                            {c.codigo && (
                                                                <Badge variant="outline" className="text-xs">
                                                                    {c.codigo}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        {c.descripcion && (
                                                            <p className="text-muted-foreground text-xs mt-1 line-clamp-2">
                                                                {c.descripcion}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <Badge
                                                        variant={c.estatus === 1 ? "soft" : "secondary"}
                                                        color={c.estatus === 1 ? "success" : "secondary"}
                                                        className="shrink-0"
                                                    >
                                                        {c.estatus === 1 ? "Activo" : "Inactivo"}
                                                    </Badge>
                                                </div>
                                                <div className="flex flex-row flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground mt-1">
                                                    {(c.departamento_nombre || c.municipio_nombre) && (
                                                        <span className="inline-flex items-center gap-1">
                                                            <MapPin className="h-3 w-3" />
                                                            {[c.municipio_nombre, c.departamento_nombre].filter(Boolean).join(", ")}
                                                        </span>
                                                    )}
                                                    {c.nombre_director && (
                                                        <span className="inline-flex items-center gap-1">
                                                            <User className="h-3 w-3" />
                                                            {c.nombre_director}
                                                        </span>
                                                    )}
                                                    {c.telefono && (
                                                        <span className="inline-flex items-center gap-1">
                                                            <Phone className="h-3 w-3" />
                                                            {c.telefono}
                                                        </span>
                                                    )}
                                                    {c.email && (
                                                        <span className="inline-flex items-center gap-1">
                                                            <Mail className="h-3 w-3" />
                                                            {c.email}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Link>
                            ))}
                        </div>
                    )}
                    {!loading && centros.length === 0 && (
                        <div className="py-12 text-center text-muted-foreground">
                            No hay centros registrados.
                        </div>
                    )}
                    {!loading && count > 0 && (
                        <div className="flex flex-row flex-wrap items-center justify-between gap-4 mt-6 pt-4 border-t">
                            <div className="flex flex-row items-center gap-4">
                                <Select
                                    value={limit + ""}
                                    onValueChange={(v) => {
                                        const newLimit = +v;
                                        setLimit(newLimit);
                                        setOffset(0);
                                        const params = new URLSearchParams({
                                            offset: "0",
                                            limit: newLimit + "",
                                            sort,
                                            desc: desc ? "desc" : "asc",
                                            search,
                                            estatus: statusFilter,
                                        });
                                        getCentros(params.toString());
                                    }}
                                >
                                    <SelectTrigger size="sm" className="w-[100px]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="10">10</SelectItem>
                                        <SelectItem value="25">25</SelectItem>
                                        <SelectItem value="50">50</SelectItem>
                                        <SelectItem value="100">100</SelectItem>
                                    </SelectContent>
                                </Select>
                                <div className="text-xs">
                                    Total: <b>{prettifyNumber(count)}</b>
                                </div>
                            </div>
                            <div className="flex gap-2 items-center">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => offset > 0 && getDataPagination(offset - 1)}
                                    disabled={offset === 0}
                                    className="h-8 w-8"
                                >
                                    <Icon
                                        icon="heroicons:chevron-left"
                                        className="w-5 h-5 rtl:rotate-180"
                                    />
                                </Button>
                                {pageIndices.map((pageIdx) =>
                                    shouldShowPagination(pageIdx) ? (
                                        <Button
                                            key={pageIdx}
                                            variant={offset === pageIdx ? undefined : "outline"}
                                            onClick={() => getDataPagination(pageIdx)}
                                            className="w-8 h-8"
                                        >
                                            {pageIdx + 1}
                                        </Button>
                                    ) : null
                                )}
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() =>
                                        offset + 1 < pages && getDataPagination(offset + 1)
                                    }
                                    disabled={offset + 1 >= pages}
                                    className="h-8 w-8"
                                >
                                    <Icon
                                        icon="heroicons:chevron-right"
                                        className="w-5 h-5 rtl:rotate-180"
                                    />
                                </Button>
                                <Button
                                    size="icon"
                                    color="info"
                                    className="h-8 w-8"
                                    onClick={onRefresh}
                                >
                                    <RefreshCcw className="h-3 w-3" />
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
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
