# Módulo de Reportes — Foundation

Ver `docs/diseno-modulo-reportes.md` para decisiones de diseño y criterios.

## Para agregar un nuevo reporte (R1–R13)

1. Crear `lib/report/definitions/rN-<slug>.ts`
2. Exportar un `ReportDefinition<Filters, Row>` y llamar `registerReport(...)`
3. Importar ese archivo en `app/(routes)/dashboard/reportes/page.tsx` (para que aparezca en el hub) y en `[slug]/page.tsx` no se necesita — el registry lo resuelve.
4. El endpoint backend debe estar en `app/api/reports/<slug>/route.ts` (GET con query params de filtros y paginación) o el `fetcher` llama a un service existente.

## Variantes

- **KPI strip (R4/R7):** pasar `<KpiStrip>` al prop `aboveTable` del shell.
- **Rojo condicional (R6/R8/R12):** declarar `variants.conditionalRed` con `when` y `cells`.
- **Compound headers (R9):** mezclar `CompoundColumnDef` en `columns`. El shell + `<CompoundHeader>` lo resuelven.
- **Jerárquico (R1):** usar `<HierarchicalBody>` en vez del tbody default (por ahora requiere wrapper custom).
- **Columnas sin fuente:** marcar `missingInDb: true` + `missingNote` + `plannedSource`. El shell agrega el banner y el warning icon automáticamente.

## Export

- Excel/CSV: client-side por default.
- Excel server-side: poner `export.excel: 'server'` en la definición → endpoint `/api/reports/<id>/export/xlsx`.
- PDF: siempre server-side → `/api/reports/<id>/export/pdf`.

## Estructura

Ver `docs/superpowers/plans/2026-04-21-reportes-foundation.md` sección "File Structure".
