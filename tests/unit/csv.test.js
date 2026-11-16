import { describe, it, expect } from 'vitest'
import { toCSV } from '@/lib/csv'

const columns = [
  { key: 'name', label: 'Name' },
  { key: 'note', label: 'Note' },
  { key: 'when', label: 'When', format: (v) => (v ? new Date(v).toISOString() : '') },
]

describe('toCSV', () => {
  it('emits a header even with no rows', () => {
    expect(toCSV([], columns)).toBe('Name,Note,When')
  })

  it('quotes cells containing commas, quotes, and newlines', () => {
    const csv = toCSV([{ name: 'Doe, Jane', note: 'said "hi"', when: '' }], columns)
    const [, row] = csv.split('\r\n')
    expect(row).toContain('"Doe, Jane"')
    expect(row).toContain('"said ""hi"""')
  })

  it('renders null/undefined as empty cells', () => {
    const csv = toCSV([{ name: null, note: undefined, when: null }], columns)
    expect(csv.split('\r\n')[1]).toBe(',,')
  })

  it('applies column formatters', () => {
    const csv = toCSV([{ name: 'x', note: 'y', when: '2026-01-02T03:04:05Z' }], columns)
    expect(csv).toContain('2026-01-02T03:04:05.000Z')
  })

  it('handles a value with an embedded newline by quoting it', () => {
    const csv = toCSV([{ name: 'a\nb', note: '', when: '' }], columns)
    expect(csv.split('\r\n')[1]).toContain('"a\nb"')
  })
})
