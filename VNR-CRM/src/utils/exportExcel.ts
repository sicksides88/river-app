/** Descarga CSV compatible con Excel (UTF-8 BOM, separador ;) */
export function exportTableToExcel(
  filename: string,
  headers: string[],
  rows: (string | number | null | undefined)[][]
) {
  const escape = (v: string | number | null | undefined) =>
    `"${String(v ?? '').replace(/"/g, '""')}"`;

  const lines = [
    headers.map(escape).join(';'),
    ...rows.map((row) => row.map(escape).join(';')),
  ];

  const blob = new Blob(['\uFEFF' + lines.join('\r\n')], {
    type: 'text/csv;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default exportTableToExcel;
