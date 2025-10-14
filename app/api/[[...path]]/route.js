import { MongoClient } from 'mongodb'
import { v4 as uuidv4 } from 'uuid'
import { NextResponse } from 'next/server'

// MongoDB connection
let client
let db

async function connectToMongo() {
  if (!client) {
    client = new MongoClient(process.env.MONGO_URL)
    await client.connect()
    db = client.db(process.env.DB_NAME)
  }
  return db
}

// Helper function to handle CORS
function handleCORS(response) {
  response.headers.set('Access-Control-Allow-Origin', process.env.CORS_ORIGINS || '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  response.headers.set('Access-Control-Allow-Credentials', 'true')
  return response
}

// OPTIONS handler for CORS
export async function OPTIONS() {
  return handleCORS(new NextResponse(null, { status: 200 }))
}

// Helper to send email (optional - graceful fallback)
async function sendEmail(to, subject, message) {
  try {
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.log('Email not configured - skipping:', { to, subject })
      return { success: false, message: 'Email not configured' }
    }
    // TODO: Implement SMTP email sending
    console.log('Email would be sent:', { to, subject, message })
    return { success: true, message: 'Email sent (simulated)' }
  } catch (error) {
    console.error('Email error:', error)
    return { success: false, message: error.message }
  }
}

// Helper to send WhatsApp (optional - graceful fallback)
async function sendWhatsApp(to, message) {
  try {
    if (!process.env.WHATSAPP_API_KEY || !process.env.WHATSAPP_PHONE_ID) {
      console.log('WhatsApp not configured - skipping:', { to, message })
      return { success: false, message: 'WhatsApp not configured' }
    }
    // TODO: Implement WhatsApp API
    console.log('WhatsApp would be sent:', { to, message })
    return { success: true, message: 'WhatsApp sent (simulated)' }
  } catch (error) {
    console.error('WhatsApp error:', error)
    return { success: false, message: error.message }
  }
}

// Route handler function
async function handleRoute(request, { params }) {
  const { path = [] } = params
  const route = `/${path.join('/')}`
  const method = request.method

  try {
    const db = await connectToMongo()

    // Root endpoint
    if ((route === '/' || route === '/root') && method === 'GET') {
      return handleCORS(NextResponse.json({ message: "SoloCRM API Ready" }))
    }

    // ==================== LEADS ENDPOINTS ====================
    
    // POST /api/leads - Create new lead
    if (route === '/leads' && method === 'POST') {
      const body = await request.json()
      
      if (!body.name || !body.email) {
        return handleCORS(NextResponse.json(
          { error: "Name and email are required" }, 
          { status: 400 }
        ))
      }

      const lead = {
        id: uuidv4(),
        name: body.name,
        email: body.email,
        phone: body.phone || '',
        message: body.message || '',
        budget: body.budget || '',
        serviceType: body.serviceType || '',
        status: 'New',
        notes: [],
        createdAt: new Date(),
        updatedAt: new Date()
      }

      await db.collection('leads').insertOne(lead)
      const { _id, ...cleanLead } = lead
      return handleCORS(NextResponse.json(cleanLead, { status: 201 }))
    }

    // GET /api/leads - List all leads
    if (route === '/leads' && method === 'GET') {
      const url = new URL(request.url)
      const search = url.searchParams.get('search') || ''
      const status = url.searchParams.get('status') || ''

      let query = {}
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      }
      if (status) {
        query.status = status
      }

      const leads = await db.collection('leads')
        .find(query)
        .sort({ createdAt: -1 })
        .limit(1000)
        .toArray()

      const cleanedLeads = leads.map(({ _id, ...rest }) => rest)
      return handleCORS(NextResponse.json(cleanedLeads))
    }

    // GET /api/leads/:id - Get single lead
    if (route.startsWith('/leads/') && method === 'GET') {
      const leadId = path[1]
      const lead = await db.collection('leads').findOne({ id: leadId })

      if (!lead) {
        return handleCORS(NextResponse.json(
          { error: "Lead not found" }, 
          { status: 404 }
        ))
      }

      const { _id, ...cleanLead } = lead
      return handleCORS(NextResponse.json(cleanLead))
    }

    // PATCH /api/leads/:id - Update lead
    if (route.startsWith('/leads/') && method === 'PATCH') {
      const leadId = path[1]
      const body = await request.json()

      const updateData = {
        ...body,
        updatedAt: new Date()
      }
      delete updateData.id
      delete updateData.createdAt

      const result = await db.collection('leads').updateOne(
        { id: leadId },
        { $set: updateData }
      )

      if (result.matchedCount === 0) {
        return handleCORS(NextResponse.json(
          { error: "Lead not found" }, 
          { status: 404 }
        ))
      }

      const updatedLead = await db.collection('leads').findOne({ id: leadId })
      const { _id, ...cleanLead } = updatedLead
      return handleCORS(NextResponse.json(cleanLead))
    }

    // DELETE /api/leads/:id - Delete lead
    if (route.startsWith('/leads/') && method === 'DELETE') {
      const leadId = path[1]
      const result = await db.collection('leads').deleteOne({ id: leadId })

      if (result.deletedCount === 0) {
        return handleCORS(NextResponse.json(
          { error: "Lead not found" }, 
          { status: 404 }
        ))
      }

      return handleCORS(NextResponse.json({ message: "Lead deleted" }))
    }

    // POST /api/leads/:id/notes - Add note to lead
    if (route.match(/^\/leads\/[^\/]+\/notes$/) && method === 'POST') {
      const leadId = path[1]
      const body = await request.json()

      if (!body.note) {
        return handleCORS(NextResponse.json(
          { error: "Note is required" }, 
          { status: 400 }
        ))
      }

      const note = {
        id: uuidv4(),
        note: body.note,
        createdAt: new Date()
      }

      const result = await db.collection('leads').updateOne(
        { id: leadId },
        { 
          $push: { notes: note },
          $set: { updatedAt: new Date() }
        }
      )

      if (result.matchedCount === 0) {
        return handleCORS(NextResponse.json(
          { error: "Lead not found" }, 
          { status: 404 }
        ))
      }

      return handleCORS(NextResponse.json(note, { status: 201 }))
    }

    // ==================== REMINDERS ENDPOINTS ====================

    // POST /api/reminders - Create reminder
    if (route === '/reminders' && method === 'POST') {
      const body = await request.json()

      if (!body.leadId || !body.title || !body.dueDate) {
        return handleCORS(NextResponse.json(
          { error: "leadId, title, and dueDate are required" }, 
          { status: 400 }
        ))
      }

      const reminder = {
        id: uuidv4(),
        leadId: body.leadId,
        title: body.title,
        description: body.description || '',
        dueDate: new Date(body.dueDate),
        type: body.type || 'follow-up', // follow-up, payment-due
        completed: false,
        createdAt: new Date()
      }

      await db.collection('reminders').insertOne(reminder)
      const { _id, ...cleanReminder } = reminder
      return handleCORS(NextResponse.json(cleanReminder, { status: 201 }))
    }

    // GET /api/reminders - List reminders
    if (route === '/reminders' && method === 'GET') {
      const url = new URL(request.url)
      const leadId = url.searchParams.get('leadId')

      let query = {}
      if (leadId) {
        query.leadId = leadId
      }

      const reminders = await db.collection('reminders')
        .find(query)
        .sort({ dueDate: 1 })
        .limit(1000)
        .toArray()

      const cleanedReminders = reminders.map(({ _id, ...rest }) => rest)
      return handleCORS(NextResponse.json(cleanedReminders))
    }

    // PATCH /api/reminders/:id - Update reminder
    if (route.startsWith('/reminders/') && method === 'PATCH') {
      const reminderId = path[1]
      const body = await request.json()

      const result = await db.collection('reminders').updateOne(
        { id: reminderId },
        { $set: body }
      )

      if (result.matchedCount === 0) {
        return handleCORS(NextResponse.json(
          { error: "Reminder not found" }, 
          { status: 404 }
        ))
      }

      const updatedReminder = await db.collection('reminders').findOne({ id: reminderId })
      const { _id, ...cleanReminder } = updatedReminder
      return handleCORS(NextResponse.json(cleanReminder))
    }

    // DELETE /api/reminders/:id - Delete reminder
    if (route.startsWith('/reminders/') && method === 'DELETE') {
      const reminderId = path[1]
      const result = await db.collection('reminders').deleteOne({ id: reminderId })

      if (result.deletedCount === 0) {
        return handleCORS(NextResponse.json(
          { error: "Reminder not found" }, 
          { status: 404 }
        ))
      }

      return handleCORS(NextResponse.json({ message: "Reminder deleted" }))
    }

    // POST /api/reminders/:id/send - Send reminder notification
    if (route.match(/^\/reminders\/[^\/]+\/send$/) && method === 'POST') {
      const reminderId = path[1]
      const body = await request.json()

      const reminder = await db.collection('reminders').findOne({ id: reminderId })
      if (!reminder) {
        return handleCORS(NextResponse.json(
          { error: "Reminder not found" }, 
          { status: 404 }
        ))
      }

      const lead = await db.collection('leads').findOne({ id: reminder.leadId })
      if (!lead) {
        return handleCORS(NextResponse.json(
          { error: "Lead not found" }, 
          { status: 404 }
        ))
      }

      const message = `Reminder: ${reminder.title}${reminder.description ? ' - ' + reminder.description : ''}`

      let results = {}
      if (body.channel === 'email' || body.channel === 'both') {
        results.email = await sendEmail(lead.email, reminder.title, message)
      }
      if (body.channel === 'whatsapp' || body.channel === 'both') {
        results.whatsapp = await sendWhatsApp(lead.phone, message)
      }

      return handleCORS(NextResponse.json({
        message: 'Reminder sent',
        results
      }))
    }

    // ==================== PAYMENTS ENDPOINTS ====================

    // POST /api/payments - Add payment
    if (route === '/payments' && method === 'POST') {
      const body = await request.json()

      if (!body.leadId || !body.amount) {
        return handleCORS(NextResponse.json(
          { error: "leadId and amount are required" }, 
          { status: 400 }
        ))
      }

      const payment = {
        id: uuidv4(),
        leadId: body.leadId,
        amount: parseFloat(body.amount),
        mode: body.mode || 'Cash', // Cash, Card, UPI, Bank Transfer
        status: body.status || 'Pending', // Pending, Completed, Failed
        date: body.date ? new Date(body.date) : new Date(),
        notes: body.notes || '',
        createdAt: new Date()
      }

      await db.collection('payments').insertOne(payment)
      const { _id, ...cleanPayment } = payment
      return handleCORS(NextResponse.json(cleanPayment, { status: 201 }))
    }

    // GET /api/payments - List payments
    if (route === '/payments' && method === 'GET') {
      const url = new URL(request.url)
      const leadId = url.searchParams.get('leadId')

      let query = {}
      if (leadId) {
        query.leadId = leadId
      }

      const payments = await db.collection('payments')
        .find(query)
        .sort({ date: -1 })
        .limit(1000)
        .toArray()

      const cleanedPayments = payments.map(({ _id, ...rest }) => rest)
      return handleCORS(NextResponse.json(cleanedPayments))
    }

    // ==================== ADMIN/SETTINGS ENDPOINTS ====================

    // POST /api/admin/api-keys - Add API key
    if (route === '/admin/api-keys' && method === 'POST') {
      const body = await request.json()

      if (!body.name || !body.apiKey || !body.provider) {
        return handleCORS(NextResponse.json(
          { error: "name, apiKey, and provider are required" }, 
          { status: 400 }
        ))
      }

      const apiKeyObj = {
        id: uuidv4(),
        name: body.name,
        apiKey: body.apiKey,
        provider: body.provider, // openai, anthropic, gemini, etc.
        baseUrl: body.baseUrl || '',
        createdAt: new Date()
      }

      await db.collection('api_keys').insertOne(apiKeyObj)
      const { _id, apiKey, ...cleanApiKey } = apiKeyObj
      return handleCORS(NextResponse.json({
        ...cleanApiKey,
        apiKey: '***' + apiKey.slice(-4)
      }, { status: 201 }))
    }

    // GET /api/admin/api-keys - List API keys
    if (route === '/admin/api-keys' && method === 'GET') {
      const apiKeys = await db.collection('api_keys')
        .find({})
        .sort({ createdAt: -1 })
        .limit(100)
        .toArray()

      const cleanedApiKeys = apiKeys.map(({ _id, apiKey, ...rest }) => ({
        ...rest,
        apiKey: '***' + apiKey.slice(-4)
      }))
      return handleCORS(NextResponse.json(cleanedApiKeys))
    }

    // DELETE /api/admin/api-keys/:id - Delete API key
    if (route.startsWith('/admin/api-keys/') && method === 'DELETE') {
      const keyId = path[2]
      const result = await db.collection('api_keys').deleteOne({ id: keyId })

      if (result.deletedCount === 0) {
        return handleCORS(NextResponse.json(
          { error: "API key not found" }, 
          { status: 404 }
        ))
      }

      return handleCORS(NextResponse.json({ message: "API key deleted" }))
    }

    // ==================== ANALYTICS ENDPOINTS ====================

    // GET /api/analytics - Get dashboard analytics
    if (route === '/analytics' && method === 'GET') {
      const now = new Date()
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

      // Leads this week
      const leadsThisWeek = await db.collection('leads')
        .countDocuments({ createdAt: { $gte: weekAgo } })

      // Total leads
      const totalLeads = await db.collection('leads').countDocuments({})

      // Leads by status
      const leadsByStatus = await db.collection('leads').aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]).toArray()

      // Total revenue
      const revenueData = await db.collection('payments').aggregate([
        { $match: { status: 'Completed' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]).toArray()
      const totalRevenue = revenueData[0]?.total || 0

      // Conversion rate (Done or Paid / Total)
      const convertedCount = await db.collection('leads')
        .countDocuments({ status: { $in: ['Done', 'Paid'] } })
      const conversionRate = totalLeads > 0 ? ((convertedCount / totalLeads) * 100).toFixed(1) : 0

      // Pending reminders
      const pendingReminders = await db.collection('reminders')
        .countDocuments({ completed: false, dueDate: { $lte: now } })

      return handleCORS(NextResponse.json({
        leadsThisWeek,
        totalLeads,
        leadsByStatus: leadsByStatus.reduce((acc, item) => {
          acc[item._id] = item.count
          return acc
        }, {}),
        totalRevenue,
        conversionRate: parseFloat(conversionRate),
        pendingReminders
      }))
    }

    // Route not found
    return handleCORS(NextResponse.json(
      { error: `Route ${route} not found` }, 
      { status: 404 }
    ))

  } catch (error) {
    console.error('API Error:', error)
    return handleCORS(NextResponse.json(
      { error: "Internal server error", details: error.message }, 
      { status: 500 }
    ))
  }
}

// Export all HTTP methods
export const GET = handleRoute
export const POST = handleRoute
export const PUT = handleRoute
export const DELETE = handleRoute
export const PATCH = handleRoute