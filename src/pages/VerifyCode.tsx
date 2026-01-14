import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import AuthLayout from '@/components/AuthLayout'

export default function VerifyCode() {
  return (
    <AuthLayout
      illustration="/assets/verify-illustration.svg"
      title="Get access to life-saving info in emergencies"
      subtitle="In emergencies, PH-DVault displays important medical information even while your phone is locked."
    >
      <div className="flex flex-col gap-7">
        {/* Logo */}
        <img src="/assets/logo.svg" alt="PH-DVault" className="w-[55px] h-[60px]" />

        {/* Header */}
        <div className="flex flex-col gap-2">
          <h2 className="heading-xl">Create Your Account</h2>
          <p className="body-text">
            We sent a temporary login code to example@gmail.com.{' '}
            <a href="#" className="underline">Not you?</a>
          </p>
        </div>

        {/* Form */}
        <div className="flex flex-col gap-10">
          <div className="flex flex-col gap-5">
            {/* Login Code Field */}
            <div className="flex flex-col gap-2">
              <label className="label-text">Login Code</label>
              <Input 
                type="text"
                placeholder="enter login code"
                className="h-12 rounded-full border-[#cbd5e1] body-text-medium"
              />
            </div>

            {/* Continue Button */}
            <Button 
              className="w-full h-12 rounded-full button-text"
              style={{ backgroundColor: '#229a94' }}
            >
              Continue
            </Button>
          </div>

          {/* Terms */}
          <p className="caption-text text-center">
            By continuing, you agree to PH-DVault's{' '}
            <a href="#" className="underline">Terms of Service</a> and{' '}
            <a href="#" className="underline">Privacy Policy</a>
          </p>

          {/* Sign In Link */}
          <div className="flex items-center justify-center gap-1">
            <span className="link-text text-[#1e293b]">Already have an account?</span>
            <Link to="/signin" className="link-text">Sign In</Link>
          </div>
        </div>
      </div>
    </AuthLayout>
  )
}