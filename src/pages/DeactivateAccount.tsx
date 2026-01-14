import { useState } from 'react'
import { ChevronLeft, UserMinus, AlertTriangle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '@/components/DashboardLayout'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/store/useAuthStore'

export default function DeactivateAccount() {
  const navigate = useNavigate()
  const { logout } = useAuthStore()
  const [step, setStep] = useState(1) // 1: Warning, 2: Confirmation
  const [reason, setReason] = useState('')
  const [confirmText, setConfirmText] = useState('')

  const reasons = [
    'I no longer need this service',
    'I found a better alternative',
    'Privacy concerns',
    'Too expensive',
    'Other'
  ]

  const handleDeactivate = async () => {
    if (confirmText.toLowerCase() !== 'deactivate') {
      alert('Please type "DEACTIVATE" to confirm')
      return
    }

    // TODO: Call API to deactivate account
    // await deactivateAccountAPI(reason)
    
    // Logout and redirect
    await logout()
    navigate('/signin', { 
      state: { message: 'Your account has been deactivated. You can reactivate it by signing in again.' }
    })
  }

  return (
    <DashboardLayout showProfile={false}>
      <div className="flex flex-col gap-6 sm:gap-8 pb-10">
        {/* Header */}
        <div className="flex items-center gap-4 sm:gap-6">
          <button onClick={() => navigate(-1)} className="p-2 bg-[#f5f6f7] rounded-lg hover:bg-[#eeeffd] transition-colors">
            <ChevronLeft className="w-5 h-5 text-[#98a2b3]" />
          </button>
          <div className="flex items-center gap-2">
            <UserMinus className="w-5 h-5 text-[#d42620]" />
            <h1 className="text-[18px] sm:text-[20px] font-bold text-black">Deactivate Account</h1>
          </div>
        </div>

        {step === 1 ? (
          <>
            {/* Warning */}
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div className="flex flex-col gap-2">
                  <h3 className="text-[14px] font-semibold text-red-900">Before You Go</h3>
                  <ul className="text-[13px] text-red-800 space-y-1 list-disc list-inside">
                    <li>Your account will be deactivated, not deleted</li>
                    <li>You can reactivate by signing in again</li>
                    <li>Your data will be preserved for 30 days</li>
                    <li>After 30 days, your data may be permanently deleted</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Reason Selection */}
            <div className="flex flex-col gap-4">
              <h2 className="text-[16px] font-semibold text-black">Why are you deactivating?</h2>
              <div className="flex flex-col gap-3">
                {reasons.map((r) => (
                  <button
                    key={r}
                    onClick={() => setReason(r)}
                    className={`p-3 text-left rounded-lg border-2 transition-colors ${
                      reason === r 
                        ? 'border-teal-primary bg-teal-50' 
                        : 'border-[#f5f6f7] bg-white hover:border-gray-300'
                    }`}
                  >
                    <span className="text-[14px] text-black">{r}</span>
                  </button>
                ))}
              </div>
            </div>

            <Button 
              onClick={() => setStep(2)}
              disabled={!reason}
              className="w-full h-12 rounded-full bg-[#d42620] text-white font-semibold mt-4 disabled:opacity-50"
            >
              Continue
            </Button>
          </>
        ) : (
          <>
            {/* Final Confirmation */}
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div className="flex flex-col gap-1">
                  <h3 className="text-[14px] font-semibold text-red-900">Final Confirmation</h3>
                  <p className="text-[13px] text-red-800">
                    This action will deactivate your account. Type <strong>"DEACTIVATE"</strong> to confirm.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-[14px] font-medium text-black">Type "DEACTIVATE" to confirm</label>
                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="DEACTIVATE"
                  className="w-full px-4 py-3 border-2 border-[#f5f6f7] rounded-lg focus:outline-none focus:border-teal-primary text-[14px]"
                />
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <Button 
                onClick={handleDeactivate}
                disabled={confirmText.toLowerCase() !== 'deactivate'}
                className="w-full h-12 rounded-full bg-[#d42620] text-white font-semibold disabled:opacity-50"
              >
                Deactivate Account
              </Button>
              <Button 
                variant="ghost"
                onClick={() => setStep(1)}
                className="w-full text-[#8d8989]"
              >
                Cancel
              </Button>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
