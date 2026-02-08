"use client";

import React, { useState, useEffect } from "react";
import { Breadcrumbs, BreadcrumbItem } from "@/components/ui/breadcrumbs";
import { Button } from "@/components/ui/button";
import { useSearchParams, usePathname, useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import SkeletonTable from "@/components/skeleton-table";
import toast from "react-hot-toast";
import { useSession } from "next-auth/react";
import { RefreshCcw, Eye } from "lucide-react";
import { Icon } from "@iconify/react";
import { dateToString, timeToString, prettifyNumber } from "@/app/libs/utils";
import { Badge } from "@/components/ui/badge";
import BitacoraDetailModal from "@/components/bitacora-detail-modal";

const Page = () => {
    const pathname = usePathname();
    const router = useRouter();
    const searchParams = useSearchParams();
    const userIdInit = searchParams?.get("user_id") ?? "";
    const roleInit = searchParams?.get("role") ?? "";
    const { data: session } = useSession() as any;
    const [logs, setLogs] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [offset, setOffset] = useState<number>(0);
    const [limit, setLimit] = useState<number>(10);
    const [count, setCount] = useState<number>(0);
    const [desc, setDesc] = useState<boolean>(true);
    const [sort, setSort] = useState<string>("created_dt");
    const [userFilter, setUserFilter] = useState<string>(userIdInit);
    const [roleFilter, setRoleFilter] = useState<string>(roleInit);
    const [loading, setLoading] = useState<boolean>(true);
    const [selectedLog, setSelectedLog] = useState<any>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);

    const getLogs = async (params: string) => {
        setLoading(true);
        try {
            const request = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/admin/logs?${params}`,
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${session?.user?.session}`,
                    },
                }
            );
            if (request.ok) {
                const response = await request.json();
                setLogs(response.data ?? []);
                setCount(response.count ?? 0);
            } else {
                const response = await request.json();
                toast.error(response.message ?? "Error al cargar bitácoras");
            }
        } catch (error: any) {
            toast.error("Error al cargar bitácoras");
        }
        setLoading(false);
    };

    const getUsers = async () => {
        try {
            const params = new URLSearchParams({
                offset: "0",
                limit: "100",
                sort: "name",
                desc: "asc",
            });
            const request = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/admin/users?${params}`,
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${session?.user?.session}`,
                    },
                }
            );
            if (request.ok) {
                const response = await request.json();
                setUsers(response.data ?? []);
            }
        } catch (error: any) {
            // Silently fail for users dropdown
        }
    };

    const buildParams = (overrides?: {
        offset?: number;
        user_id?: string;
        role?: string;
        limit?: number;
    }) => {
        const o = overrides?.offset ?? offset;
        const u = overrides?.user_id !== undefined ? overrides.user_id : userFilter;
        const r = overrides?.role !== undefined ? overrides.role : roleFilter;
        const l = overrides?.limit ?? limit;
        const p = new URLSearchParams({
            offset: String(o * l),
            limit: String(l),
            sort,
            desc: desc ? "desc" : "asc",
        });
        if (u) p.set("user_id", u);
        if (r) p.set("role", r);
        return p.toString();
    };

    const applyFilters = (userId: string, role: string) => {
        setUserFilter(userId);
        setRoleFilter(role);
        const p = new URLSearchParams();
        if (userId) p.set("user_id", userId);
        if (role) p.set("role", role);
        const query = p.toString();
        router.replace(query ? `${pathname}?${query}` : pathname);
        getLogs(buildParams({ offset: 0, user_id: userId, role }));
        setOffset(0);
    };

    const getDataPagination = async (newOffset: number) => {
        setOffset(newOffset);
        await getLogs(buildParams({ offset: newOffset }));
    };

    const onRefresh = () => {
        router.replace(pathname);
        setUserFilter("");
        setRoleFilter("");
        setOffset(0);
        getLogs(buildParams({ offset: 0, user_id: "", role: "" }));
    };

    useEffect(() => {
        if (session) {
            getUsers();
            getLogs(buildParams({ offset: 0, user_id: userIdInit, role: roleInit }));
            if (userIdInit) setUserFilter(userIdInit);
            if (roleInit) setRoleFilter(roleInit);
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

    const openDetail = (log: any) => {
        setSelectedLog(log);
        setIsDetailModalOpen(true);
    };

    const roleLabel = (role: string) =>
        role === "ADMIN" ? "Administrador" : role === "MANAGER" ? "Supervisor" : "Agente";

    const roleBadgeColor = (role: string) =>
        role === "ADMIN" ? "dark" : role === "MANAGER" ? "warning" : "default";

    return (
        <div>
            <Breadcrumbs>
                <BreadcrumbItem>Plataforma</BreadcrumbItem>
                <BreadcrumbItem>Administración</BreadcrumbItem>
                <BreadcrumbItem className="text-primary">Bitácoras</BreadcrumbItem>
            </Breadcrumbs>
            <div className="mt-5 text-sm font-bold">Listado de Bitácoras</div>
            <Card className="p-4 mt-4">
                <CardContent className="p-0">
                    <div className="flex flex-row flex-wrap items-center justify-between gap-4 mb-4">
                        <div className="flex flex-wrap items-center gap-4">
                            <div className="flex flex-col gap-2">
                                <Label className="text-muted-foreground text-xs">Usuario</Label>
                                <Select
                                    value={userFilter || "all"}
                                    onValueChange={(v) =>
                                        applyFilters(v === "all" ? "" : v, roleFilter)
                                    }
                                >
                                    <SelectTrigger size="sm" className="w-[200px]">
                                        <SelectValue placeholder="Todos" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todos los usuarios</SelectItem>
                                        {users.map((u) => (
                                            <SelectItem key={u.id} value={u.id}>
                                                {u.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex flex-col gap-2">
                                <Label className="text-muted-foreground text-xs">Rol</Label>
                                <Select
                                    value={roleFilter || "all"}
                                    onValueChange={(v) =>
                                        applyFilters(userFilter, v === "all" ? "" : v)
                                    }
                                >
                                    <SelectTrigger size="sm" className="w-[160px]">
                                        <SelectValue placeholder="Todos" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todos los roles</SelectItem>
                                        <SelectItem value="ADMIN">Administrador</SelectItem>
                                        <SelectItem value="MANAGER">Supervisor</SelectItem>
                                        <SelectItem value="AGENT">Agente</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <Button size="icon" color="info" className="h-8 w-8" onClick={onRefresh}>
                            <RefreshCcw className="h-3 w-3" />
                        </Button>
                    </div>
                    {loading && <SkeletonTable />}
                    {!loading && (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Fecha</TableHead>
                                        <TableHead>Hora</TableHead>
                                        <TableHead>Usuario</TableHead>
                                        <TableHead>Rol</TableHead>
                                        <TableHead>Bitácora</TableHead>
                                        <TableHead className="w-[80px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {logs.map((log) => (
                                        <TableRow key={log.id}>
                                            <TableCell className="text-sm">
                                                {log.created_dt
                                                    ? dateToString(new Date(log.created_dt))
                                                    : "-"}
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                {log.created_dt
                                                    ? timeToString(new Date(log.created_dt))
                                                    : "-"}
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                {log.user_name ?? "-"}
                                            </TableCell>
                                            <TableCell>
                                                <Badge color={roleBadgeColor(log.user_role)}>
                                                    {roleLabel(log.user_role)}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground max-w-[300px]">
                                                <span className="line-clamp-2">{log.log ?? "-"}</span>
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8"
                                                    onClick={() => openDetail(log)}
                                                >
                                                    <Eye className="h-4 w-4 mr-1" />
                                                    Ver
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                    {!loading && logs.length === 0 && (
                        <div className="py-12 text-center text-muted-foreground">
                            No hay bitácoras registradas.
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
                                        getLogs(
                                            buildParams({
                                                offset: 0,
                                                limit: newLimit,
                                                user_id: userFilter,
                                                role: roleFilter,
                                            })
                                        );
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
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
            <BitacoraDetailModal
                log={selectedLog}
                isOpen={isDetailModalOpen}
                setIsOpen={setIsDetailModalOpen}
            />
        </div>
    );
};

export default Page;
