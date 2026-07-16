/**
 * Interruptor de la señalética de "columnas pendientes de captura":
 * banner celeste informativo, ícono ⚠ en el encabezado y sombreado de las
 * celdas. Las columnas pendientes SIEMPRE se muestran con "—" (transparencia
 * del dato); esto solo controla los avisos visuales alrededor.
 *
 * Apagado (false) para presentaciones al cliente — la tabla se ve limpia.
 * Encendido (true) para trabajo interno/desarrollo, donde conviene ver de
 * un vistazo qué columnas dependen de módulos aún no implementados.
 */
export const SHOW_PENDING_HINTS = false;
