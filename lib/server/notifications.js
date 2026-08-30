// Optional notification channels with graceful fallback when unconfigured.

export async function sendEmail(to, subject, message) {
  try {
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.log('Email not configured - skipping:', { to, subject })
      return { success: false, message: 'Email not configured' }
    }
    // TODO: Implement SMTP email sending (e.g. nodemailer).
    console.log('Email would be sent:', { to, subject, message })
    return { success: true, message: 'Email sent (simulated)' }
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
