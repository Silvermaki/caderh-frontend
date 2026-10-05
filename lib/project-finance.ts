/**
 * Cifras del header de un proyecto, compartidas por el listado y el detalle
 * para que ambas vistas muestren exactamente lo mismo.
 *
 * Criterio CADERH: solo el efectivo suma al presupuesto ("Donaciones: en
 * especie (ahorro) y en efectivo (es un ingreso)"). El backend ya entrega
 * financed_amount = fuentes + donaciones en efectivo y total_expenses = gastos
 * pagados con ese presupuesto (generales, contra una fuente o contra una
 * donación en efectivo). Las donaciones en suministros y beneficios se
 * muestran aparte con su disponible: recibido − gastos imputados a ellas.
 */

type Amount = number | string | null | undefined;

/** Totales que devuelve GET /supervisor/projects y /supervisor/projects/:id. */
export interface ProjectFinanceFields {
  financed_amount?: Amount;
  total_expenses?: Amount;
  cash_donations?: Amount;
  cash_donations_consumed?: Amount;
  in_kind_donations?: Amount;
  in_kind_consumed?: Amount;
  benefit_donations?: Amount;
  benefit_consumed?: Amount;
}

export interface ProjectFinance {
  /** Presupuesto General: ingresos en efectivo. */
  financed: number;
  /** Presupuesto Ejecutado: gastos pagados con el presupuesto en efectivo. */
  totalExpenses: number;
  remaining: number;
  /** % de ejecución financiera, sin tope; null = N/D (gasto sin ingresos). */
  executedPct: number | null;
  progressColor: 'destructive' | 'warning' | 'success';
  cashDonations: number;
  cashAvailable: number;
  inKindDonations: number;
  inKindAvailable: number;
  benefitDonations: number;
  benefitAvailable: number;
}

// Postgres devuelve los NUMERIC como texto.
const num = (v: Amount) => Number(v ?? 0) || 0;

export function computeProjectFinance(p: ProjectFinanceFields): ProjectFinance {
  const financed = num(p.financed_amount);
  const totalExpenses = num(p.total_expenses);
  // % = las mismas dos cifras que muestra el header (numeral 9: gastos en
  // efectivo ÷ ingresos en efectivo × 100). >100 % = sobre-ejecución.
  const executedPct = financed > 0
    ? Math.round((totalExpenses / financed) * 100)
    : (totalExpenses > 0 ? null : 0);
  const progressColor = executedPct == null || executedPct >= 90
    ? 'destructive'
    : executedPct >= 70 ? 'warning' : 'success';

  const cashDonations = num(p.cash_donations);
  const inKindDonations = num(p.in_kind_donations);
  const benefitDonations = num(p.benefit_donations);

  return {
    financed,
    totalExpenses,
    remaining: Math.max(0, financed - totalExpenses),
    executedPct,
    progressColor,
    cashDonations,
    cashAvailable: cashDonations - num(p.cash_donations_consumed),
    inKindDonations,
    inKindAvailable: inKindDonations - num(p.in_kind_consumed),
    benefitDonations,
    benefitAvailable: benefitDonations - num(p.benefit_consumed),
  };
}
