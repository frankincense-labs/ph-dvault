import { useState, useEffect } from 'react'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import DashboardLayout from '@/components/DashboardLayout'
import AddRecordSheet from '@/components/AddRecordSheet'
import { useAuthStore } from '@/store/useAuthStore'
import { getRecords } from '@/lib/api/records'
import { supabase } from '@/lib/supabase'
import type { MedicalRecord, RecordCategory } from '@/types/database'

const categoryConfig: Record<RecordCategory, { label: string; icon: string; color: string; route: string }> = {
  allergies: { label: 'Allergies', icon: '/assets/allergy-icon.svg', color: '#ef4444', route: '/record/allergy' },
  chronic_conditions: { label: 'Chronic Conditions', icon: '/assets/chronic-icon.svg', color: '#8810a4', route: '/record/chronic' },
  lab_results: { label: 'Lab Results', icon: '/assets/lab-icon.svg', color: '#3b82f6', route: '/record/lab' },
  medications: { label: 'Medications', icon: '/assets/meds-icon.svg', color: '#f59e08', route: '/record/medication' },
  past_treatments: { label: 'Past Treatments', icon: '/assets/treatment-icon.svg', color: '#c026d3', route: '/record/treatment' },
  vaccinations: { label: 'Vaccinations', icon: '/assets/vaccine-icon.svg', color: '#10b880', route: '/record/vaccine' },
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { user, isAuthenticated, role } = useAuthStore()
  const [detailsVisible, setDetailsVisible] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<RecordCategory | undefined>(undefined)
  const [profile, setProfile] = useState<any>(null)
  const isDoctor = role === 'doctor'

  // Fetch user profile
  useEffect(() => {
    if (user?.id) {
      supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
        .then(({ data }) => setProfile(data))
    }
  }, [user])

  // Fetch records (only for patients - doctors access shared records differently)
  const { data: records = [], isLoading, error } = useQuery({
    queryKey: ['records', user?.id, selectedCategory],
    queryFn: () => getRecords(user!.id, selectedCategory),
    enabled: !!user?.id && isAuthenticated && !isDoctor,
  })

  const formatDate = (dateString: string | null) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' })
  }

  const formatRecordDate = (record: MedicalRecord) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    // If status is ongoing, don't show end date (or show "Ongoing" if end date is in past)
    if (record.status === 'ongoing') {
      if (record.start_date) {
        const startDate = new Date(record.start_date)
        startDate.setHours(0, 0, 0, 0)
        
        // If end_date exists and is in the past, don't show it (it's ongoing)
        if (record.end_date) {
          const endDate = new Date(record.end_date)
          endDate.setHours(0, 0, 0, 0)
          if (endDate < today) {
            // End date is in past but status is ongoing - just show start date
            return `Started ${formatDate(record.start_date)}`
          }
          // End date is in future - show range
          return `${formatDate(record.start_date)} - ${formatDate(record.end_date)}`
        }
        return `Started ${formatDate(record.start_date)}`
      }
      return record.description || 'Ongoing'
    }
    
    // For completed/archived records, show date range if available
    if (record.start_date && record.end_date) {
      return `${formatDate(record.start_date)} - ${formatDate(record.end_date)}`
    }
    if (record.start_date) {
      return `Started ${formatDate(record.start_date)}`
    }
    if (record.end_date) {
      return `Ended ${formatDate(record.end_date)}`
    }
    
    return record.description || 'No date'
  }

  const getCategoryRoute = (category: RecordCategory) => categoryConfig[category]?.route || '/record/medication'

  const filteredRecords = selectedCategory 
    ? records.filter(r => r.category === selectedCategory)
    : records

  const displayedRecords = filteredRecords.slice(0, 6) // Show max 6 records

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-5 sm:gap-6 lg:gap-10 w-full">
        {/* Basic Info Card - Only show for patients */}
        {!isDoctor && (
          <div className="bg-navy-dark rounded-[8px] p-3 sm:p-4 md:p-6 text-white relative overflow-hidden w-full animate-in fade-in slide-in-from-top-4">
          {/* Background SVGs simplified as styled divs for now or img if needed */}
            <div className="flex flex-col gap-4 sm:gap-6 relative z-10">
            <div className="flex items-center justify-between">
                <span className="text-[13px] sm:text-[14px] font-semibold text-[#98a2b3]">Basic Info</span>
                <button 
                  onClick={() => setDetailsVisible(!detailsVisible)} 
                  className="text-[#98a2b3] hover:text-white transition-all duration-200 p-1"
                  aria-label={detailsVisible ? "Hide details" : "Show details"}
                >
                  {detailsVisible ? (
                    <Eye className="w-5 h-5 text-white transition-all duration-200" />
                  ) : (
                    <EyeOff className="w-5 h-5 text-[#98a2b3] transition-all duration-200" />
                  )}
              </button>
            </div>

              <div className="flex items-center gap-3 sm:gap-4">
                {profile?.avatar_url && (
                  <img 
                    src={profile.avatar_url} 
                    alt={profile?.full_name || 'User'} 
                    className="w-10 h-10 sm:w-11 sm:h-11 rounded-full object-cover" 
                  />
                )}
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-[15px] sm:text-[16px] font-medium truncate">
                    {profile?.full_name || user?.full_name || 'User'}
                  </span>
                {detailsVisible ? (
                     (profile?.date_of_birth || profile?.gender) ? (
                       <div className="flex items-center gap-1 text-[12px] sm:text-[13px] text-[#98a2b3] flex-wrap">
                        {profile?.date_of_birth && (
                          <>
                            <span>{new Date().getFullYear() - new Date(profile.date_of_birth).getFullYear()} years</span>
                            {profile?.gender && (
                              <>
                    <span className="w-1 h-1 rounded-full bg-gray-400" />
                                <span>{profile.gender}</span>
                              </>
                            )}
                          </>
                        )}
                        {!profile?.date_of_birth && profile?.gender && (
                          <span>{profile.gender}</span>
                        )}
                   </div>
                     ) : (profile?.blood_group || profile?.genotype) ? (
                       <span className="text-[12px] sm:text-[13px] text-[#98a2b3]">View details below</span>
                     ) : (
                       <span className="text-[12px] sm:text-[13px] text-[#98a2b3]">No additional details available</span>
                     )
                ) : (
                    <>
                      <span className="text-[12px] sm:text-[13px] text-[#98a2b3]">Your Details are hidden</span>
                      <p className="text-[11px] sm:text-[12px] text-gray-400 mt-1">Tap the eye icon above to view</p>
                    </>
                )}
              </div>
            </div>

              {detailsVisible && (
                <div className="grid grid-cols-2 gap-3 sm:gap-4 mt-2">
                  {profile?.blood_group && (
                    <div className="flex flex-col">
                      <span className="text-[13px] sm:text-[14px] text-[#98a2b3]">Blood Group</span>
                      <span className="text-[13px] sm:text-[14px] font-medium">{profile.blood_group}</span>
                    </div>
                  )}
                  {profile?.genotype && (
                <div className="flex flex-col">
                      <span className="text-[13px] sm:text-[14px] text-[#98a2b3]">Genotype</span>
                      <span className="text-[13px] sm:text-[14px] font-medium">{profile.genotype}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Doctor Welcome Card */}
        {isDoctor && (
          <div className="bg-gradient-to-br from-teal-primary to-teal-600 rounded-[8px] p-4 sm:p-5 md:p-6 text-white relative overflow-hidden w-full animate-in fade-in slide-in-from-top-4">
            <div className="flex flex-col gap-3 sm:gap-4 relative z-10">
              <div className="flex items-center gap-3 sm:gap-4">
                {profile?.avatar_url && (
                  <img 
                    src={profile.avatar_url} 
                    alt={profile?.full_name || 'Doctor'} 
                    className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover border-2 border-white/30" 
                  />
                )}
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-[16px] sm:text-[18px] font-bold truncate">
                    {profile?.full_name || user?.full_name || 'Doctor'}
                  </span>
                  <span className="text-[13px] sm:text-[14px] text-white/80">
                    {profile?.specialization || 'Healthcare Professional'}
                  </span>
                </div>
              </div>
              <p className="text-[13px] sm:text-[14px] text-white/90">
                Access patient records securely using access links or codes provided by patients.
              </p>
            </div>
          </div>
        )}

        {/* Medical Information Section */}
        <div className="flex flex-col gap-3 sm:gap-4 md:gap-6 w-full animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: '100ms' }}>
          <h2 className="text-[14px] sm:text-[15px] md:text-[16px] font-semibold text-[#1a1a1a]">
            {isDoctor ? 'Patient Records' : 'Medical Information'}
          </h2>
          
          {/* Categories from FIGMA 10328 */}
          <div className="w-full overflow-x-auto pb-2 sm:pb-3 md:pb-4 scrollbar-hidden -mx-3 sm:-mx-4 md:mx-0 px-3 sm:px-4 md:px-0">
            <div className="flex gap-2 sm:gap-3 md:gap-4">
            {Object.entries(categoryConfig).map(([key, cat], index) => (
              <button 
                key={key}
                onClick={() => setSelectedCategory(selectedCategory === key ? undefined : key as RecordCategory)}
                className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 md:px-5 py-1.5 sm:py-2 md:py-2.5 rounded-full border whitespace-nowrap hover:bg-gray-50 hover:scale-105 active:scale-95 transition-all duration-200 shrink-0 animate-in fade-in slide-in-from-left-4 ${
                  selectedCategory === key 
                    ? 'border-teal-primary bg-teal-50 shadow-md' 
                    : 'border-[#dfe2e7]'
                }`}
                style={{ 
                  animationDelay: `${index * 30}ms`,
                  animationFillMode: 'both'
                }}
              >
                <div className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: cat.color }}>
                   <img src={cat.icon} alt="" className="w-2.5 sm:w-3 md:w-3.5 h-2.5 sm:h-3 md:h-3.5 invert" />
                </div>
                <span className="text-[12px] sm:text-[13px] md:text-[14px] font-medium text-[#444951]">{cat.label}</span>
              </button>
            ))}
            </div>
          </div>

          {/* Records List */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-teal-primary" />
                   </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-[14px] text-red-600 mb-2">Error loading records</p>
              <p className="text-[12px] text-[#8d8989]">Please try again later</p>
                   </div>
          ) : displayedRecords.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center animate-in fade-in">
              <div className="w-16 h-16 bg-[#f5f6f7] rounded-full flex items-center justify-center mb-4">
                <img src="/assets/meds-icon.svg" className="w-8 h-8 opacity-50" alt="" />
                </div>
              <h3 className="text-[16px] font-semibold text-black mb-2">
                {isDoctor 
                  ? 'No patient records accessed yet'
                  : selectedCategory 
                    ? `No ${categoryConfig[selectedCategory]?.label} records` 
                    : 'No medical records yet'
                }
              </h3>
              <p className="text-[13px] text-[#8d8989] mb-4">
                {isDoctor
                  ? 'Use access links or codes from patients to view their records'
                  : selectedCategory 
                    ? 'Add your first record to get started' 
                    : 'Start by adding your medical information'
                }
              </p>
              {isDoctor && (
                <button
                  onClick={() => navigate('/doctor-access')}
                  className="mt-4 px-6 py-2.5 bg-teal-primary text-white rounded-full font-semibold hover:bg-teal-600 transition-colors"
                >
                  Access Patient Record
                </button>
              )}
             </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 w-full">
              {displayedRecords.map((record: MedicalRecord, index) => {
                const config = categoryConfig[record.category]
                const dateRange = formatRecordDate(record)
                
                return (
                  <div 
                    key={record.id}
                    onClick={() => navigate(getCategoryRoute(record.category))}
                    className="flex items-center justify-between p-3 sm:p-4 md:p-5 bg-[#f5f6f7] rounded-xl cursor-pointer hover:bg-[#eef2f2] hover:shadow-md active:scale-[0.98] transition-all duration-200 w-full animate-in fade-in slide-in-from-bottom-4"
                    style={{ 
                      animationDelay: `${index * 50}ms`,
                      animationFillMode: 'both'
                    }}
             >
                    <div className="flex items-center gap-2 sm:gap-3 md:gap-4 min-w-0 flex-1">
                      <div 
                        className="w-9 h-9 sm:w-10 sm:h-10 md:w-11 md:h-11 rounded-lg flex items-center justify-center shrink-0"
                        style={{ backgroundColor: config.color + '20' }}
                      >
                        <img src={config.icon} className="w-4 sm:w-5 md:w-6 h-4 sm:h-5 md:h-6 invert opacity-70" alt="" />
                   </div>
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="text-[14px] sm:text-[15px] md:text-[16px] font-medium truncate">{record.title}</span>
                        <span className="text-[10px] sm:text-[11px] md:text-[12px] text-[#868484] truncate">{dateRange}</span>
                   </div>
                </div>
                    <span className={`px-2 sm:px-2.5 md:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-[11px] md:text-[12px] font-semibold shrink-0 ml-1 sm:ml-2 capitalize ${
                      record.status === 'ongoing' 
                        ? 'bg-[#eef2f2] text-teal-primary' 
                        : record.status === 'completed'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {record.status}
                    </span>
             </div>
                )
              })}
          </div>
          )}
        </div>
      </div>

      {/* Floating Action Button (Drawer) - Only for patients */}
      {!isDoctor && <AddRecordSheet />}
    </DashboardLayout>
  )
}