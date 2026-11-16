import { describe, it, expect } from 'vitest'
import { z } from 'zod'
import { HttpError, toErrorResponse } from '@/lib/server/http'

async function body(res) {
  return { status: res.status, json: await res.json() }
}

describe('toErrorResponse', () => {
  it('maps an HttpError to its status and message', async () => {
    const { status, json } = await body(toErrorResponse(new HttpError(404, 'Lead not found')))
    expect(status).toBe(404)
    expect(json.error).toBe('Lead not found')
  })

  it('includes HttpError extras (e.g. retryAfter)', async () => {
    const { json } = await body(toErrorResponse(new HttpError(429, 'Too many', { retryAfter: 5 })))
    expect(json.retryAfter).toBe(5)
  })

  it('maps a ZodError to 400 with field issues', async () => {
    let zerr
    try {
      z.object({ email: z.string().email() }).parse({ email: 'nope' })
    } catch (e) {
      zerr = e
    }
    const { status, json } = await body(toErrorResponse(zerr))
    expect(status).toBe(400)
    expect(json.error).toBe('Validation failed')
    expect(Array.isArray(json.fields)).toBe(true)
    expect(json.fields[0].field).toBe('email')
  })

  it('maps an unknown error to a generic 500 (no internal leakage)', async () => {
    const { status, json } = await body(toErrorResponse(new Error('secret stack detail')))
    expect(status).toBe(500)
    expect(json.error).toBe('Internal server error')
    expect(JSON.stringify(json)).not.toContain('secret stack detail')
  })
})
