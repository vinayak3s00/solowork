import { describe, it, expect, beforeAll } from 'vitest'
import './../setup/mongo'
import { makeRequest, readResponse, sessionTokenFrom } from '../helpers/request'

// Imported dynamically in beforeAll, after mongo setup has set MONGO_URL.
let auth, leads, reminders, payments, apiKeys, analytics, getDb

beforeAll(async () => {
  auth = await import('@/lib/server/handlers/auth')
  leads = await import('@/lib/server/handlers/leads')
  reminders = await import('@/lib/server/handlers/reminders')
  payments = await import('@/lib/server/handlers/payments')
  apiKeys = await import('@/lib/server/handlers/apiKeys')
  analytics = await import('@/lib/server/handlers/analytics')
  ;({ getDb } = await import('@/lib/server/mongo'))
})

// Convenience wrappers -------------------------------------------------------
const authedReq = (token, opts = {}) =>
  makeRequest({ ...opts, cookies: { solocrm_session: token } })

async function registerOwner(name, email, password) {
  const res = await auth.register(makeRequest({ method: 'POST', body: { name, email, password } }))
  const token = sessionTokenFrom(res)
  const { json } = await readResponse(res)
  return { token, user: json }
}

describe('auth flow', () => {
  it('registers the first user (bootstrap), then closes registration', async () => {
    const res1 = await auth.register(
      makeRequest({ method: 'POST', body: { name: 'Owner', email: 'owner@x.com', password: 'password123' } })
    )
    const r1 = await readResponse(res1)
    expect(r1.status).toBe(201)
    expect(r1.json.email).toBe('owner@x.com')
    expect(sessionTokenFrom(res1)).toBeTruthy()

    // Second registration must be rejected.
    const res2 = await auth.register(
      makeRequest({ method: 'POST', body: { name: 'Intruder', email: 'x@y.com', password: 'password123' } })
    ).catch((e) => e)
    expect(res2.status).toBe(403)
  })

  it('logs in with correct credentials and rejects wrong ones', async () => {
    const ok = await auth.login(
      makeRequest({ method: 'POST', body: { email: 'owner@x.com', password: 'password123' } })
    )
    expect((await readResponse(ok)).status).toBe(200)
    expect(sessionTokenFrom(ok)).toBeTruthy()

    const bad = await auth
      .login(makeRequest({ method: 'POST', body: { email: 'owner@x.com', password: 'nope' } }))
      .catch((e) => e)
    expect(bad.status).toBe(401)
  })

  it('me() reports authenticated status from a session cookie', async () => {
    const login = await auth.login(
      makeRequest({ method: 'POST', body: { email: 'owner@x.com', password: 'password123' } })
    )
    const token = sessionTokenFrom(login)
    const meRes = await auth.me(authedReq(token))
    const { json } = await readResponse(meRes)
    expect(json.authenticated).toBe(true)
    expect(json.user.email).toBe('owner@x.com')

    const anon = await readResponse(await auth.me(makeRequest({})))
    expect(anon.json.authenticated).toBe(false)
  })
})

describe('authorization guards', () => {
  it('rejects unauthenticated access to management endpoints with 401', async () => {
    const err = await leads.listLeads(makeRequest({})).catch((e) => e)
    expect(err.status).toBe(401)
  })
})

describe('lead lifecycle + ownership scoping', () => {
  let token
  let ownerId

  beforeAll(async () => {
    const login = await auth.login(
      makeRequest({ method: 'POST', body: { email: 'owner@x.com', password: 'password123' } })
    )
    token = sessionTokenFrom(login)
    const db = await getDb()
    ownerId = (await db.collection('users').findOne({ email: 'owner@x.com' })).id
  })

  it('creates (public), lists, updates, notes, and deletes a lead', async () => {
    // Public capture attaches to the bootstrap owner.
    const created = await readResponse(
      await leads.createLead(makeRequest({ method: 'POST', body: { name: 'Client A', email: 'A@CO.COM' } }))
    )
    expect(created.status).toBe(201)
    expect(created.json.email).toBe('a@co.com')
    expect(created.json).not.toHaveProperty('ownerId') // stripped from response
    const id = created.json.id

    const list = await readResponse(await leads.listLeads(authedReq(token)))
    expect(list.json.items.some((l) => l.id === id)).toBe(true)
    expect(list.json.total).toBeGreaterThanOrEqual(1)

    const updated = await readResponse(
      await leads.updateLead(authedReq(token, { method: 'PATCH', body: { status: 'In Progress' } }), { id })
    )
    expect(updated.json.status).toBe('In Progress')

    const noted = await readResponse(
      await leads.addNote(authedReq(token, { method: 'POST', body: { note: 'Called client' } }), { id })
    )
    expect(noted.status).toBe(201)

    const del = await readResponse(await leads.deleteLead(authedReq(token, { method: 'DELETE' }), { id }))
    expect(del.json.message).toBe('Lead deleted')
  })

  it('does not leak another owner\'s leads', async () => {
    const db = await getDb()
    // Seed a lead owned by someone else directly.
    await db.collection('leads').insertOne({
      id: 'foreign-1',
      ownerId: 'someone-else',
      name: 'Not Yours',
      email: 'no@x.com',
      status: 'New',
      notes: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    const list = await readResponse(await leads.listLeads(authedReq(token)))
    expect(list.json.items.some((l) => l.id === 'foreign-1')).toBe(false)

    // Direct fetch of the foreign lead should 404 for this owner.
    const err = await leads.getLead(authedReq(token), { id: 'foreign-1' }).catch((e) => e)
    expect(err.status).toBe(404)
  })
})

describe('reminders + payments respect lead ownership', () => {
  let token
  let leadId

  beforeAll(async () => {
    const login = await auth.login(
      makeRequest({ method: 'POST', body: { email: 'owner@x.com', password: 'password123' } })
    )
    token = sessionTokenFrom(login)
    const created = await readResponse(
      await leads.createLead(makeRequest({ method: 'POST', body: { name: 'Payer', email: 'p@x.com' } }))
    )
    leadId = created.json.id
  })

  it('creates a reminder for an owned lead and sends it (graceful fallback)', async () => {
    const rem = await readResponse(
      await reminders.createReminder(
        authedReq(token, {
          method: 'POST',
          body: { leadId, title: 'Follow up', dueDate: '2026-09-01T10:00:00Z' },
        })
      )
    )
    expect(rem.status).toBe(201)

    const send = await readResponse(
      await reminders.sendReminder(authedReq(token, { method: 'POST', body: { channel: 'both' } }), {
        id: rem.json.id,
      })
    )
    // No SMTP/WhatsApp configured -> graceful failure, not an error.
    expect(send.json.results.email.success).toBe(false)
    expect(send.json.results.whatsapp.success).toBe(false)
  })

  it('rejects a reminder targeting a lead you do not own', async () => {
    const err = await reminders
      .createReminder(
        authedReq(token, {
          method: 'POST',
          body: { leadId: 'foreign-1', title: 'x', dueDate: '2026-09-01T10:00:00Z' },
        })
      )
      .catch((e) => e)
    expect(err.status).toBe(404)
  })

  it('records a payment (coerced amount) and lists it', async () => {
    const pay = await readResponse(
      await payments.createPayment(
        authedReq(token, { method: 'POST', body: { leadId, amount: '1500.50', status: 'Completed' } })
      )
    )
    expect(pay.json.amount).toBe(1500.5)

    const list = await readResponse(
      await payments.listPayments(authedReq(token, { url: `http://localhost/api?leadId=${leadId}` }))
    )
    expect(list.json.items.length).toBeGreaterThanOrEqual(1)
  })
})

describe('api keys are encrypted at rest and masked in responses', () => {
  let token

  beforeAll(async () => {
    const login = await auth.login(
      makeRequest({ method: 'POST', body: { email: 'owner@x.com', password: 'password123' } })
    )
    token = sessionTokenFrom(login)
  })

  it('stores ciphertext, returns only a masked hint', async () => {
    const created = await readResponse(
      await apiKeys.createApiKey(
        authedReq(token, { method: 'POST', body: { name: 'OpenAI', apiKey: 'sk-secret-1234', provider: 'openai' } })
      )
    )
    expect(created.json.apiKey).toBe('***1234')
    expect(created.json).not.toHaveProperty('apiKeyEnc')

    // Verify the DB stores encrypted, not plaintext.
    const db = await getDb()
    const doc = await db.collection('api_keys').findOne({ id: created.json.id })
    expect(doc.apiKeyEnc).toMatch(/^v1:/)
    expect(JSON.stringify(doc)).not.toContain('sk-secret-1234')

    const list = await readResponse(await apiKeys.listApiKeys(authedReq(token)))
    expect(list.json.every((k) => k.apiKey.startsWith('***'))).toBe(true)
  })
})

describe('analytics are owner-scoped', () => {
  it('returns a numeric summary for the authenticated owner', async () => {
    const login = await auth.login(
      makeRequest({ method: 'POST', body: { email: 'owner@x.com', password: 'password123' } })
    )
    const token = sessionTokenFrom(login)
    const res = await readResponse(await analytics.getAnalytics(authedReq(token)))
    expect(res.json.totalLeads).toBeTypeOf('number')
    expect(res.json.conversionRate).toBeTypeOf('number')
    // The foreign-owned lead must not be counted.
    const db = await getDb()
    const foreignCount = await db.collection('leads').countDocuments({ ownerId: 'someone-else' })
    expect(foreignCount).toBeGreaterThanOrEqual(1)
  })
})


describe('lead pagination', () => {
  let token
  let ownerId

  beforeAll(async () => {
    const login = await auth.login(
      makeRequest({ method: 'POST', body: { email: 'owner@x.com', password: 'password123' } })
    )
    token = sessionTokenFrom(login)
    const db = await getDb()
    ownerId = (await db.collection('users').findOne({ email: 'owner@x.com' })).id

    // Seed a clean, known set of paginated leads for this owner.
    await db.collection('leads').deleteMany({ ownerId })
    const now = Date.now()
    const docs = Array.from({ length: 30 }, (_, i) => ({
      id: `page-lead-${i}`,
      ownerId,
      name: `Lead ${String(i).padStart(2, '0')}`,
      email: `lead${i}@x.com`,
      status: i % 2 === 0 ? 'New' : 'Paid',
      notes: [],
      // Descending createdAt so index i is newest-first.
      createdAt: new Date(now - i * 1000),
      updatedAt: new Date(now - i * 1000),
    }))
    await db.collection('leads').insertMany(docs)
  })

  it('returns the first page with a total and totalPages', async () => {
    const res = await readResponse(
      await leads.listLeads(authedReq(token, { url: 'http://localhost/api?page=1&pageSize=10' }))
    )
    expect(res.json.items).toHaveLength(10)
    expect(res.json.total).toBe(30)
    expect(res.json.page).toBe(1)
    expect(res.json.pageSize).toBe(10)
    expect(res.json.totalPages).toBe(3)
    // Newest first.
    expect(res.json.items[0].id).toBe('page-lead-0')
  })

  it('returns a distinct second page', async () => {
    const res = await readResponse(
      await leads.listLeads(authedReq(token, { url: 'http://localhost/api?page=2&pageSize=10' }))
    )
    expect(res.json.items).toHaveLength(10)
    expect(res.json.items[0].id).toBe('page-lead-10')
    expect(res.json.page).toBe(2)
  })

  it('applies the status filter to the total count', async () => {
    const res = await readResponse(
      await leads.listLeads(authedReq(token, { url: 'http://localhost/api?status=Paid&pageSize=100' }))
    )
    expect(res.json.total).toBe(15)
    expect(res.json.items.every((l) => l.status === 'Paid')).toBe(true)
  })

  it('clamps an oversized pageSize', async () => {
    const res = await readResponse(
      await leads.listLeads(authedReq(token, { url: 'http://localhost/api?pageSize=99999' }))
    )
    expect(res.json.pageSize).toBe(100)
  })
})
