import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { ChevronDown, Eye, EyeOff } from 'lucide-react'
import AuthLayout from '@/components/AuthLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { useAuthStore } from '@/store/useAuthStore'
import { isValidMDCNFormat } from '@/lib/api/mdcn'

const doctorSignUpSchema = z.object({
  full_name: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  mdcn_number: z.string()
    .min(1, 'MDCN number is required')
    .refine((val) => isValidMDCNFormat(val), {
      message: 'Invalid MDCN number format. Examples: MDCN/12345/2020 or 12345/2020'
    }),
  specialization: z.string().min(1, 'Specialization is required'),
  hospital_name: z.string().optional(),
  country: z.string().optional(),
})

export default function DoctorSignUp() {
  const navigate = useNavigate()
  const { signUp, isLoading } = useAuthStore()
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const form = useForm<z.infer<typeof doctorSignUpSchema>>({
    resolver: zodResolver(doctorSignUpSchema),
    defaultValues: {
      full_name: '',
      email: '',
      password: '',
      mdcn_number: '',
      specialization: '',
      hospital_name: '',
      country: '',
    },
  })

  const onSubmit = async (data: z.infer<typeof doctorSignUpSchema>) => {
    try {
      setError(null)
      await signUp({
        email: data.email,
        password: data.password,
        full_name: data.full_name,
        role: 'doctor',
        mdcn_number: data.mdcn_number,
      })
      navigate('/verify-faceid')
    } catch (err: any) {
      setError(err.message || 'Failed to create doctor account. Please try again.')
    }
  }

  return (
    <AuthLayout
      illustration="/assets/doctor-profile.svg"
      title="Join as a Healthcare Professional"
      subtitle="Register as a doctor to access patient records securely and provide better care."
    >
      <div className="flex flex-col gap-6 sm:gap-7">
        {/* Logo */}
        <img src="/assets/logo.svg" alt="PH-DVault" className="w-[55px] h-[60px]" />

        {/* Header */}
        <div className="flex flex-col gap-2">
          <h2 className="heading-xl">Doctor Registration</h2>
          <p className="body-text">Create your account to access patient health records</p>
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

            {/* Role Selection */}
            <div className="flex gap-3 sm:gap-4">
              <Link
                to="/signup"
                className="flex-1 p-3 sm:p-4 border border-[#cccccc] rounded-lg text-center hover:bg-gray-50 transition-colors"
              >
                <span className="text-[14px] font-medium text-[#1a1a1a]">Patient</span>
              </Link>
              <div className="flex-1 p-3 sm:p-4 bg-teal-primary rounded-lg text-center">
                <span className="text-[14px] font-medium text-white">Doctor</span>
              </div>
            </div>

            {/* Form Fields */}
            <div className="flex flex-col gap-4 sm:gap-6">
              <FormField
                control={form.control}
                name="full_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[#7a828f] text-[14px]">Full name</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter your full name"
                        className="border-0 border-b border-[#d0d5dd] rounded-none px-0 h-11 focus-visible:ring-0 focus-visible:border-teal-primary text-[#101928]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[#7a828f] text-[14px]">Email</FormLabel>
                    <FormControl>
                      <Input 
                        type="email"
                        placeholder="Enter your email"
                        className="border-0 border-b border-[#d0d5dd] rounded-none px-0 h-11 focus-visible:ring-0 focus-visible:border-teal-primary text-[#101928]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[#7a828f] text-[14px]">Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input 
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter password"
                          className="border-0 border-b border-[#d0d5dd] rounded-none px-0 pr-8 h-11 focus-visible:ring-0 focus-visible:border-teal-primary text-[#101928]"
                          {...field}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-0 top-1/2 -translate-y-1/2 text-[#667185]"
                        >
                          {showPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="mdcn_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[#7a828f] text-[14px]">MDCN Number</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter your MDCN number"
                        className="border-0 border-b border-[#d0d5dd] rounded-none px-0 h-11 focus-visible:ring-0 focus-visible:border-teal-primary text-[#101928]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="specialization"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[#7a828f] text-[14px]">Specialty</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input 
                          placeholder="e.g. Cardiologist"
                          className="border-0 border-b border-[#d0d5dd] rounded-none px-0 pr-6 h-11 focus-visible:ring-0 focus-visible:border-teal-primary text-[#101928]"
                          {...field}
                        />
                        <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 text-[#667185]" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="hospital_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[#7a828f] text-[14px]">Hospital/Clinic name (Optional)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter hospital name"
                        className="border-0 border-b border-[#d0d5dd] rounded-none px-0 h-11 focus-visible:ring-0 focus-visible:border-teal-primary text-[#101928]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[#7a828f] text-[14px]">Country (Optional)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input 
                          placeholder="Select country"
                          className="border-0 border-b border-[#d0d5dd] rounded-none px-0 pr-6 h-11 focus-visible:ring-0 focus-visible:border-teal-primary text-[#101928]"
                          {...field}
                        />
                        <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 text-[#667185]" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Button 
              type="submit"
              disabled={isLoading}
              className="w-full h-12 rounded-full bg-teal-primary text-white font-semibold hover:bg-teal-600 disabled:opacity-50"
            >
              {isLoading ? 'Creating account...' : 'Sign Up'}
            </Button>

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
