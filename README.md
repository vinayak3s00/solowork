# SoloCRM - Micro CRM for Solopreneurs

A complete CRM solution built for solo entrepreneurs and small businesses. Manage leads, track payments, set reminders, and grow your business.

## 🚀 Features

### Current (MVP - Production Ready)
- ✅ **Lead Management**: Full CRUD operations with search and filtering
- ✅ **Client Dashboard**: Track lead status (New → In Progress → Done → Paid)
- ✅ **Notes System**: Add unlimited notes to each lead
- ✅ **Reminders**: Create and manage follow-up reminders
- ✅ **Payment Tracking**: Record and track payments
- ✅ **Analytics Dashboard**: Real-time metrics and insights
- ✅ **Admin Settings**: Manage multiple AI API keys
- ✅ **Beautiful UI**: Modern, responsive design with shadcn/ui

### Communication (Optional)
- 📧 Email notifications (SMTP) - configure in .env
- 💬 WhatsApp notifications (Meta Cloud API) - configure in .env
- ⚠️ **App works without these integrations** (graceful fallback)

## 🛠️ Tech Stack

**Frontend:**
- Next.js 14 (App Router)
- React 18
- Tailwind CSS
- shadcn/ui components
- Sonner (notifications)

**Backend:**
- Next.js API Routes
- MongoDB (native driver)
- UUID for ID generation

## 📦 Installation

1. **Clone the repository:**
```bash
git clone <your-repo>
cd solocrm
```

2. **Install dependencies:**
```bash
yarn install
```

3. **Set up environment variables:** (copy `.env.example` to `.env`)
```bash
# Required
MONGO_URL=mongodb://localhost:27017
DB_NAME=solocrm
NEXT_PUBLIC_BASE_URL=http://localhost:3000
CORS_ORIGINS=*

# Required - used to encrypt AI API keys at rest (AES-256-GCM).
# Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
APP_ENCRYPTION_KEY=your_64_char_hex_key

# Optional - Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@email.com
SMTP_PASS=your_password

# Optional - WhatsApp (Meta Cloud API)
WHATSAPP_API_KEY=your_api_key
WHATSAPP_PHONE_ID=your_phone_id
```

4. **Run the development server:**
```bash
yarn dev
```

5. **Open [http://localhost:3000](http://localhost:3000)**

## 📖 API Documentation

See [DOCUMENTATION.md](./DOCUMENTATION.md) for complete API reference.

### Quick Reference

**Auth:**
- `POST /api/auth/register` - Create the owner account (only while no user exists)
- `POST /api/auth/login` - Sign in, sets a session cookie
- `POST /api/auth/logout` - Clear the session
- `GET /api/auth/me` - Current user, or `{ authenticated: false, needsSetup }`

**Leads:**
- `POST /api/leads` - Create lead
- `GET /api/leads?search=john&status=New` - List leads
- `GET /api/leads/:id` - Get lead
- `PATCH /api/leads/:id` - Update lead
- `DELETE /api/leads/:id` - Delete lead
- `POST /api/leads/:id/notes` - Add note

**Reminders:**
- `POST /api/reminders` - Create reminder
- `GET /api/reminders?leadId=:id` - List reminders
- `PATCH /api/reminders/:id` - Update reminder
- `POST /api/reminders/:id/send` - Send notification

**Payments:**
- `POST /api/payments` - Record payment
- `GET /api/payments?leadId=:id` - List payments

**Analytics:**
- `GET /api/analytics` - Get dashboard stats

**Admin:**
- `POST /api/admin/api-keys` - Add API key
- `GET /api/admin/api-keys` - List API keys
- `DELETE /api/admin/api-keys/:id` - Delete API key

## 📁 Project Structure

```
app/
├── api/[[...path]]/route.js    # API catch-all handler
├── page.js                      # Main SPA application
├── layout.js                    # Root layout
└── globals.css                  # Global styles

components/
└── ui/                          # shadcn/ui components

lib/
├── utils.js                     # UI class-name helper
└── server/                      # Backend modules (server-only)
    ├── mongo.js                 # Cached MongoDB connection
    ├── http.js                  # CORS, JSON + safe error responses
    ├── schemas.js               # zod validation schemas
    ├── crypto.js                # AES-256-GCM encrypt/decrypt/mask
    ├── rateLimit.js             # In-memory rate limiter
    ├── notifications.js         # Email/WhatsApp (graceful fallback)
    └── handlers/                # Per-resource route handlers
        ├── leads.js
        ├── reminders.js
        ├── payments.js
        ├── apiKeys.js
        └── analytics.js

DOCUMENTATION.md                 # Complete enterprise roadmap
README.md                        # This file
.env.example                     # Environment variable template
```

## 🎯 Usage

### 1. Lead Capture
- Share your URL with clients
- They fill the "Capture Lead" form
- Lead automatically appears in your dashboard

### 2. Lead Management
- View all leads in "Leads" tab
- Search by name or email
- Filter by status
- Update status as you progress
- Add notes for each interaction

### 3. Reminders
- Create follow-up reminders for any lead
- Set due dates and types
- Send email/WhatsApp notifications (if configured)
- Mark as complete when done

### 4. Payments
- Record payments for each lead
- Track payment modes (Cash, Card, UPI, Bank Transfer)
- View payment history
- Auto-calculate total revenue

### 5. Analytics
- View leads this week
- Track conversion rate
- Monitor total revenue
- See pending reminders

### 6. Settings
- Add multiple AI API keys (OpenAI, Anthropic, Gemini)
- Configure email/WhatsApp settings
- Manage communication preferences

## 🔐 Security Notes

**Current (MVP):**
- **Authentication** via session cookies (httpOnly, SameSite=Lax, Secure in prod); passwords hashed with scrypt
- **Per-owner data scoping** — every lead, reminder, payment, and API key is isolated by owner
- Public lead-capture endpoint stays open (rate-limited); everything else requires login
- **AI API keys encrypted at rest** (AES-256-GCM) and masked in responses
- **All API input validated** with zod (email format, amounts, dates, enums, lengths)
- **Rate limiting** on the public lead-capture endpoint (10 req/min per IP)
- Error responses never leak internal details or stack traces
- CORS configurable via `CORS_ORIGINS`

**For Production (See DOCUMENTATION.md):**
- Implement authentication (NextAuth.js)
- Add multi-tenancy
- Implement RBAC
- Add rate limiting
- Enable audit logging
- Encrypt sensitive data

## 🚀 Enterprise Roadmap

SoloCRM can be scaled to enterprise level. See [DOCUMENTATION.md](./DOCUMENTATION.md) for:

- 📅 **28-week roadmap** to enterprise features
- 🔒 Authentication & multi-tenancy
- 👥 Team collaboration
- 🤖 AI features (lead scoring, message generation)
- 📊 Advanced analytics
- 📱 Mobile app (PWA + React Native)
- 🔗 Third-party integrations
- 💳 Subscription billing
- 🛡️ Security & compliance (GDPR, SOC 2)
- 📈 Scalability strategy

## 📊 Test Results

**Backend API:** 19/19 tests passed ✅
- Lead CRUD operations
- Search and filtering (8 scenarios)
- Reminders with graceful fallback (11 scenarios)
- Payment tracking
- Analytics calculations
- Admin API key management

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📝 License

MIT License - feel free to use for personal or commercial projects.

## 🆘 Support

- 📖 [Full Documentation](./DOCUMENTATION.md)
- 🐛 Report Issues
- 💬 Community Discussions

## 🎉 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI components by [shadcn/ui](https://ui.shadcn.com/)
- Icons by [Lucide](https://lucide.dev/)

---

**Made with ❤️ for solopreneurs**
