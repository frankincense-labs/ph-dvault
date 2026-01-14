import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import AuthLayout from '@/components/AuthLayout'
import { Button } from '@/components/ui/button'
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
  const [contact, setContact] = useState<string>('')
  const [maskedContact, setMaskedContact] = useState<string>('')
  const [isPhone, setIsPhone] = useState<boolean>(true)

  useEffect(() => {
    // Get phone number or email from location state or sessionStorage
    const statePhone = location.state?.phone
    const stateEmail = location.state?.email
    const storedPhone = sessionStorage.getItem('signupPhone')
    const storedEmail = sessionStorage.getItem('signupEmail')
    
    const userPhone = statePhone || storedPhone || ''
    const userEmail = stateEmail || storedEmail || ''
    
    // Prefer phone, fallback to email
    if (userPhone) {
      setContact(userPhone)
      setIsPhone(true)
      // Mask phone for display (e.g., 081***1998)
      const cleaned = userPhone.replace(/\D/g, '')
      if (cleaned.length >= 4) {
        const last4 = cleaned.slice(-4)
        const masked = '***' + last4
        setMaskedContact(masked)
      } else {
        setMaskedContact('***' + cleaned)
      }
    } else if (userEmail) {
      setContact(userEmail)
      setIsPhone(false)
      // Mask email for display (e.g., exa***@email.com)
      const [localPart, domain] = userEmail.split('@')
      const masked = localPart.slice(0, 3) + '***@' + domain
      setMaskedContact(masked)
    } else {
      // If no contact found, redirect back to signup
      navigate('/signup')
    }
  }, [location, navigate])

  const handleVerify = async () => {
    if (otp.length !== 6) {
      setError('Please enter the complete 6-digit OTP code')
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
      // Refresh auth session
      await checkSession()
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
      // Show success message (you could use a toast here)
      const message = isPhone 
        ? 'OTP code resent! Please check your phone for the SMS.'
        : 'OTP code resent! Please check your email.'
      alert(message)
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
            We sent a 6-digit code to verify your email address.
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
              maxLength={6}
              value={otp}
              onChange={(value) => {
                setOtp(value)
                setError(null)
              }}
              disabled={isVerifying}
            >
              <InputOTPGroup className="gap-3 sm:gap-4">
                <InputOTPSlot 
                  index={0} 
                  className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg border-2 border-[#d0d5dd] text-xl focus:border-teal-primary" 
                />
                <InputOTPSlot 
                  index={1} 
                  className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg border-2 border-[#d0d5dd] text-xl focus:border-teal-primary" 
                />
                <InputOTPSlot 
                  index={2} 
                  className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg border-2 border-[#d0d5dd] text-xl focus:border-teal-primary" 
                />
                <InputOTPSlot 
                  index={3} 
                  className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg border-2 border-[#d0d5dd] text-xl focus:border-teal-primary" 
                />
                <InputOTPSlot 
                  index={4} 
                  className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg border-2 border-[#d0d5dd] text-xl focus:border-teal-primary" 
                />
                <InputOTPSlot 
                  index={5} 
                  className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg border-2 border-[#d0d5dd] text-xl focus:border-teal-primary" 
                />
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
          disabled={isVerifying || otp.length !== 6}
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
    </AuthLayout>
  )
}