import { useState, useEffect } from 'react'
import { ChevronLeft, Calendar, ChevronRight, Loader2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '@/components/DashboardLayout'
import { supabase } from '@/lib/supabase'
import type { MedicalRecord, RecordCategory } from '@/types/database'

const categoryConfig: Record<RecordCategory, { label: string; icon: string; color: string }> = {
  allergies: { label: 'Allergy', icon: '/assets/allergy-icon.svg', color: '#ef4444' },
  chronic_conditions: { label: 'Chronic Condition', icon: '/assets/chronic-icon.svg', color: '#8810a4' },
  lab_results: { label: 'Lab Result', icon: '/assets/lab-icon.svg', color: '#3b82f6' },
  medications: { label: 'Medication', icon: '/assets/meds-icon.svg', color: '#f59e08' },
  past_treatments: { label: 'Treatment', icon: '/assets/treatment-icon.svg', color: '#c026d3' },
  vaccinations: { label: 'Vaccination', icon: '/assets/vaccine-icon.svg', color: '#10b880' },
}

interface PatientProfile {
  id: string
  full_name: string | null
  phone: string | null
  avatar_url: string | null
  gender: string | null
  date_of_birth: string | null
  blood_group: string | null
  genotype: string | null
}

export default function PatientDetails() {
  const navigate = useNavigate()
  const [records, setRecords] = useState<MedicalRecord[]>([])
  const [patientProfile, setPatientProfile] = useState<PatientProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadSharedData = async () => {
      try {
        // Get shared records from session storage
        const sharedRecordsStr = sessionStorage.getItem('sharedRecords')
        const shareTokenStr = sessionStorage.getItem('shareToken')

        if (!sharedRecordsStr || !shareTokenStr) {
          setError('No shared records found. Please access records using a valid share link.')
          setIsLoading(false)
          return
        }

        const sharedRecords = JSON.parse(sharedRecordsStr) as MedicalRecord[]
        const shareToken = JSON.parse(shareTokenStr)

        setRecords(sharedRecords)

        // Fetch the patient's profile using the user_id from the share token
        if (shareToken?.user_id) {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('id, full_name, phone, avatar_url, gender, date_of_birth, blood_group, genotype')
            .eq('id', shareToken.user_id)
            .single()

          if (profileError) {
            console.error('Error fetching patient profile:', profileError)
          } else if (profile) {
            setPatientProfile(profile)
          }
        }
      } catch (err) {
        console.error('Error loading shared data:', err)
        setError('Failed to load patient records.')
      } finally {
        setIsLoading(false)
      }
    }

    loadSharedData()
  }, [])

  const calculateAge = (dateOfBirth: string | null) => {
    if (!dateOfBirth) return null
    const today = new Date()
    const birthDate = new Date(dateOfBirth)
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' })
  }

  const formatRecordDate = (record: MedicalRecord) => {
    if (record.start_date && record.end_date) {
      return `${formatDate(record.start_date)} - ${formatDate(record.end_date)}`
    }
    if (record.start_date) {
      return `Started ${formatDate(record.start_date)}`
    }
    return formatDate(record.created_at)
  }

  const handleRecordClick = (record: MedicalRecord) => {
    // Store the record in session storage for the detail page
    sessionStorage.setItem('viewingRecord', JSON.stringify(record))
    
    // Navigate to the appropriate detail page
    const routeMap: Record<RecordCategory, string> = {
      allergies: '/record/allergy',
      chronic_conditions: '/record/chronic',
      lab_results: '/record/lab',
      medications: '/record/medication',
      past_treatments: '/record/treatment',
      vaccinations: '/record/vaccine',
    }
    navigate(routeMap[record.category] + `?id=${record.id}`)
  }

  if (isLoading) {
    return (
      <DashboardLayout showProfile={false}>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-teal-primary" />
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout showProfile={false}>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-[14px] text-red-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/doctor-access')}
            className="text-teal-primary font-semibold hover:underline"
          >
            Go back to access page
          </button>
        </div>
      </DashboardLayout>
    )
  }

  const age = calculateAge(patientProfile?.date_of_birth || null)

  return (
    <DashboardLayout showProfile={false}>
      <div className="flex flex-col gap-8 sm:gap-10 pb-10">
        {/* Header */}
        <div className="flex items-center gap-4 sm:gap-6">
          <button 
            onClick={() => navigate(-1)} 
            className="p-2 bg-[#f5f6f7] rounded-lg hover:bg-[#eeeffd] transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-[#98a2b3]" />
          </button>
          <h1 className="text-[18px] sm:text-[20px] font-bold text-[#1a1a1a]">Patient Details</h1>
        </div>

        {/* Profile Info */}
        <div className="flex flex-col items-center gap-4">
          {patientProfile?.avatar_url ? (
            <img 
              src={patientProfile.avatar_url} 
              alt={patientProfile.full_name || 'Patient'} 
              className="w-[90px] h-[90px] sm:w-[100px] sm:h-[100px] rounded-full object-cover border-4 border-white shadow-lg" 
            />
          ) : (
            <div className="w-[90px] h-[90px] sm:w-[100px] sm:h-[100px] rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg">
              {patientProfile?.full_name?.charAt(0) || 'P'}
            </div>
          )}
          <div className="text-center">
            <h2 className="text-[16px] sm:text-[18px] font-semibold text-[#1a1a1a]">
              {patientProfile?.full_name || 'Patient'}
            </h2>
            {patientProfile?.phone && (
              <p className="text-[13px] sm:text-[14px] text-[#868484]">{patientProfile.phone}</p>
            )}
          </div>
        </div>

        {/* Quick Stats Grid */}
        {(patientProfile?.gender || age || patientProfile?.blood_group || patientProfile?.genotype) && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {patientProfile?.gender && (
              <div className="flex flex-col items-center gap-1 p-3 bg-[#f5f6f7] rounded-xl">
                <span className="text-[15px] sm:text-[16px] font-semibold text-[#1a1a1a]">{patientProfile.gender}</span>
                <span className="text-[11px] sm:text-[12px] text-[#868484]">Gender</span>
              </div>
            )}
            {age && (
              <div className="flex flex-col items-center gap-1 p-3 bg-[#f5f6f7] rounded-xl">
                <span className="text-[15px] sm:text-[16px] font-semibold text-[#1a1a1a]">{age}</span>
                <span className="text-[11px] sm:text-[12px] text-[#868484]">Age</span>
              </div>
            )}
            {patientProfile?.blood_group && (
              <div className="flex flex-col items-center gap-1 p-3 bg-[#f5f6f7] rounded-xl">
                <span className="text-[15px] sm:text-[16px] font-semibold text-[#1a1a1a]">{patientProfile.blood_group}</span>
                <span className="text-[11px] sm:text-[12px] text-[#868484]">Blood Group</span>
              </div>
            )}
            {patientProfile?.genotype && (
              <div className="flex flex-col items-center gap-1 p-3 bg-[#f5f6f7] rounded-xl">
                <span className="text-[15px] sm:text-[16px] font-semibold text-[#1a1a1a]">{patientProfile.genotype}</span>
                <span className="text-[11px] sm:text-[12px] text-[#868484]">Genotype</span>
              </div>
            )}
          </div>
        )}

        {/* Medical Records Section */}
        <div className="flex flex-col gap-4 sm:gap-6">
          <h3 className="text-[15px] sm:text-[16px] font-semibold text-black">
            Medical Information ({records.length} record{records.length !== 1 ? 's' : ''})
          </h3>
          
          {records.length === 0 ? (
            <p className="text-[14px] text-[#8d8989] py-4">No records shared.</p>
          ) : (
            <div className="flex flex-col gap-3 sm:gap-4">
              {records.map((record) => {
                const config = categoryConfig[record.category]
                return (
                  <div 
                    key={record.id} 
                    onClick={() => handleRecordClick(record)}
                    className="flex items-center gap-3 sm:gap-4 bg-[#f5f6f7] p-3 sm:p-4 rounded-xl cursor-pointer hover:bg-[#eeeffd] hover:shadow-md transition-all duration-200 active:scale-[0.99]"
                  >
                    <div 
                      className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: config.color }}
                    >
                      <img src={config.icon} alt="" className="w-5 h-5 sm:w-6 sm:h-6 invert" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-[14px] sm:text-[15px] font-medium text-[#1a1a1a] truncate">{record.title}</h4>
                      <p className="text-[12px] sm:text-[13px] text-[#868484]">{config.label}</p>
                      {(record.start_date || record.end_date) && (
                        <div className="flex items-center gap-2 mt-1 text-[11px] sm:text-[12px] text-[#868484]">
                          <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                          <span>{formatRecordDate(record)}</span>
                        </div>
                      )}
                    </div>
                    <ChevronRight className="w-5 h-5 text-[#98a2b3] shrink-0" />
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
