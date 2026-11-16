import { v4 as uuidv4 } from 'uuid'
import { getDb } from '../mongo'
import { json, HttpError } from '../http'
import { createReminderSchema, updateReminderSchema, sendReminderSchema } from '../schemas'
import { sendEmail, sendWhatsApp } from '../notifications'
import { requireAuth } from '../auth/session'
import { parsePagination, paginatedEnvelope } from '../pagination'

/** @param {Record<string, any>} doc */
const strip = ({ _id, ownerId, ...rest }) => rest

export async function createReminder(request) {
  const { sub: ownerId } = requireAuth(request)
  const data = createReminderSchema.parse(await request.json())

  const db = await getDb()
  // Ensure the reminder targets a lead the owner actually owns.
  const lead = await db.collection('leads').findOne({ id: data.leadId, ownerId })
  if (!lead) throw new HttpError(404, 'Lead not found')

  const reminder = {
    id: uuidv4(),
    ownerId,
    ...data,
    completed: false,
    createdAt: new Date(),
  }

  await db.collection('reminders').insertOne(reminder)
  return json(strip(reminder), { status: 201 })
}

export async function listReminders(request) {
  const { sub: ownerId } = requireAuth(request)
  const url = new URL(request.url)
  const leadId = url.searchParams.get('leadId')
  const { page, pageSize, skip } = parsePagination(url)

  const query = { ownerId }
  if (leadId) query.leadId = leadId

  const db = await getDb()
  const collection = db.collection('reminders')
  const [docs, total] = await Promise.all([
    collection.find(query).sort({ dueDate: 1 }).skip(skip).limit(pageSize).toArray(),
    collection.countDocuments(query),
  ])

  return json(paginatedEnvelope(docs.map(strip), total, page, pageSize))
}

export async function updateReminder(request, { id }) {
  const { sub: ownerId } = requireAuth(request)
  const data = updateReminderSchema.parse(await request.json())

  const db = await getDb()
  const result = await db.collection('reminders').updateOne({ id, ownerId }, { $set: data })
  if (result.matchedCount === 0) throw new HttpError(404, 'Reminder not found')

  const updated = await db.collection('reminders').findOne({ id, ownerId })
  return json(strip(updated))
}

export async function deleteReminder(request, { id }) {
  const { sub: ownerId } = requireAuth(request)
  const db = await getDb()
  const result = await db.collection('reminders').deleteOne({ id, ownerId })
  if (result.deletedCount === 0) throw new HttpError(404, 'Reminder not found')
  return json({ message: 'Reminder deleted' })
}

export async function sendReminder(request, { id }) {
  const { sub: ownerId } = requireAuth(request)
  const { channel } = sendReminderSchema.parse(await request.json())

  const db = await getDb()
  const reminder = await db.collection('reminders').findOne({ id, ownerId })
  if (!reminder) throw new HttpError(404, 'Reminder not found')

  const lead = await db.collection('leads').findOne({ id: reminder.leadId, ownerId })
  if (!lead) throw new HttpError(404, 'Lead not found')

  const message = `Reminder: ${reminder.title}${
    reminder.description ? ' - ' + reminder.description : ''
  }`

  const results = {}
  if (channel === 'email' || channel === 'both') {
    results.email = await sendEmail(lead.email, reminder.title, message)
  }
  if (channel === 'whatsapp' || channel === 'both') {
    results.whatsapp = await sendWhatsApp(lead.phone, message)
  }

  return json({ message: 'Reminder sent', results })
}
