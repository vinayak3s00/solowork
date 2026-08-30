export const DEFAULT_PAGE_SIZE = 25
export const MAX_PAGE_SIZE = 100

/**
 * Parses page/pageSize from a request URL's search params, clamped to safe bounds.
 * - page: integer >= 1 (default 1)
 * - pageSize: integer in [1, MAX_PAGE_SIZE] (default DEFAULT_PAGE_SIZE)
 * @param {URL} url
 * @returns {{ page: number, pageSize: number, skip: number }}
 */
export function parsePagination(url) {
  const rawPage = parseInt(url.searchParams.get('page') ?? '', 10)
  const rawSize = parseInt(url.searchParams.get('pageSize') ?? '', 10)

  const page = Number.isFinite(rawPage) && rawPage >= 1 ? rawPage : 1
  let pageSize = Number.isFinite(rawSize) && rawSize >= 1 ? rawSize : DEFAULT_PAGE_SIZE
  if (pageSize > MAX_PAGE_SIZE) pageSize = MAX_PAGE_SIZE

  return { page, pageSize, skip: (page - 1) * pageSize }
}

/**
 * Wraps a page of items with pagination metadata.
 * @template T
 * @param {T[]} items
 * @param {number} total
 * @param {number} page
 * @param {number} pageSize
 */
export function paginatedEnvelope(items, total, page, pageSize) {
  return {
    items,
    total,
    page,
    pageSize,
    totalPages: pageSize > 0 ? Math.max(1, Math.ceil(total / pageSize)) : 1,
  }
}
