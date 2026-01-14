import { supabase } from '../supabase'
import type { UserRole, VerificationStatus } from '@/types/database'

export interface SignUpData {
  email: string
  password: string
  full_name: string
  role: UserRole
  phone?: string
  mdcn_number?: string // For doctors
}

export interface SignInData {
  email: string
  password: string
  rememberMe?: boolean
}

export interface AuthResponse {
  user: any
  session: any
  role: UserRole
  verification_status?: VerificationStatus
}

// Sign Up
export async function signUp(data: SignUpData): Promise<AuthResponse> {
  // Create auth user
  // Note: If "Confirm email" is enabled in Supabase, this will send a confirmation link
  // We'll send OTP separately - user should use OTP code, not the confirmation link
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      // Don't set emailRedirectTo to avoid triggering confirmation email
      // We'll handle verification via OTP instead
      data: {
        full_name: data.full_name,
        role: data.role,
        phone: data.phone,
        mdcn_number: data.mdcn_number,
      },
    },
  })

  if (authError) {
    // Handle rate limiting
    if (authError.message.includes('429') || authError.message.includes('Too Many Requests')) {
      throw new Error('Too many signup attempts. Please wait a few minutes and try again.')
    }
    throw authError
  }
  
  if (!authData.user) throw new Error('Failed to create user')

  // IMPORTANT: If "Confirm email" is OFF, signUp creates a session automatically
  // We need to sign out immediately to prevent auto-login before OTP verification
  if (authData.session) {
    // Sign out to clear the session - user must verify OTP first
    await supabase.auth.signOut()
  }

  // Create profile in profiles table
  // Note: If email confirmation is required, profile will be created by the trigger
  // But we'll try to create it here anyway in case confirmation is disabled
  const { error: profileError } = await supabase
    .from('profiles')
    .insert({
      id: authData.user.id,
      email: data.email,
      role: data.role,
      full_name: data.full_name,
      phone: data.phone,
      mdcn_number: data.role === 'doctor' ? data.mdcn_number : null,
      verification_status: data.role === 'doctor' ? 'pending' : null,
    })

  // If profile creation fails, it might be because the trigger already created it
  // or email confirmation is required. We'll continue anyway.
  if (profileError && !profileError.message.includes('duplicate key')) {
    console.warn('Profile creation warning:', profileError)
  }

  // Send OTP to email for verification
  // CRITICAL: Supabase email template MUST be configured correctly:
  // 1. Go to: Supabase Dashboard → Authentication → Email → Templates
  // 2. Edit the "Magic Link" template (or create custom OTP template)
  // 3. Replace {{ .ConfirmationURL }} with {{ .Token }} to send OTP codes
  // 4. The email should show the 6-digit code, not a clickable link
  // 
  // Also note: Free tier has 2 emails/hour limit - if exceeded, OTP won't send
  // Small delay to ensure user is fully created before sending OTP
  await new Promise(resolve => setTimeout(resolve, 1500))
  
  try {
    // Use signInWithOtp to send OTP code
    // This sends OTP code (6 digits) IF email template uses {{ .Token }}
    // If template uses {{ .ConfirmationURL }}, it sends magic link instead
    const { error } = await supabase.auth.signInWithOtp({
      email: data.email,
      options: {
        // shouldCreateUser: false since user already exists from signUp
        shouldCreateUser: false,
        // CRITICAL: Do NOT include emailRedirectTo - that forces magic link behavior
      },
    })
    
    if (error) {
      console.error('OTP send failed:', error)
      
      // Handle specific error cases
      if (error.message.includes('email') && error.message.includes('already')) {
        throw new Error('An account with this email already exists. Please sign in instead.')
      }
      
      // Rate limit errors
      if (error.message.includes('429') || error.message.includes('rate limit') || error.message.includes('too many')) {
        throw new Error('Email rate limit reached. Please wait up to 1 hour before requesting another OTP code. (Supabase free tier allows only 2 emails per hour)')
      }
      
      // Check if it's a magic link issue
      if (error.message.includes('email') || error.message.includes('template')) {
        throw new Error(`Failed to send OTP: ${error.message}. Make sure the Supabase email template uses {{ .Token }} instead of {{ .ConfirmationURL }}.`)
      }
      
      throw new Error(`Failed to send OTP code: ${error.message}`)
    }
  } catch (otpError: any) {
      throw otpError
  }

  // Return user data but NO session - user must verify OTP first
  // Session will be created after OTP verification
  return {
    user: authData.user,
    session: null, // No session until OTP is verified
    role: data.role,
    verification_status: data.role === 'doctor' ? 'pending' : undefined,
  }
}

// Sign In
export async function signIn(data: SignInData): Promise<AuthResponse> {
  const { data: authData, error } = await supabase.auth.signInWithPassword({
    email: data.email,
    password: data.password,
  })

  if (error) throw error
  if (!authData.user) throw new Error('Sign in failed')

  // Get user profile to get role
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role, verification_status')
    .eq('id', authData.user.id)
    .single()

  if (profileError) throw profileError

  return {
    user: authData.user,
    session: authData.session,
    role: profile.role,
    verification_status: profile.verification_status,
  }
}

// Sign Out
export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

// Get Current User
export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error) throw error
  return { ...user, profile }
}

// Sign in with Google
export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth-success`,
    },
  })
  if (error) throw error
  return data
}

// Reset Password
export async function resetPassword(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  })
  if (error) throw error
}

// Update Password
export async function updatePassword(newPassword: string) {
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  })
  if (error) throw error
}

// Send OTP to phone number (SMS) or email
export async function sendOTP(phoneOrEmail: string, isPhone: boolean = true) {
  if (isPhone) {
    const { error } = await supabase.auth.signInWithOtp({
      phone: phoneOrEmail,
    })
    if (error) throw error
  } else {
    // For email OTP, don't include emailRedirectTo - this sends OTP code, not magic link
    const { error } = await supabase.auth.signInWithOtp({
      email: phoneOrEmail,
      // No emailRedirectTo = sends OTP code
      // With emailRedirectTo = sends magic link
    })
    if (error) throw error
  }
}

// Resend OTP
export async function resendOTP(phoneOrEmail: string, isPhone: boolean = true) {
  return sendOTP(phoneOrEmail, isPhone)
}

// Verify OTP
export async function verifyOTP(phoneOrEmail: string, token: string, isPhone: boolean = true) {
  if (isPhone) {
    const { data, error } = await supabase.auth.verifyOtp({
      phone: phoneOrEmail,
      token,
      type: 'sms',
    })
    if (error) throw error
    return data
  } else {
    const { data, error } = await supabase.auth.verifyOtp({
      email: phoneOrEmail,
      token,
      type: 'email',
    })
    if (error) throw error
    return data
  }
}
