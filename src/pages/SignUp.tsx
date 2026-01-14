import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import AuthLayout from '@/components/AuthLayout'
import { useAuthStore } from '@/store/useAuthStore'
import { Eye, EyeOff } from 'lucide-react'
import type { UserRole } from '@/types/database'
import { isValidMDCNFormat } from '@/lib/api/mdcn'

const createSignUpSchema = (isDoctor: boolean) => z.object({
  email: z.string().email('Please enter a valid email address'),
  full_name: z.string().min(2, 'Full name must be at least 2 characters'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  confirmPassword: z.string(),
  phone: z.string().min(1, 'Phone number is required'),
  mdcn_number: isDoctor 
    ? z.string()
        .min(1, 'MDCN number is required for doctors')
        .refine((val) => isValidMDCNFormat(val), {
          message: 'Invalid MDCN number format. Examples: MDCN/12345/2020 or 12345/2020'
        })
    : z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

export default function SignUp() {
  const navigate = useNavigate()
  const { signUp, signInWithGoogle, isLoading } = useAuthStore()
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [selectedRole, setSelectedRole] = useState<UserRole>('patient')

  const form = useForm<z.infer<ReturnType<typeof createSignUpSchema>>>({
    resolver: zodResolver(createSignUpSchema(selectedRole === 'doctor')),
    defaultValues: {
      email: '',
      full_name: '',
      password: '',
      confirmPassword: '',
      phone: '',
      mdcn_number: '',
    },
  })

  // Update form when role changes
  useEffect(() => {
    // Clear errors and reset MDCN field when switching roles
    form.clearErrors()
    if (selectedRole === 'patient') {
      form.setValue('mdcn_number', '')
    }
  }, [selectedRole, form])

  const handleRoleChange = (role: UserRole) => {
    setSelectedRole(role)
  }

  const onSubmit = async (data: z.infer<ReturnType<typeof createSignUpSchema>>) => {
    try {
      setError(null)
      
      await signUp({
        email: data.email,
        password: data.password,
        full_name: data.full_name,
        role: selectedRole,
        phone: data.phone,
        mdcn_number: selectedRole === 'doctor' ? data.mdcn_number : undefined,
      })
      
      // Store email for OTP verification (we only use email OTP)
      sessionStorage.setItem('signupEmail', data.email)
      navigate('/verify-otp', { state: { email: data.email } })
    } catch (err: any) {
      let errorMessage = err.message || 'Failed to create account. Please try again.'
      
      // Better error messages
      if (err.message?.includes('429') || err.message?.includes('Too Many Requests') || err.message?.includes('rate limit')) {
        errorMessage = 'Email rate limit reached. Supabase free tier allows only 2 emails per hour. Please wait before trying again.'
      } else if (err.message?.includes('User already registered')) {
        errorMessage = 'An account with this email already exists. Please sign in instead.'
      } else if (err.message?.includes('Invalid email')) {
        errorMessage = 'Please enter a valid email address.'
      } else if (err.message?.includes('OTP') || err.message?.includes('Failed to send')) {
        errorMessage = err.message
      }
      
      setError(errorMessage)
    }
  }

  const handleGoogleSignUp = async () => {
    try {
      setError(null)
      await signInWithGoogle()
    } catch (err: any) {
      setError(err.message || 'Failed to sign up with Google.')
    }
  }

  return (
    <AuthLayout
      illustration="/assets/signup-illustration.svg"
      title="Store and share your health records securely"
      subtitle="Upload your medical history and share it with doctors using private, time-limited access - anytime, anywhere."
    >
      <div className="flex flex-col gap-7">
        {/* Logo */}
        <img src="/assets/logo.svg" alt="PH-DVault" className="w-[55px] h-[60px]" />

        {/* Header */}
        <div className="flex flex-col gap-2">
          <h2 className="heading-xl">Create Your Account</h2>
          <p className="body-text">Welcome to PH-DVault - Get started to explore our features</p>
        </div>

        {/* Form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-6 sm:gap-8">
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Google Sign Up */}
            <Button 
              type="button"
              variant="outline" 
              onClick={handleGoogleSignUp}
              disabled={isLoading}
              className="w-full h-12 gap-3 rounded-full border-[#dddddd] hover:bg-gray-50"
            >
              <img src="/assets/google-icon.svg" alt="Google" className="w-6 h-6" />
              <span className="button-text text-[#1e293b]">Continue With Google</span>
            </Button>

            {/* Role Selection */}
            <div className="flex gap-3 sm:gap-4">
              <button
                type="button"
                onClick={() => handleRoleChange('patient')}
                className={`flex-1 p-3 sm:p-4 border rounded-lg text-center transition-colors ${
                  selectedRole === 'patient'
                    ? 'bg-teal-primary border-teal-primary'
                    : 'border-[#cccccc] hover:bg-gray-50'
                }`}
              >
                <span className={`text-[14px] font-medium ${
                  selectedRole === 'patient' ? 'text-white' : 'text-[#1a1a1a]'
                }`}>Patient</span>
              </button>
              <button
                type="button"
                onClick={() => handleRoleChange('doctor')}
                className={`flex-1 p-3 sm:p-4 border rounded-lg text-center transition-colors ${
                  selectedRole === 'doctor'
                    ? 'bg-teal-primary border-teal-primary'
                    : 'border-[#cccccc] hover:bg-gray-50'
                }`}
              >
                <span className={`text-[14px] font-medium ${
                  selectedRole === 'doctor' ? 'text-white' : 'text-[#1a1a1a]'
                }`}>Doctor</span>
              </button>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-2">
              <Separator className="flex-1" />
              <span className="body-text-medium text-[#5b616b] px-1 text-sm sm:text-base">or</span>
              <Separator className="flex-1" />
            </div>

            {/* Form Fields */}
            <div className="flex flex-col gap-4 sm:gap-5">
              {/* Full Name Field */}
              <FormField
                control={form.control}
                name="full_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="label-text">Full Name</FormLabel>
                    <FormControl>
                      <Input 
                        type="text"
                        placeholder="Enter your full name"
                        className="h-12 rounded-full border-[#cbd5e1] body-text-medium"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Email Field */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="label-text">Email Address</FormLabel>
                    <FormControl>
                      <Input 
                        type="email"
                        placeholder="example123@email.com"
                        className="h-12 rounded-full border-[#cbd5e1] body-text-medium"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Phone Field (Optional) */}
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="label-text">Phone Number</FormLabel>
                    <FormControl>
                      <Input 
                        type="tel"
                        placeholder="08123456789"
                        className="h-12 rounded-full border-[#cbd5e1] body-text-medium"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* MDCN Number Field (Only for Doctors) */}
              {selectedRole === 'doctor' && (
                <FormField
                  control={form.control}
                  name="mdcn_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="label-text">MDCN Number <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Input 
                          type="text"
                          placeholder="MDCN/12345/2020 or 12345/2020"
                          className="h-12 rounded-full border-[#cbd5e1] body-text-medium"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                      <p className="text-[11px] text-[#667185] mt-1">
                        Enter your Medical and Dental Council of Nigeria registration number
                      </p>
                    </FormItem>
                  )}
                />
              )}

              {/* Password Field */}
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="label-text">Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input 
                          type={showPassword ? "text" : "password"}
                          placeholder="Create a strong password"
                          className="h-12 rounded-full border-[#cbd5e1] body-text-medium pr-12"
                          {...field}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-[#98a2b3] hover:text-[#667185]"
                        >
                          {showPassword ? (
                            <EyeOff className="w-5 h-5" />
                          ) : (
                            <Eye className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                    <p className="text-[11px] text-[#667185] mt-1">
                      Must be at least 8 characters with uppercase, lowercase, number, and special character
                    </p>
                  </FormItem>
                )}
              />

              {/* Confirm Password Field */}
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="label-text">Confirm Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input 
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Re-enter your password"
                          className="h-12 rounded-full border-[#cbd5e1] body-text-medium pr-12"
                          {...field}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-[#98a2b3] hover:text-[#667185]"
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="w-5 h-5" />
                          ) : (
                            <Eye className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Sign Up Button */}
              <Button 
                type="submit"
                disabled={isLoading}
                className="w-full h-12 rounded-full button-text bg-teal-primary hover:bg-teal-600 disabled:opacity-50 mt-2"
              >
                {isLoading ? 'Creating account...' : 'Sign Up'}
              </Button>
            </div>

            {/* Terms */}
            <p className="caption-text text-center text-xs sm:text-sm px-2">
              By continuing, you agree to PH-DVault's{' '}
              <a href="#" className="underline">Terms of Service</a> and{' '}
              <a href="#" className="underline">Privacy Policy</a>
            </p>

            {/* Sign In Link */}
            <div className="flex items-center justify-center gap-1 flex-wrap">
              <span className="link-text text-[#1e293b] text-sm sm:text-base">Already have an account?</span>
              <Link to="/signin" className="link-text text-sm sm:text-base">Sign In</Link>
            </div>
          </form>
        </Form>
      </div>
    </AuthLayout>
  )
}