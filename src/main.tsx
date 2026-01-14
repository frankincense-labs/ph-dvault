import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './lib/queryClient'
import { useAuthStore } from './store/useAuthStore'
import { supabase } from './lib/supabase'
import './index.css'
import App from './App.tsx'

// Component to initialize auth session
function AppWithAuth() {
  const checkSession = useAuthStore((state) => state.checkSession)

  useEffect(() => {
    // Handle magic link redirects - prevent auto-login
    const hashParams = new URLSearchParams(window.location.hash.substring(1))
    const accessToken = hashParams.get('access_token')
    const type = hashParams.get('type')
    
    if (accessToken && type === 'magiclink') {
      // Magic link was clicked - sign out and redirect to OTP page
      // User must use OTP code, not magic link
      supabase.auth.signOut().then(() => {
        // Clear hash and redirect to OTP page
        window.history.replaceState(null, '', '/verify-otp')
        // The OTP page will handle getting the email from sessionStorage
        window.location.reload()
      })
      return
    }
    
    checkSession()
  }, [checkSession])

  return <App />
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AppWithAuth />
    </QueryClientProvider>
  </StrictMode>,
)