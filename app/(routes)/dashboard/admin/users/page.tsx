"use client"
import React, { useState, useEffect, useRef } from 'react';
import { Breadcrumbs, BreadcrumbItem } from "@/components/ui/breadcrumbs";
import DataTable from "@/components/ui/service-datatable";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, MenuSquare } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Card, CardContent } from "@/components/ui/card";
import { useMediaQuery } from "@/hooks/use-media-query";
import SkeletonTable from "@/components/skeleton-table";
import { useRouter } from 'next/navigation';
import { Badge } from "@/components/ui/badge";
import UserModal from "@/components/user-modal";
import NewUserModal from "@/components/new-user-modal";
import { usePathname, useSearchParams } from 'next/navigation';
import toast from "react-hot-toast";
import { useSession } from "next-auth/react";

const Page = () => {
    const searchParams: any = useSearchParams();
    const isMobile = useMediaQuery("(max-width: 1000px)");
    const [users, setUsers] = useState<any>([]);
    const [offset, setOffset] = useState<number>(0);
    const [limit, setLimit] = useState<number>(10);
    const [count, setCount] = useState<number>(0);
    const [desc, setDesc] = useState<boolean>(true);
    const [sort, setSort] = useState<string>('name');
    let searchInit = (new URLSearchParams(searchParams)).get('search') ?? '';
    const [search, setSearch] = useState<string>(searchInit ?? '');
    const [loading, setLoading] = useState<boolean>(true);
    const [isUserModalLoading, setIsUserModalLoading] = useState<boolean>(false);
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [isUserModalOpen, setIsUserModalOpen] = useState<boolean>(false);
    const [isNewUserModalOpen, setIsNewUserModalOpen] = useState<boolean>(false);
    const pathname = usePathname();
    const router = useRouter();
    const { data: session } = useSession() as any;

    const columns: any[] = [
        {
            accessorKey: "email",
            header: ({ column }: any) => {
                return (
                    <Button
                        variant="ghost"
                        color="dark"
                        className='p-2'
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    >
                        Correo Electrónico
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                );
            },
            cell: ({ row }: any) => {
                const value = row.original.email;
                return (
                    <div className="font-medium text-card-foreground/80">
                        <div className="flex space-x-3 rtl:space-x-reverse items-center">
                            <span className="text-sm text-card-foreground whitespace-nowrap">
                                {value ?? "-"}
                            </span>
                        </div>
                    </div>
                )
            }
        },
        {
            accessorKey: "name",
            header: ({ column }: any) => {
                return (
                    <Button
                        variant="ghost"
                        color="dark"
                        className='p-2'
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    >
                        Nombre
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                );
            },
            cell: ({ row }: any) => {
                const value = row.original.name;
                return (
                    <div className="font-medium text-card-foreground/80">
                        <div className="flex space-x-3 rtl:space-x-reverse items-center">
                            <span className="text-sm text-card-foreground whitespace-nowrap">
                                {value ?? "-"}
                            </span>
                        </div>
                    </div>
                )
            }
        },
        {
            accessorKey: "role",
            header: ({ column }: any) => {
                return (
                    <Button
                        variant="ghost"
                        color="dark"
                        className='p-2'
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    >
                        Rol
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                );
            },
            cell: ({ row }: any) => {
                const value = row.original.role;
                return (
                    <div className="font-medium">
                        <div className="flex space-x-3 rtl:space-x-reverse items-center">
                            <Badge color={`${value === 'ADMIN' ? "dark" : value === 'MANAGER' ? "warning" : "default"}`}>{value === 'ADMIN' ? "Administrador" : value === 'MANAGER' ? "Supervisor" : "Agente"}</Badge>
                        </div>
                    </div>
                )
            }
        },
        {
            accessorKey: "disabled",
            header: ({ column }: any) => {
                return (
                    <Button
                        variant="ghost"
                        color="dark"
                        className='p-2'
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    >
                        Estado
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                );
            },
            cell: ({ row }: any) => {
                const value = row.original.disabled;
                return (
                    <div className="font-medium">
                        <div className="flex space-x-3 rtl:space-x-reverse items-center">
                            <Badge color={`${value ? "destructive" : "success"}`}>{value ? "Deshabilitado" : "Activo"}</Badge>
                        </div>
                    </div>
                )
            }
        },
        {
            id: "actions",
            enableHiding: false,
            cell: ({ row }: any) => {
                return (
                    <div className=" text-end">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0" color='dark'>
                                    <MenuSquare className="h-5 w-5" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" side="bottom">
                                <DropdownMenuLabel>Opciones</DropdownMenuLabel>
                                <DropdownMenuItem
                                    onClick={async () => {
                                        setIsUserModalOpen(true);
                                        await getUser(row.original.id);
                                    }}
                                >
                                    Detalle de Usuario
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => { router.push(`/dashboard/admin/logs/${row.original.id}`) }}
                                >Ver Bitácoras</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                );
            },
        },
    ]

    const mobileColumns: any[] = [
        {
            accessorKey: "email",
            header: ({ column }: any) => {
                return (
                    <Button
                        variant="ghost"
                        color="dark"
                        className='p-2'
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    >
                        Correo Electrónico
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                );
            },
            cell: ({ row }: any) => {
                const value = row.original.email;
                return (
                    <div className="font-medium text-card-foreground/80">
                        <div className="flex space-x-3 rtl:space-x-reverse items-center">
                            <span className="text-sm text-card-foreground whitespace-nowrap">
                                {value ?? "-"}
                            </span>
                        </div>
                    </div>
                )
            }
        },
        {
            accessorKey: "disabled",
            header: ({ column }: any) => {
                return (
                    <Button
                        variant="ghost"
                        color="dark"
                        className='p-2'
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    >
                        Estado
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                );
            },
            cell: ({ row }: any) => {
                const value = row.original.disabled;
                return (
                    <div className="font-medium">
                        <div className="flex space-x-3 rtl:space-x-reverse items-center">
                            <Badge color={`${value ? "destructive" : "success"}`}>{value ? "Deshabilitado" : "Activo"}</Badge>
                        </div>
                    </div>
                )
            }
        },
        {
            id: "actions",
            enableHiding: false,
            cell: ({ row }: any) => {
                return (
                    <div className=" text-end">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0" color='dark'>
                                    <MenuSquare className="h-5 w-5" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" side="bottom">
                                <DropdownMenuLabel>Opciones</DropdownMenuLabel>
                                <DropdownMenuItem
                                    onClick={async () => {
                                        setIsUserModalOpen(true);
                                        await getUser(row.original.id);
                                    }}
                                >
                                    Detalle de Usuario
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => { router.push(`/dashboard/admin/logs/${row.original.id}`) }}
                                >Ver Bitácoras</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                );
            },
        },
    ]

    const getUsers = async (params: string) => {
        setLoading(true);
        try {
            const request = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/users?${params}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${session?.user?.session}`
                },
            });
            if (request.ok) {
                let response = await request.json();
                setUsers(response.data ?? []);
                setCount(response.count);
            } else {
                let response = await request.json();
                toast.error(response.message);
            }
        } catch (error: any) { }
        setLoading(false);
    }

    const getDataInit = async (searchValue: string) => {
        setSearch(searchValue);
        const params = new URLSearchParams({ offset: '0', limit: limit + '', sort: 'name', desc: 'desc', search: searchValue });
        setDesc(false);
        await getUsers(params.toString());
        setOffset(0);
    }

    const getDataSort = async (sorting: string) => {
        const params = new URLSearchParams({ offset: (offset * limit) + '', limit: limit + '', sort: sorting + '', desc: desc ? 'desc' : 'asc', search: search });
        setDesc(!desc);
        setSort(sorting);
        await getUsers(params.toString());
    }

    const getDataSearch = async (searching: string) => {
        const params = new URLSearchParams({ offset: '0', limit: limit + '', sort: sort + '', desc: !desc ? 'desc' : 'asc', search: searching });
        setSearch(searching);
        await getUsers(params.toString());
        setOffset(0);
    }

    const getDataPagination = async (offseting: number) => {
        setOffset(offseting);
        const params = new URLSearchParams({ offset: (offseting * limit) + '', limit: limit + '', sort: sort + '', desc: !desc ? 'desc' : 'asc', search: search });
        await getUsers(params.toString());
    }

    const onSort = async (sorting: { id: string }) => {
        getDataSort(sorting.id);
    }

    const onSearch = async (value: string) => {
        if (value) {
            router.replace(`${pathname}?search=${value}`);
        } else {
            router.replace(`${pathname}`);
        }
        getDataSearch(value);
    }

    const onRefresh = () => {
        router.replace(`${pathname}`);
        getDataInit('');
    }

    const getUser = async (id: string) => {
        setIsUserModalLoading(true);
        try {
            const params = new URLSearchParams({ id });
            const request = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/user?${params.toString()}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${session?.user?.session}`
                },
            });
            if (request.ok) {
                let response = await request.json();
                console.log(response?.data);
                setSelectedUser(response?.data ?? null);
            } else {
                let response = await request.json();
                toast.error(response.message);
            }
        } catch (error: any) { }
        setIsUserModalLoading(false);
    }

    useEffect(() => {
        if (session) {
            getDataInit(searchInit);
        }
    }, [session]);

    useEffect(() => {
        if (users.length > 0) {
            getDataPagination(0);
        }
    }, [limit]);

    return (
        <div>
            <Breadcrumbs>
                <BreadcrumbItem>Plataforma</BreadcrumbItem>
                <BreadcrumbItem>Administración</BreadcrumbItem>
                <BreadcrumbItem className="text-primary">Usuarios</BreadcrumbItem>
            </Breadcrumbs>
            <div className="mt-5 text-sm font-bold">Listado de Usuarios</div>
            <Card className="p-4 mt-4">
                <CardContent className='p-0'>
                    {loading && (
                        <SkeletonTable></SkeletonTable>
                    )}
                    {!loading && (
                        <DataTable insertString='Crear Usuario' onInsert={() => { setIsNewUserModalOpen(true); }} search={search} setSearch={setSearch} className={`${loading ? 'hidden' : ''}`} data={users} columns={isMobile ? mobileColumns : columns} refresh={onRefresh} searchPlaceholder="Buscar..." onSort={onSort} onSearch={onSearch} offset={offset} count={count} limit={limit} setLimit={setLimit} showLimit={true} onPagination={getDataPagination}></DataTable>
                    )}
                </CardContent>
            </Card>
            <UserModal user={selectedUser} users={users} setUsers={setUsers} loading={isUserModalLoading} isOpen={isUserModalOpen} setIsOpen={setIsUserModalOpen} reload={getUser}></UserModal>
            <NewUserModal isOpen={isNewUserModalOpen} setIsOpen={setIsNewUserModalOpen} reloadList={() => { getDataInit(''); }}></NewUserModal>
        </div>
    );
};

export default Page;