import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { UserRole, VerificationStatus } from '@/types/database'
import * as authAPI from '@/lib/api/auth'

interface User {
  id: string
  email: string
  role: UserRole
  full_name: string | null
  verification_status?: VerificationStatus
}

interface AuthState {
  user: User | null
  role: UserRole | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (user: User) => void
  logout: () => Promise<void>
  signIn: (email: string, password: string, rememberMe?: boolean) => Promise<void>
  signUp: (data: {
    email: string
    password: string
    full_name: string
    role: UserRole
    phone?: string
    mdcn_number?: string
  }) => Promise<void>
  signInWithGoogle: () => Promise<void>
  checkSession: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  role: null,
  isAuthenticated: false,
  isLoading: true,

  login: (user) => {
    set({
      user,
      role: user.role,
      isAuthenticated: true,
      isLoading: false,
    })
  },

  logout: async () => {
    await authAPI.signOut()
      set({
        user: null,
        role: null,
        isAuthenticated: false,
        isLoading: false,
      })
  },

  signIn: async (email, password, rememberMe) => {
    set({ isLoading: true })
    try {
      const response = await authAPI.signIn({ email, password, rememberMe })
      const profile = await supabase
        .from('profiles')
        .select('*')
        .eq('id', response.user.id)
        .single()

      if (profile.data) {
        const user: User = {
          id: response.user.id,
          email: response.user.email!,
          role: profile.data.role,
          full_name: profile.data.full_name,
          verification_status: profile.data.verification_status,
        }
        set({
          user,
          role: user.role,
          isAuthenticated: true,
          isLoading: false,
        })
      }
    } catch (error) {
      set({ isLoading: false })
      throw error
    }
  },

  signUp: async (data) => {
    set({ isLoading: true })
    try {
      const response = await authAPI.signUp(data)
      // Don't set isAuthenticated to true yet - user needs to verify OTP first
      // Store user data temporarily, but keep isAuthenticated false
      const user: User = {
        id: response.user.id,
        email: response.user.email!,
        role: data.role,
        full_name: data.full_name,
        verification_status: response.verification_status,
      }
      set({
        user,
        role: user.role,
        isAuthenticated: false, // User must verify OTP before being authenticated
        isLoading: false,
      })
    } catch (error) {
      set({ isLoading: false })
      throw error
    }
  },

  signInWithGoogle: async () => {
    set({ isLoading: true })
    try {
      await authAPI.signInWithGoogle()
    } catch (error) {
      set({ isLoading: false })
      throw error
    }
  },

  checkSession: async () => {
    set({ isLoading: true })
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()

        if (profile) {
          const user: User = {
            id: session.user.id,
            email: session.user.email!,
            role: profile.role,
            full_name: profile.full_name,
            verification_status: profile.verification_status,
          }
          set({
            user,
            role: user.role,
            isAuthenticated: true,
            isLoading: false,
          })
        } else {
          set({ isLoading: false })
        }
      } else {
        set({ isLoading: false })
      }
    } catch (error) {
      console.error('Session check error:', error)
      set({ isLoading: false })
    }
  },
}))
