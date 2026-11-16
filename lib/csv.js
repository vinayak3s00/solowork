// Client-side CSV export helpers.

/** Escapes a single CSV cell per RFC 4180. */
function escapeCell(value) {
  if (value === null || value === undefined) return ''
  const str = String(value)
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

/**
 * Converts an array of rows into a CSV string.
 * @param {Array<object>} rows
 * @param {Array<{ key: string, label: string, format?: (v:any, row:object)=>any }>} columns
 */
export function toCSV(rows, columns) {
  const header = columns.map((c) => escapeCell(c.label)).join(',')
  const body = (rows || [])
    .map((row) =>
      columns
        .map((c) => {
          const raw = row?.[c.key]
          return escapeCell(c.format ? c.format(raw, row) : raw)
        })
        .join(',')
    )
    .join('\r\n')
  return body ? `${header}\r\n${body}` : header
}

/** Triggers a browser download of the given rows as a CSV file. */
export function downloadCSV(filename, rows, columns) {
  const csv = toCSV(rows, columns)
  // Prepend BOM so Excel opens UTF-8 correctly.
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
