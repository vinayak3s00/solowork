import { v4 as uuidv4 } from 'uuid'
import { getDb } from '../mongo'
import { json, HttpError } from '../http'
import { createLeadSchema, updateLeadSchema, addNoteSchema } from '../schemas'
import { enforceRateLimit, getClientIp } from '../rateLimit'

const strip = ({ _id, ...rest }) => rest

export async function createLead(request) {
  // Public endpoint: mitigate spam/abuse.
  enforceRateLimit(`capture:${getClientIp(request)}`, 10, 60_000)

  const data = createLeadSchema.parse(await request.json())

  const lead = {
    id: uuidv4(),
    ...data,
    status: 'New',
    notes: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const db = await getDb()
  await db.collection('leads').insertOne(lead)
  return json(strip(lead), { status: 201 })
}

export async function listLeads(request) {
  const url = new URL(request.url)
  const search = url.searchParams.get('search') || ''
  const status = url.searchParams.get('status') || ''

  const query = {}
  if (search) {
    const safe = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    query.$or = [
      { name: { $regex: safe, $options: 'i' } },
      { email: { $regex: safe, $options: 'i' } },
    ]
  }
  if (status) query.status = status

  const db = await getDb()
  const leads = await db
    .collection('leads')
    .find(query)
    .sort({ createdAt: -1 })
    .limit(1000)
    .toArray()

  return json(leads.map(strip))
}

export async function getLead(request, { id }) {
  const db = await getDb()
  const lead = await db.collection('leads').findOne({ id })
  if (!lead) throw new HttpError(404, 'Lead not found')
  return json(strip(lead))
}

export async function updateLead(request, { id }) {
  const data = updateLeadSchema.parse(await request.json())

  const db = await getDb()
  const result = await db
    .collection('leads')
    .updateOne({ id }, { $set: { ...data, updatedAt: new Date() } })

  if (result.matchedCount === 0) throw new HttpError(404, 'Lead not found')

  const updated = await db.collection('leads').findOne({ id })
  return json(strip(updated))
}

export async function deleteLead(request, { id }) {
  const db = await getDb()
  const result = await db.collection('leads').deleteOne({ id })
  if (result.deletedCount === 0) throw new HttpError(404, 'Lead not found')
  return json({ message: 'Lead deleted' })
}

export async function addNote(request, { id }) {
  const { note } = addNoteSchema.parse(await request.json())

  const noteObj = { id: uuidv4(), note, createdAt: new Date() }

  const db = await getDb()
  const result = await db
    .collection('leads')
    .updateOne({ id }, { $push: { notes: noteObj }, $set: { updatedAt: new Date() } })

  if (result.matchedCount === 0) throw new HttpError(404, 'Lead not found')
  return json(noteObj, { status: 201 })
}
