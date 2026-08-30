import { describe, it, expect } from 'vitest'
import {
  parsePagination,
  paginatedEnvelope,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
} from '@/lib/server/pagination'

const url = (qs) => new URL(`http://localhost/api?${qs}`)

describe('parsePagination', () => {
  it('defaults to page 1 and the default page size', () => {
    expect(parsePagination(url(''))).toEqual({
      page: 1,
      pageSize: DEFAULT_PAGE_SIZE,
      skip: 0,
    })
  })

  it('computes skip from page and pageSize', () => {
    expect(parsePagination(url('page=3&pageSize=10'))).toEqual({
      page: 3,
      pageSize: 10,
      skip: 20,
    })
  })

  it('clamps pageSize to the maximum', () => {
    expect(parsePagination(url('pageSize=99999')).pageSize).toBe(MAX_PAGE_SIZE)
  })

  it('falls back to defaults for invalid/negative values', () => {
    expect(parsePagination(url('page=0&pageSize=-5')).page).toBe(1)
    expect(parsePagination(url('page=abc')).page).toBe(1)
    expect(parsePagination(url('pageSize=abc')).pageSize).toBe(DEFAULT_PAGE_SIZE)
  })
})

describe('paginatedEnvelope', () => {
  it('wraps items with computed totalPages', () => {
    expect(paginatedEnvelope([1, 2], 5, 1, 2)).toEqual({
      items: [1, 2],
      total: 5,
      page: 1,
      pageSize: 2,
      totalPages: 3,
    })
  })

  it('reports at least one page when there are no results', () => {
    expect(paginatedEnvelope([], 0, 1, 25).totalPages).toBe(1)
  })
})
