import React, { useState, Fragment } from 'react';
import { cn } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ColumnFiltersState, SortingState, VisibilityState, flexRender, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { RefreshCcw, UserPlus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Icon } from "@iconify/react";
import { prettifyNumber } from '@/app/libs/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface BlankProps {
    className?: string,
    data: any[],
    columns: any[],
    filterByPlaceholder: string;
    filterByColumn: string;
    refresh: (input?: any) => any;
    insert: (input: any) => any;
}
const DataTable = ({ className, data, columns, filterByPlaceholder, filterByColumn, refresh, insert }: BlankProps) => {
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
    const [rowSelection, setRowSelection] = useState({});
    const [pageIndex, setPageIndex] = useState<number>(0);
    const [pageSize, setPageSize] = useState<number>(10);

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
        state: {
            sorting,
            columnFilters,
            columnVisibility,
            rowSelection,
            pagination: {
                pageSize: pageSize,
                pageIndex: pageIndex
            }
        },
    });

    const shouldShowPagination = (pageIdx: number) => {
        if (pageIndex <= 2 && pageIdx <= 6) {
            return true;
        }
        if (pageIndex >= (table.getPageOptions().length - 3) && pageIdx >= (table.getPageOptions().length - 7)) {
            return true;
        }
        if (pageIndex + 3 >= pageIdx && pageIndex - 3 <= pageIdx) {
            return true;
        }
        return false;
    }

    return (
        <div className={cn('overflow-x-hidden overflow-y-hidden', className)}>
            <div className="flex flex-row justify-between gap-2 flex-wrap">
                <div className='flex flex-row gap-4 flex-wrap'>
                    <Input
                        placeholder={filterByPlaceholder}
                        value={(table.getColumn(`${filterByColumn}`)?.getFilterValue() as string) || ""}
                        onChange={(event) => {
                            table.getColumn(`${filterByColumn}`)?.setFilterValue(event.target.value);
                        }}
                        className="max-w-sm min-w-[200px] h-10"
                    />
                    <Button color='success' onClick={insert}>
                        New user<UserPlus className="h-4 w-4 ml-2" />
                    </Button>
                </div>
                <div className='flex flex-row justify-right items-center'>
                    <div className='flex-none mr-8'>
                        <Select value={pageSize + ""} onValueChange={(event) => {
                            setPageSize(+event);
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
                    <div className='mr-8 text-xs'>
                        Total: <b>{prettifyNumber(data.length)}</b>
                    </div>
                    <div className="flex items-center flex-wrap gap-4">
                        <div className="flex gap-2 items-center">
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => {
                                    if (table.getCanPreviousPage()) {
                                        table.previousPage();
                                        setPageIndex(pageIndex - 1);
                                    }
                                }}
                                disabled={!table.getCanPreviousPage()}
                                className="h-8 w-8"
                            >
                                <Icon icon="heroicons:chevron-left" className="w-5 h-5 rtl:rotate-180" />
                            </Button>
                            {table.getPageOptions().map((page, pageIdx) => (
                                <Fragment key={`basic-data-table-${pageIdx}`}>
                                    {shouldShowPagination(pageIdx) && (
                                        <Button
                                            variant={pageIndex === pageIdx ? undefined : "outline"}
                                            onClick={() => {
                                                table.setPageIndex(pageIdx);
                                                setPageIndex(pageIdx);
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
                                    if (table.getCanNextPage()) {
                                        table.nextPage();
                                        setPageIndex(pageIndex + 1);
                                    }
                                }}
                                disabled={!table.getCanNextPage()}
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