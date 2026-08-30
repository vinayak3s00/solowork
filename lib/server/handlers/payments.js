import { v4 as uuidv4 } from 'uuid'
import { getDb } from '../mongo'
import { json, HttpError } from '../http'
import { createPaymentSchema } from '../schemas'
import { requireAuth } from '../auth/session'

const strip = ({ _id, ownerId, ...rest }) => rest

export async function createPayment(request) {
  const { sub: ownerId } = requireAuth(request)
  const data = createPaymentSchema.parse(await request.json())

  const db = await getDb()
  // Only allow recording payments against the owner's own leads.
  const lead = await db.collection('leads').findOne({ id: data.leadId, ownerId })
  if (!lead) throw new HttpError(404, 'Lead not found')

  const payment = {
    id: uuidv4(),
    ownerId,
    ...data,
    date: data.date ?? new Date(),
    createdAt: new Date(),
  }

  await db.collection('payments').insertOne(payment)
  return json(strip(payment), { status: 201 })
}

export async function listPayments(request) {
  const { sub: ownerId } = requireAuth(request)
  const url = new URL(request.url)
  const leadId = url.searchParams.get('leadId')

  const query = { ownerId }
  if (leadId) query.leadId = leadId

  const db = await getDb()
  const payments = await db
    .collection('payments')
    .find(query)
    .sort({ date: -1 })
    .limit(1000)
    .toArray()

  return json(payments.map(strip))
}
