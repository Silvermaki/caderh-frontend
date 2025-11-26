import React, { useState, useEffect, Fragment } from 'react';
import { cn } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ColumnFiltersState, SortingState, VisibilityState, flexRender, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { RefreshCcw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Icon } from "@iconify/react";
import { InputGroup, InputGroupButton } from "@/components/ui/input-group";
import { prettifyNumber } from '@/app/libs/utils';

interface BlankProps {
    className?: string;
    data: any[];
    columns: any[];
    offset: number;
    count: number;
    limit: number;
    searchPlaceholder?: string;
    search: string;
    team: string;
    subject: string;
    teams: any[];
    subjects: any[];
    refresh: (input?: any) => any;
    onSort: (input?: any) => any;
    onSearch: (input?: any) => any;
    setSearch: (value: any) => any;
    onPagination: (input?: any) => any;
    onTeamSubjectChange: (input?: any) => any;
    setLimit?: (value: any) => any;
    showLimit?: boolean;
}
const DataTable = ({ className, data, columns, refresh, onSort, onSearch, searchPlaceholder = 'Search...', offset, count, limit, onPagination, search, setSearch, team, subject, teams, subjects, onTeamSubjectChange, showLimit = false, setLimit = (value: any) => { } }: BlankProps) => {
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
    const [rowSelection, setRowSelection] = useState({});
    const [searchInput, setSearchInput] = useState<string>(search);
    const [pages, setPages] = useState<number[]>([]);

    const table = useReactTable({
        data,
        columns,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        enableSortingRemoval: false,
        manualSorting: true,
        state: {
            sorting,
            columnFilters,
            columnVisibility,
            rowSelection,
        },
        manualPagination: true
    });

    const shouldShowPagination = (pageIdx: number) => {
        if (offset <= 2 && pageIdx <= 6) {
            return true;
        }
        if (offset >= (pages.length - 3) && pageIdx >= (pages.length - 7)) {
            return true;
        }
        if (offset + 3 >= pageIdx && offset - 3 <= pageIdx) {
            return true;
        }
        return false;
    }

    const getPages = () => {
        let pages = [];
        if (count > 0) {
            for (let i = 0; i <= count / limit; i++) {
                pages.push(i);
            }
        } else {
            pages.push(0);
        }
        setPages(pages);
    }

    useEffect(() => {
        getPages();
    }, [count, offset]);

    useEffect(() => {
        if (sorting && sorting.length > 0) {
            onSort(sorting[0]);
        }
    }, [sorting]);

    useEffect(() => {
        setSearchInput(search);
    }, [search])

    return (
        <div className={cn('overflow-x-hidden overflow-y-hidden ', className)}>
            <div className="flex flex-row justify-between gap-2 flex-wrap">
                <div className='flex flex-row gap-4 flex-wrap'>
                    <div className='flex-none'>
                        <InputGroup>
                            <Input
                                placeholder={searchPlaceholder}
                                value={searchInput}
                                onChange={(event) => {
                                    setSearchInput(event.target.value);
                                }}
                                onKeyDown={(event) => {
                                    if (event.key === 'Enter') {
                                        onSearch(searchInput);
                                    }
                                }}
                                className="max-w-sm min-w-[150px] h-10"
                            />
                            <InputGroupButton>
                                <Button color="primary" size="sm" className='h-10' onClick={() => { onSearch(searchInput); }}>
                                    Search
                                </Button>
                            </InputGroupButton>
                        </InputGroup>
                    </div>
                    <div className='flex-none'>
                        <Select value={team} onValueChange={(event) => {
                            onTeamSubjectChange({ team_id: event, subject_id: '' });
                        }}>
                            <SelectTrigger className='w-[180px]'>
                                <SelectValue placeholder="Selected Team" />
                            </SelectTrigger>
                            <SelectContent className='max-h-[300px] overflow-auto'>
                                <SelectItem value="">All Teams</SelectItem>
                                {teams.map((x) => (
                                    <Fragment key={`service-data-table-team-${x.id}`}>
                                        <SelectItem value={x.id}>{x.name}</SelectItem>
                                    </Fragment>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className='flex-none'>
                        <Select value={subject} onValueChange={(event) => {
                            onTeamSubjectChange({ team_id: team, subject_id: event });
                        }}>
                            <SelectTrigger className='w-[180px]'>
                                <SelectValue placeholder="Selected Subject" />
                            </SelectTrigger>
                            <SelectContent className='max-h-[300px] overflow-auto'>
                                <SelectItem value="">All Subjects</SelectItem>
                                {subjects.map((x) => (
                                    <Fragment key={`service-data-table-subject-${x.id}`}>
                                        <SelectItem value={x.id}>{x.name}</SelectItem>
                                    </Fragment>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <div className='flex flex-row justify-right items-center'>
                    {showLimit &&
                        <div className='flex-none mr-8'>
                            <Select value={limit + ""} onValueChange={(event) => {
                                setLimit(+event);
                            }}>
                                <SelectTrigger size="sm" className='w-[100px]'>
                                    <SelectValue placeholder="Environment" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="10">10</SelectItem>
                                    <SelectItem value="25">25</SelectItem>
                                    <SelectItem value="50">50</SelectItem>
                                    <SelectItem value="100">100</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    }
                    <div className='mr-8 text-xs'>
                        Total: <b>{prettifyNumber(count)}</b>
                    </div>
                    <div className="flex items-center flex-wrap gap-4">
                        <div className="flex gap-2 items-center">
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => {
                                    if (offset > 0) {
                                        onPagination(offset - 1);
                                    }
                                }}
                                disabled={offset === 0}
                                className="h-8 w-8"
                            >
                                <Icon icon="heroicons:chevron-left" className="w-5 h-5 rtl:rotate-180" />
                            </Button>
                            {pages.map((page) => (
                                <Fragment key={`basic-data-table-${page}`}>
                                    {shouldShowPagination(page) && (
                                        <Button
                                            variant={offset === page ? undefined : "outline"}
                                            onClick={() => {
                                                onPagination(page);
                                            }}
                                            className={cn("w-8 h-8")}
                                        >
                                            {page + 1}
                                        </Button>
                                    )}
                                </Fragment>
                            ))}
                            <Button
                                onClick={() => {
                                    if (offset < pages.length) {
                                        onPagination(offset + 1);
                                    }
                                }}
                                disabled={offset + 1 >= pages.length}
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                            >
                                <Icon icon="heroicons:chevron-right" className="w-5 h-5 rtl:rotate-180" />
                            </Button>
                        </div>
                    </div>
                    <Button className='flex-none h-6 w-6 ml-8' size="icon" color='info' onClick={() => {
                        refresh();
                        setSearch("");
                        setSorting([]);
                    }}>
                        <RefreshCcw className="h-3 w-3" />
                    </Button>
                </div>

            </div>
            <div>
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => {
                                    return (
                                        <TableHead key={header.id} className='p-0'>
                                            {flexRender(
                                                header.column.columnDef.header,
                                                header.getContext()
                                            )}
                                        </TableHead>
                                    );
                                })}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    data-state={row.getIsSelected() && "selected"}
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id} className='p-2'>
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext()
                                            )}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell
                                    colSpan={columns.length}
                                    className="h-24 text-center"
                                >
                                    No data available.
                                </TableCell>
                                <TableCell
                                    className="h-24 text-center p-0"
                                >
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
};

export default DataTable;