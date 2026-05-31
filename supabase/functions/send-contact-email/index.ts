import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const OWNER_EMAIL = 'nanikiibunai@gmail.com'
const FROM_EMAIL = 'NaniKiBunai <onboarding@resend.dev>'
const RATE_LIMIT_MAX = 3
const RATE_LIMIT_WINDOW_HOURS = 1

interface ContactPayload {
  name: string
  email: string
  phone?: string
  subject?: string
  message: string
  _honey?: string // honeypot
}

interface ValidationError {
  field: string
  message: string
}

function validate(data: ContactPayload): ValidationError[] {
  const errors: ValidationError[] = []

  // Honeypot check — reject silently
  if (data._honey) return [{ field: '_honey', message: 'spam' }]

  // Name
  if (!data.name || !data.name.trim()) {
    errors.push({ field: 'name', message: 'Name is required' })
  } else if (data.name.trim().length > 100) {
    errors.push({ field: 'name', message: 'Name must be under 100 characters' })
  }

  // Email
  if (!data.email || !data.email.trim()) {
    errors.push({ field: 'email', message: 'Email is required' })
  } else if (data.email.length > 254) {
    errors.push({ field: 'email', message: 'Email is too long' })
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) {
    errors.push({ field: 'email', message: 'Email format is invalid' })
  }

  // Phone (optional)
  if (data.phone && data.phone.trim()) {
    const cleaned = data.phone.replace(/[\s\-\(\)]/g, '')
    if (cleaned.length > 0 && (cleaned.length < 7 || cleaned.length > 15)) {
      errors.push({ field: 'phone', message: 'Phone number is invalid' })
    }
    if (cleaned.length > 0 && !/^\+?\d{7,15}$/.test(cleaned)) {
      errors.push({ field: 'phone', message: 'Phone must contain only digits' })
    }
  }

  // Subject (optional)
  if (data.subject && data.subject.trim().length > 200) {
    errors.push({ field: 'subject', message: 'Subject must be under 200 characters' })
  }

  // Message
  if (!data.message || !data.message.trim()) {
    errors.push({ field: 'message', message: 'Message is required' })
  } else if (data.message.trim().length < 10) {
    errors.push({ field: 'message', message: 'Message must be at least 10 characters' })
  } else if (data.message.trim().length > 5000) {
    errors.push({ field: 'message', message: 'Message must be under 5000 characters' })
  }

  return errors
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function buildOwnerEmailHtml(data: ContactPayload): string {
  const name = escapeHtml(data.name.trim())
  const email = escapeHtml(data.email.trim())
  const phone = data.phone?.trim() ? escapeHtml(data.phone.trim()) : 'Not provided'
  const subject = data.subject?.trim() ? escapeHtml(data.subject.trim()) : 'No subject'
  const message = escapeHtml(data.message.trim()).replace(/\n/g, '<br>')

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#faf8f5;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
  <div style="max-width:560px;margin:32px auto;background:white;border-radius:12px;overflow:hidden;border:1px solid #e8e0d8;">
    <div style="background:#5c4033;padding:28px 32px;">
      <h1 style="margin:0;color:#f5efe8;font-size:20px;font-weight:600;">New Contact Message</h1>
      <p style="margin:6px 0 0;color:#c4896a;font-size:13px;">NaniKiBunai Website</p>
    </div>
    <div style="padding:28px 32px;">
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <tr>
          <td style="padding:10px 0;color:#8b7355;font-weight:600;width:90px;vertical-align:top;">Name</td>
          <td style="padding:10px 0;color:#3a2a1e;">${name}</td>
        </tr>
        <tr>
          <td style="padding:10px 0;color:#8b7355;font-weight:600;vertical-align:top;">Email</td>
          <td style="padding:10px 0;color:#3a2a1e;"><a href="mailto:${email}" style="color:#c4896a;">${email}</a></td>
        </tr>
        <tr>
          <td style="padding:10px 0;color:#8b7355;font-weight:600;vertical-align:top;">Phone</td>
          <td style="padding:10px 0;color:#3a2a1e;">${phone}</td>
        </tr>
        <tr>
          <td style="padding:10px 0;color:#8b7355;font-weight:600;vertical-align:top;">Subject</td>
          <td style="padding:10px 0;color:#3a2a1e;">${subject}</td>
        </tr>
        <tr>
          <td colspan="2" style="padding:16px 0 6px;color:#8b7355;font-weight:600;">Message</td>
        </tr>
        <tr>
          <td colspan="2" style="padding:8px 16px;background:#faf8f5;border-radius:8px;color:#3a2a1e;line-height:1.6;">
            ${message}
          </td>
        </tr>
      </table>
    </div>
    <div style="padding:16px 32px;border-top:1px dashed #e8e0d8;text-align:center;">
      <p style="margin:0;font-size:12px;color:#8b7355;">You can reply directly to this email to respond to ${name}</p>
    </div>
  </div>
</body>
</html>`
}

function buildAutoReplyHtml(name: string): string {
  const safeName = escapeHtml(name.trim())

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#faf8f5;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
  <div style="max-width:560px;margin:32px auto;background:white;border-radius:12px;overflow:hidden;border:1px solid #e8e0d8;">
    <div style="background:#5c4033;padding:28px 32px;text-align:center;">
      <h1 style="margin:0;color:#f5efe8;font-size:22px;font-weight:600;font-style:italic;">NaniKiBunai</h1>
    </div>
    <div style="padding:32px;">
      <p style="color:#3a2a1e;font-size:15px;line-height:1.7;margin:0 0 16px;">
        Dear ${safeName},
      </p>
      <p style="color:#3a2a1e;font-size:15px;line-height:1.7;margin:0 0 16px;">
        Thank you for reaching out to us! We've received your message and will get back to you within 24 hours.
      </p>
      <p style="color:#3a2a1e;font-size:15px;line-height:1.7;margin:0 0 16px;">
        Every stitch we make is crafted with love and care, and we treat every message with the same attention.
      </p>
      <div style="border-top:1.5px dashed #c4896a;margin:24px 0;opacity:0.3;"></div>
      <p style="color:#8b7355;font-size:14px;line-height:1.6;margin:0 0 4px;font-style:italic;">
        With warmth,
      </p>
      <p style="color:#3a2a1e;font-size:18px;margin:0;font-style:italic;">Nani</p>
      <p style="color:#8b7355;font-size:12px;margin:4px 0 0;">Founder & Master Artisan</p>
    </div>
    <div style="padding:16px 32px;background:#faf8f5;text-align:center;border-top:1px solid #e8e0d8;">
      <p style="margin:0;font-size:12px;color:#8b7355;">
        NaniKiBunai &middot; Handcrafted with love &middot; Gurgaon, Haryana
      </p>
    </div>
  </div>
</body>
</html>`
}

async function sendEmail(
  to: string,
  subject: string,
  html: string,
  replyTo?: string,
): Promise<boolean> {
  const payload: Record<string, unknown> = {
    from: FROM_EMAIL,
    to: [to],
    subject,
    html,
  }
  if (replyTo) payload.reply_to = replyTo

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify(payload),
  })

  return res.ok
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Only POST allowed
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }

  try {
    const body: ContactPayload = await req.json()

    // Validate
    const errors = validate(body)

    // Honeypot triggered — fake success
    if (errors.length === 1 && errors[0].field === '_honey') {
      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    if (errors.length > 0) {
      return new Response(
        JSON.stringify({ error: 'Validation failed', errors }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // Create Supabase client with service role (bypasses RLS for reads)
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Rate limiting — check recent submissions from this email
    const windowStart = new Date(
      Date.now() - RATE_LIMIT_WINDOW_HOURS * 60 * 60 * 1000,
    ).toISOString()

    const { count } = await supabase
      .from('reachout_submissions')
      .select('*', { count: 'exact', head: true })
      .eq('email', body.email.trim().toLowerCase())
      .gte('created_at', windowStart)

    if (count !== null && count >= RATE_LIMIT_MAX) {
      return new Response(
        JSON.stringify({
          error: 'rate_limit',
          message: 'Too many messages sent recently. Please try again later.',
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // Insert into database
    const { error: dbError } = await supabase.from('reachout_submissions').insert({
      name: body.name.trim(),
      email: body.email.trim().toLowerCase(),
      phone: body.phone?.trim() || null,
      subject: body.subject?.trim() || null,
      message: body.message.trim(),
    })

    if (dbError) {
      console.error('DB insert error:', dbError)
      return new Response(
        JSON.stringify({ error: 'server_error', message: 'Failed to save your message.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // Send notification email to owner
    const ownerSubject = body.subject?.trim()
      ? `New message: ${body.subject.trim()}`
      : `New contact message from ${body.name.trim()}`

    const ownerSent = await sendEmail(
      OWNER_EMAIL,
      ownerSubject,
      buildOwnerEmailHtml(body),
      body.email.trim(),
    )

    if (!ownerSent) {
      console.error('Failed to send owner notification email')
    }

    // Send auto-reply to sender
    const replySent = await sendEmail(
      body.email.trim(),
      'Thank you for contacting NaniKiBunai!',
      buildAutoReplyHtml(body.name),
    )

    if (!replySent) {
      console.error('Failed to send auto-reply email')
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    console.error('Unhandled error:', err)
    return new Response(
      JSON.stringify({ error: 'server_error', message: 'Something went wrong. Please try again.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})
