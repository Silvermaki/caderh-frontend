"use client";
import { Skeleton } from "@/components/ui/skeleton";

const DefaultSkeleton = () => {
    return (
        <div className="w-full">
            <Skeleton className="w-1/3 mb-4 h-10" />
            <Skeleton className="w-full h-10 mb-3" />
            <Skeleton className="w-full h-9 mb-3" />
            <Skeleton className="w-full h-9 mb-3" />
            <Skeleton className="w-full h-9 mb-3" />
            <Skeleton className="w-full h-9 mb-3" />
            <Skeleton className="w-full h-9 mb-3" />
            <Skeleton className="w-full h-9 mb-3" />
            <Skeleton className="w-full h-9 mb-3" />
            <Skeleton className="w-full h-9 mb-3" />
            <Skeleton className="w-full h-9 mb-3" />
            <Skeleton className="w-full h-9" />
        </div>
    );
};

export default DefaultSkeleton;