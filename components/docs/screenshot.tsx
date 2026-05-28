"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, ZoomIn } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ScreenshotProps {
  src: string;
  alt: string;
  caption?: string;
  className?: string;
}

export function Screenshot({ src, alt, caption, className }: ScreenshotProps) {
  const [open, setOpen] = React.useState(false);
  const [origin, setOrigin] = React.useState<{ x: number; y: number } | null>(null);
  const figureRef = React.useRef<HTMLButtonElement>(null);

  const handleOpen = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setOrigin({
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    });
    setOpen(true);
  };

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  const transformOrigin = origin
    ? `${origin.x}px ${origin.y}px`
    : "center center";

  return (
    <>
      <figure className={cn("group my-4", className)}>
        <button
          ref={figureRef}
          type="button"
          onClick={handleOpen}
          aria-label={`Ampliar imagen: ${alt}`}
          className={cn(
            "relative block w-full overflow-hidden rounded-lg border border-border bg-default-50",
            "shadow-sm transition-all duration-200",
            "hover:shadow-md hover:border-primary/30",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          )}
        >
          <img
            src={src}
            alt={alt}
            className="block w-full h-auto"
            loading="lazy"
          />
          <span
            aria-hidden
            className={cn(
              "absolute top-2 right-2 inline-flex items-center gap-1 rounded-md bg-background/90 backdrop-blur",
              "px-2 py-1 text-[11px] font-medium text-foreground/80 shadow-sm",
              "opacity-0 group-hover:opacity-100 transition-opacity duration-150"
            )}
          >
            <ZoomIn className="h-3 w-3" /> Ampliar
          </span>
        </button>
        {caption && (
          <figcaption className="mt-2 text-xs text-muted-foreground text-center px-2">
            {caption}
          </figcaption>
        )}
      </figure>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
            className="fixed inset-0 z-[1000] flex items-center justify-center bg-background/85 backdrop-blur-sm p-6"
            onClick={() => setOpen(false)}
            role="dialog"
            aria-modal="true"
            aria-label={alt}
          >
            <motion.img
              src={src}
              alt={alt}
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.97, opacity: 0 }}
              transition={{ type: "spring", duration: 0.4, bounce: 0.15 }}
              style={{ transformOrigin }}
              className="max-h-[92vh] max-w-[95vw] rounded-lg shadow-2xl"
            />
            <motion.button
              type="button"
              onClick={() => setOpen(false)}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 0.05, duration: 0.15 }}
              aria-label="Cerrar"
              className={cn(
                "absolute top-4 right-4 h-9 w-9 rounded-full bg-card border border-border",
                "flex items-center justify-center text-foreground shadow-md",
                "hover:bg-default-100 active:scale-95 transition-all duration-150"
              )}
            >
              <X className="h-4 w-4" />
            </motion.button>
            {caption && (
              <p className="absolute bottom-6 left-1/2 -translate-x-1/2 max-w-2xl text-center text-sm text-muted-foreground bg-card/90 backdrop-blur px-4 py-2 rounded-lg border border-border">
                {caption}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
