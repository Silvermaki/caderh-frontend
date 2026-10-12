"use client";

import { useMemo } from "react";
import { useSession } from "next-auth/react";

const apiBase = process.env.NEXT_PUBLIC_API_PROXY;

type Params = Record<string, string | number | null | undefined>;

function buildUrl(path: string, params?: Params) {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(params ?? {})) {
        if (v !== undefined && v !== null && String(v) !== "") qs.set(k, String(v));
    }
    const s = qs.toString();
    return `${apiBase}${path}${s ? `?${s}` : ""}`;
}

/** Error con el mensaje del backend ({ message }) listo para mostrar. */
export class ApiError extends Error {
    status: number;
    constructor(message: string, status: number) {
        super(message);
        this.status = status;
    }
}

async function parse(res: Response) {
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new ApiError(json?.message ?? "Error del servidor", res.status);
    return json;
}

/** Peticiones autenticadas del módulo de egresados (mismo token que el resto de centros). */
export function useApi() {
    const { data: session } = useSession() as any;
    const token: string | undefined = session?.user?.session;

    return useMemo(() => {
        const auth = { Authorization: `Bearer ${token}` };
        return {
            ready: !!token,
            get: (path: string, params?: Params) =>
                fetch(buildUrl(path, params), { headers: auth }).then(parse),
            send: (method: "POST" | "PUT" | "PATCH" | "DELETE", path: string, body?: unknown) =>
                fetch(buildUrl(path), {
                    method,
                    headers: { ...auth, "Content-Type": "application/json" },
                    body: body === undefined ? undefined : JSON.stringify(body),
                }).then(parse),
            upload: (path: string, form: FormData) =>
                fetch(buildUrl(path), { method: "POST", headers: auth, body: form }).then(parse),
            download: async (path: string, params: Params, filename: string) => {
                const res = await fetch(buildUrl(path, params), { headers: auth });
                if (!res.ok) await parse(res);
                const blob = await res.blob();
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                a.remove();
                setTimeout(() => URL.revokeObjectURL(url), 1000);
            },
        };
    }, [token]);
}

export type Api = ReturnType<typeof useApi>;

/** 'YYYY-MM-DD' → 'dd/mm/aaaa' ('' si no hay fecha). */
export function fechaCorta(iso?: string | null): string {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso ?? "");
    return m ? `${m[3]}/${m[2]}/${m[1]}` : "";
}

/** Hoy (fecha local) como 'YYYY-MM-DD'. */
export function hoyIso(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
