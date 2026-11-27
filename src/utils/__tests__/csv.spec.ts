import { describe, expect, it } from 'vitest';

import { toCsv } from '@/utils/csv';

// El BOM de UTF-8 escrito como código: como carácter es invisible en el editor.
const BOM = String.fromCharCode(0xfeff);

describe('toCsv', () => {
  it('empieza con el BOM de UTF-8 para que Excel lea bien los acentos', () => {
    expect(toCsv([['Óptica']]).charCodeAt(0)).toBe(0xfeff);
  });

  it('separa columnas con punto y coma y filas con CRLF', () => {
    expect(
      toCsv([
        ['Empresa', 'Estado'],
        ['Ferretería', 'Deudor'],
      ]),
    ).toBe(`${BOM}"Empresa";"Estado"\r\n"Ferretería";"Deudor"`);
  });

  it('escribe los números con coma decimal, sin separador de miles', () => {
    expect(toCsv([[6840, 1520.5, 0, 11]])).toBe(
      `${BOM}"6840";"1520,50";"0";"11"`,
    );
  });

  it('duplica las comillas dentro de un texto', () => {
    expect(toCsv([['Almacén "El Sol"']])).toBe(`${BOM}"Almacén ""El Sol"""`);
  });

  it('deja vacías las celdas sin dato', () => {
    expect(toCsv([['a', null, undefined, 'b']])).toBe(`${BOM}"a";"";"";"b"`);
  });

  it('neutraliza un texto que Excel tomaría como fórmula', () => {
    expect(
      toCsv([['=HYPERLINK("http://x")', '+1', '-2', '@SUM(A1)', 'Normal']]),
    ).toBe(
      `${BOM}"'=HYPERLINK(""http://x"")";"'+1";"'-2";"'@SUM(A1)";"Normal"`,
    );
  });
});
