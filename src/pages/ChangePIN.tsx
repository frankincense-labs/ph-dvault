import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Delete, Check, Loader2 } from 'lucide-react'
import DashboardLayout from '@/components/DashboardLayout'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { updateUserPIN } from '@/lib/api/account'

export default function ChangePIN() {
  const navigate = useNavigate()
  const [pin, setPin] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleKeyPress = (val: string) => {
    if (pin.length < 4) {
      setPin(prev => prev + val)
      setError(null)
    }
  }

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1))
    setError(null)
  }

  const handleSave = async () => {
    if (pin.length === 4) {
      setIsLoading(true)
      setError(null)
      
      try {
        await updateUserPIN(pin)
        setShowSuccess(true)
      } catch (err: any) {
        console.error('Failed to save PIN:', err)
        setError(err.message || 'Failed to save PIN. Please try again.')
      } finally {
        setIsLoading(false)
      }
    }
  }

  return (
    <DashboardLayout showProfile={false}>
      <div className="flex flex-col gap-8 sm:gap-10 pb-10 min-h-[85vh]">
        <div className="flex items-center gap-4 sm:gap-6">
          <button onClick={() => navigate(-1)} className="p-2 bg-[#f5f6f7] rounded-lg hover:bg-[#eeeffd] transition-colors">
            <ChevronLeft className="w-5 h-5 text-[#98a2b3]" />
          </button>
          <h1 className="text-[18px] sm:text-[20px] font-bold text-black">Change PIN</h1>
        </div>

        <div className="flex-1 flex flex-col items-center gap-6 sm:gap-10 pt-6 sm:pt-10">
          <div className="text-center flex flex-col gap-2">
            <h2 className="text-[15px] sm:text-[16px] font-medium text-black">Enter your new 4-digit PIN</h2>
          </div>

          {/* PIN Indicators */}
          <div className="flex gap-3 sm:gap-4">
            {[0, 1, 2, 3].map((i) => (
              <div 
                key={i} 
                className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${pin.length > i ? 'bg-teal-primary border-teal-primary scale-110' : 'border-[#d0d5dd]'}`} 
              />
            ))}
          </div>

          {/* Number Pad */}
          <div className="grid grid-cols-3 gap-x-8 sm:gap-x-12 gap-y-6 sm:gap-y-8 mt-6 sm:mt-10">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
              <button 
                key={num} 
                onClick={() => handleKeyPress(num)}
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-full text-[22px] sm:text-[25px] text-black hover:bg-gray-100 active:bg-gray-200 transition-colors flex items-center justify-center"
              >
                {num}
              </button>
            ))}
            <div /> {/* Spacer */}
            <button 
              onClick={() => handleKeyPress('0')}
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-full text-[22px] sm:text-[25px] text-black hover:bg-gray-100 active:bg-gray-200 transition-colors flex items-center justify-center"
            >
              0
            </button>
            <button 
              onClick={handleDelete}
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-full text-black hover:bg-gray-100 active:bg-gray-200 transition-colors flex items-center justify-center"
            >
              <Delete className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm text-center">
              {error}
            </div>
          )}
        </div>

        <Button 
          disabled={pin.length < 4 || isLoading}
          onClick={handleSave}
          className="w-full h-12 rounded-full bg-teal-primary text-white font-semibold mt-auto disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            'Save PIN'
          )}
        </Button>
      </div>

      {/* Success Modal */}
      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
        <DialogContent className="bg-white border-0 shadow-2xl rounded-[12px] p-10 max-w-[346px] mx-auto flex flex-col items-center gap-6">
          <div className="w-16 h-16 bg-teal-primary rounded-full flex items-center justify-center text-white">
            <Check className="w-8 h-8" />
          </div>
          <div className="text-center flex flex-col gap-2">
            <h3 className="text-[16px] font-bold text-black">PIN Updated Successfully!</h3>
            <p className="text-[12px] text-[#8d8989]">Your PIN has been updated successfully.</p>
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