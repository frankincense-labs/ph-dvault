import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Drawer, 
  DrawerContent, 
  DrawerHeader, 
  DrawerTitle,
  DrawerDescription,
  DrawerTrigger 
} from '@/components/ui/drawer'
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
    // Small delay for smooth drawer close animation
    setTimeout(() => navigate(path), 150)
  }

  return (
    <Drawer open={open} onOpenChange={setOpen} modal={true}>
      <DrawerTrigger asChild>
        <button 
          className="fixed bottom-20 sm:bottom-32 right-4 sm:right-6 w-14 h-14 sm:w-16 sm:h-16 bg-teal-primary rounded-full flex items-center justify-center text-white shadow-xl hover:shadow-2xl hover:bg-teal-600 active:scale-95 transition-all duration-300 z-10 lg:bottom-28 animate-in fade-in slide-in-from-bottom-4"
          aria-label="Add new record"
        >
          <Plus className="w-6 h-6 sm:w-7 sm:h-7 transition-transform duration-300 group-hover:rotate-90" />
        </button>
      </DrawerTrigger>
      <DrawerContent className="bg-white px-4 sm:px-5 pb-6 sm:pb-10 max-w-screen-sm mx-auto rounded-t-3xl border-t-0 safe-area-bottom">
        <DrawerHeader className="px-0 pt-4 pb-3 sm:pt-6 sm:pb-5 w-full">
          <DrawerTitle className="text-left text-[20px] sm:text-[24px] font-bold text-[#1a1a1a] mb-1.5 sm:mb-2 w-full">
            Add Record
          </DrawerTitle>
          <DrawerDescription className="text-left text-[13px] sm:text-[15px] text-[#667185] leading-relaxed mt-0">
            Select a category to add a new medical record
          </DrawerDescription>
        </DrawerHeader>
        
        <div className="grid grid-cols-2 gap-2.5 sm:gap-3 pb-1 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {recordTypes.map((type, index) => (
            <button
              key={type.label}
              onClick={() => handleNavigate(type.path)}
              className="flex flex-col items-center justify-center gap-1.5 sm:gap-2 p-2.5 sm:p-3.5 min-h-[80px] sm:min-h-[90px] bg-gradient-to-br from-white to-[#f8f9fa] rounded-lg border border-[#e5e7eb] hover:border-teal-primary/30 hover:shadow-md hover:shadow-teal-primary/10 active:scale-[0.98] transition-all duration-300 group animate-in fade-in slide-in-from-bottom-4"
              style={{ 
                animationDelay: `${index * 50}ms`,
                animationFillMode: 'both'
              }}
            >
              <div 
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg shrink-0"
                style={{ 
                  backgroundColor: type.color,
                  boxShadow: `0 2px 8px 0 ${type.color}40`
                }}
              >
                <img 
                  src={type.icon} 
                  alt="" 
                  className="w-4 h-4 sm:w-4.5 sm:h-4.5 invert transition-transform duration-300 group-hover:scale-110" 
                />
              </div>
              <span className="text-[11px] sm:text-[13px] font-semibold text-[#1a1a1a] text-center leading-tight px-0.5">
                {type.label}
              </span>
            </button>
          ))}
        </div>
      </DrawerContent>
    </Drawer>
  )
}