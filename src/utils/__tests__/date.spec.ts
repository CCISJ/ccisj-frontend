// Las fechas sin hora llegan del backend como medianoche UTC. En Uruguay
// (UTC-3) eso es el día anterior a las 21 h, y es el error más fácil de
// cometer en esta app: ya pasó en Caja (H-15).
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  formatDate,
  formatMonth,
  getMonthRange,
  todayLocal,
  uruguayDay,
} from '@/utils/date';

afterEach(() => {
  vi.useRealTimers();
});

describe('zona horaria de los tests', () => {
  it('es la de Uruguay, o los tests de fechas no prueban nada', () => {
    // vitest.config.ts la fija. Si esto falla, los de abajo pasarían en una
    // máquina en UTC aunque el código estuviera mal.
    expect(new Date('2020-06-15T00:00:00.000Z').getDate()).toBe(14);
  });
});

describe('formatDate', () => {
  it.each([
    ['2020-06-15T00:00:00.000Z', '15/06/2020'],
    ['2020-06-15T00:00:00Z', '15/06/2020'],
    ['2020-06-15', '15/06/2020'],
  ])('una fecha sin hora (%s) no se corre un día', (value, shown) => {
    expect(formatDate(value)).toBe(shown);
  });

  it('un instante con hora se muestra en hora de Uruguay', () => {
    // 01:30 UTC del 15 son las 22:30 del 14 en Uruguay.
    expect(formatDate('2020-06-15T01:30:00.000Z')).toBe('14/06/2020');
  });

  it.each([null, undefined, '', 'no es una fecha'])(
    'sin fecha válida muestra un guion: %j',
    (value) => {
      expect(formatDate(value)).toBe('—');
    },
  );
});

describe('uruguayDay', () => {
  it('da el día de Uruguay, no el de UTC', () => {
    // A las 23:30 del 31/12 en Uruguay ya es 1/1 en UTC.
    expect(uruguayDay('2025-01-01T02:30:00.000Z')).toBe('2024-12-31');
    expect(uruguayDay('2025-01-01T03:30:00.000Z')).toBe('2025-01-01');
  });
});

describe('todayLocal', () => {
  it('cerca de la medianoche no adelanta el día', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-03-10T02:00:00.000Z'));

    // `toISOString().slice(0, 10)` daría 2025-03-10.
    expect(todayLocal()).toBe('2025-03-09');
  });
});

describe('getMonthRange', () => {
  it.each([
    ['2025-01', 1, '2025-01-31'],
    ['2024-02', 1, '2024-02-29'],
    ['2025-02', 1, '2025-02-28'],
    ['2025-11', 3, '2026-01-31'],
    ['2025-01', 12, '2025-12-31'],
  ])('%s por %i meses termina el %s', (start, months, end) => {
    expect(getMonthRange(start, months)).toEqual({
      fechaDesde: `${start}-01`,
      fechaHasta: end,
    });
  });

  it('sin duración no tiene fin', () => {
    expect(getMonthRange('2025-05', null)).toEqual({
      fechaDesde: '2025-05-01',
      fechaHasta: undefined,
    });
  });

  it('rechaza un mes mal escrito', () => {
    expect(() => getMonthRange('2025', 1)).toThrow('Mes de inicio inválido');
  });
});

describe('formatMonth', () => {
  it('el mes de una fecha sin hora no se corre al anterior', () => {
    expect(formatMonth('2025-03-01T00:00:00.000Z')).toMatch(/^Mar\.? 2025$/);
  });
});
