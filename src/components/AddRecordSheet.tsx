import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogTrigger 
} from '@/components/ui/dialog'
import { Plus } from 'lucide-react'

export default function AddRecordSheet() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  const recordTypes = [
    { label: 'Allergies', icon: '/assets/allergy-icon.svg', color: '#ef4444', path: '/add/allergies' },
    { label: 'Chronic Condition', icon: '/assets/chronic-icon.svg', color: '#8810a4', path: '/add/chronic' },
    { label: 'Lab Results', icon: '/assets/lab-icon.svg', color: '#3b82f6', path: '/add/lab' },
    { label: 'Medications', icon: '/assets/meds-icon.svg', color: '#f59e08', path: '/add/medication' },
    { label: 'Past Treatments', icon: '/assets/treatment-icon.svg', color: '#c026d3', path: '/add/treatment' },
    { label: 'Vaccinations', icon: '/assets/vaccine-icon.svg', color: '#10b880', path: '/add/vaccine' },
  ]

  const handleNavigate = (path: string) => {
    setOpen(false)
    // Small delay for smooth modal close animation
    setTimeout(() => navigate(path), 150)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button 
          className="fixed bottom-20 sm:bottom-32 right-4 sm:right-6 w-14 h-14 sm:w-16 sm:h-16 bg-teal-primary rounded-full flex items-center justify-center text-white shadow-xl hover:shadow-2xl hover:bg-teal-600 active:scale-95 transition-all duration-300 z-10 lg:bottom-28 animate-in fade-in slide-in-from-bottom-4"
          aria-label="Add new record"
        >
          <Plus className="w-6 h-6 sm:w-7 sm:h-7 transition-transform duration-300 group-hover:rotate-90" />
        </button>
      </DialogTrigger>
      <DialogContent className="bg-white border-0 shadow-2xl rounded-[12px] p-4 sm:p-6 max-w-[90vw] sm:max-w-[420px] mx-auto" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle className="text-[18px] font-bold text-black">Add Record</DialogTitle>
            <DialogDescription className="text-[14px] text-[#8d8989] pt-2">
              Select a category to add a new medical record
            </DialogDescription>
          </DialogHeader>
        
        <div className="grid grid-cols-2 gap-3 mt-4">
          {recordTypes.map((type, index) => (
            <button
              key={type.label}
              onClick={() => handleNavigate(type.path)}
              className="flex flex-col items-center justify-center gap-3 p-4 min-h-[100px] bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200 hover:border-teal-primary/40 hover:shadow-md active:scale-[0.98] transition-all duration-200 group"
              style={{ 
                animationDelay: `${index * 50}ms`,
              }}
            >
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center transition-transform duration-200 group-hover:scale-110"
                style={{ 
                  backgroundColor: type.color,
                  boxShadow: `0 4px 12px 0 ${type.color}30`
                }}
              >
                <img 
                  src={type.icon} 
                  alt="" 
                  className="w-5 h-5 invert" 
                />
              </div>
              <span className="text-[13px] font-semibold text-gray-900 text-center leading-tight">
                {type.label}
              </span>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
