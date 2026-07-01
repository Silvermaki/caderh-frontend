"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Info, type LucideIcon } from "lucide-react";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface KPIBlockProps {
    icon: LucideIcon;
    label: string;
    value: string;
    /** Texto de ayuda mostrado en un tooltip junto al label. */
    tooltip?: string;
    iconColor?: string;
    className?: string;
    index?: number;
}

const KPIBlock = ({ icon: Icon, label, value, tooltip, iconColor, className, index = 0 }: KPIBlockProps) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: index * 0.08, ease: "easeOut" }}
            className={cn(
                "bg-card border border-border rounded-lg p-4 flex flex-col min-h-[88px]",
                "hover:shadow-md hover:border-primary/20 transition-all duration-200",
                className
            )}
        >
            <div className="flex items-center gap-2 mb-2">
                <Icon className={cn("h-4 w-4 shrink-0", iconColor ?? "text-muted-foreground")} />
                <span className="text-xs text-muted-foreground uppercase tracking-wide leading-tight">{label}</span>
                {tooltip && (
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Info className="h-3.5 w-3.5 shrink-0 text-muted-foreground/70 cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent color="secondary" className="max-w-xs">
                                {tooltip}
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                )}
            </div>
            <p className="text-xl font-bold text-foreground truncate mt-auto">{value}</p>
        </motion.div>
    );
};

export default KPIBlock;
