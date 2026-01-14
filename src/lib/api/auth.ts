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
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      emailRedirectTo: `${window.location.origin}/auth-success`,
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
