/**
 * Archivos CSV que Excel abre bien con la configuración regional de Uruguay:
 *
 * - **Separador `;`**: con la región en español, Excel separa las columnas
 *   por punto y coma (la coma es el separador decimal). Con `,` todo quedaría
 *   en la primera columna.
 * - **BOM de UTF-8** al principio: sin él, Excel lee el archivo como
 *   Windows-1252 y los acentos y la ñ salen rotos ("FerreterÃ­a").
 * - **Números con coma decimal** y sin separador de miles, para que Excel los
 *   tome como números y se puedan sumar. Los enteros van sin decimales.
 * - **Fin de línea `\r\n`**, el que espera Excel.
 *
 * Cada celda va entre comillas. Las que empiezan con `=`, `+`, `-`, `@`, o con
 * un tabulador o un retorno, llevan un apóstrofo adelante: si no, Excel las
 * ejecuta como fórmula (inyección de fórmulas en CSV). Una razón social
 * cargada como `=HYPERLINK(...)` se vería como texto, no como un enlace.
 */
export type CsvCell = string | number | null | undefined;

const SEPARATOR = ';';
const BOM = String.fromCharCode(0xfeff);
const FORMULA_START = /^[=+\-@\t\r]/;

function cell(value: CsvCell) {
  if (value === null || value === undefined) return '""';

  const text =
    typeof value === 'number'
      ? Number.isInteger(value)
        ? String(value)
        : value.toFixed(2).replace('.', ',')
      : FORMULA_START.test(value)
        ? `'${value}`
        : value;

  return `"${text.replaceAll('"', '""')}"`;
}

export function toCsv(rows: CsvCell[][]) {
  return BOM + rows.map((row) => row.map(cell).join(SEPARATOR)).join('\r\n');
}

/** Descarga las filas como un archivo `.csv` desde el navegador. */
export function downloadCsv(filename: string, rows: CsvCell[][]) {
  const blob = new Blob([toCsv(rows)], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();

  URL.revokeObjectURL(url);
}
