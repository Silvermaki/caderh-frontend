"use client";

import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

const LayoutSkeleton = () => {
  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Header */}
      <div className="h-[52px] border-b border-default-200 flex items-center px-4 gap-4 shrink-0">
        <Skeleton className="h-8 w-8 rounded" />
        <Skeleton className="h-5 w-28 rounded" />
        <div className="flex-1" />
        <Skeleton className="h-8 w-8 rounded-full" />
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="hidden xl:flex flex-col w-[248px] shrink-0 border-r border-default-200 p-4 gap-3">
          <Skeleton className="h-10 w-full rounded-md mb-2" />
          <Skeleton className="h-8 w-3/4 rounded-md" />
          <Skeleton className="h-8 w-full rounded-md" />
          <Skeleton className="h-8 w-5/6 rounded-md" />
          <Skeleton className="h-8 w-2/3 rounded-md" />
          <Skeleton className="h-8 w-3/4 rounded-md" />
        </div>

        {/* Content area */}
        <div className="flex-1 p-6 space-y-4 overflow-hidden">
          {/* Breadcrumbs */}
          <div className="flex gap-2">
            <Skeleton className="h-4 w-20 rounded" />
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-4 w-24 rounded" />
          </div>

          {/* Title */}
          <Skeleton className="h-7 w-48 rounded" />

          {/* Card with table skeleton */}
          <div className="rounded-md border border-default-200 p-4 space-y-3">
            <Skeleton className="h-10 w-1/3 rounded" />
            <Skeleton className="h-10 w-full rounded" />
            <Skeleton className="h-9 w-full rounded" />
            <Skeleton className="h-9 w-full rounded" />
            <Skeleton className="h-9 w-full rounded" />
            <Skeleton className="h-9 w-full rounded" />
            <Skeleton className="h-9 w-full rounded" />
            <Skeleton className="h-9 w-full rounded" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LayoutSkeleton;
