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
  user: any | null
  session: any | null
  role?: UserRole
  verification_status?: VerificationStatus
  pending?: boolean
}

// Sign Up
export async function signUp(data: SignUpData): Promise<AuthResponse> {
  const { data: response, error } = await supabase.functions.invoke('start-signup', {
    body: {
      email: data.email,
      password: data.password,
      full_name: data.full_name,
      role: data.role,
      phone: data.phone,
      mdcn_number: data.mdcn_number,
    },
  })

  if (error) throw new Error(error.message)
  if (response?.error) throw new Error(response.error)

  return {
    user: null,
    session: null,
    role: data.role,
    verification_status: data.role === 'doctor' ? 'pending' : undefined,
    pending: true,
  }
}

// Sign In
export async function signIn(data: SignInData): Promise<AuthResponse> {
  const { data: authData, error } = await supabase.auth.signInWithPassword({
    email: data.email,
    password: data.password,
  })

  if (error) {
    // If user exists but email not confirmed, guide them to verify
    if (error.message.includes('Email not confirmed') || error.message.includes('email_confirmed_at')) {
      throw new Error('Please verify your email address first. Check your inbox for the OTP code or request a new one.')
    }
    throw error
  }
  if (!authData.user) throw new Error('Sign in failed')

  // Check if email is verified
  if (!authData.user.email_confirmed_at) {
    // User exists but email not verified - sign them out and redirect to OTP
    await supabase.auth.signOut()
    throw new Error('Email not verified. Please verify your email address first.')
  }

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
    const { data, error } = await supabase.functions.invoke('resend-signup-otp', {
      body: { email: phoneOrEmail },
    })
    if (error) throw new Error(error.message)
    if (data?.error) throw new Error(data.error)
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
    const { data, error } = await supabase.functions.invoke('verify-signup-otp', {
      body: { email: phoneOrEmail, token },
    })
    if (error) throw new Error(error.message)
    if (data?.error) throw new Error(data.error)

    if (data?.session?.access_token && data?.session?.refresh_token) {
      await supabase.auth.setSession({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      })
    }

    return data
  }
}
