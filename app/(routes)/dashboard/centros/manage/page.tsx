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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import SkeletonTable from "@/components/skeleton-table";
import { usePathname, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useSession } from "next-auth/react";
import { PlusCircle, RefreshCcw, MapPin, Phone, Mail, User, ArrowDown01, ArrowDown10, ArrowDownAZ, ArrowDownZA, Download, Loader2 } from "lucide-react";
import CentroWizard from "@/components/centro/centro-wizard";
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
    const [desc, setDesc] = useState<boolean>(false);
    const [sort, setSort] = useState<string>("codigo");
    const [search, setSearch] = useState<string>(searchInit);
    const [searchInput, setSearchInput] = useState<string>(searchInit);
    const [loading, setLoading] = useState<boolean>(true);
    const [statusFilter, setStatusFilter] = useState<string>("1");
    const [wizardOpen, setWizardOpen] = useState(false);
    const [exporting, setExporting] = useState(false);
    const userRole = session?.user?.role;

    const exportConsolidado = async (formato: "excel" | "pdf") => {
        setExporting(true);
        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_PROXY}/centros/centros/export/consolidado?formato=${formato}`,
                { headers: { Authorization: `Bearer ${session?.user?.session}` } },
            );
            if (!res.ok) { toast.error("Error al exportar consolidado"); setExporting(false); return; }
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `consolidado-centros.${formato === "pdf" ? "pdf" : "xlsx"}`;
            a.click();
            URL.revokeObjectURL(url);
        } catch { toast.error("Error al exportar consolidado"); }
        setExporting(false);
    };

    const getCentros = async (params: string) => {
        setLoading(true);
        try {
            const request = await fetch(
                `${process.env.NEXT_PUBLIC_API_PROXY}/centros/centros?${params}`,
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

    const getDataInit = async (searchValue: string, estatus?: string, sortField?: string, sortDesc?: boolean) => {
        const activeStatus = estatus ?? statusFilter;
        setSearch(searchValue);
        const params = new URLSearchParams({
            offset: "0",
            limit: limit + "",
            sort: sortField ?? sort,
            desc: (sortDesc ?? desc) ? "desc" : "asc",
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

    const SORT_ICONS: Record<string, React.ElementType> = {
        "codigo:asc": ArrowDown01,
        "codigo:desc": ArrowDown10,
        "nombre:asc": ArrowDownAZ,
        "nombre:desc": ArrowDownZA,
    };
    const sortKey = `${sort}:${desc ? "desc" : "asc"}`;
    const SortIcon = SORT_ICONS[sortKey] ?? ArrowDown01;

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
                            <Select
                                value={sortKey}
                                onValueChange={(v) => {
                                    const [field, dir] = v.split(":");
                                    setSort(field);
                                    setDesc(dir === "desc");
                                    setOffset(0);
                                    getDataInit(search, undefined, field, dir === "desc");
                                }}
                            >
                                <SelectTrigger className="w-[130px] h-10 whitespace-nowrap">
                                    <span className="flex items-center">
                                        <SortIcon className="h-4 w-4 mr-2 shrink-0 text-muted-foreground" />
                                        {sort === "codigo" ? "Código" : "Nombre"}
                                    </span>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="codigo:asc">
                                        <span className="flex items-center">
                                            <ArrowDown01 className="h-4 w-4 mr-2.5 shrink-0 text-muted-foreground" />
                                            <span className="pr-2">Código ascendente</span>
                                        </span>
                                    </SelectItem>
                                    <SelectItem value="codigo:desc">
                                        <span className="flex items-center">
                                            <ArrowDown10 className="h-4 w-4 mr-2.5 shrink-0 text-muted-foreground" />
                                            <span className="pr-2">Código descendente</span>
                                        </span>
                                    </SelectItem>
                                    <SelectItem value="nombre:asc">
                                        <span className="flex items-center">
                                            <ArrowDownAZ className="h-4 w-4 mr-2.5 shrink-0 text-muted-foreground" />
                                            <span className="pr-2">Nombre A–Z</span>
                                        </span>
                                    </SelectItem>
                                    <SelectItem value="nombre:desc">
                                        <span className="flex items-center">
                                            <ArrowDownZA className="h-4 w-4 mr-2.5 shrink-0 text-muted-foreground" />
                                            <span className="pr-2">Nombre Z–A</span>
                                        </span>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-center gap-2">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" disabled={exporting}>
                                        {exporting
                                            ? <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            : <Download className="h-4 w-4 mr-2" />}
                                        Exportar
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => exportConsolidado("excel")}>
                                        Excel (.xlsx)
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => exportConsolidado("pdf")}>
                                        PDF
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                            {userRole !== "USER" && (
                                <Button
                                    color="success"
                                    onClick={() => setWizardOpen(true)}
                                >
                                    Crear Centro
                                    <PlusCircle className="h-4 w-4 ml-2" />
                                </Button>
                            )}
                        </div>
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
                                    <Card className="hover:border-primary/50 hover:bg-primary/5 transition-colors cursor-pointer">
                                        <CardContent className="p-4">
                                            <div className="flex flex-col gap-2">
                                                <div className="flex flex-row items-start justify-between gap-2">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <h3 className="font-semibold text-card-foreground text-sm leading-tight">
                                                                {c.nombre}
                                                            </h3>
                                                            {c.siglas && (
                                                                <Badge color="secondary" className="text-xs">
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
                                                        variant={c.estatus === 1 ? "soft" : undefined}
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
            <CentroWizard isOpen={wizardOpen} setIsOpen={setWizardOpen} reloadList={() => getDataInit(search)} />
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
