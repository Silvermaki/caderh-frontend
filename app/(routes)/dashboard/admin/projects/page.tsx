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
import SkeletonTable from "@/components/skeleton-table";
import { usePathname, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useSession } from "next-auth/react";
import { PlusCircle, RefreshCcw } from "lucide-react";
import { Icon } from "@iconify/react";
import { prettifyNumber } from "@/app/libs/utils";
import NewProjectModal from "@/components/new-project-modal";
import ProjectHeader from "@/components/project/ProjectHeader";
import { Suspense } from "react";

function PageContent() {
    const pathname = usePathname();
    const router = useRouter();
    const searchParams = useSearchParams();
    const searchInit = searchParams?.get("search") ?? "";
    const { data: session } = useSession() as any;
    const [projects, setProjects] = useState<any[]>([]);
    const [offset, setOffset] = useState<number>(0);
    const [limit, setLimit] = useState<number>(10);
    const [count, setCount] = useState<number>(0);
    const [desc, setDesc] = useState<boolean>(true);
    const [sort, setSort] = useState<string>("created_dt");
    const [search, setSearch] = useState<string>(searchInit);
    const [searchInput, setSearchInput] = useState<string>(searchInit);
    const [loading, setLoading] = useState<boolean>(true);
    const [statusFilter, setStatusFilter] = useState<string>("ACTIVE");
    const [assignedFilter, setAssignedFilter] = useState<string>("ALL");
    const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState<boolean>(false);
    const userRole = session?.user?.role;

    const getProjects = async (params: string) => {
        setLoading(true);
        try {
            const request = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/supervisor/projects?${params}`,
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${session?.user?.session}`,
                    },
                }
            );
            if (request.ok) {
                const response = await request.json();
                setProjects(response.data ?? []);
                setCount(response.count ?? 0);
            } else {
                const response = await request.json();
                toast.error(response.message ?? "Error al cargar proyectos");
            }
        } catch (error: any) {
            toast.error("Error al cargar proyectos");
        }
        setLoading(false);
    };

    const getDataInit = async (searchValue: string, status?: string, assigned?: string) => {
        const activeStatus = status ?? statusFilter;
        const activeAssigned = assigned ?? assignedFilter;
        setSearch(searchValue);
        const params = new URLSearchParams({
            offset: "0",
            limit: limit + "",
            sort,
            desc: desc ? "desc" : "asc",
            search: searchValue,
            status: activeStatus,
        });
        if (activeAssigned === "MINE") params.set("assigned_to", "me");
        await getProjects(params.toString());
        setOffset(0);
    };

    const getDataSearch = async (searching: string) => {
        const params = new URLSearchParams({
            offset: "0",
            limit: limit + "",
            sort,
            desc: desc ? "desc" : "asc",
            search: searching,
            status: statusFilter,
        });
        if (assignedFilter === "MINE") params.set("assigned_to", "me");
        setSearch(searching);
        await getProjects(params.toString());
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
            status: statusFilter,
        });
        if (assignedFilter === "MINE") params.set("assigned_to", "me");
        await getProjects(params.toString());
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

    const reloadList = () => {
        const params = new URLSearchParams({
            offset: offset * limit + "",
            limit: limit + "",
            sort,
            desc: desc ? "desc" : "asc",
            search,
            status: statusFilter,
        });
        if (assignedFilter === "MINE") params.set("assigned_to", "me");
        getProjects(params.toString());
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
                <BreadcrumbItem>Administración</BreadcrumbItem>
                <BreadcrumbItem className="text-primary">Proyectos</BreadcrumbItem>
            </Breadcrumbs>
            <div className="mt-5 text-sm font-bold">Listado de Proyectos</div>
            <Card className="p-4 mt-4">
                <CardContent className="p-0">
                    <div className="flex flex-row justify-between items-center gap-4 mb-4">
                        <div className="flex flex-row items-center gap-3">
                            <InputGroup className="max-w-sm shrink-0">
                                <Input
                                    placeholder="Buscar..."
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
                                    <SelectItem value="ACTIVE">Activo</SelectItem>
                                    <SelectItem value="ARCHIVED">Archivado</SelectItem>
                                </SelectContent>
                            </Select>
                            {userRole === "USER" && (
                                <Select
                                    value={assignedFilter}
                                    onValueChange={(v) => {
                                        setAssignedFilter(v);
                                        setOffset(0);
                                        getDataInit(search, undefined, v);
                                    }}
                                >
                                    <SelectTrigger className="w-auto min-w-[140px] h-10">
                                        <SelectValue placeholder="Asignación" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ALL">Todos</SelectItem>
                                        <SelectItem value="MINE">Mis proyectos</SelectItem>
                                    </SelectContent>
                                </Select>
                            )}
                        </div>
                        {userRole !== "USER" && (
                            <Button
                                color="success"
                                onClick={() => setIsNewProjectModalOpen(true)}
                            >
                                Crear nuevo proyecto
                                <PlusCircle className="h-4 w-4 ml-2" />
                            </Button>
                        )}
                    </div>
                    {loading && <SkeletonTable />}
                    {!loading && (
                        <div className="grid grid-cols-1 gap-4">
                            {projects.map((p) => {
                                const financed = Number(p.financed_amount ?? 0);
                                const expenses = Number(p.total_expenses ?? 0);
                                const inKindDonations = Number((p as any).in_kind_donations ?? 0);
                                const cashDonations = Number((p as any).cash_donations ?? 0);
                                const executedPct =
                                    financed > 0 ? Math.min(100, Math.round((expenses / financed) * 100)) : 0;
                                const remaining = Math.max(0, financed - expenses);
                                const progressColor: "destructive" | "warning" | "success" =
                                    executedPct >= 90 ? "destructive" : executedPct >= 70 ? "warning" : "success";
                                return (
                                    <Link
                                        key={p.id}
                                        href={`/dashboard/admin/projects/${p.id}`}
                                        className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-md"
                                    >
                                        <ProjectHeader
                                            name={p.name ?? "-"}
                                            description={p.description ?? "-"}
                                            startDate={p.start_date}
                                            endDate={p.end_date}
                                            accomplishments={p.accomplishments}
                                            financed={financed}
                                            totalExpenses={expenses}
                                            remaining={remaining}
                                            executedPct={executedPct}
                                            progressColor={progressColor}
                                            inKindDonations={inKindDonations}
                                            cashDonations={cashDonations}
                                            projectCategory={p.project_category}
                                            assignedAgentName={p.assigned_agent_name}
                                            interactive
                                        />
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                    {!loading && projects.length === 0 && (
                        <div className="py-12 text-center text-muted-foreground">
                            No hay proyectos. Crea uno nuevo para comenzar.
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
                                            status: statusFilter,
                                        });
                                        if (assignedFilter === "MINE") params.set("assigned_to", "me");
                                        getProjects(params.toString());
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
            <NewProjectModal
                isOpen={isNewProjectModalOpen}
                setIsOpen={setIsNewProjectModalOpen}
                reloadList={reloadList}
            />
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
