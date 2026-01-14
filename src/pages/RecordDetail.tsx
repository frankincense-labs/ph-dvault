import { useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, AlertCircle } from 'lucide-react'
import DashboardLayout from '@/components/DashboardLayout'
import { Button } from '@/components/ui/button'

export default function RecordDetail() {
  const navigate = useNavigate()
  const { type } = useParams()

  // Mock data matching the FIGMA detail screens
  const data = {
    title: type === 'allergy' ? 'Lactose Intolerance' : 'Paracetamol',
    subtitle: type === 'allergy' ? 'Allergy' : 'Medication',
    icon: type === 'allergy' ? '/assets/allergy-icon.svg' : '/assets/meds-icon.svg',
    color: type === 'allergy' ? '#ef4444' : '#f59e08',
    sections: [
      { label: 'Triggers', value: 'Dairy Products, Plant Milk, Mayonnaise', show: type === 'allergy' },
      { label: 'Dosage', value: '1 morning / 1 night • Daily', show: type !== 'allergy' },
      { label: 'Strength', value: '10mg', show: type !== 'allergy' },
      { label: 'Duration', value: '20/08/2025 - 27/08/2025 (Ongoing)', show: type !== 'allergy' },
      { label: 'Prescribed for', value: 'Malaria', show: type !== 'allergy' },
      { label: 'Notes', value: 'I took one tablet once daily in the morning after eating. I also took the drug at the same time each day for best results.' },
    ],
    sideEffects: ['Nausea', 'Anorexia', 'Tiredness', 'Insomnia', 'Rashes']
  }

  return (
    <DashboardLayout showProfile={false}>
      <div className="flex flex-col gap-6 sm:gap-8 pb-10">
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-4 sm:gap-6 min-w-0 flex-1">
            <button onClick={() => navigate(-1)} className="p-2 bg-[#f5f6f7] rounded-lg hover:bg-[#eeeffd] transition-colors shrink-0">
              <ChevronLeft className="w-5 h-5 text-[#98a2b3]" />
            </button>
            <h1 className="text-[18px] sm:text-[20px] font-bold text-black truncate">{data.title}</h1>
          </div>
          <Button 
            variant="ghost" 
            className="text-teal-primary font-bold shrink-0 text-sm sm:text-base"
            onClick={() => {
              // Navigate to the appropriate edit page based on record type
              const editRoutes: Record<string, string> = {
                'allergy': '/add/allergies',
                'chronic': '/add/chronic',
                'lab': '/add/lab',
                'medication': '/add/medication',
                'treatment': '/add/treatment',
                'vaccine': '/add/vaccine'
              }
              const editRoute = editRoutes[type || ''] || '/dashboard'
              navigate(editRoute)
            }}
          >
            Edit
          </Button>
        </div>

        {/* Info Card */}
        <div className="bg-[#f5f6f7] p-4 sm:p-6 rounded-xl flex items-center gap-4 sm:gap-6">
           <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl flex items-center justify-center shadow-sm shrink-0" style={{ backgroundColor: data.color }}>
              <img src={data.icon} alt="" className="w-7 h-7 sm:w-8 sm:h-8 invert" />
           </div>
           <div className="flex flex-col min-w-0 flex-1">
              <span className="text-[16px] sm:text-[18px] font-bold text-navy-dark truncate">{data.title}</span>
              <span className="text-[13px] sm:text-[14px] text-[#868484]">{data.subtitle}</span>
           </div>
        </div>

        {/* Details List */}
        <div className="flex flex-col gap-6 sm:gap-8">
           {data.sections.filter(s => s.show !== false).map((section, i) => (
             <div key={i} className="flex flex-col gap-2">
                <span className="text-[16px] font-semibold text-black">{section.label}</span>
                <p className="text-[14px] text-[#35393f] leading-relaxed">{section.value}</p>
             </div>
           ))}

           <div className="flex flex-col gap-3 sm:gap-4">
              <span className="text-[15px] sm:text-[16px] font-semibold text-black">Side Effects</span>
              <div className="flex flex-wrap gap-2">
                 {data.sideEffects.map((effect) => (
                   <span key={effect} className="px-3 sm:px-4 py-1.5 sm:py-2 bg-white border border-[#dfe2e7] rounded-full text-[11px] sm:text-[12px] font-medium text-[#35393f]">
                      {effect}
                   </span>
                 ))}
              </div>
           </div>
        </div>

        {/* Warning/Alert box from FIGMA 10333 */}
        <div className="bg-navy-dark p-4 sm:p-6 rounded-[12px] flex flex-col gap-3 sm:gap-4">
           <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#cb1a14] rounded-lg flex items-center justify-center">
                 <AlertCircle className="w-5 h-5 text-white" />
              </div>
              <span className="text-[14px] text-[#98a2b3] font-medium">Important Information</span>
           </div>
           <p className="text-[14px] text-[#98a2b3] leading-relaxed">
             {data.title} may cause nausea, stomach upset, or rash. Rare but serious effects need urgent medical care.
           </p>
        </div>
      </div>
    </DashboardLayout>
  )
}