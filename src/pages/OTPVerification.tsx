import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import AuthLayout from '@/components/AuthLayout'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'
import { verifyOTP, resendOTP } from '@/lib/api/auth'
import { useAuthStore } from '@/store/useAuthStore'
import { Loader2 } from 'lucide-react'

export default function OTPVerification() {
  const navigate = useNavigate()
  const location = useLocation()
  const { checkSession } = useAuthStore()
  const [otp, setOtp] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isVerifying, setIsVerifying] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [resendMessage, setResendMessage] = useState<string>('')
  const [isResendDialogOpen, setIsResendDialogOpen] = useState(false)
  const [contact, setContact] = useState<string>('')
  const [maskedContact, setMaskedContact] = useState<string>('')
  const [isPhone, setIsPhone] = useState<boolean>(false)

  useEffect(() => {
    // Get email from location state or sessionStorage (we only use email for OTP now)
    const stateEmail = location.state?.email
    const storedEmail = sessionStorage.getItem('signupEmail')
    
    const userEmail = stateEmail || storedEmail || ''
    
    if (userEmail) {
      setContact(userEmail)
      setIsPhone(false) // Always email, not phone
      // Mask email for display (e.g., k**dans@gmail.com)
      const [localPart, domain] = userEmail.split('@')
      if (localPart.length > 2) {
        // Show first 2 chars, mask the rest, then @domain
        const visible = localPart.slice(0, 2)
        const masked = visible + '***@' + domain
        setMaskedContact(masked)
      } else {
        // If email is too short, just show ***@domain
        setMaskedContact('***@' + domain)
      }
    } else {
      // If no email found, redirect back to signup
      navigate('/signup')
    }
  }, [location, navigate])

  const handleVerify = async () => {
    if (otp.length !== 8) {
      setError('Please enter the complete 8-digit OTP code')
      return
    }

    if (!contact) {
      setError('Contact information not found. Please sign up again.')
      return
    }

    setIsVerifying(true)
    setError(null)

    try {
      await verifyOTP(contact, otp, isPhone)
      // Clear stored contact info
      sessionStorage.removeItem('signupPhone')
      sessionStorage.removeItem('signupEmail')
      
      // OTP verification creates a session - refresh auth state
      await checkSession()
      
      // Navigate to dashboard only if authenticated
      navigate('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Invalid OTP code. Please try again.')
      setOtp('') // Clear OTP on error
    } finally {
      setIsVerifying(false)
    }
  }

  const handleResend = async () => {
    if (!contact) {
      setError('Contact information not found. Please sign up again.')
      return
    }

    setIsResending(true)
    setError(null)

    try {
      await resendOTP(contact, isPhone)
      setError(null)
      const message = isPhone
        ? 'OTP code resent! Please check your phone for the SMS.'
        : 'OTP code resent! Please check your email.'
      setResendMessage(message)
      setIsResendDialogOpen(true)
    } catch (err: any) {
      setError(err.message || 'Failed to resend OTP. Please try again.')
    } finally {
      setIsResending(false)
    }
  }

  return (
    <AuthLayout
      illustration="/assets/otp-verify.svg"
      title="Verify Your Account"
      subtitle="Enter the code we sent to your email to complete your registration."
    >
      <div className="flex flex-col gap-6 sm:gap-7 w-full">
        {/* Logo */}
        <img src="/assets/logo.svg" alt="PH-DVault" className="w-[55px] h-[60px]" />

        {/* Header */}
        <div className="flex flex-col gap-2">
          <h2 className="heading-xl">OTP Verification</h2>
          <p className="body-text text-sm sm:text-base">
            We sent an 8-digit code to verify your email address.
            {maskedContact && (
              <span className="block mt-1">Please type the OTP sent to {maskedContact}</span>
            )}
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* OTP Input */}
        <div className="flex flex-col items-center gap-6 sm:gap-8">
          <div className="flex justify-center w-full">
            <InputOTP 
              maxLength={8}
              value={otp}
              onChange={(value) => {
                setOtp(value)
                setError(null)
              }}
              disabled={isVerifying}
            >
              <InputOTPGroup className="gap-3 sm:gap-4">
                {Array.from({ length: 8 }).map((_, index) => (
                  <InputOTPSlot
                    key={index}
                    index={index}
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg border-2 border-[#d0d5dd] text-xl focus:border-teal-primary"
                  />
                ))}
              </InputOTPGroup>
            </InputOTP>
          </div>

          <div className="flex items-center gap-1 flex-wrap justify-center">
            <span className="text-[14px] font-medium text-[#444951]">Didn't receive code?</span>
            <button 
              onClick={handleResend}
              disabled={isResending || !contact}
              className="text-[14px] font-medium text-teal-primary underline hover:text-teal-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isResending ? 'Resending...' : 'Resend Code'}
            </button>
          </div>
        </div>

        <Button 
          onClick={handleVerify}
          disabled={isVerifying || otp.length !== 8}
          className="w-full h-12 rounded-full bg-teal-primary text-white font-semibold hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isVerifying ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Verifying...
            </>
          ) : (
            'Continue'
          )}
        </Button>
      </div>

      <Dialog open={isResendDialogOpen} onOpenChange={setIsResendDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>OTP Code Sent</DialogTitle>
            <DialogDescription>{resendMessage}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setIsResendDialogOpen(false)}>OK</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AuthLayout>
  )
}