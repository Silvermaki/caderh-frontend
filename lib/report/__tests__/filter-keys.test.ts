import { describe, it, expect } from 'vitest';
import { FILTER_GROUPS, FILTER_META, filtersByGroup } from '../filter-keys';

describe('filter-keys registry', () => {
  it('has 5 groups in fixed order', () => {
    expect(FILTER_GROUPS.map(g => g.key)).toEqual([
      'periodo', 'contexto', 'demografia', 'ubicacion', 'programatico',
    ]);
  });

  it('has metadata for all 15 filter keys', () => {
    const allKeys = Object.keys(FILTER_META);
    expect(allKeys).toHaveLength(15);
    expect(FILTER_META.dateRange.label).toBeDefined();
  });

  it('groups filters correctly', () => {
    const grouped = filtersByGroup(['dateRange', 'project', 'gender']);
    expect(grouped.periodo).toContain('dateRange');
    expect(grouped.contexto).toContain('project');
    expect(grouped.demografia).toContain('gender');
  });
});
