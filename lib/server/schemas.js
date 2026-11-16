import { z } from 'zod'

/** @type {[string, ...string[]]} */
const LEAD_STATUSES = ['New', 'In Progress', 'Done', 'Paid']
/** @type {[string, ...string[]]} */
const REMINDER_TYPES = ['follow-up', 'payment-due']
/** @type {[string, ...string[]]} */
const PAYMENT_MODES = ['Cash', 'Card', 'UPI', 'Bank Transfer']
/** @type {[string, ...string[]]} */
const PAYMENT_STATUSES = ['Pending', 'Completed', 'Failed']
/** @type {[string, ...string[]]} */
const API_PROVIDERS = ['openai', 'anthropic', 'gemini', 'other']

const trimmed = (max) => z.string().trim().max(max)

export const createLeadSchema = z.object({
  name: trimmed(120).min(1, 'Name is required'),
  email: z.string().trim().toLowerCase().email('A valid email is required').max(254),
  phone: trimmed(40).optional().default(''),
  message: trimmed(5000).optional().default(''),
  budget: trimmed(100).optional().default(''),
  serviceType: trimmed(120).optional().default(''),
})

export const updateLeadSchema = z
  .object({
    name: trimmed(120).min(1).optional(),
    email: z.string().trim().toLowerCase().email().max(254).optional(),
    phone: trimmed(40).optional(),
    message: trimmed(5000).optional(),
    budget: trimmed(100).optional(),
    serviceType: trimmed(120).optional(),
    status: z.enum(LEAD_STATUSES).optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: 'No fields to update' })

export const addNoteSchema = z.object({
  note: trimmed(2000).min(1, 'Note is required'),
})

export const createReminderSchema = z.object({
  leadId: trimmed(64).min(1, 'leadId is required'),
  title: trimmed(200).min(1, 'title is required'),
  description: trimmed(2000).optional().default(''),
  dueDate: z.coerce.date({ errorMap: () => ({ message: 'dueDate must be a valid date' }) }),
  type: z.enum(REMINDER_TYPES).optional().default('follow-up'),
})

export const updateReminderSchema = z
  .object({
    title: trimmed(200).min(1).optional(),
    description: trimmed(2000).optional(),
    dueDate: z.coerce.date().optional(),
    type: z.enum(REMINDER_TYPES).optional(),
    completed: z.boolean().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: 'No fields to update' })

export const sendReminderSchema = z.object({
  channel: z.enum(['email', 'whatsapp', 'both']),
})

export const createPaymentSchema = z.object({
  leadId: trimmed(64).min(1, 'leadId is required'),
  amount: z.coerce.number().positive('amount must be greater than 0').finite(),
  mode: z.enum(PAYMENT_MODES).optional().default('Cash'),
  status: z.enum(PAYMENT_STATUSES).optional().default('Pending'),
  date: z.coerce.date().optional(),
  notes: trimmed(2000).optional().default(''),
})

export const createApiKeySchema = z.object({
  name: trimmed(120).min(1, 'name is required'),
  apiKey: trimmed(500).min(1, 'apiKey is required'),
  provider: z.enum(API_PROVIDERS),
  baseUrl: z.union([z.string().trim().url(), z.literal('')]).optional().default(''),
})

export const registerSchema = z.object({
  name: trimmed(120).min(1, 'Name is required'),
  email: z.string().trim().toLowerCase().email('A valid email is required').max(254),
  password: z.string().min(8, 'Password must be at least 8 characters').max(200),
})

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('A valid email is required').max(254),
  password: z.string().min(1, 'Password is required').max(200),
})

export { LEAD_STATUSES, REMINDER_TYPES, PAYMENT_MODES, PAYMENT_STATUSES, API_PROVIDERS }
