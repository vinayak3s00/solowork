import nodemailer from 'nodemailer'

// Caches the SMTP transporter on globalThis so we don't rebuild a connection
// pool on every hot-reload / serverless invocation.
const globalForMail = globalThis

/**
 * Reads SMTP settings from the environment.
 * @returns {{ host: string, port: number, secure: boolean, user: string, pass: string, from: string } | null}
 *   Config object, or null when SMTP is not (fully) configured.
 */
export function getSmtpConfig() {
  const host = process.env.SMTP_HOST
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS
  if (!host || !user || !pass) return null

  const port = parseInt(process.env.SMTP_PORT ?? '587', 10) || 587
  return {
    host,
    port,
    // Port 465 uses implicit TLS; others use STARTTLS. Allow an explicit override.
    secure: process.env.SMTP_SECURE ? process.env.SMTP_SECURE === 'true' : port === 465,
    user,
    pass,
    from: process.env.SMTP_FROM || user,
  }
}

/** True when SMTP is configured. */
export function isEmailConfigured() {
  return getSmtpConfig() !== null
}

/**
 * Returns a cached nodemailer transporter, or null when SMTP is unconfigured.
 * A factory can be injected for testing.
 */
export function getTransporter(createTransport = nodemailer.createTransport) {
  const config = getSmtpConfig()
  if (!config) return null

  if (globalForMail.__soloworkMailTransporter) {
    return globalForMail.__soloworkMailTransporter
  }

  const transporter = createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: { user: config.user, pass: config.pass },
  })
  globalForMail.__soloworkMailTransporter = transporter
  return transporter
}

/** Clears the cached transporter (used by tests). */
export function resetTransporter() {
  globalForMail.__soloworkMailTransporter = undefined
}
