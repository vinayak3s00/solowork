# SoloCRM - Complete Documentation & Enterprise Roadmap

## Table of Contents
1. [Current Architecture](#current-architecture)
2. [Database Schema](#database-schema)
3. [API Documentation](#api-documentation)
4. [Frontend Architecture](#frontend-architecture)
5. [Enterprise Migration Roadmap](#enterprise-migration-roadmap)
6. [Security & Compliance](#security--compliance)
7. [Scalability Strategy](#scalability-strategy)
8. [Feature Enhancement Plan](#feature-enhancement-plan)

---

## Current Architecture

### Tech Stack Overview
```
Frontend:
├── Next.js 14 (App Router)
├── React 18
├── Tailwind CSS
├── shadcn/ui components
└── Sonner (notifications)

Backend:
├── Next.js API Routes
├── MongoDB (native driver)
└── UUID for ID generation

Infrastructure:
├── Single server deployment
├── MongoDB on localhost
└── No caching layer
```

### Current Limitations (MVP)
- ❌ No authentication/authorization
- ❌ Single tenant (no multi-tenancy)
- ❌ No role-based access control
- ❌ No API rate limiting
- ❌ No audit logging
- ❌ No data backup strategy
- ❌ No real-time features
- ❌ No file upload capability
- ❌ Email/WhatsApp not implemented
- ❌ No AI features (though keys can be stored)
- ❌ No team collaboration
- ❌ No export/import functionality

---

## Database Schema

### Current Collections

#### 1. `leads` Collection
```javascript
{
  id: "uuid-v4",                    // Primary key
  name: "string",                   // Required
  email: "string",                  // Required, should be unique
  phone: "string",                  // Optional
  message: "string",                // Optional
  budget: "string",                 // Optional
  serviceType: "string",            // Optional
  status: "enum",                   // New, In Progress, Done, Paid
  notes: [                          // Array of note objects
    {
      id: "uuid-v4",
      note: "string",
      createdAt: "date"
    }
  ],
  createdAt: "date",
  updatedAt: "date"
}
```

**Indexes Needed:**
```javascript
db.leads.createIndex({ email: 1 }, { unique: true })
db.leads.createIndex({ status: 1 })
db.leads.createIndex({ createdAt: -1 })
db.leads.createIndex({ name: "text", email: "text" }) // For text search
```

#### 2. `reminders` Collection
```javascript
{
  id: "uuid-v4",
  leadId: "uuid-v4",                // Foreign key to leads
  title: "string",                  // Required
  description: "string",            // Optional
  dueDate: "date",                  // Required
  type: "enum",                     // follow-up, payment-due
  completed: "boolean",             // Default: false
  createdAt: "date"
}
```

**Indexes Needed:**
```javascript
db.reminders.createIndex({ leadId: 1 })
db.reminders.createIndex({ dueDate: 1 })
db.reminders.createIndex({ completed: 1 })
```

#### 3. `payments` Collection
```javascript
{
  id: "uuid-v4",
  leadId: "uuid-v4",                // Foreign key to leads
  amount: "number",                 // Required, decimal
  mode: "enum",                     // Cash, Card, UPI, Bank Transfer
  status: "enum",                   // Pending, Completed, Failed
  date: "date",                     // Payment date
  notes: "string",                  // Optional
  createdAt: "date"
}
```

**Indexes Needed:**
```javascript
db.payments.createIndex({ leadId: 1 })
db.payments.createIndex({ status: 1 })
db.payments.createIndex({ date: -1 })
```

#### 4. `api_keys` Collection
```javascript
{
  id: "uuid-v4",
  name: "string",                   // Required, e.g., "Production OpenAI"
  apiKey: "string",                 // Required, encrypted in enterprise
  provider: "enum",                 // openai, anthropic, gemini, other
  baseUrl: "string",                // Optional, for custom providers
  createdAt: "date"
}
```

**Indexes Needed:**
```javascript
db.api_keys.createIndex({ provider: 1 })
```

---

## API Documentation

### Base URL
- Development: `http://localhost:3000/api`
- Production: `https://solocrm.preview.emergentagent.com/api`

### Authentication
**Current:** None (MVP)  
**Enterprise:** JWT tokens, API keys, OAuth 2.0

---

### Leads Endpoints

#### 1. Create Lead
```http
POST /api/leads
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "message": "Looking for web design",
  "budget": "$5000-$10000",
  "serviceType": "Web Design"
}

Response (201):
{
  "id": "uuid",
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "message": "Looking for web design",
  "budget": "$5000-$10000",
  "serviceType": "Web Design",
  "status": "New",
  "notes": [],
  "createdAt": "2025-10-14T08:23:57.241Z",
  "updatedAt": "2025-10-14T08:23:57.241Z"
}
```

#### 2. List Leads (with filtering)
```http
GET /api/leads?search=john&status=New

Response (200):
[
  {
    "id": "uuid",
    "name": "John Doe",
    ...
  }
]
```

**Query Parameters:**
- `search`: Search by name or email (case-insensitive, regex)
- `status`: Filter by status (New, In Progress, Done, Paid)

#### 3. Get Single Lead
```http
GET /api/leads/{leadId}

Response (200):
{
  "id": "uuid",
  "name": "John Doe",
  ...
}
```

#### 4. Update Lead
```http
PATCH /api/leads/{leadId}
Content-Type: application/json

{
  "status": "In Progress",
  "phone": "+9876543210"
}

Response (200):
{
  "id": "uuid",
  "status": "In Progress",
  ...
}
```

#### 5. Delete Lead
```http
DELETE /api/leads/{leadId}

Response (200):
{
  "message": "Lead deleted"
}
```

#### 6. Add Note to Lead
```http
POST /api/leads/{leadId}/notes
Content-Type: application/json

{
  "note": "Called client, very interested"
}

Response (201):
{
  "id": "uuid",
  "note": "Called client, very interested",
  "createdAt": "2025-10-14T08:23:57.241Z"
}
```

---

### Reminders Endpoints

#### 1. Create Reminder
```http
POST /api/reminders
Content-Type: application/json

{
  "leadId": "uuid",
  "title": "Follow up with John",
  "description": "Send project proposal",
  "dueDate": "2025-10-16T10:00:00.000Z",
  "type": "follow-up"
}

Response (201):
{
  "id": "uuid",
  "leadId": "uuid",
  "title": "Follow up with John",
  "description": "Send project proposal",
  "dueDate": "2025-10-16T10:00:00.000Z",
  "type": "follow-up",
  "completed": false,
  "createdAt": "2025-10-14T08:23:57.241Z"
}
```

#### 2. List Reminders
```http
GET /api/reminders?leadId=uuid

Response (200):
[
  {
    "id": "uuid",
    "leadId": "uuid",
    ...
  }
]
```

#### 3. Update Reminder
```http
PATCH /api/reminders/{reminderId}
Content-Type: application/json

{
  "completed": true
}

Response (200):
{
  "id": "uuid",
  "completed": true,
  ...
}
```

#### 4. Delete Reminder
```http
DELETE /api/reminders/{reminderId}

Response (200):
{
  "message": "Reminder deleted"
}
```

#### 5. Send Reminder Notification
```http
POST /api/reminders/{reminderId}/send
Content-Type: application/json

{
  "channel": "email"  // or "whatsapp" or "both"
}

Response (200):
{
  "message": "Reminder sent",
  "results": {
    "email": {
      "success": false,
      "message": "Email not configured"
    }
  }
}
```

---

### Payments Endpoints

#### 1. Record Payment
```http
POST /api/payments
Content-Type: application/json

{
  "leadId": "uuid",
  "amount": 5000.00,
  "mode": "Bank Transfer",
  "status": "Completed",
  "date": "2025-10-14",
  "notes": "Initial payment"
}

Response (201):
{
  "id": "uuid",
  "leadId": "uuid",
  "amount": 5000.00,
  "mode": "Bank Transfer",
  "status": "Completed",
  "date": "2025-10-14T00:00:00.000Z",
  "notes": "Initial payment",
  "createdAt": "2025-10-14T08:23:57.241Z"
}
```

#### 2. List Payments
```http
GET /api/payments?leadId=uuid

Response (200):
[
  {
    "id": "uuid",
    "leadId": "uuid",
    "amount": 5000.00,
    ...
  }
]
```

---

### Admin Endpoints

#### 1. Add API Key
```http
POST /api/admin/api-keys
Content-Type: application/json

{
  "name": "Production OpenAI",
  "apiKey": "sk-test123456789",
  "provider": "openai",
  "baseUrl": ""
}

Response (201):
{
  "id": "uuid",
  "name": "Production OpenAI",
  "apiKey": "***6789",  // Masked
  "provider": "openai",
  "baseUrl": "",
  "createdAt": "2025-10-14T08:23:57.241Z"
}
```

#### 2. List API Keys
```http
GET /api/admin/api-keys

Response (200):
[
  {
    "id": "uuid",
    "name": "Production OpenAI",
    "apiKey": "***6789",  // Masked
    "provider": "openai",
    "createdAt": "2025-10-14T08:23:57.241Z"
  }
]
```

#### 3. Delete API Key
```http
DELETE /api/admin/api-keys/{keyId}

Response (200):
{
  "message": "API key deleted"
}
```

---

### Analytics Endpoint

```http
GET /api/analytics

Response (200):
{
  "leadsThisWeek": 3,
  "totalLeads": 10,
  "leadsByStatus": {
    "New": 4,
    "In Progress": 3,
    "Done": 2,
    "Paid": 1
  },
  "totalRevenue": 15000.00,
  "conversionRate": 30.0,
  "pendingReminders": 5
}
```

**Calculations:**
- `leadsThisWeek`: Count of leads created in last 7 days
- `conversionRate`: (Done + Paid) / Total * 100
- `totalRevenue`: Sum of completed payments
- `pendingReminders`: Reminders not completed and dueDate <= now

---

## Frontend Architecture

### Component Structure
```
app/
├── page.js                          # Main SPA with all features
├── layout.js                        # Root layout with metadata
├── globals.css                      # Global styles + Tailwind
└── api/[[...path]]/route.js        # Catch-all API handler

components/
└── ui/                              # shadcn components
    ├── button.tsx
    ├── card.tsx
    ├── input.tsx
    ├── dialog.tsx
    ├── tabs.tsx
    └── ... (30+ components)
```

### State Management
**Current:** React useState/useEffect (component-level)

**Issues:**
- All state in one massive component
- No global state management
- Props drilling for nested components
- Re-fetching data on every tab change

**Enterprise Solution:**
```javascript
// Use Redux Toolkit or Zustand
store/
├── slices/
│   ├── leadsSlice.js
│   ├── remindersSlice.js
│   ├── paymentsSlice.js
│   ├── authSlice.js
│   └── uiSlice.js
└── index.js
```

### Current Page Structure
```javascript
App Component (1200+ lines)
├── State (10+ useState hooks)
├── Effects (4+ useEffect hooks)
├── Event Handlers (15+ functions)
└── JSX (5 tabs)
    ├── Dashboard Tab
    ├── Leads Tab
    ├── Capture Tab
    ├── Reminders Tab
    └── Settings Tab
```

**Problem:** Monolithic component, hard to maintain

**Enterprise Refactoring:**
```
pages/
├── dashboard/
│   ├── page.tsx
│   └── components/
│       ├── AnalyticsCards.tsx
│       ├── RecentLeads.tsx
│       └── QuickActions.tsx
├── leads/
│   ├── page.tsx
│   ├── [id]/page.tsx
│   └── components/
│       ├── LeadsList.tsx
│       ├── LeadDetail.tsx
│       ├── SearchFilters.tsx
│       └── NotesPanel.tsx
├── reminders/
│   ├── page.tsx
│   └── components/
│       ├── RemindersList.tsx
│       ├── CreateReminderModal.tsx
│       └── SendNotificationButton.tsx
└── settings/
    ├── page.tsx
    └── components/
        ├── ApiKeysManager.tsx
        ├── TeamSettings.tsx
        └── IntegrationSettings.tsx
```

---

## Enterprise Migration Roadmap

### Phase 1: Foundation (Weeks 1-4)
**Priority: Critical Infrastructure**

#### 1.1 Authentication & Authorization (Week 1-2)
```javascript
// Implementation Plan

// 1. Add NextAuth.js
npm install next-auth @auth/mongodb-adapter bcryptjs

// 2. Create auth configuration
app/api/auth/[...nextauth]/route.js

// 3. Add User Schema
{
  id: "uuid",
  email: "string",
  password: "hashed",
  name: "string",
  role: "enum",  // admin, manager, sales, viewer
  organizationId: "uuid",
  status: "enum",  // active, inactive, suspended
  createdAt: "date",
  lastLogin: "date"
}

// 4. Middleware for protected routes
middleware.js
```

**Features to Implement:**
- ✅ Email/password authentication
- ✅ Password reset flow
- ✅ Email verification
- ✅ Session management (JWT)
- ✅ "Remember me" functionality
- ✅ OAuth providers (Google, Microsoft)

**Files to Create:**
```
app/
├── api/
│   ├── auth/[...nextauth]/route.js
│   ├── users/route.js
│   └── verify-email/route.js
├── (auth)/
│   ├── login/page.tsx
│   ├── register/page.tsx
│   ├── forgot-password/page.tsx
│   └── reset-password/page.tsx
├── middleware.ts
└── lib/
    ├── auth.js
    └── password.js
```

#### 1.2 Multi-Tenancy (Week 2-3)
```javascript
// Organizations Schema
{
  id: "uuid",
  name: "string",
  slug: "string",  // unique, for subdomain
  plan: "enum",  // free, starter, professional, enterprise
  maxUsers: "number",
  maxLeads: "number",
  features: ["array"],  // enabled features
  billingEmail: "string",
  subscriptionStatus: "enum",
  subscriptionId: "string",  // Stripe subscription ID
  createdAt: "date",
  settings: {
    timezone: "string",
    currency: "string",
    dateFormat: "string"
  }
}

// Update all collections to include organizationId
leads: { organizationId: "uuid", ... }
reminders: { organizationId: "uuid", ... }
payments: { organizationId: "uuid", ... }
```

**Data Isolation Strategy:**
```javascript
// Middleware to extract organizationId from token
export async function getOrganizationId(request) {
  const session = await getServerSession()
  return session.user.organizationId
}

// All queries must filter by organizationId
const leads = await db.collection('leads')
  .find({ organizationId })
  .toArray()
```

**Indexes to Add:**
```javascript
db.leads.createIndex({ organizationId: 1, email: 1 }, { unique: true })
db.reminders.createIndex({ organizationId: 1, dueDate: 1 })
db.payments.createIndex({ organizationId: 1, status: 1 })
db.users.createIndex({ organizationId: 1, role: 1 })
```

#### 1.3 Role-Based Access Control (Week 3-4)
```javascript
// Permissions Matrix
const permissions = {
  admin: {
    leads: ['create', 'read', 'update', 'delete', 'export'],
    reminders: ['create', 'read', 'update', 'delete'],
    payments: ['create', 'read', 'update', 'delete'],
    analytics: ['read'],
    settings: ['read', 'update'],
    users: ['create', 'read', 'update', 'delete'],
    apiKeys: ['create', 'read', 'delete']
  },
  manager: {
    leads: ['create', 'read', 'update', 'export'],
    reminders: ['create', 'read', 'update', 'delete'],
    payments: ['read'],
    analytics: ['read'],
    settings: ['read']
  },
  sales: {
    leads: ['create', 'read', 'update'],
    reminders: ['create', 'read', 'update'],
    payments: ['read'],
    analytics: ['read']
  },
  viewer: {
    leads: ['read'],
    reminders: ['read'],
    payments: ['read'],
    analytics: ['read']
  }
}

// Implement permission checking
export function hasPermission(user, resource, action) {
  return permissions[user.role]?.[resource]?.includes(action)
}

// Use in API routes
if (!hasPermission(user, 'leads', 'delete')) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}
```

---

### Phase 2: Data & Performance (Weeks 5-8)

#### 2.1 Database Optimization (Week 5)

**Add MongoDB Indexes:**
```javascript
// Create index script
scripts/create-indexes.js

// Compound indexes for common queries
db.leads.createIndex({ organizationId: 1, status: 1, createdAt: -1 })
db.leads.createIndex({ organizationId: 1, email: 1 }, { unique: true })

// Full-text search
db.leads.createIndex({ 
  name: "text", 
  email: "text", 
  message: "text" 
}, {
  weights: { name: 3, email: 2, message: 1 }
})

// Analytics optimization
db.payments.createIndex({ 
  organizationId: 1, 
  status: 1, 
  date: -1 
})
```

**Connection Pooling:**
```javascript
// lib/mongodb.js
import { MongoClient } from 'mongodb'

let client
let clientPromise

if (!global._mongoClientPromise) {
  client = new MongoClient(process.env.MONGO_URL, {
    maxPoolSize: 10,
    minPoolSize: 5,
    maxIdleTimeMS: 30000,
    serverSelectionTimeoutMS: 5000
  })
  global._mongoClientPromise = client.connect()
}

clientPromise = global._mongoClientPromise
export default clientPromise
```

#### 2.2 Caching Layer (Week 6)

**Add Redis:**
```javascript
// Install Redis
npm install ioredis

// lib/redis.js
import Redis from 'ioredis'

export const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  password: process.env.REDIS_PASSWORD
})

// Cache analytics (expires after 5 minutes)
export async function getCachedAnalytics(organizationId) {
  const cacheKey = `analytics:${organizationId}`
  const cached = await redis.get(cacheKey)
  
  if (cached) {
    return JSON.parse(cached)
  }
  
  const analytics = await calculateAnalytics(organizationId)
  await redis.setex(cacheKey, 300, JSON.stringify(analytics))
  
  return analytics
}

// Invalidate cache on data changes
export async function invalidateAnalyticsCache(organizationId) {
  await redis.del(`analytics:${organizationId}`)
}
```

**What to Cache:**
- Analytics dashboard data (5 min TTL)
- User sessions (JWT blacklist)
- API rate limit counters
- Recently viewed leads
- Organization settings

#### 2.3 API Rate Limiting (Week 6)

```javascript
// middleware/rateLimit.js
import { redis } from '@/lib/redis'

export async function rateLimit(request, userId, limit = 100, window = 60) {
  const key = `rate_limit:${userId}`
  const requests = await redis.incr(key)
  
  if (requests === 1) {
    await redis.expire(key, window)
  }
  
  if (requests > limit) {
    return new Response('Rate limit exceeded', { status: 429 })
  }
  
  return null
}

// Apply to all API routes
export async function middleware(request) {
  const session = await getServerSession()
  
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const rateLimitResponse = await rateLimit(
      request, 
      session.user.id,
      100,  // 100 requests
      60    // per minute
    )
    
    if (rateLimitResponse) return rateLimitResponse
  }
  
  return NextResponse.next()
}
```

#### 2.4 Audit Logging (Week 7)

```javascript
// audit_logs collection
{
  id: "uuid",
  organizationId: "uuid",
  userId: "uuid",
  action: "enum",  // CREATE, UPDATE, DELETE, VIEW, EXPORT
  resource: "string",  // leads, payments, settings
  resourceId: "uuid",
  changes: {
    before: {},
    after: {}
  },
  ipAddress: "string",
  userAgent: "string",
  timestamp: "date"
}

// lib/audit.js
export async function logAudit({
  organizationId,
  userId,
  action,
  resource,
  resourceId,
  changes,
  request
}) {
  await db.collection('audit_logs').insertOne({
    id: uuidv4(),
    organizationId,
    userId,
    action,
    resource,
    resourceId,
    changes,
    ipAddress: request.headers.get('x-forwarded-for'),
    userAgent: request.headers.get('user-agent'),
    timestamp: new Date()
  })
}

// Use in API routes
await logAudit({
  organizationId: user.organizationId,
  userId: user.id,
  action: 'DELETE',
  resource: 'leads',
  resourceId: leadId,
  changes: { before: lead, after: null },
  request
})
```

#### 2.5 Backup Strategy (Week 8)

```bash
# Daily MongoDB backup
#!/bin/bash
# scripts/backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/mongodb"

mongodump \
  --uri="$MONGO_URL" \
  --out="$BACKUP_DIR/backup_$DATE" \
  --gzip

# Keep last 30 days
find $BACKUP_DIR -type d -mtime +30 -exec rm -rf {} \;

# Upload to S3
aws s3 sync $BACKUP_DIR s3://solocrm-backups/mongodb/
```

**Automated Restore Testing:**
```bash
# scripts/test-restore.sh
mongorestore \
  --uri="$MONGO_TEST_URL" \
  --gzip \
  --archive=/backups/mongodb/latest/backup.gz
```

---

### Phase 3: Communication & Integrations (Weeks 9-12)

#### 3.1 Email Integration (Week 9)

**Option 1: Resend (Recommended)**
```javascript
// lib/email.js
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendEmail({ to, subject, html }) {
  try {
    const data = await resend.emails.send({
      from: 'SoloCRM <notifications@solocrm.com>',
      to,
      subject,
      html
    })
    
    return { success: true, messageId: data.id }
  } catch (error) {
    console.error('Email error:', error)
    return { success: false, error: error.message }
  }
}

// Email templates
export async function sendReminderEmail(lead, reminder) {
  const html = `
    <h2>Reminder: ${reminder.title}</h2>
    <p>Hi ${lead.name},</p>
    <p>${reminder.description}</p>
    <p>Due: ${new Date(reminder.dueDate).toLocaleString()}</p>
  `
  
  return sendEmail({
    to: lead.email,
    subject: `Reminder: ${reminder.title}`,
    html
  })
}
```

**Email Templates to Create:**
- Welcome email (new user registration)
- Email verification
- Password reset
- Reminder notifications
- Lead status updates
- Payment confirmations
- Weekly digest

#### 3.2 WhatsApp Integration (Week 9)

**Using Meta WhatsApp Cloud API:**
```javascript
// lib/whatsapp.js
export async function sendWhatsAppMessage(to, message) {
  const response = await fetch(
    `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_ID}/messages`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.WHATSAPP_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: to.replace(/[^0-9]/g, ''),  // Remove non-numeric
        type: 'text',
        text: { body: message }
      })
    }
  )
  
  const data = await response.json()
  
  if (response.ok) {
    return { success: true, messageId: data.messages[0].id }
  } else {
    return { success: false, error: data.error.message }
  }
}

// WhatsApp webhook for delivery status
// app/api/webhooks/whatsapp/route.js
export async function POST(request) {
  const body = await request.json()
  
  // Handle status updates
  if (body.entry?.[0]?.changes?.[0]?.value?.statuses) {
    const status = body.entry[0].changes[0].value.statuses[0]
    await updateMessageStatus(status.id, status.status)
  }
  
  return NextResponse.json({ success: true })
}
```

#### 3.3 Stripe Payment Integration (Week 10)

```javascript
// lib/stripe.js
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

// Create subscription for organization
export async function createSubscription(organization, priceId) {
  const customer = await stripe.customers.create({
    email: organization.billingEmail,
    name: organization.name,
    metadata: { organizationId: organization.id }
  })
  
  const subscription = await stripe.subscriptions.create({
    customer: customer.id,
    items: [{ price: priceId }],
    payment_behavior: 'default_incomplete',
    expand: ['latest_invoice.payment_intent']
  })
  
  return subscription
}

// Webhook handler
// app/api/webhooks/stripe/route.js
export async function POST(request) {
  const sig = request.headers.get('stripe-signature')
  const body = await request.text()
  
  const event = stripe.webhooks.constructEvent(
    body,
    sig,
    process.env.STRIPE_WEBHOOK_SECRET
  )
  
  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
      await updateSubscription(event.data.object)
      break
    case 'customer.subscription.deleted':
      await cancelSubscription(event.data.object)
      break
    case 'invoice.payment_succeeded':
      await recordPayment(event.data.object)
      break
  }
  
  return NextResponse.json({ received: true })
}
```

**Subscription Plans:**
```javascript
const plans = {
  free: {
    name: 'Free',
    maxUsers: 1,
    maxLeads: 100,
    features: ['basic_crm', 'analytics']
  },
  starter: {
    name: 'Starter',
    price: 29,
    maxUsers: 3,
    maxLeads: 1000,
    features: ['basic_crm', 'analytics', 'email_notifications', 'api_access']
  },
  professional: {
    name: 'Professional',
    price: 99,
    maxUsers: 10,
    maxLeads: 10000,
    features: ['basic_crm', 'analytics', 'email_notifications', 'whatsapp_notifications', 'api_access', 'ai_features', 'custom_fields']
  },
  enterprise: {
    name: 'Enterprise',
    price: 299,
    maxUsers: -1,  // Unlimited
    maxLeads: -1,  // Unlimited
    features: ['all_features', 'sso', 'dedicated_support', 'custom_integrations']
  }
}
```

#### 3.4 Calendar Integration (Week 11)

**Google Calendar:**
```javascript
// lib/google-calendar.js
import { google } from 'googleapis'

export async function createCalendarEvent(reminder, lead) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  )
  
  oauth2Client.setCredentials({
    refresh_token: user.googleRefreshToken
  })
  
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client })
  
  const event = {
    summary: reminder.title,
    description: `${reminder.description}\n\nLead: ${lead.name} (${lead.email})`,
    start: {
      dateTime: reminder.dueDate,
      timeZone: 'UTC'
    },
    end: {
      dateTime: new Date(reminder.dueDate.getTime() + 60 * 60 * 1000).toISOString(),
      timeZone: 'UTC'
    }
  }
  
  const response = await calendar.events.insert({
    calendarId: 'primary',
    resource: event
  })
  
  return response.data
}
```

#### 3.5 Webhook System (Week 12)

```javascript
// webhooks collection
{
  id: "uuid",
  organizationId: "uuid",
  name: "string",
  url: "string",
  events: ["array"],  // lead.created, lead.updated, reminder.due
  secret: "string",  // For signature verification
  active: "boolean",
  createdAt: "date"
}

// lib/webhooks.js
export async function triggerWebhook(organizationId, event, data) {
  const webhooks = await db.collection('webhooks')
    .find({ 
      organizationId, 
      events: event,
      active: true
    })
    .toArray()
  
  for (const webhook of webhooks) {
    const payload = {
      event,
      data,
      timestamp: new Date().toISOString()
    }
    
    const signature = createHmac('sha256', webhook.secret)
      .update(JSON.stringify(payload))
      .digest('hex')
    
    try {
      await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature
        },
        body: JSON.stringify(payload)
      })
    } catch (error) {
      console.error(`Webhook failed for ${webhook.name}:`, error)
    }
  }
}

// Use after lead creation
await triggerWebhook(organizationId, 'lead.created', lead)
```

---

### Phase 4: AI Features (Weeks 13-16)

#### 4.1 AI Lead Scoring (Week 13)

```javascript
// lib/ai/lead-scoring.js
import OpenAI from 'openai'

export async function scoreLeadWithAI(lead, organization) {
  const apiKey = await getActiveApiKey(organization.id, 'openai')
  const openai = new OpenAI({ apiKey })
  
  const prompt = `
Analyze this lead and provide a score from 0-100 based on potential value:

Lead Information:
- Name: ${lead.name}
- Service: ${lead.serviceType}
- Budget: ${lead.budget}
- Message: ${lead.message}

Industry Context:
- Organization: ${organization.name}
- Target Market: ${organization.settings.targetMarket}

Provide response in JSON format:
{
  "score": number (0-100),
  "confidence": "high" | "medium" | "low",
  "reasoning": "explanation",
  "recommended_actions": ["action1", "action2"],
  "estimated_value": number
}
`
  
  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' }
  })
  
  return JSON.parse(response.choices[0].message.content)
}

// Add to leads collection
{
  ...lead,
  aiScore: {
    score: 85,
    confidence: "high",
    reasoning: "High budget and clear requirements",
    recommendedActions: ["Schedule demo", "Send pricing"],
    estimatedValue: 15000,
    scoredAt: "date"
  }
}
```

#### 4.2 AI Follow-up Message Generator (Week 14)

```javascript
// lib/ai/message-generator.js
export async function generateFollowUpMessage(lead, context) {
  const apiKey = await getActiveApiKey(lead.organizationId, 'openai')
  const openai = new OpenAI({ apiKey })
  
  const prompt = `
Generate a professional follow-up email for this lead:

Lead Info:
- Name: ${lead.name}
- Service Interest: ${lead.serviceType}
- Budget: ${lead.budget}
- Initial Message: ${lead.message}
- Status: ${lead.status}

Previous Interactions:
${lead.notes.map(n => `- ${n.note}`).join('\n')}

Context: ${context}

Generate a personalized, professional follow-up email that:
1. References their specific needs
2. Provides value
3. Has a clear call-to-action
4. Is concise and friendly

Format: Plain text email
`
  
  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7
  })
  
  return response.choices[0].message.content
}
```

#### 4.3 Smart Reminders (Week 15)

```javascript
// AI suggests when to follow up
export async function suggestFollowUpTime(lead) {
  const apiKey = await getActiveApiKey(lead.organizationId, 'openai')
  const openai = new OpenAI({ apiKey })
  
  const prompt = `
Based on this lead's information and status, suggest the optimal follow-up time:

Lead:
- Status: ${lead.status}
- Created: ${lead.createdAt}
- Last Updated: ${lead.updatedAt}
- Service: ${lead.serviceType}
- Budget: ${lead.budget}

Notes:
${lead.notes.slice(-3).map(n => `- ${n.note} (${n.createdAt})`).join('\n')}

Provide JSON response:
{
  "suggested_time": "ISO date string",
  "reasoning": "why this timing",
  "urgency": "low" | "medium" | "high"
}
`
  
  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' }
  })
  
  return JSON.parse(response.choices[0].message.content)
}
```

#### 4.4 Sentiment Analysis (Week 16)

```javascript
// Analyze lead messages for sentiment
export async function analyzeSentiment(message) {
  const apiKey = await getActiveApiKey(organizationId, 'openai')
  const openai = new OpenAI({ apiKey })
  
  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [{
      role: 'user',
      content: `Analyze the sentiment of this message and categorize urgency:
      
Message: "${message}"

Respond in JSON:
{
  "sentiment": "positive" | "neutral" | "negative",
  "urgency": "low" | "medium" | "high",
  "key_concerns": ["concern1", "concern2"],
  "suggested_response_tone": "description"
}
`
    }],
    response_format: { type: 'json_object' }
  })
  
  return JSON.parse(response.choices[0].message.content)
}
```

---

### Phase 5: Advanced Features (Weeks 17-20)

#### 5.1 File Upload System (Week 17)

**Using AWS S3 or Cloudflare R2:**
```javascript
// lib/storage.js
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
})

// Generate presigned upload URL (client uploads directly to S3)
export async function getUploadUrl(organizationId, fileName, fileType) {
  const key = `${organizationId}/attachments/${uuidv4()}-${fileName}`
  
  const command = new PutObjectCommand({
    Bucket: process.env.S3_BUCKET,
    Key: key,
    ContentType: fileType
  })
  
  const url = await getSignedUrl(s3, command, { expiresIn: 3600 })
  
  return { url, key }
}

// attachments collection
{
  id: "uuid",
  organizationId: "uuid",
  leadId: "uuid",
  fileName: "string",
  fileType: "string",
  fileSize: "number",
  s3Key: "string",
  uploadedBy: "uuid",
  createdAt: "date"
}
```

**API Endpoint:**
```javascript
// POST /api/attachments/upload-url
export async function POST(request) {
  const { fileName, fileType, leadId } = await request.json()
  
  const { url, key } = await getUploadUrl(
    user.organizationId,
    fileName,
    fileType
  )
  
  // Create attachment record
  const attachment = {
    id: uuidv4(),
    organizationId: user.organizationId,
    leadId,
    fileName,
    fileType,
    s3Key: key,
    uploadedBy: user.id,
    createdAt: new Date()
  }
  
  await db.collection('attachments').insertOne(attachment)
  
  return NextResponse.json({ uploadUrl: url, attachmentId: attachment.id })
}
```

#### 5.2 Real-Time Notifications (Week 18)

**Using Server-Sent Events (SSE):**
```javascript
// app/api/notifications/stream/route.js
export async function GET(request) {
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      const organizationId = user.organizationId
      
      // Subscribe to Redis pub/sub
      const subscriber = redis.duplicate()
      await subscriber.subscribe(`notifications:${organizationId}`)
      
      subscriber.on('message', (channel, message) => {
        controller.enqueue(
          encoder.encode(`data: ${message}\n\n`)
        )
      })
      
      // Keep alive ping every 30 seconds
      const interval = setInterval(() => {
        controller.enqueue(encoder.encode(': ping\n\n'))
      }, 30000)
      
      request.signal.addEventListener('abort', () => {
        clearInterval(interval)
        subscriber.unsubscribe()
        subscriber.quit()
        controller.close()
      })
    }
  })
  
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  })
}

// Publish notification
export async function publishNotification(organizationId, notification) {
  await redis.publish(
    `notifications:${organizationId}`,
    JSON.stringify(notification)
  )
}
```

**Frontend:**
```javascript
// hooks/useNotifications.js
export function useNotifications() {
  useEffect(() => {
    const eventSource = new EventSource('/api/notifications/stream')
    
    eventSource.onmessage = (event) => {
      const notification = JSON.parse(event.data)
      toast.info(notification.message)
    }
    
    return () => eventSource.close()
  }, [])
}
```

#### 5.3 Advanced Analytics (Week 19)

**ClickHouse for Analytics (Optional - High Scale):**
```javascript
// analytics_events table (ClickHouse)
CREATE TABLE analytics_events (
  event_id UUID,
  organization_id UUID,
  user_id UUID,
  event_type String,
  event_timestamp DateTime,
  lead_id Nullable(UUID),
  properties String  -- JSON
) ENGINE = MergeTree()
ORDER BY (organization_id, event_timestamp)

// Track events
export async function trackEvent(event) {
  await clickhouse.insert({
    table: 'analytics_events',
    values: [{
      event_id: uuidv4(),
      organization_id: event.organizationId,
      user_id: event.userId,
      event_type: event.type,
      event_timestamp: new Date(),
      lead_id: event.leadId,
      properties: JSON.stringify(event.properties)
    }]
  })
}

// Complex analytics queries
export async function getConversionFunnel(organizationId, dateRange) {
  const query = `
    SELECT
      event_type,
      COUNT(DISTINCT lead_id) as unique_leads,
      COUNT(*) as total_events
    FROM analytics_events
    WHERE organization_id = '${organizationId}'
      AND event_timestamp >= '${dateRange.start}'
      AND event_timestamp <= '${dateRange.end}'
      AND event_type IN ('lead_created', 'lead_contacted', 'lead_qualified', 'lead_converted')
    GROUP BY event_type
    ORDER BY total_events DESC
  `
  
  return await clickhouse.query(query).toPromise()
}
```

**New Analytics Features:**
- Sales funnel visualization
- Lead source tracking
- Conversion rate by channel
- Team performance metrics
- Revenue forecasting
- Cohort analysis
- Custom reports

#### 5.4 Import/Export (Week 20)

**CSV Import:**
```javascript
// app/api/leads/import/route.js
import Papa from 'papaparse'

export async function POST(request) {
  const formData = await request.formData()
  const file = formData.get('file')
  const text = await file.text()
  
  const results = Papa.parse(text, {
    header: true,
    skipEmptyLines: true
  })
  
  const imported = []
  const errors = []
  
  for (const row of results.data) {
    try {
      // Validate row
      if (!row.name || !row.email) {
        errors.push({ row, error: 'Missing required fields' })
        continue
      }
      
      // Check for duplicates
      const existing = await db.collection('leads').findOne({
        organizationId: user.organizationId,
        email: row.email
      })
      
      if (existing) {
        errors.push({ row, error: 'Duplicate email' })
        continue
      }
      
      // Create lead
      const lead = {
        id: uuidv4(),
        organizationId: user.organizationId,
        name: row.name,
        email: row.email,
        phone: row.phone || '',
        serviceType: row.serviceType || '',
        budget: row.budget || '',
        message: row.message || '',
        status: 'New',
        notes: [],
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      await db.collection('leads').insertOne(lead)
      imported.push(lead)
      
    } catch (error) {
      errors.push({ row, error: error.message })
    }
  }
  
  return NextResponse.json({
    imported: imported.length,
    errors: errors.length,
    details: { imported, errors }
  })
}
```

**Export to CSV/Excel:**
```javascript
// app/api/leads/export/route.js
import ExcelJS from 'exceljs'

export async function GET(request) {
  const leads = await db.collection('leads')
    .find({ organizationId: user.organizationId })
    .toArray()
  
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('Leads')
  
  worksheet.columns = [
    { header: 'Name', key: 'name', width: 25 },
    { header: 'Email', key: 'email', width: 30 },
    { header: 'Phone', key: 'phone', width: 20 },
    { header: 'Service', key: 'serviceType', width: 20 },
    { header: 'Budget', key: 'budget', width: 15 },
    { header: 'Status', key: 'status', width: 15 },
    { header: 'Created', key: 'createdAt', width: 20 }
  ]
  
  leads.forEach(lead => {
    worksheet.addRow({
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      serviceType: lead.serviceType,
      budget: lead.budget,
      status: lead.status,
      createdAt: lead.createdAt.toISOString()
    })
  })
  
  const buffer = await workbook.xlsx.writeBuffer()
  
  return new Response(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename=leads.xlsx'
    }
  })
}
```

---

### Phase 6: Team Collaboration (Weeks 21-24)

#### 6.1 Team Management (Week 21)

**User Invitation System:**
```javascript
// invitations collection
{
  id: "uuid",
  organizationId: "uuid",
  email: "string",
  role: "enum",
  invitedBy: "uuid",
  token: "string",
  status: "enum",  // pending, accepted, expired
  expiresAt: "date",
  createdAt: "date"
}

// POST /api/team/invite
export async function POST(request) {
  const { email, role } = await request.json()
  
  const invitation = {
    id: uuidv4(),
    organizationId: user.organizationId,
    email,
    role,
    invitedBy: user.id,
    token: crypto.randomBytes(32).toString('hex'),
    status: 'pending',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),  // 7 days
    createdAt: new Date()
  }
  
  await db.collection('invitations').insertOne(invitation)
  
  // Send invitation email
  await sendEmail({
    to: email,
    subject: `Join ${organization.name} on SoloCRM`,
    html: `
      <p>You've been invited to join ${organization.name} as a ${role}.</p>
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/accept-invitation?token=${invitation.token}">
        Accept Invitation
      </a>
    `
  })
  
  return NextResponse.json(invitation)
}
```

#### 6.2 Lead Assignment (Week 22)

```javascript
// Add to leads collection
{
  ...lead,
  assignedTo: "uuid",  // User ID
  assignedAt: "date",
  assignedBy: "uuid"
}

// POST /api/leads/{leadId}/assign
export async function POST(request, { params }) {
  const { userId } = await request.json()
  
  await db.collection('leads').updateOne(
    { id: params.leadId, organizationId: user.organizationId },
    {
      $set: {
        assignedTo: userId,
        assignedAt: new Date(),
        assignedBy: user.id
      }
    }
  )
  
  // Notify assigned user
  await publishNotification(user.organizationId, {
    type: 'lead_assigned',
    userId: userId,
    message: `You've been assigned a new lead: ${lead.name}`,
    leadId: params.leadId
  })
  
  return NextResponse.json({ success: true })
}

// Lead routing rules
export async function autoAssignLead(lead, organization) {
  const rules = await db.collection('routing_rules')
    .find({ organizationId: organization.id, active: true })
    .sort({ priority: 1 })
    .toArray()
  
  for (const rule of rules) {
    if (matchesRule(lead, rule)) {
      return assignLead(lead.id, rule.assignTo)
    }
  }
  
  // Round-robin assignment
  return roundRobinAssign(lead, organization)
}
```

#### 6.3 Activity Feed (Week 23)

```javascript
// activities collection
{
  id: "uuid",
  organizationId: "uuid",
  userId: "uuid",
  type: "enum",  // created, updated, assigned, noted, etc.
  resource: "string",  // leads, reminders, payments
  resourceId: "uuid",
  description: "string",
  metadata: {},
  createdAt: "date"
}

// Track activity
export async function trackActivity(activity) {
  await db.collection('activities').insertOne({
    id: uuidv4(),
    ...activity,
    createdAt: new Date()
  })
  
  // Publish to real-time stream
  await publishNotification(activity.organizationId, {
    type: 'activity',
    activity
  })
}

// GET /api/activities
export async function GET(request) {
  const url = new URL(request.url)
  const leadId = url.searchParams.get('leadId')
  
  const query = {
    organizationId: user.organizationId
  }
  
  if (leadId) {
    query.resourceId = leadId
  }
  
  const activities = await db.collection('activities')
    .find(query)
    .sort({ createdAt: -1 })
    .limit(50)
    .toArray()
  
  return NextResponse.json(activities)
}
```

#### 6.4 Internal Chat/Comments (Week 24)

```javascript
// comments collection
{
  id: "uuid",
  organizationId: "uuid",
  leadId: "uuid",
  userId: "uuid",
  content: "string",
  mentions: ["uuid"],  // Mentioned user IDs
  isInternal: "boolean",  // Private team comment vs. customer-facing note
  createdAt: "date",
  updatedAt: "date"
}

// POST /api/leads/{leadId}/comments
export async function POST(request, { params }) {
  const { content, isInternal, mentions } = await request.json()
  
  const comment = {
    id: uuidv4(),
    organizationId: user.organizationId,
    leadId: params.leadId,
    userId: user.id,
    content,
    mentions: mentions || [],
    isInternal: isInternal !== false,
    createdAt: new Date(),
    updatedAt: new Date()
  }
  
  await db.collection('comments').insertOne(comment)
  
  // Notify mentioned users
  for (const mentionedUserId of comment.mentions) {
    await publishNotification(user.organizationId, {
      type: 'mentioned',
      userId: mentionedUserId,
      message: `${user.name} mentioned you in a comment`,
      leadId: params.leadId,
      commentId: comment.id
    })
  }
  
  return NextResponse.json(comment)
}
```

---

### Phase 7: Mobile & PWA (Weeks 25-28)

#### 7.1 Progressive Web App (Week 25-26)

**Add PWA Support:**
```javascript
// next.config.js
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development'
})

module.exports = withPWA({
  // ... other config
})

// public/manifest.json
{
  "name": "SoloCRM",
  "short_name": "SoloCRM",
  "description": "CRM for Solopreneurs",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#3b82f6",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

**Offline Support:**
```javascript
// Service worker caching strategy
self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('/api/')) {
    // Network-first for API
    event.respondWith(
      fetch(event.request)
        .catch(() => caches.match(event.request))
    )
  } else {
    // Cache-first for static assets
    event.respondWith(
      caches.match(event.request)
        .then(response => response || fetch(event.request))
    )
  }
})
```

#### 7.2 Mobile App (React Native) (Week 27-28)

**Create React Native App:**
```bash
npx create-expo-app solocrm-mobile
cd solocrm-mobile
npm install @react-navigation/native @react-navigation/stack
npm install axios react-native-async-storage
```

**Basic Structure:**
```javascript
// src/screens/DashboardScreen.js
export default function DashboardScreen() {
  const [analytics, setAnalytics] = useState(null)
  
  useEffect(() => {
    fetchAnalytics()
  }, [])
  
  return (
    <View style={styles.container}>
      <AnalyticsCards data={analytics} />
      <RecentLeadsList />
    </View>
  )
}

// src/api/client.js
import axios from 'axios'
import AsyncStorage from '@react-native-async-storage/async-storage'

const api = axios.create({
  baseURL: 'https://solocrm.preview.emergentagent.com/api'
})

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default api
```

**Push Notifications:**
```javascript
// Using Expo Notifications
import * as Notifications from 'expo-notifications'

export async function registerForPushNotifications() {
  const { status } = await Notifications.requestPermissionsAsync()
  
  if (status === 'granted') {
    const token = await Notifications.getExpoPushTokenAsync()
    
    // Send token to backend
    await api.post('/users/push-token', { token: token.data })
  }
}
```

---

## Security & Compliance

### Security Checklist

#### 1. Authentication & Authorization
- [ ] Implement JWT with short expiry (15 min access, 7 day refresh)
- [ ] Store refresh tokens securely (httpOnly cookies)
- [ ] Implement password hashing (bcrypt, 10+ rounds)
- [ ] Add 2FA support (TOTP via authenticator apps)
- [ ] Implement password policies (min 8 chars, complexity)
- [ ] Add account lockout after failed attempts
- [ ] Implement session management
- [ ] Add "remember me" securely

#### 2. Data Protection
- [ ] Encrypt sensitive data at rest (API keys, passwords)
- [ ] Use TLS 1.3 for all connections
- [ ] Implement field-level encryption for PII
- [ ] Add data anonymization for analytics
- [ ] Implement secure file upload validation
- [ ] Add virus scanning for uploaded files
- [ ] Implement GDPR data export
- [ ] Add right to be forgotten (data deletion)

#### 3. API Security
- [ ] Implement rate limiting (100 req/min per user)
- [ ] Add API key authentication for external access
- [ ] Implement CORS properly
- [ ] Add request size limits
- [ ] Implement SQL injection prevention
- [ ] Add XSS protection headers
- [ ] Implement CSRF tokens
- [ ] Add webhook signature verification

#### 4. Monitoring & Logging
- [ ] Log all authentication attempts
- [ ] Log all data access (audit trail)
- [ ] Monitor for suspicious activity
- [ ] Implement intrusion detection
- [ ] Add error tracking (Sentry)
- [ ] Monitor API usage patterns
- [ ] Set up alerting for anomalies
- [ ] Implement security incident response plan

#### 5. Compliance
- [ ] GDPR compliance (data privacy)
- [ ] CCPA compliance (California)
- [ ] SOC 2 preparation
- [ ] HIPAA (if handling health data)
- [ ] Terms of Service
- [ ] Privacy Policy
- [ ] Cookie Policy
- [ ] Data Processing Agreement (DPA)

### Implementation Example

**Encryption at Rest:**
```javascript
// lib/encryption.js
import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const KEY = Buffer.from(process.env.ENCRYPTION_KEY, 'hex')

export function encrypt(text) {
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv)
  
  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  
  const authTag = cipher.getAuthTag()
  
  return {
    encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex')
  }
}

export function decrypt({ encrypted, iv, authTag }) {
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    KEY,
    Buffer.from(iv, 'hex')
  )
  
  decipher.setAuthTag(Buffer.from(authTag, 'hex'))
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  
  return decrypted
}

// Use for API keys
const encryptedKey = encrypt(apiKey)
await db.collection('api_keys').insertOne({
  ...keyData,
  apiKey: encryptedKey
})
```

---

## Scalability Strategy

### Horizontal Scaling

#### 1. Application Servers
```yaml
# docker-compose.yml for multi-instance deployment
services:
  app1:
    image: solocrm:latest
    environment:
      - INSTANCE_ID=1
    ports:
      - "3001:3000"
  
  app2:
    image: solocrm:latest
    environment:
      - INSTANCE_ID=2
    ports:
      - "3002:3000"
  
  app3:
    image: solocrm:latest
    environment:
      - INSTANCE_ID=3
    ports:
      - "3003:3000"
  
  nginx:
    image: nginx:latest
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
    ports:
      - "80:80"
    depends_on:
      - app1
      - app2
      - app3
```

**Load Balancer Config:**
```nginx
# nginx.conf
upstream app_servers {
  least_conn;
  server app1:3000;
  server app2:3000;
  server app3:3000;
}

server {
  listen 80;
  
  location / {
    proxy_pass http://app_servers;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
  }
}
```

#### 2. Database Scaling

**MongoDB Replica Set:**
```javascript
// MongoDB connection with replica set
const client = new MongoClient(
  'mongodb://mongo1:27017,mongo2:27017,mongo3:27017/solocrm?replicaSet=rs0',
  {
    readPreference: 'secondaryPreferred',  // Read from secondaries
    maxPoolSize: 50,
    minPoolSize: 10
  }
)
```

**Read Replicas Strategy:**
- Primary: Write operations only
- Secondaries: Read operations (analytics, reports)
- Separate connection pools for read/write

**Sharding Strategy (for 1M+ leads):**
```javascript
// Shard key: organizationId
sh.shardCollection("solocrm.leads", { organizationId: 1, _id: 1 })

// This ensures all data for an organization stays together
// Enables efficient queries within an organization
```

#### 3. Caching Strategy

**Multi-Layer Caching:**
```
User Request
↓
1. Browser Cache (static assets)
↓
2. CDN (Cloudflare)
↓
3. Redis Cache (application data)
↓
4. MongoDB (database)
```

**Cache Implementation:**
```javascript
// lib/cache.js
export async function getCached(key, fetcher, ttl = 300) {
  // Try Redis first
  const cached = await redis.get(key)
  if (cached) {
    return JSON.parse(cached)
  }
  
  // Fetch and cache
  const data = await fetcher()
  await redis.setex(key, ttl, JSON.stringify(data))
  
  return data
}

// Usage
const analytics = await getCached(
  `analytics:${organizationId}`,
  () => calculateAnalytics(organizationId),
  300  // 5 minutes
)
```

### Performance Optimization

#### 1. Database Queries
```javascript
// Bad: N+1 query problem
const leads = await db.collection('leads').find({}).toArray()
for (const lead of leads) {
  lead.payments = await db.collection('payments').find({ leadId: lead.id }).toArray()
}

// Good: Use aggregation
const leads = await db.collection('leads').aggregate([
  {
    $lookup: {
      from: 'payments',
      localField: 'id',
      foreignField: 'leadId',
      as: 'payments'
    }
  }
]).toArray()
```

#### 2. API Response Time Targets
- GET endpoints: < 200ms
- POST/PATCH endpoints: < 500ms
- Complex analytics: < 2s
- Exports: Background job

#### 3. Frontend Optimization
```javascript
// Code splitting
const DashboardComponent = dynamic(() => import('@/components/Dashboard'), {
  loading: () => <Loading />
})

// Image optimization
import Image from 'next/image'
<Image src="/logo.png" width={200} height={50} alt="Logo" priority />

// API request batching
const { data } = useQueries([
  { queryKey: ['leads'], queryFn: fetchLeads },
  { queryKey: ['analytics'], queryFn: fetchAnalytics },
  { queryKey: ['reminders'], queryFn: fetchReminders }
])
```

---

## Deployment Strategy

### Infrastructure Options

#### Option 1: Vercel + MongoDB Atlas (Recommended for MVP)
```yaml
Cost: ~$50-100/month
- Vercel Pro: $20/mo
- MongoDB Atlas M10: $57/mo
- Upstash Redis: $10/mo

Pros:
- Zero DevOps
- Auto-scaling
- Global CDN
- Preview deployments

Setup:
1. Push to GitHub
2. Connect Vercel
3. Add environment variables
4. Done!
```

#### Option 2: AWS ECS + DocumentDB (Enterprise)
```yaml
Cost: ~$500-1000/month
- ECS Fargate: $200/mo
- DocumentDB: $400/mo
- ElastiCache: $100/mo
- S3 + CloudFront: $50/mo

Pros:
- Full control
- VPC isolation
- Compliance-ready
- Custom networking

Setup:
1. Create ECS cluster
2. Configure task definitions
3. Set up Application Load Balancer
4. Configure Auto Scaling
```

#### Option 3: Kubernetes (Large Scale)
```yaml
Cost: ~$2000-5000/month
- Managed K8s: $300/mo
- Worker nodes: $1500/mo
- Database: $800/mo
- Monitoring: $400/mo

Pros:
- Ultimate scalability
- Multi-cloud ready
- Advanced orchestration
- Zero-downtime deployments
```

### CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm test
      - run: npm run lint
  
  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: vercel/actions/cli@v2
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

---

## Monitoring & Observability

### Tools Stack

```javascript
// 1. Error Tracking - Sentry
import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0.1,
  environment: process.env.NODE_ENV
})

// 2. APM - Datadog or New Relic
import { datadogRum } from '@datadog/browser-rum'

datadogRum.init({
  applicationId: process.env.DD_APP_ID,
  clientToken: process.env.DD_CLIENT_TOKEN,
  site: 'datadoghq.com',
  service: 'solocrm',
  env: process.env.NODE_ENV,
  sessionSampleRate: 100,
  sessionReplaySampleRate: 20
})

// 3. Analytics - PostHog or Mixpanel
import posthog from 'posthog-js'

posthog.init(process.env.POSTHOG_KEY, {
  api_host: 'https://app.posthog.com'
})

// Track events
posthog.capture('lead_created', {
  organizationId: user.organizationId,
  leadSource: 'website'
})

// 4. Uptime Monitoring - Better Uptime
// Configure via dashboard: https://betteruptime.com

// 5. Log Management - LogDNA or Papertrail
import { createLogger, format, transports } from 'winston'

const logger = createLogger({
  format: format.json(),
  transports: [
    new transports.Http({
      host: process.env.LOGDNA_HOST,
      path: '/logs/ingest',
      auth: { bearer: process.env.LOGDNA_KEY }
    })
  ]
})
```

---

## Cost Estimation

### MVP (10-100 users)
```
Hosting: $50/mo
Database: $60/mo
Email: $20/mo
Monitoring: $30/mo
---
Total: ~$160/mo
```

### Growth (100-1000 users)
```
Hosting: $200/mo
Database: $200/mo
Cache (Redis): $100/mo
Email: $100/mo
SMS/WhatsApp: $200/mo
Monitoring: $100/mo
AI APIs: $300/mo
---
Total: ~$1,200/mo
```

### Enterprise (1000-10000 users)
```
Infrastructure: $2,000/mo
Database: $1,000/mo
Cache: $300/mo
CDN: $200/mo
Email/SMS: $1,000/mo
AI APIs: $1,500/mo
Monitoring: $500/mo
Support: $2,000/mo
---
Total: ~$8,500/mo
```

---

## Timeline Summary

**Total Estimated Time: 28 weeks (~7 months)**

| Phase | Duration | Focus |
|-------|----------|-------|
| Phase 1 | 4 weeks | Foundation (Auth, Multi-tenancy, RBAC) |
| Phase 2 | 4 weeks | Data & Performance |
| Phase 3 | 4 weeks | Communication & Integrations |
| Phase 4 | 4 weeks | AI Features |
| Phase 5 | 4 weeks | Advanced Features |
| Phase 6 | 4 weeks | Team Collaboration |
| Phase 7 | 4 weeks | Mobile & PWA |

---

## Next Steps

### Immediate Actions (Week 1)
1. Set up proper Git repository with branches
2. Implement authentication (NextAuth.js)
3. Add environment variable management
4. Set up error tracking (Sentry)
5. Create development/staging environments

### Quick Wins (Month 1)
1. Add email notifications
2. Implement basic analytics caching
3. Add export to CSV
4. Create API documentation
5. Set up automated backups

### Critical Path (Quarter 1)
1. Multi-tenancy implementation
2. Subscription/billing system
3. Team management
4. Mobile PWA
5. WhatsApp integration

---

## Conclusion

This documentation provides a complete roadmap to transform SoloCRM from an MVP to an enterprise-grade SaaS platform. The phased approach allows for:

- ✅ Incremental development
- ✅ Regular testing and validation
- ✅ Gradual scaling
- ✅ Revenue generation during development

**Key Success Factors:**
1. Start with authentication and multi-tenancy (critical for SaaS)
2. Focus on performance early (caching, indexes)
3. Build integrations that users need most (email, payments)
4. Add AI features for competitive advantage
5. Ensure security and compliance from day one

**Ready to start? Begin with Phase 1, Week 1!**
