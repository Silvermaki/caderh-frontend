// Barrel de definiciones de reportes. Cada import ejecuta registerReport()
// en el módulo `lib/report/registry.ts`, poblando el registry global.
// IMPORTANTE: este archivo se importa desde el layout de /dashboard/reportes
// para que el registry esté poblado sin importar la ruta de entrada.

import './r6-ingreso-proyecto';
import './r7-ingreso-consolidado';
import './r8-overhead';
import './r12-presupuesto-vs-ejecutado';

export {};
