import { useNavigate } from 'react-router-dom'
import { Check } from 'lucide-react'
import DashboardLayout from '@/components/DashboardLayout'
import { Button } from '@/components/ui/button'

export default function AuthSuccess() {
  const navigate = useNavigate()

  return (
    <DashboardLayout showProfile={false}>
      <div className="flex flex-col gap-8 pb-10 h-full min-h-[80vh] items-center justify-center text-center">
        <div className="w-24 h-24 bg-teal-primary rounded-full flex items-center justify-center text-white mb-4">
          <Check className="w-12 h-12" />
        </div>

        <div className="flex flex-col gap-4">
          <h1 className="text-[20px] font-bold text-black">Your account has been created!</h1>
          <p className="text-[14px] text-[#1a1a1a] max-w-[370px]">
            You’re all set. You can now securely upload and manage your medical records, share them with doctors, and access emergency info anytime.
          </p>
        </div>

        <div className="w-full mt-20">
          <Button 
            onClick={() => navigate('/dashboard')}
            className="w-full h-12 rounded-full bg-teal-primary text-white font-semibold"
          >
            Proceed to Dashboard
          </Button>
        </div>
      </div>
    </DashboardLayout>
  )
}