import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, EyeOff, Eye, Check, Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import DashboardLayout from '@/components/DashboardLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { updatePassword } from '@/lib/api/auth'
import { supabase } from '@/lib/supabase'

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

type PasswordFormData = z.infer<typeof passwordSchema>

export default function ChangePassword() {
  const navigate = useNavigate()
  const [showSuccess, setShowSuccess] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  })

  const onSubmit = async (data: PasswordFormData) => {
    setIsSubmitting(true)
    setError(null)

    try {
      // First, verify current password by attempting to sign in
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user?.email) {
        throw new Error('You must be logged in to change your password')
      }

      // Verify current password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: userData.user.email,
        password: data.currentPassword,
      })

      if (signInError) {
        throw new Error('Current password is incorrect')
      }

      // Update password
      await updatePassword(data.newPassword)

      setShowSuccess(true)
      form.reset()
    } catch (err: any) {
      console.error('Error changing password:', err)
      setError(err.message || 'Failed to change password. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <DashboardLayout showProfile={false}>
      <div className="flex flex-col gap-8 sm:gap-10 pb-10 min-h-[85vh]">
        <div className="flex items-center gap-4 sm:gap-6">
          <button onClick={() => navigate(-1)} className="p-2 bg-[#f5f6f7] rounded-lg hover:bg-[#eeeffd] transition-colors">
            <ChevronLeft className="w-5 h-5 text-[#98a2b3]" />
          </button>
          <h1 className="text-[18px] sm:text-[20px] font-bold text-black">Change Password</h1>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-6 sm:gap-8 pt-6 sm:pt-10">
            <FormField
              control={form.control}
              name="currentPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[#7a828f] text-[14px]">Current Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input 
                        type={showCurrentPassword ? 'text' : 'password'}
                        placeholder="********" 
                        className="border-0 border-b border-[#d0d5dd] rounded-none px-0 pr-8 h-11 focus-visible:ring-0 focus-visible:border-teal-primary text-[#101928]"
                        {...field}
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 text-[#98a2b3] hover:text-[#667185]"
                      >
                        {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[#7a828f] text-[14px]">New Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input 
                        type={showNewPassword ? 'text' : 'password'}
                        placeholder="********" 
                        className="border-0 border-b border-[#d0d5dd] rounded-none px-0 pr-8 h-11 focus-visible:ring-0 focus-visible:border-teal-primary text-[#101928]"
                        {...field}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 text-[#98a2b3] hover:text-[#667185]"
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[#7a828f] text-[14px]">Confirm New Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input 
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="********" 
                        className="border-0 border-b border-[#d0d5dd] rounded-none px-0 pr-8 h-11 focus-visible:ring-0 focus-visible:border-teal-primary text-[#101928]"
                        {...field}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 text-[#98a2b3] hover:text-[#667185]"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {error && (
              <div className="text-[13px] text-red-600 bg-red-50 p-3 rounded-lg">
                {error}
              </div>
            )}

            <Button 
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 rounded-full bg-teal-primary text-white font-semibold mt-auto disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Changing Password...
                </>
              ) : (
                'Change Password'
              )}
            </Button>
          </form>
        </Form>
      </div>

      {/* Success Modal */}
      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
        <DialogContent className="bg-white border-0 shadow-2xl rounded-[12px] p-10 max-w-[346px] mx-auto flex flex-col items-center gap-6">
          <div className="w-16 h-16 bg-teal-primary rounded-full flex items-center justify-center text-white">
            <Check className="w-8 h-8" />
          </div>
          <div className="text-center flex flex-col gap-2">
            <h3 className="text-[16px] font-bold text-black">Password Updated Successfully!</h3>
            <p className="text-[12px] text-[#8d8989]">Your Password has been updated successfully.</p>
          </div>
          <Button 
            onClick={() => {
              setShowSuccess(false)
              navigate('/settings')
            }}
            className="w-full bg-teal-primary text-white font-semibold rounded-full h-11"
          >
            Ok
          </Button>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}