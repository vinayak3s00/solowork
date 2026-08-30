// Optional notification channels with graceful fallback when unconfigured.
import { getTransporter, getSmtpConfig } from './mailer'

/** Escapes text for safe inclusion in an HTML email body. */
function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/**
 * Sends an email via SMTP (nodemailer). Returns a result object rather than
 * throwing, so callers can degrade gracefully.
 * @param {string} to
 * @param {string} subject
 * @param {string} message  Plain-text body.
 * @param {object} [transporter]  Injectable transporter (for tests).
 * @returns {Promise<{ success: boolean, message: string }>}
 */
export async function sendEmail(to, subject, message, transporter = getTransporter()) {
  try {
    const config = getSmtpConfig()
    if (!config || !transporter) {
      console.log('Email not configured - skipping:', { to, subject })
      return { success: false, message: 'Email not configured' }
    }
    if (!to) {
      return { success: false, message: 'No recipient email' }
    }

    await transporter.sendMail({
      from: config.from,
      to,
      subject,
      text: message,
      html: `<p>${escapeHtml(message)}</p>`,
    })
    return { success: true, message: 'Email sent' }
  } catch (error) {
    console.error('Email error:', error)
    return { success: false, message: 'Failed to send email' }
  }
}

export async function sendWhatsApp(to, message) {
  try {
    if (!process.env.WHATSAPP_API_KEY || !process.env.WHATSAPP_PHONE_ID) {
      console.log('WhatsApp not configured - skipping:', { to })
      return { success: false, message: 'WhatsApp not configured' }
    }
    // TODO: Implement WhatsApp Cloud API call.
    console.log('WhatsApp would be sent:', { to, message })
    return { success: true, message: 'WhatsApp sent (simulated)' }
  } catch (error) {
    console.error('WhatsApp error:', error)
    return { success: false, message: 'Failed to send WhatsApp' }
  }
}
