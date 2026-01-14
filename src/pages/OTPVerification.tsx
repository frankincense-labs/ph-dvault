import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import AuthLayout from '@/components/AuthLayout'
import { Button } from '@/components/ui/button'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'

export default function OTPVerification() {
  const navigate = useNavigate()
  const [otp, setOtp] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleVerify = () => {
    if (otp.length !== 4) {
      setError('Please enter the complete OTP code')
      return
    }
    // TODO: Verify OTP with backend
    navigate('/dashboard')
  }

  return (
    <AuthLayout
      illustration="/assets/otp-verify.svg"
      title="Verify Your Account"
      subtitle="Enter the code we sent to your email or phone number to complete your registration."
    >
      <div className="flex flex-col gap-6 sm:gap-7 w-full">
        {/* Logo */}
        <img src="/assets/logo.svg" alt="PH-DVault" className="w-[55px] h-[60px]" />

        {/* Header */}
        <div className="flex flex-col gap-2">
          <h2 className="heading-xl">OTP Verification</h2>
          <p className="body-text text-sm sm:text-base">
            We sent a code to verify your phone number. 
            Please type the OTP sent to xxxxxxx1998
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
              maxLength={4}
              value={otp}
              onChange={(value) => {
                setOtp(value)
                setError(null)
              }}
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
              </InputOTPGroup>
            </InputOTP>
          </div>

          <div className="flex items-center gap-1 flex-wrap justify-center">
            <span className="text-[14px] font-medium text-[#444951]">Didn't receive code?</span>
            <button className="text-[14px] font-medium text-teal-primary underline hover:text-teal-600">
              Resend Code
            </button>
          </div>
        </div>

        <Button 
          onClick={handleVerify}
          className="w-full h-12 rounded-full bg-teal-primary text-white font-semibold hover:bg-teal-600"
        >
          Continue
        </Button>
      </div>
    </AuthLayout>
  )
}