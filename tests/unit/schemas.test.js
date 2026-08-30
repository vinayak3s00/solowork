import { describe, it, expect } from 'vitest'
import {
  createLeadSchema,
  updateLeadSchema,
  createPaymentSchema,
  createReminderSchema,
  createApiKeySchema,
  registerSchema,
  loginSchema,
} from '@/lib/server/schemas'

describe('lead schemas', () => {
  it('trims name and lowercases email', () => {
    const out = createLeadSchema.parse({ name: '  Jane  ', email: 'JANE@EXAMPLE.COM' })
    expect(out.name).toBe('Jane')
    expect(out.email).toBe('jane@example.com')
    expect(out.phone).toBe('')
  })

  it('rejects an invalid email', () => {
    expect(() => createLeadSchema.parse({ name: 'x', email: 'nope' })).toThrow()
  })

  it('rejects a missing name', () => {
    expect(() => createLeadSchema.parse({ email: 'a@b.com' })).toThrow()
  })

  it('rejects an empty update', () => {
    expect(() => updateLeadSchema.parse({})).toThrow()
  })

  it('accepts a valid status update', () => {
    expect(updateLeadSchema.parse({ status: 'Paid' })).toEqual({ status: 'Paid' })
  })

  it('rejects an unknown status', () => {
    expect(() => updateLeadSchema.parse({ status: 'Nope' })).toThrow()
  })
})

describe('payment schema', () => {
  it('coerces a string amount to a number', () => {
    const out = createPaymentSchema.parse({ leadId: 'abc', amount: '1000.50' })
    expect(out.amount).toBe(1000.5)
  })

  it('rejects a non-positive amount', () => {
    expect(() => createPaymentSchema.parse({ leadId: 'abc', amount: -5 })).toThrow()
    expect(() => createPaymentSchema.parse({ leadId: 'abc', amount: 0 })).toThrow()
  })

  it('rejects an unknown payment mode', () => {
    expect(() =>
      createPaymentSchema.parse({ leadId: 'abc', amount: 1, mode: 'Crypto' })
    ).toThrow()
  })
})

describe('reminder schema', () => {
  it('coerces dueDate to a Date', () => {
    const out = createReminderSchema.parse({
      leadId: 'l1',
      title: 'Follow up',
      dueDate: '2026-09-01T10:00:00Z',
    })
    expect(out.dueDate).toBeInstanceOf(Date)
    expect(out.type).toBe('follow-up')
  })

  it('rejects an invalid date', () => {
    expect(() =>
      createReminderSchema.parse({ leadId: 'l1', title: 't', dueDate: 'not-a-date' })
    ).toThrow()
  })
})

describe('api key schema', () => {
  it('rejects an unknown provider', () => {
    expect(() =>
      createApiKeySchema.parse({ name: 'k', apiKey: 'x', provider: 'badprov' })
    ).toThrow()
  })

  it('accepts a valid provider and empty baseUrl', () => {
    const out = createApiKeySchema.parse({ name: 'k', apiKey: 'x', provider: 'openai' })
    expect(out.baseUrl).toBe('')
  })
})

describe('auth schemas', () => {
  it('requires an 8+ char password on register', () => {
    expect(() =>
      registerSchema.parse({ name: 'A', email: 'a@b.com', password: 'short' })
    ).toThrow()
    expect(
      registerSchema.parse({ name: 'A', email: 'a@b.com', password: '12345678' }).password
    ).toBe('12345678')
  })

  it('accepts any non-empty password on login', () => {
    expect(loginSchema.parse({ email: 'a@b.com', password: 'x' }).email).toBe('a@b.com')
  })
})
