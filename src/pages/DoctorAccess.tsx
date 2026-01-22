import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Link as LinkIcon, Lock, Loader2, AlertCircle, ArrowLeft } from 'lucide-react'
import DashboardLayout from '@/components/DashboardLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'
import { useAuthStore } from '@/store/useAuthStore'
import { supabase } from '@/lib/supabase'
import { accessSharedRecords, getShareByToken } from '@/lib/api/shares'

type Step = 'method' | 'pin'

export default function DoctorAccess() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [step, setStep] = useState<Step>('method')
  const [method, setMethod] = useState<'link' | 'code'>('link')
  const [profile, setProfile] = useState<any>(null)
  const [linkInput, setLinkInput] = useState('')
  const [pinInput, setPinInput] = useState('')
  const [isValidating, setIsValidating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [extractedToken, setExtractedToken] = useState<string | null>(null)
  
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

  const handleContinueToPin = async () => {
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
        // For code method, the input IS the token
        token = linkInput.trim()
        if (!token) {
          setError('Please enter the access code')
          setIsValidating(false)
          return
        }
      }

      // Verify the token exists and is valid
      const shareToken = await getShareByToken(token)
      if (!shareToken) {
        setError('Invalid or expired share token')
        setIsValidating(false)
        return
      }

      // Store the token and move to PIN step
      setExtractedToken(token)
      setStep('pin')
    } catch (err: any) {
      setError(err.message || 'Invalid or expired token. Please check and try again.')
    } finally {
      setIsValidating(false)
    }
  }

  const handleVerifyAndAccess = async () => {
    if (!user?.id || !extractedToken) return

    if (pinInput.length !== 5) {
      setError('Please enter the 5-digit verification PIN')
      return
    }

    setIsValidating(true)
    setError(null)

    try {
      const result = await accessSharedRecords(extractedToken, user.id, pinInput)
      
      // Store shared records in sessionStorage for the details page
      sessionStorage.setItem('sharedRecords', JSON.stringify(result.records))
      sessionStorage.setItem('shareToken', JSON.stringify(result.shareToken))
      
      navigate('/details')
    } catch (err: any) {
      if (err.message.includes('PIN')) {
        setError('Invalid verification PIN. Please check and try again.')
      } else {
        setError(err.message || 'Failed to access records. Please try again.')
      }
    } finally {
      setIsValidating(false)
    }
  }

  const handleBack = () => {
    setStep('method')
    setPinInput('')
    setError(null)
    setExtractedToken(null)
  }

  return (
    <DashboardLayout showProfile={false}>
      <div className="flex flex-col gap-6 sm:gap-8 pb-10">
        {/* Header */}
        <div className="flex items-center gap-3 sm:gap-4">
          {step === 'pin' && (
            <button 
              onClick={handleBack}
              className="p-2 bg-[#f5f6f7] rounded-lg hover:bg-[#eeeffd] transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-[#98a2b3]" />
            </button>
          )}
          {profile?.avatar_url && step === 'method' && (
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

        {step === 'method' ? (
          <>
            <div className="flex flex-col gap-2">
              <h1 className="text-[18px] sm:text-[20px] font-bold text-navy-dark">Access Patient Record</h1>
              <p className="text-[12px] sm:text-[13px] text-[#868484]">Enter the access link provided by the patient.</p>
            </div>

            {/* Method Switcher - Only show Link option now */}
            <div className="grid grid-cols-1 gap-3 sm:gap-4">
              <button 
                onClick={() => setMethod('link')}
                className="flex flex-col items-center gap-4 p-6 rounded-xl text-center transition-all bg-[#fffbeb] border-2 border-orange-dosage shadow-sm"
              >
                <div className="w-11 h-11 bg-orange-dosage rounded-lg flex items-center justify-center text-white">
                  <LinkIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-[14px] font-medium text-black">Access Link</h3>
                  <p className="text-[12px] text-[#8d8989]">Enter the shared link from patient</p>
                </div>
              </button>
            </div>

            {/* Entry Field */}
            <div className="flex flex-col gap-4 mt-4">
              <h2 className="text-[14px] font-semibold text-[#7a828f]">
                Enter Shared Link
              </h2>
              
              <div className="relative">
                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#98a2b3] pointer-events-none" />
                <Input 
                  value={linkInput}
                  onChange={(e) => setLinkInput(e.target.value)}
                  placeholder="https://phdvault.app/shared/..." 
                  className="border border-[#d0d5dd] rounded-lg pl-10 pr-4 h-12 focus-visible:ring-1 focus-visible:ring-teal-primary focus-visible:border-teal-primary text-[#101928]"
                  disabled={isValidating}
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Button 
              onClick={handleContinueToPin}
              disabled={isValidating || !linkInput.trim()}
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
          </>
        ) : (
          <>
            {/* PIN Verification Step */}
            <div className="flex flex-col gap-2">
              <h1 className="text-[18px] sm:text-[20px] font-bold text-navy-dark">Enter Verification PIN</h1>
              <p className="text-[12px] sm:text-[13px] text-[#868484]">
                Enter the 5-digit PIN provided by the patient to access their records.
              </p>
            </div>

            <div className="flex flex-col items-center gap-6 py-6">
              <div className="w-16 h-16 bg-purple-accent/10 rounded-full flex items-center justify-center">
                <Lock className="w-8 h-8 text-purple-accent" />
              </div>

              <InputOTP 
                maxLength={5}
                value={pinInput}
                onChange={setPinInput}
                disabled={isValidating}
              >
                <InputOTPGroup className="gap-3">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <InputOTPSlot 
                      key={i} 
                      index={i} 
                      className="w-14 h-14 rounded-xl border-2 border-[#d0d5dd] text-2xl font-bold" 
                    />
                  ))}
                </InputOTPGroup>
              </InputOTP>

              <p className="text-[12px] text-[#8d8989] text-center">
                The patient should have shared this PIN with you along with the access link.
              </p>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Button 
              onClick={handleVerifyAndAccess}
              disabled={isValidating || pinInput.length !== 5}
              className="w-full h-12 rounded-full bg-teal-primary text-white font-semibold mt-6 disabled:opacity-50"
            >
              {isValidating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Access Records'
              )}
            </Button>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
