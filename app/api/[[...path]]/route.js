import { withCORS, json, errorResponse, toErrorResponse } from '@/lib/server/http'
import { NextResponse } from 'next/server'
import {
  createLead,
  listLeads,
  getLead,
  updateLead,
  deleteLead,
  addNote,
} from '@/lib/server/handlers/leads'
import {
  createReminder,
  listReminders,
  updateReminder,
  deleteReminder,
  sendReminder,
} from '@/lib/server/handlers/reminders'
import { createPayment, listPayments } from '@/lib/server/handlers/payments'
import { createApiKey, listApiKeys, deleteApiKey } from '@/lib/server/handlers/apiKeys'
import { getAnalytics } from '@/lib/server/handlers/analytics'
import { register, login, logout, me } from '@/lib/server/handlers/auth'

// CORS preflight
export async function OPTIONS() {
  return withCORS(new NextResponse(null, { status: 200 }))
}

// Route table: [method, RegExp, handler]. The first capture group (if any)
// is passed to the handler as an id/param object.
const routes = [
  ['GET', /^\/$/, () => json({ message: 'SoloCRM API Ready' })],
  ['GET', /^\/root$/, () => json({ message: 'SoloCRM API Ready' })],

  // Auth
  ['POST', /^\/auth\/register$/, (req) => register(req)],
  ['POST', /^\/auth\/login$/, (req) => login(req)],
  ['POST', /^\/auth\/logout$/, () => logout()],
  ['GET', /^\/auth\/me$/, (req) => me(req)],

  // Leads
  ['POST', /^\/leads$/, (req) => createLead(req)],
  ['GET', /^\/leads$/, (req) => listLeads(req)],
  ['POST', /^\/leads\/([^/]+)\/notes$/, (req, id) => addNote(req, { id })],
  ['GET', /^\/leads\/([^/]+)$/, (req, id) => getLead(req, { id })],
  ['PATCH', /^\/leads\/([^/]+)$/, (req, id) => updateLead(req, { id })],
  ['DELETE', /^\/leads\/([^/]+)$/, (req, id) => deleteLead(req, { id })],

  // Reminders
  ['POST', /^\/reminders$/, (req) => createReminder(req)],
  ['GET', /^\/reminders$/, (req) => listReminders(req)],
  ['POST', /^\/reminders\/([^/]+)\/send$/, (req, id) => sendReminder(req, { id })],
  ['PATCH', /^\/reminders\/([^/]+)$/, (req, id) => updateReminder(req, { id })],
  ['DELETE', /^\/reminders\/([^/]+)$/, (req, id) => deleteReminder(req, { id })],

  // Payments
  ['POST', /^\/payments$/, (req) => createPayment(req)],
  ['GET', /^\/payments$/, (req) => listPayments(req)],

  // Admin / API keys
  ['POST', /^\/admin\/api-keys$/, (req) => createApiKey(req)],
  ['GET', /^\/admin\/api-keys$/, (req) => listApiKeys(req)],
  ['DELETE', /^\/admin\/api-keys\/([^/]+)$/, (req, id) => deleteApiKey(req, { id })],

  // Analytics
  ['GET', /^\/analytics$/, (req) => getAnalytics(req)],
]

async function handleRoute(request, { params }) {
  const { path = [] } = params
  const route = `/${path.join('/')}`
  const method = request.method

  try {
    for (const [m, pattern, handler] of routes) {
      if (m !== method) continue
      const match = pattern.exec(route)
      if (match) {
        return await handler(request, match[1] ? decodeURIComponent(match[1]) : undefined)
      }
    }
    return errorResponse(`Route ${route} not found`, 404)
  } catch (err) {
    return toErrorResponse(err)
  }
}

export const GET = handleRoute
export const POST = handleRoute
export const PUT = handleRoute
export const DELETE = handleRoute
export const PATCH = handleRoute
