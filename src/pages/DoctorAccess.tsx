import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Link as LinkIcon, Lock, Loader2, AlertCircle } from 'lucide-react'
import DashboardLayout from '@/components/DashboardLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'
import { useAuthStore } from '@/store/useAuthStore'
import { supabase } from '@/lib/supabase'
import { accessSharedRecords } from '@/lib/api/shares'

export default function DoctorAccess() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [method, setMethod] = useState<'link' | 'code'>('link')
  const [profile, setProfile] = useState<any>(null)
  const [linkInput, setLinkInput] = useState('')
  const [codeInput, setCodeInput] = useState('')
  const [isValidating, setIsValidating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Check if there's a pending share token from a shared link
  useEffect(() => {
    const pendingToken = sessionStorage.getItem('pendingShareToken')
    if (pendingToken) {
      // Pre-fill the link input with the full URL
      setLinkInput(`${window.location.origin}/shared/${pendingToken}`)
      setMethod('link')
      // Clear the pending token
      sessionStorage.removeItem('pendingShareToken')
    }
  }, [])

  useEffect(() => {
    if (user?.id) {
      supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
        .then(({ data }) => setProfile(data))
    }
  }, [user])

  const displayName = profile?.full_name || user?.full_name || 'Doctor'
  const getTitle = (name: string) => {
    // If name doesn't start with Dr., add it
    if (name.toLowerCase().startsWith('dr.')) {
      return name
    }
    return `Dr. ${name.split(' ')[0]}`
  }

  const extractTokenFromLink = (link: string): string | null => {
    try {
      const url = new URL(link)
      const pathParts = url.pathname.split('/')
      const tokenIndex = pathParts.indexOf('shared')
      if (tokenIndex !== -1 && pathParts[tokenIndex + 1]) {
        return pathParts[tokenIndex + 1]
      }
      // Fallback: try to extract from end of URL
      const lastPart = pathParts[pathParts.length - 1]
      if (lastPart && lastPart !== 'shared') {
        return lastPart
      }
    } catch {
      // If it's not a valid URL, treat the whole input as token
      return link.trim() || null
    }
    return null
  }

  const handleContinue = async () => {
    if (!user?.id) return

    setIsValidating(true)
    setError(null)

    try {
      let token: string | null = null

      if (method === 'link') {
        token = extractTokenFromLink(linkInput)
        if (!token) {
          setError('Invalid link format. Please check the link and try again.')
          setIsValidating(false)
          return
        }
      } else {
        token = codeInput
        if (token.length !== 5) {
          setError('Access code must be 5 digits')
          setIsValidating(false)
          return
        }
      }

      const result = await accessSharedRecords(token, user.id)
      
      // Store shared records in sessionStorage for the details page
      sessionStorage.setItem('sharedRecords', JSON.stringify(result.records))
      sessionStorage.setItem('shareToken', JSON.stringify(result.shareToken))
      
      navigate('/details')
    } catch (err: any) {
      setError(err.message || 'Invalid or expired token. Please check and try again.')
    } finally {
      setIsValidating(false)
    }
  }

  return (
    <DashboardLayout showProfile={false}>
      <div className="flex flex-col gap-6 sm:gap-8 pb-10">
        {/* Header */}
        <div className="flex items-center gap-3 sm:gap-4">
          {profile?.avatar_url && (
            <img 
              src={profile.avatar_url} 
              alt={displayName} 
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover" 
            />
          )}
          <span className="text-[15px] sm:text-[16px] font-medium text-black">
            Hello, {getTitle(displayName)}
          </span>
        </div>

        <div className="flex flex-col gap-2">
          <h1 className="text-[18px] sm:text-[20px] font-bold text-navy-dark">Access Patient Record</h1>
          <p className="text-[12px] sm:text-[13px] text-[#868484]">Enter the access code or link provided by the patient.</p>
        </div>

        {/* Method Switcher */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <button 
            onClick={() => setMethod('link')}
            className={`flex flex-col items-center gap-4 p-6 rounded-xl text-center transition-all ${method === 'link' ? 'bg-[#fffbeb] border-2 border-orange-dosage shadow-sm' : 'bg-[#f5f6f7] opacity-60'}`}
          >
            <div className="w-11 h-11 bg-orange-dosage rounded-lg flex items-center justify-center text-white">
              <LinkIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-[14px] font-medium text-black">Access Link</h3>
              <p className="text-[12px] text-[#8d8989]">Access shared link</p>
            </div>
          </button>

          <button 
            onClick={() => setMethod('code')}
            className={`flex flex-col items-center gap-4 p-6 rounded-xl text-center transition-all ${method === 'code' ? 'bg-[#fdf4ff] border-2 border-purple-accent shadow-sm' : 'bg-[#f5f6f7] opacity-60'}`}
          >
            <div className="w-11 h-11 bg-purple-accent rounded-lg flex items-center justify-center text-white">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-[14px] font-medium text-black">Access Code</h3>
              <p className="text-[12px] text-[#8d8989]">One-time access code</p>
            </div>
          </button>
        </div>

        {/* Entry Field */}
        <div className="flex flex-col gap-4 mt-4">
          <h2 className="text-[14px] font-semibold text-[#7a828f]">
            {method === 'link' ? 'Enter Shared Link' : 'Enter Access Code'}
          </h2>
          
          {method === 'link' ? (
            <div className="relative">
              <LinkIcon className="absolute left-0 top-1/2 -translate-y-1/2 w-5 h-5 text-[#98a2b3] z-10" />
              <Input 
                value={linkInput}
                onChange={(e) => setLinkInput(e.target.value)}
                placeholder="https://phdvault.app/shared/..." 
                className="border-0 border-b border-[#d0d5dd] rounded-none pl-8 px-0 h-11 focus-visible:ring-0 focus-visible:border-teal-primary text-[#101928]"
                disabled={isValidating}
              />
            </div>
          ) : (
             <div className="flex flex-col items-center gap-4">
                <InputOTP 
                  maxLength={5}
                  value={codeInput}
                  onChange={setCodeInput}
                  disabled={isValidating}
                >
                  <InputOTPGroup className="gap-2">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <InputOTPSlot key={i} index={i} className="w-12 h-12 rounded-lg border-2 border-[#d0d5dd] text-xl" />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
             </div>
          )}
        </div>

        {error && (
          <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <Button 
          onClick={handleContinue}
          disabled={isValidating || (method === 'link' ? !linkInput.trim() : codeInput.length !== 5)}
          className="w-full h-12 rounded-full bg-teal-primary text-white font-semibold mt-10 disabled:opacity-50"
        >
          {isValidating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Validating...
            </>
          ) : (
            'Continue'
          )}
        </Button>
      </div>
    </DashboardLayout>
  )
}