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
  // IMPORTANT: "Confirm email" must be OFF in Supabase for OTP to work
  // If it's ON, Supabase will send confirmation links instead of allowing OTP
  // Small delay to ensure user is created before sending OTP
  await new Promise(resolve => setTimeout(resolve, 500))
  
  try {
    // Always send email OTP (we don't use phone OTP anymore)
    // signInWithOtp works even if user exists - it sends an OTP code
    const { error } = await supabase.auth.signInWithOtp({
      email: data.email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth-success`,
      },
    })
    
    if (error) {
      console.error('OTP send failed:', error)
      throw new Error(`Failed to send OTP code: ${error.message}. Make sure "Confirm email" is disabled in Supabase settings.`)
    }
  } catch (otpError: any) {
      // If OTP fails, throw the error so user knows
      // Common reasons: "Confirm email" is enabled, rate limiting, or email service issue
      throw otpError
  }

  return {
    user: authData.user,
    session: authData.session,
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
    const { error } = await supabase.auth.signInWithOtp({
      email: phoneOrEmail,
      options: {
        emailRedirectTo: `${window.location.origin}/auth-success`,
      },
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
