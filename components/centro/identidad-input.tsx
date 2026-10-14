"use client";

import * as React from "react";
import { Input, type InputProps } from "@/components/ui/input";

/** Identidad hondureña: 13 dígitos con el formato 0000-0000-00000. */
export const IDENTIDAD_RE = /^\d{4}-\d{4}-\d{5}$/;

export const IDENTIDAD_ERROR = "Debe tener 13 dígitos (0000-0000-00000)";

/** Deja solo dígitos (máximo 13) y pone los guiones: 0801199912345 → 0801-1999-12345. */
export function formatIdentidad(value: string): string {
    const d = value.replace(/\D/g, "").slice(0, 13);
    if (d.length <= 4) return d;
    if (d.length <= 8) return `${d.slice(0, 4)}-${d.slice(4)}`;
    return `${d.slice(0, 4)}-${d.slice(4, 8)}-${d.slice(8)}`;
}

interface IdentidadInputProps extends Omit<InputProps, "value" | "onChange" | "type"> {
    value: string;
    onChange: (value: string) => void;
}

/**
 * Campo de identidad con máscara: acepta solo dígitos, agrega los guiones al
 * escribir o pegar y conserva el cursor al corregir en medio del número.
 */
export const IdentidadInput = React.forwardRef<HTMLInputElement, IdentidadInputProps>(
    ({ value, onChange, placeholder = "0000-0000-00000", ...props }, ref) => {
        const inputRef = React.useRef<HTMLInputElement | null>(null);
        const caret = React.useRef<number | null>(null);

        React.useLayoutEffect(() => {
            const el = inputRef.current;
            if (caret.current == null || !el || document.activeElement !== el) return;
            el.setSelectionRange(caret.current, caret.current);
            caret.current = null;
        });

        return (
            <Input
                {...props}
                ref={(el) => {
                    inputRef.current = el;
                    if (typeof ref === "function") ref(el);
                    else if (ref) ref.current = el;
                }}
                type="text"
                inputMode="numeric"
                autoComplete="off"
                placeholder={placeholder}
                value={value}
                onChange={(e) => {
                    const raw = e.target.value;
                    const next = formatIdentidad(raw);
                    // El cursor queda después del mismo número de dígitos que tenía antes.
                    const digitos = raw.slice(0, e.target.selectionStart ?? raw.length).replace(/\D/g, "").length;
                    let pos = 0;
                    for (let n = 0; pos < next.length && n < digitos; pos++) {
                        if (/\d/.test(next[pos])) n++;
                    }
                    caret.current = next === value ? null : pos;
                    onChange(next);
                }}
            />
        );
    }
);
IdentidadInput.displayName = "IdentidadInput";
