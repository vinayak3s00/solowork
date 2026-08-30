import { v4 as uuidv4 } from 'uuid'
import { getDb } from '../mongo'
import { json, HttpError } from '../http'
import { createLeadSchema, updateLeadSchema, addNoteSchema } from '../schemas'
import { enforceRateLimit, getClientIp } from '../rateLimit'
import { requireAuth, getSession } from '../auth/session'
import { parsePagination, paginatedEnvelope } from '../pagination'

/** @param {Record<string, any>} doc */
const strip = ({ _id, ownerId, ...rest }) => rest

/**
 * POST /leads — PUBLIC lead capture (rate-limited).
 * Assigns the lead to the single owner account when one exists, so captured
 * leads show up in the owner's dashboard even though the submitter isn't logged in.
 */
export async function createLead(request) {
  enforceRateLimit(`capture:${getClientIp(request)}`, 10, 60_000)

  const data = createLeadSchema.parse(await request.json())

  const db = await getDb()

  // Prefer the logged-in user; otherwise attach to the bootstrap owner.
  let ownerId = getSession(request)?.sub
  if (!ownerId) {
    const owner = await db.collection('users').findOne({}, { sort: { createdAt: 1 } })
    ownerId = owner?.id || null
  }

  const lead = {
    id: uuidv4(),
    ownerId,
    ...data,
    status: 'New',
    notes: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  await db.collection('leads').insertOne(lead)
  return json(strip(lead), { status: 201 })
}

export async function listLeads(request) {
  const { sub: ownerId } = requireAuth(request)
  const url = new URL(request.url)
  const search = url.searchParams.get('search') || ''
  const status = url.searchParams.get('status') || ''
  const { page, pageSize, skip } = parsePagination(url)

  const query = { ownerId }
  if (search) {
    const safe = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    query.$or = [
      { name: { $regex: safe, $options: 'i' } },
      { email: { $regex: safe, $options: 'i' } },
    ]
  }
  if (status) query.status = status

  const db = await getDb()
  const collection = db.collection('leads')
  const [docs, total] = await Promise.all([
    collection.find(query).sort({ createdAt: -1 }).skip(skip).limit(pageSize).toArray(),
    collection.countDocuments(query),
  ])

  return json(paginatedEnvelope(docs.map(strip), total, page, pageSize))
}

export async function getLead(request, { id }) {
  const { sub: ownerId } = requireAuth(request)
  const db = await getDb()
  const lead = await db.collection('leads').findOne({ id, ownerId })
  if (!lead) throw new HttpError(404, 'Lead not found')
  return json(strip(lead))
}

export async function updateLead(request, { id }) {
  const { sub: ownerId } = requireAuth(request)
  const data = updateLeadSchema.parse(await request.json())

  const db = await getDb()
  const result = await db
    .collection('leads')
    .updateOne({ id, ownerId }, { $set: { ...data, updatedAt: new Date() } })

  if (result.matchedCount === 0) throw new HttpError(404, 'Lead not found')

  const updated = await db.collection('leads').findOne({ id, ownerId })
  return json(strip(updated))
}

export async function deleteLead(request, { id }) {
  const { sub: ownerId } = requireAuth(request)
  const db = await getDb()
  const result = await db.collection('leads').deleteOne({ id, ownerId })
  if (result.deletedCount === 0) throw new HttpError(404, 'Lead not found')
  return json({ message: 'Lead deleted' })
}

export async function addNote(request, { id }) {
  const { sub: ownerId } = requireAuth(request)
  const { note } = addNoteSchema.parse(await request.json())

  const noteObj = { id: uuidv4(), note, createdAt: new Date() }

  const db = await getDb()
  const result = await db
    .collection('leads')
    .updateOne({ id, ownerId }, { $push: { notes: noteObj }, $set: { updatedAt: new Date() } })

  if (result.matchedCount === 0) throw new HttpError(404, 'Lead not found')
  return json(noteObj, { status: 201 })
}
