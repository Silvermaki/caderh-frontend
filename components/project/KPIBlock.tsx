"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { type LucideIcon } from "lucide-react";

interface KPIBlockProps {
    icon: LucideIcon;
    label: string;
    value: string;
    iconColor?: string;
    className?: string;
    index?: number;
}

const KPIBlock = ({ icon: Icon, label, value, iconColor, className, index = 0 }: KPIBlockProps) => {
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
            </div>
            <p className="text-xl font-bold text-foreground truncate mt-auto">{value}</p>
        </motion.div>
    );
};

export default KPIBlock;
