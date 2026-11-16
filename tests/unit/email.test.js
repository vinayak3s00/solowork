import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { getSmtpConfig, isEmailConfigured, getTransporter, resetTransporter } from '@/lib/server/mailer'
import { sendEmail } from '@/lib/server/notifications'

const SMTP_KEYS = ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS', 'SMTP_PORT', 'SMTP_SECURE', 'SMTP_FROM']

function clearSmtp() {
  for (const k of SMTP_KEYS) delete process.env[k]
  resetTransporter()
}

function configureSmtp(overrides = {}) {
  process.env.SMTP_HOST = 'smtp.example.com'
  process.env.SMTP_USER = 'user@example.com'
  process.env.SMTP_PASS = 'secret'
  Object.assign(process.env, overrides)
  resetTransporter()
}

beforeEach(clearSmtp)
afterEach(clearSmtp)

describe('getSmtpConfig', () => {
  it('returns null when not fully configured', () => {
    expect(getSmtpConfig()).toBeNull()
    expect(isEmailConfigured()).toBe(false)
    process.env.SMTP_HOST = 'smtp.example.com'
    expect(getSmtpConfig()).toBeNull() // still missing user/pass
  })

  it('parses config and defaults the port to 587 (STARTTLS)', () => {
    configureSmtp()
    const cfg = getSmtpConfig()
    expect(cfg).toMatchObject({ host: 'smtp.example.com', port: 587, secure: false })
    expect(cfg.from).toBe('user@example.com') // defaults to SMTP_USER
  })

  it('uses implicit TLS on port 465', () => {
    configureSmtp({ SMTP_PORT: '465' })
    expect(getSmtpConfig().secure).toBe(true)
  })

  it('honors an explicit SMTP_SECURE override and SMTP_FROM', () => {
    configureSmtp({ SMTP_PORT: '2525', SMTP_SECURE: 'true', SMTP_FROM: 'noreply@x.com' })
    const cfg = getSmtpConfig()
    expect(cfg.secure).toBe(true)
    expect(cfg.from).toBe('noreply@x.com')
  })
})

describe('getTransporter', () => {
  it('returns null when unconfigured', () => {
    expect(getTransporter()).toBeNull()
  })

  it('builds and caches a transporter when configured', () => {
    configureSmtp()
    const factory = vi.fn(() => ({ sendMail: vi.fn() }))
    const t1 = getTransporter(factory)
    const t2 = getTransporter(factory)
    expect(t1).toBe(t2) // cached
    expect(factory).toHaveBeenCalledTimes(1)
    expect(factory).toHaveBeenCalledWith(
      expect.objectContaining({ host: 'smtp.example.com', port: 587, secure: false })
    )
  })
})

describe('sendEmail', () => {
  it('gracefully skips when SMTP is not configured', async () => {
    const res = await sendEmail('a@b.com', 'Hi', 'body')
    expect(res.success).toBe(false)
    expect(res.message).toBe('Email not configured')
  })

  it('sends via the transporter and returns success', async () => {
    configureSmtp()
    const sendMail = vi.fn().mockResolvedValue({ messageId: 'abc' })
    const res = await sendEmail('a@b.com', 'Reminder', 'Follow up', { sendMail })
    expect(res).toEqual({ success: true, message: 'Email sent' })
    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'a@b.com',
        subject: 'Reminder',
        text: 'Follow up',
        from: 'user@example.com',
      })
    )
  })

  it('escapes HTML in the body', async () => {
    configureSmtp()
    const sendMail = vi.fn().mockResolvedValue({})
    await sendEmail('a@b.com', 'S', '<script>x</script>', { sendMail })
    const arg = sendMail.mock.calls[0][0]
    expect(arg.html).toContain('&lt;script&gt;')
    expect(arg.html).not.toContain('<script>')
  })

  it('returns a failure result (not a throw) when the transport errors', async () => {
    configureSmtp()
    const sendMail = vi.fn().mockRejectedValue(new Error('connection refused: secret detail'))
    const res = await sendEmail('a@b.com', 'S', 'body', { sendMail })
    expect(res.success).toBe(false)
    expect(res.message).toBe('Failed to send email')
    // No internal error detail leaks into the result.
    expect(JSON.stringify(res)).not.toContain('secret detail')
  })

  it('rejects a missing recipient when configured', async () => {
    configureSmtp()
    const sendMail = vi.fn()
    const res = await sendEmail('', 'S', 'body', { sendMail })
    expect(res.success).toBe(false)
    expect(sendMail).not.toHaveBeenCalled()
  })
})
