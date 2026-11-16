import { v4 as uuidv4 } from 'uuid'
import { getDb } from '../mongo'
import { json } from '../http'
import { createPaymentSchema } from '../schemas'

const strip = ({ _id, ...rest }) => rest

export async function createPayment(request) {
  const data = createPaymentSchema.parse(await request.json())

  const payment = {
    id: uuidv4(),
    ...data,
    date: data.date ?? new Date(),
    createdAt: new Date(),
  }

  const db = await getDb()
  await db.collection('payments').insertOne(payment)
  return json(strip(payment), { status: 201 })
}

export async function listPayments(request) {
  const url = new URL(request.url)
  const leadId = url.searchParams.get('leadId')

  const query = {}
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
