import { describe, it, expect } from 'vitest';
import { computeProjectFinance } from '../project-finance';

// Totales tal como los entrega GET /supervisor/projects[/:id] para el
// escenario de las notas de CADERH (18/08/2026): fuente L100,000, donaciones
// efectivo L20,000 / suministro L30,000 / beneficio L10,000, y gastos general
// L40,000, contra efectivo L5,000, contra suministro L12,000, contra beneficio
// L4,000. Postgres devuelve los NUMERIC como texto.
const project = {
  financed_amount: '120000.00000000000000000000',
  total_expenses: '45000.00000000000000000000',
  cash_donations: '20000.00000000000000000000',
  cash_donations_consumed: '5000.00000000000000000000',
  in_kind_donations: '30000.00000000000000000000',
  in_kind_consumed: '12000.00000000000000000000',
  benefit_donations: '10000.00000000000000000000',
  benefit_consumed: '4000.00000000000000000000',
};

describe('computeProjectFinance', () => {
  it('usa el presupuesto en efectivo del backend (suministro y beneficio no suman)', () => {
    const f = computeProjectFinance(project);
    expect(f.financed).toBe(120000);
    expect(f.totalExpenses).toBe(45000);
    expect(f.remaining).toBe(75000);
  });

  it('el % de ejecución es exactamente ejecutado ÷ general (las cifras visibles)', () => {
    const f = computeProjectFinance(project);
    expect(f.executedPct).toBe(38); // 45,000 / 120,000 = 37.5 %
    expect(f.executedPct).toBe(Math.round((f.totalExpenses / f.financed) * 100));
    expect(f.progressColor).toBe('success');
  });

  it('cada tipo de donación muestra su disponible (recibido − gastos imputados)', () => {
    const f = computeProjectFinance(project);
    expect(f.cashDonations).toBe(20000);
    expect(f.cashAvailable).toBe(15000);
    expect(f.inKindDonations).toBe(30000);
    expect(f.inKindAvailable).toBe(18000);
    expect(f.benefitDonations).toBe(10000);
    expect(f.benefitAvailable).toBe(6000);
  });

  it('sobre-ejecución: el % no se topa y el disponible no baja de cero', () => {
    const f = computeProjectFinance({ financed_amount: 1000, total_expenses: 1500 });
    expect(f.executedPct).toBe(150);
    expect(f.remaining).toBe(0);
    expect(f.progressColor).toBe('destructive');
  });

  it('N/D cuando hay gasto pero ningún ingreso en efectivo; 0 % cuando no hay nada', () => {
    expect(computeProjectFinance({ financed_amount: 0, total_expenses: 10 }).executedPct).toBeNull();
    expect(computeProjectFinance({ financed_amount: 0, total_expenses: 10 }).progressColor).toBe('destructive');
    expect(computeProjectFinance({}).executedPct).toBe(0);
    expect(computeProjectFinance({}).progressColor).toBe('success');
  });

  it('umbral de color: 70 % advertencia, 90 % rojo', () => {
    expect(computeProjectFinance({ financed_amount: 100, total_expenses: 69 }).progressColor).toBe('success');
    expect(computeProjectFinance({ financed_amount: 100, total_expenses: 70 }).progressColor).toBe('warning');
    expect(computeProjectFinance({ financed_amount: 100, total_expenses: 90 }).progressColor).toBe('destructive');
  });
});
