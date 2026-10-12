import { describe, it, expect } from 'vitest';
import {
  FILTER_GROUPS, FILTER_META, FILTER_PARAMS, filtersByGroup,
  paramsFor, parseParamValue, serializeParamValue, queryParams, formatIsoDate,
} from '../filter-keys';

describe('filter-keys registry', () => {
  it('has 6 groups in fixed order', () => {
    expect(FILTER_GROUPS.map(g => g.key)).toEqual([
      'periodo', 'contexto', 'demografia', 'resultados', 'ubicacion', 'programatico',
    ]);
  });

  it('has metadata and URL params for all 18 filter keys', () => {
    const allKeys = Object.keys(FILTER_META);
    expect(allKeys).toHaveLength(18);
    expect(Object.keys(FILTER_PARAMS).sort()).toEqual([...allKeys].sort());
    expect(FILTER_META.dateRange.label).toBeDefined();
  });

  it('groups filters correctly', () => {
    const grouped = filtersByGroup(['dateRange', 'project', 'gender', 'courseResult']);
    expect(grouped.periodo).toContain('dateRange');
    expect(grouped.contexto).toContain('project');
    expect(grouped.demografia).toContain('gender');
    expect(grouped.resultados).toContain('courseResult');
  });
});

describe('URL params', () => {
  it('maps composite filters to several params', () => {
    expect([...paramsFor(['dateRange', 'age', 'youthStatus']).keys()])
      .toEqual(['from', 'to', 'age_min', 'age_max', 'estatus']);
  });

  it('parses values by kind; empty means "no filter"', () => {
    expect(parseParamValue('a,b', 'array')).toEqual(['a', 'b']);
    expect(parseParamValue('2026', 'number')).toBe(2026);
    expect(parseParamValue('x', 'number')).toBeUndefined();
    expect(parseParamValue('', 'string')).toBeUndefined();
    expect(parseParamValue('', 'array')).toBeUndefined();
  });

  it('serializes values; empty → null', () => {
    expect(serializeParamValue(['a', 'b'])).toBe('a,b');
    expect(serializeParamValue([])).toBeNull();
    expect(serializeParamValue(undefined)).toBeNull();
    expect(serializeParamValue(18)).toBe('18');
  });

  it('builds backend query params only for declared filters', () => {
    expect(queryParams(['dateRange', 'project'], {
      from: '2026-01-01', to: '', project: ['p1', 'p2'], year: 2025,
    })).toEqual({ from: '2026-01-01', project: 'p1,p2' });
  });

  it('formats ISO dates as dd/mm/yyyy', () => {
    expect(formatIsoDate('2026-03-09')).toBe('09/03/2026');
  });
});
