import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import DashboardLayout from '@/components/DashboardLayout'
import { Button } from '@/components/ui/button'

export default function FaceIDVerification() {
  const navigate = useNavigate()
  const [status, setStatus] = useState<'scanning' | 'success'>('scanning')

  useEffect(() => {
    const timer = setTimeout(() => setStatus('success'), 3000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <DashboardLayout showProfile={false}>
      <div className="flex flex-col gap-8 pb-10 h-full min-h-[80vh]">
        <div className="flex items-center gap-6">
          <button onClick={() => navigate(-1)} className="p-2 bg-[#f5f6f7] rounded-lg">
            <ChevronLeft className="w-5 h-5 text-[#98a2b3]" />
          </button>
          <h1 className="text-[20px] font-bold text-black">Verify Face ID to continue</h1>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center gap-12 pt-10">
          <div className="relative">
             <img src="/assets/face-id-scan.svg" alt="Face ID" className={`w-64 h-64 transition-opacity duration-500 ${status === 'success' ? 'opacity-0' : 'opacity-100'}`} />
             {status === 'success' && (
               <img src="/assets/verify-success.svg" alt="Success" className="w-64 h-64 absolute inset-0 transition-opacity duration-500 opacity-100" />
             )}
          </div>

          <div className="text-center flex flex-col gap-2">
            <h2 className={`text-[20px] font-bold ${status === 'success' ? 'text-teal-primary' : 'text-black'}`}>
              {status === 'scanning' ? 'Verifying face ID...' : 'Face ID verified successfully!'}
            </h2>
            <p className="text-[12px] text-[#1a1a1a] max-w-[338px]">
              Be assured that all your information is secure and readily available. Your privacy is utmost priority.
            </p>
          </div>
        </div>

        <div className="mt-auto">
          {status === 'success' ? (
            <Button 
              onClick={() => navigate('/auth-success')}
              className="w-full h-12 rounded-full bg-teal-primary text-white font-semibold"
            >
              Continue
            </Button>
          ) : (
            <Button variant="ghost" onClick={() => navigate(-1)} className="w-full text-[#1a1a1a] font-semibold">
              Go Back
            </Button>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}