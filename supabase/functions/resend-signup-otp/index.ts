import { jsonResponse, handleCors } from '../_shared/response.ts'
import { supabaseAdmin } from '../_shared/supabase.ts'
import { generateOtp, hashOtp } from '../_shared/crypto.ts'

const OTP_EXPIRY_MINUTES = 15

async function sendOtpEmail(email: string, otp: string) {
  const apiKey = Deno.env.get('RESEND_API_KEY')
  const fromEmail = Deno.env.get('RESEND_FROM_EMAIL')

  if (!apiKey || !fromEmail) {
    throw new Error('Missing RESEND_API_KEY or RESEND_FROM_EMAIL')
  }

  const subject = 'Your PH-DVault OTP Code'
  const html = `
    <h2>Your One-Time Password</h2>
    <p>Please use the following code to verify your email:</p>
    <h3>${otp}</h3>
    <p>This code will expire in ${OTP_EXPIRY_MINUTES} minutes.</p>
  `

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: fromEmail,
      to: email,
      subject,
      html,
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Failed to send OTP email: ${text}`)
  }
}

Deno.serve(async (req) => {
  const cors = handleCors(req)
  if (cors) return cors

  try {
    const body = await req.json()
    const { email } = body || {}

    if (!email) {
      return jsonResponse({ error: 'Email is required.' }, 400)
    }

    const { data: pending, error: pendingError } = await supabaseAdmin
      .from('pending_signups')
      .select('email')
      .eq('email', email)
      .single()

    if (pendingError || !pending) {
      return jsonResponse({ error: 'No pending signup found for this email.' }, 404)
    }

    const otp = generateOtp(8)
    const otpHash = await hashOtp(otp)
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000).toISOString()

    const { error: updateError } = await supabaseAdmin
      .from('pending_signups')
      .update({
        otp_hash: otpHash,
        otp_expires_at: expiresAt,
        updated_at: new Date().toISOString(),
      })
      .eq('email', email)

    if (updateError) {
      return jsonResponse({ error: updateError.message }, 400)
    }

    await sendOtpEmail(email, otp)

    return jsonResponse({ success: true, expires_at: expiresAt })
  } catch (error) {
    return jsonResponse({ error: error?.message || 'Unexpected error' }, 500)
  }
})
