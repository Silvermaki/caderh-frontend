import { describe, it, expect } from 'vitest';
import { formatIdentidad, IDENTIDAD_RE } from '../identidad-input';

describe('formatIdentidad', () => {
  it('agrega los guiones mientras se escribe', () => {
    expect(formatIdentidad('0801')).toBe('0801');
    expect(formatIdentidad('08011')).toBe('0801-1');
    expect(formatIdentidad('080119991')).toBe('0801-1999-1');
    expect(formatIdentidad('0801199912345')).toBe('0801-1999-12345');
  });

  it('descarta letras, espacios y dígitos de más (al pegar)', () => {
    expect(formatIdentidad('0801 1999 12345')).toBe('0801-1999-12345');
    expect(formatIdentidad('0801-1999-123456789')).toBe('0801-1999-12345');
    expect(formatIdentidad('a0b8c01')).toBe('0801');
  });

  it('no deja un guion colgando al borrar', () => {
    expect(formatIdentidad('0801-')).toBe('0801');
    expect(formatIdentidad('0801-1999-')).toBe('0801-1999');
  });
});

describe('IDENTIDAD_RE', () => {
  it('acepta solo 13 dígitos con el formato 0000-0000-00000', () => {
    expect(IDENTIDAD_RE.test('0801-1999-12345')).toBe(true);
    expect(IDENTIDAD_RE.test('0801-1999-1234')).toBe(false);
    expect(IDENTIDAD_RE.test('0801199912345')).toBe(false);
  });
});
