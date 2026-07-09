# Módulo de Reportes — Foundation

Ver `docs/diseno-modulo-reportes.md` para decisiones de diseño y criterios.

## Para agregar un nuevo reporte (R1–R11)

1. Crear `lib/report/definitions/rN-<slug>.ts`
2. Exportar un `ReportDefinition<Filters, Row>` y llamar `registerReport(...)`
3. Importar ese archivo en `lib/report/definitions/index.ts` (barrel) para que el registry esté poblado.
4. El endpoint backend debe estar en `src/api/reports/reports/<rN>.js` (GET con query params de filtros y paginación) registrado en `reports.api.js`.

## Variantes

- **KPI strip (R1–R4/R7):** declarar `variants.kpiStrip.cards` (key/label/color/format) en la definición; el shell la pinta automáticamente con los `kpis` que devuelve el backend (si falta la clave, la tarjeta no se muestra).
- **Rojo condicional (R6/R8/R9):** declarar `variants.conditionalRed` con `when` y `cells`.
- **Compound headers:** mezclar `CompoundColumnDef` en `columns`. El shell + `<CompoundHeader>` lo resuelven.
- **Jerárquico (R1):** usar `<HierarchicalBody>` en vez del tbody default (por ahora requiere wrapper custom).
- **Template (R11):** marcar `variants.template = true` y usar `<ReportTemplateShell>`. No renderiza tabla; pide al backend un archivo binario.
- **Columnas sin fuente:** marcar `missingInDb: true` + `missingNote` + `plannedSource`. El shell agrega el banner y el warning icon automáticamente.

## Export

- Excel/CSV: client-side por default.
- Excel server-side: poner `export.excel: 'server'` en la definición → endpoint `/api/reports/<id>/export/xlsx`.
- PDF: siempre server-side → `/api/reports/<id>/export/pdf`.

## Estructura

Ver `docs/superpowers/plans/2026-04-21-reportes-foundation.md` sección "File Structure".
