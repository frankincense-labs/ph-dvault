import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import AuthLayout from '@/components/AuthLayout'
import { useAuthStore } from '@/store/useAuthStore'
import { Eye, EyeOff } from 'lucide-react'

const signInSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  rememberMe: z.boolean(),
})

export default function SignIn() {
  const navigate = useNavigate()
  const { signIn, signInWithGoogle, isLoading } = useAuthStore()
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<z.infer<typeof signInSchema>>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  })

  const onSubmit = async (data: z.infer<typeof signInSchema>) => {
    try {
      setError(null)
      await signIn(data.email, data.password, data.rememberMe)
      navigate('/dashboard')
    } catch (err: any) {
      let message = err.message || 'Failed to sign in. Please check your credentials.'
      if (message.includes('Invalid login credentials')) {
        message = 'Email not found or password is incorrect.'
      } else if (message.includes('Email not verified')) {
        message = 'Email not verified. Please verify your email address first.'
      }
      setError(message)
    }
  }

  const handleGoogleSignIn = async () => {
    try {
      setError(null)
      await signInWithGoogle()
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with Google.')
    }
  }

  return (
    <AuthLayout
      illustration="/assets/signin-illustration.svg"
      title="Tired of loosing your medical history?"
      subtitle="Paper records get lost or damaged. PH-DVault keeps your health data safe, secure, and always with you."
    >
      <div className="flex flex-col gap-7">
        {/* Logo */}
        <img src="/assets/logo.svg" alt="PH-DVault" className="w-[55px] h-[60px]" />

        {/* Header */}
        <div className="flex flex-col gap-2">
          <h2 className="heading-xl">Welcome Back</h2>
          <p className="body-text">Sign in to continue to enjoy our features</p>
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

            {/* Google Sign In */}
            <Button 
              type="button"
              variant="outline" 
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full h-12 gap-3 rounded-full border-[#dddddd] hover:bg-gray-50"
            >
              <img src="/assets/google-icon.svg" alt="Google" className="w-6 h-6" />
              <span className="button-text text-[#1e293b]">Continue With Google</span>
            </Button>

            {/* Divider */}
            <div className="flex items-center gap-2">
              <Separator className="flex-1" />
              <span className="body-text-medium text-[#1a1a1a] px-1 text-sm sm:text-base">OR</span>
              <Separator className="flex-1" />
            </div>

            {/* Email and Password Form */}
            <div className="flex flex-col gap-4 sm:gap-6">
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
                          placeholder="Enter your password"
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
                  </FormItem>
                )}
              />

              {/* Remember & Forgot */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                <FormField
                  control={form.control}
                  name="rememberMe"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center gap-2">
                      <FormControl>
                        <Checkbox 
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="border-2 border-white data-[state=checked]:bg-teal-primary data-[state=checked]:border-teal-primary"
                        />
                      </FormControl>
                      <FormLabel className="body-text-medium text-[#1e293b] text-[14px] font-medium cursor-pointer !mt-0">
                        Remember For 30 Days
                      </FormLabel>
                    </FormItem>
                  )}
                />
                <Link to="/forgot-password" className="link-text whitespace-nowrap text-sm sm:text-base">
                  Forgot Password
                </Link>
              </div>
            </div>

            {/* Sign In Button */}
            <div className="flex flex-col gap-4 sm:gap-6">
              <Button 
                type="submit"
                disabled={isLoading}
                className="w-full h-12 rounded-full button-text bg-teal-primary hover:bg-teal-600 disabled:opacity-50"
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>

              {/* Sign Up Link */}
              <div className="flex items-center justify-center gap-1 flex-wrap">
                <span className="link-text text-[#1e293b] text-sm sm:text-base">Don't have an account?</span>
                <Link to="/signup" className="link-text text-sm sm:text-base">Sign Up</Link>
              </div>
            </div>

            {/* Terms */}
            <p className="caption-text text-center text-xs sm:text-sm px-2">
              By continuing, you agree to PH-DVault's{' '}
              <a href="#" className="underline">Terms of Service</a> and{' '}
              <a href="#" className="underline">Privacy Policy</a>
            </p>
          </form>
        </Form>
      </div>
    </AuthLayout>
  )
}