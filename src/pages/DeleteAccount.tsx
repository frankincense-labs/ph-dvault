import { useState } from 'react'
import { ChevronLeft, Trash2, AlertTriangle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '@/components/DashboardLayout'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/store/useAuthStore'

export default function DeleteAccount() {
  const navigate = useNavigate()
  const { logout } = useAuthStore()
  const [step, setStep] = useState(1) // 1: Warning, 2: Confirmation
  const [reason, setReason] = useState('')
  const [confirmText, setConfirmText] = useState('')
  const [password, setPassword] = useState('')

  const reasons = [
    'I no longer need this service',
    'Privacy concerns',
    'I want to start fresh',
    'Too many issues',
    'Other'
  ]

  const handleDelete = async () => {
    if (confirmText.toLowerCase() !== 'delete') {
      alert('Please type "DELETE" to confirm')
      return
    }

    if (!password) {
      alert('Please enter your password')
      return
    }

    // TODO: Call API to delete account
    // await deleteAccountAPI(password, reason)
    
    // Logout and redirect
    await logout()
    navigate('/signin', { 
      state: { message: 'Your account and all data have been permanently deleted.' }
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
            <Trash2 className="w-5 h-5 text-[#d42620]" />
            <h1 className="text-[18px] sm:text-[20px] font-bold text-black">Delete Account</h1>
          </div>
        </div>

        {step === 1 ? (
          <>
            {/* Warning */}
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div className="flex flex-col gap-2">
                  <h3 className="text-[14px] font-semibold text-red-900">This Action Cannot Be Undone</h3>
                  <ul className="text-[13px] text-red-800 space-y-1 list-disc list-inside">
                    <li>All your medical records will be permanently deleted</li>
                    <li>All shared links and codes will be invalidated</li>
                    <li>Your account cannot be recovered</li>
                    <li>This action is immediate and irreversible</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Reason Selection */}
            <div className="flex flex-col gap-4">
              <h2 className="text-[16px] font-semibold text-black">Why are you deleting your account?</h2>
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
                  <h3 className="text-[14px] font-semibold text-red-900">Final Warning</h3>
                  <p className="text-[13px] text-red-800">
                    This will permanently delete your account and all data. Type <strong>"DELETE"</strong> to confirm.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-[14px] font-medium text-black">Type "DELETE" to confirm</label>
                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="DELETE"
                  className="w-full px-4 py-3 border-2 border-[#f5f6f7] rounded-lg focus:outline-none focus:border-teal-primary text-[14px]"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[14px] font-medium text-black">Enter your password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full px-4 py-3 border-2 border-[#f5f6f7] rounded-lg focus:outline-none focus:border-teal-primary text-[14px]"
                />
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <Button 
                onClick={handleDelete}
                disabled={confirmText.toLowerCase() !== 'delete' || !password}
                className="w-full h-12 rounded-full bg-[#d42620] text-white font-semibold disabled:opacity-50"
              >
                Permanently Delete Account
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
