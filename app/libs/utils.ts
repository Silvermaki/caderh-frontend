export const datetimeToString = (date: Date) => {
    return date.toLocaleString('en-us', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}

export const dateToString = (date: Date) => {
    return date.toLocaleString('en-us', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

/**
 * Formatea una fecha para VISUALIZACIÓN como DD/MM/YYYY.
 * - Acepta 'YYYY-MM-DD' o ISO con hora ('YYYY-MM-DDTHH:mm:ss.sssZ').
 * - Los componentes de fecha se extraen del string directamente (sin pasar por
 *   new Date(string)), evitando el desfase de zona horaria: parsear
 *   'YYYY-MM-DD' con new Date lo interpreta como medianoche UTC y en UTC-6
 *   retrocede un día al mostrarse (01/07 → 30/06).
 * - null / undefined / vacío / no parseable → '-'.
 * Usar para columnas DATE (start_date, fecha_inicial, disbursement_date, etc.).
 * Para timestamps con hora que deban mostrarse en hora local, seguir usando
 * dateToString/datetimeToString.
 */
export const formatDate = (value: string | Date | null | undefined): string => {
    if (value === null || value === undefined || value === "") return "-";
    if (value instanceof Date) {
        if (isNaN(value.getTime())) return "-";
        const dd = String(value.getDate()).padStart(2, "0");
        const mm = String(value.getMonth() + 1).padStart(2, "0");
        return `${dd}/${mm}/${value.getFullYear()}`;
    }
    const str = String(value).trim();
    const m = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (m) return `${m[3]}/${m[2]}/${m[1]}`;
    const d = new Date(str);
    if (isNaN(d.getTime())) return "-";
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    return `${dd}/${mm}/${d.getFullYear()}`;
}

export const timeToString = (date: Date) => {
    return date.toLocaleTimeString('es-HN', { hour: '2-digit', minute: '2-digit' });
}

export const prettifyNumber = (value: number, decimals: number = 0): string => {
    const curr = new Intl.NumberFormat('en-US', {
        style: 'decimal',
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });
    return curr.format(+value);
};

export const prettifyNumberNoPad = (value: number, decimals: number = 0): string => {
    const curr = new Intl.NumberFormat('en-US', {
        style: 'decimal',
        maximumFractionDigits: decimals
    });
    return curr.format(+value);
};

export const formatCurrency = (value: number): string => {
    return "L " + prettifyNumber(value ?? 0, 2);
};