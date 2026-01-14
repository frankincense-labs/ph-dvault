import { jsonResponse, handleCors } from '../_shared/response.ts'
import { supabaseAdmin, supabaseAnon } from '../_shared/supabase.ts'
import { decryptPassword, hashOtp } from '../_shared/crypto.ts'

Deno.serve(async (req) => {
  const cors = handleCors(req)
  if (cors) return cors

  try {
    const body = await req.json()
    const { email, token } = body || {}

    if (!email || !token) {
      return jsonResponse({ error: 'Email and token are required.' }, 400)
    }

    const { data: pending, error: pendingError } = await supabaseAdmin
      .from('pending_signups')
      .select('*')
      .eq('email', email)
      .single()

    if (pendingError || !pending) {
      return jsonResponse({ error: 'No pending signup found for this email.' }, 404)
    }

    if (new Date(pending.otp_expires_at).getTime() < Date.now()) {
      return jsonResponse({ error: 'Token has expired.' }, 400)
    }

    const tokenHash = await hashOtp(token)
    if (tokenHash !== pending.otp_hash) {
      return jsonResponse({ error: 'Token is invalid.' }, 400)
    }

    const encryptionKey = Deno.env.get('OTP_ENCRYPTION_KEY')
    if (!encryptionKey) {
      return jsonResponse({ error: 'Missing OTP_ENCRYPTION_KEY.' }, 500)
    }

    const password = await decryptPassword(
      pending.password_encrypted,
      pending.password_iv,
      encryptionKey,
    )

    const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: pending.email,
      password,
      email_confirmed: true,
      user_metadata: {
        full_name: pending.full_name,
        role: pending.role,
        phone: pending.phone,
        mdcn_number: pending.mdcn_number,
      },
    })

    if (createError || !created?.user) {
      return jsonResponse({ error: createError?.message || 'Failed to create user.' }, 400)
    }

    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: created.user.id,
        email: pending.email,
        role: pending.role,
        full_name: pending.full_name,
        phone: pending.phone,
        mdcn_number: pending.role === 'doctor' ? pending.mdcn_number : null,
        verification_status: pending.role === 'doctor' ? 'pending' : null,
      })

    if (profileError && !profileError.message.includes('duplicate key')) {
      return jsonResponse({ error: profileError.message }, 400)
    }

    await supabaseAdmin
      .from('pending_signups')
      .delete()
      .eq('email', email)

    const { data: sessionData, error: signInError } = await supabaseAnon.auth.signInWithPassword({
      email: pending.email,
      password,
    })

    if (signInError || !sessionData.session) {
      return jsonResponse({ error: signInError?.message || 'Failed to create session.' }, 400)
    }

    return jsonResponse({
      success: true,
      session: sessionData.session,
      user: sessionData.user,
    })
  } catch (error) {
    return jsonResponse({ error: error?.message || 'Unexpected error' }, 500)
  }
})
