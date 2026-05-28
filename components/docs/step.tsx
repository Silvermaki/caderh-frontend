"use client";

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Screenshot } from "./screenshot";

export interface StepProps {
  number: number;
  title: string;
  id?: string;
  screenshot?: { src: string; alt: string; caption?: string };
  children?: React.ReactNode;
  className?: string;
}

const EASE_OUT = [0.23, 1, 0.32, 1] as const;

export function Step({
  number,
  title,
  id,
  screenshot,
  children,
  className,
}: StepProps) {
  const reduced = useReducedMotion();
  const delay = Math.min((number - 1) * 0.04, 0.24);

  return (
    <motion.section
      id={id}
      initial={reduced ? { opacity: 0 } : { opacity: 0, y: 8 }}
      whileInView={reduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10% 0px -10% 0px" }}
      transition={{ duration: 0.32, ease: EASE_OUT, delay }}
      className={cn(
        "relative rounded-xl border border-border bg-card p-5 md:p-6 scroll-mt-24",
        className
      )}
    >
      <header className="flex items-start gap-4 mb-3">
        <span
          aria-hidden
          className={cn(
            "shrink-0 inline-flex items-center justify-center",
            "h-9 w-9 rounded-full bg-primary text-primary-foreground",
            "font-semibold text-sm tabular-nums shadow-sm"
          )}
        >
          {number}
        </span>
        <div className="min-w-0 flex-1 pt-1">
          <h3 className="text-base md:text-lg font-semibold text-foreground leading-snug">
            {title}
          </h3>
        </div>
      </header>

      <div className="pl-0 md:pl-[3.25rem] space-y-3">
        <div
          className={cn(
            "text-sm md:text-[15px] leading-relaxed text-foreground/85",
            "[&_p+p]:mt-2 [&_strong]:font-semibold [&_strong]:text-foreground",
            "[&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:bg-default-100 [&_code]:text-foreground [&_code]:text-[0.85em]"
          )}
        >
          {children}
        </div>
        {screenshot && (
          <Screenshot
            src={screenshot.src}
            alt={screenshot.alt}
            caption={screenshot.caption}
          />
        )}
      </div>
    </motion.section>
  );
}
