import { useState, useEffect } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ChevronLeft, AlertCircle, Loader2, FileText, Download } from 'lucide-react'
import DashboardLayout from '@/components/DashboardLayout'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/store/useAuthStore'
import { getRecord } from '@/lib/api/records'
import type { MedicalRecord, RecordCategory } from '@/types/database'

const categoryConfig: Record<RecordCategory, { label: string; icon: string; color: string }> = {
  allergies: { label: 'Allergy', icon: '/assets/allergy-icon.svg', color: '#ef4444' },
  chronic_conditions: { label: 'Chronic Condition', icon: '/assets/chronic-icon.svg', color: '#8810a4' },
  lab_results: { label: 'Lab Result', icon: '/assets/lab-icon.svg', color: '#3b82f6' },
  medications: { label: 'Medication', icon: '/assets/meds-icon.svg', color: '#f59e08' },
  past_treatments: { label: 'Treatment', icon: '/assets/treatment-icon.svg', color: '#c026d3' },
  vaccinations: { label: 'Vaccination', icon: '/assets/vaccine-icon.svg', color: '#10b880' },
}

export default function RecordDetail() {
  const navigate = useNavigate()
  useParams() // Route param available but not needed currently
  const [searchParams] = useSearchParams()
  const recordId = searchParams.get('id')
  const { user, role } = useAuthStore()
  
  const [record, setRecord] = useState<MedicalRecord | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadRecord = async () => {
      try {
        // First check if there's a viewing record in session (for doctors viewing shared records)
        const viewingRecordStr = sessionStorage.getItem('viewingRecord')
        if (viewingRecordStr) {
          const viewingRecord = JSON.parse(viewingRecordStr) as MedicalRecord
          // If the ID matches, use this record
          if (!recordId || viewingRecord.id === recordId) {
            setRecord(viewingRecord)
            setIsLoading(false)
            return
          }
        }

        // Otherwise, fetch from database
        if (recordId && user?.id) {
          const fetchedRecord = await getRecord(recordId, user.id)
          setRecord(fetchedRecord)
        } else {
          setError('Record not found')
        }
      } catch (err: any) {
        console.error('Error loading record:', err)
        setError(err.message || 'Failed to load record')
      } finally {
        setIsLoading(false)
      }
    }

    loadRecord()
  }, [recordId, user?.id])

  const formatDate = (dateString: string | null) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  const handleEdit = () => {
    if (!record) return
    
    // Store the record to edit
    sessionStorage.setItem('editingRecord', JSON.stringify(record))
    
    // Navigate to the appropriate edit page with edit mode
    const editRoutes: Record<RecordCategory, string> = {
      allergies: '/add/allergies',
      chronic_conditions: '/add/chronic',
      lab_results: '/add/lab',
      medications: '/add/medication',
      past_treatments: '/add/treatment',
      vaccinations: '/add/vaccine',
    }
    navigate(`${editRoutes[record.category]}?edit=${record.id}`)
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

  if (error || !record) {
    return (
      <DashboardLayout showProfile={false}>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-[14px] text-red-600 mb-4">{error || 'Record not found'}</p>
          <button
            onClick={() => navigate(-1)}
            className="text-teal-primary font-semibold hover:underline"
          >
            Go back
          </button>
        </div>
      </DashboardLayout>
    )
  }

  const config = categoryConfig[record.category]
  const metadata = record.metadata || {}
  const isDoctor = role === 'doctor'

  // Render different sections based on category
  const renderCategorySpecificContent = () => {
    switch (record.category) {
      case 'allergies':
        return (
          <>
            {metadata.triggers && metadata.triggers.length > 0 && (
              <div className="flex flex-col gap-2">
                <span className="text-[15px] sm:text-[16px] font-semibold text-black">Triggers</span>
                <div className="flex flex-wrap gap-2">
                  {metadata.triggers.map((trigger: string, i: number) => (
                    <span key={i} className="px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-full text-[12px] font-medium text-amber-700">
                      {trigger}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {metadata.reactions && metadata.reactions.length > 0 && (
              <div className="flex flex-col gap-2">
                <span className="text-[15px] sm:text-[16px] font-semibold text-black">Reactions</span>
                <div className="flex flex-wrap gap-2">
                  {metadata.reactions.map((reaction: string, i: number) => (
                    <span key={i} className="px-3 py-1.5 bg-red-50 border border-red-200 rounded-full text-[12px] font-medium text-red-700">
                      {reaction}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </>
        )

      case 'medications':
        return (
          <>
            {metadata.dosage && (
              <div className="flex flex-col gap-1">
                <span className="text-[15px] sm:text-[16px] font-semibold text-black">Dosage</span>
                <p className="text-[14px] text-[#35393f]">{metadata.dosage}</p>
              </div>
            )}
            {metadata.frequency && (
              <div className="flex flex-col gap-1">
                <span className="text-[15px] sm:text-[16px] font-semibold text-black">Frequency</span>
                <p className="text-[14px] text-[#35393f]">{metadata.frequency}</p>
              </div>
            )}
            {metadata.strength && (
              <div className="flex flex-col gap-1">
                <span className="text-[15px] sm:text-[16px] font-semibold text-black">Strength</span>
                <p className="text-[14px] text-[#35393f]">{metadata.strength}</p>
              </div>
            )}
            {metadata.prescribed_for && (
              <div className="flex flex-col gap-1">
                <span className="text-[15px] sm:text-[16px] font-semibold text-black">Prescribed For</span>
                <p className="text-[14px] text-[#35393f]">{metadata.prescribed_for}</p>
              </div>
            )}
            {metadata.side_effects && metadata.side_effects.length > 0 && (
              <div className="flex flex-col gap-2">
                <span className="text-[15px] sm:text-[16px] font-semibold text-black">Side Effects</span>
                <div className="flex flex-wrap gap-2">
                  {metadata.side_effects.map((effect: string, i: number) => (
                    <span key={i} className="px-3 py-1.5 bg-white border border-[#dfe2e7] rounded-full text-[12px] font-medium text-[#35393f]">
                      {effect}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </>
        )

      case 'chronic_conditions':
        return (
          <>
            {metadata.diagnosed_date && (
              <div className="flex flex-col gap-1">
                <span className="text-[15px] sm:text-[16px] font-semibold text-black">Diagnosed Date</span>
                <p className="text-[14px] text-[#35393f]">{formatDate(metadata.diagnosed_date)}</p>
              </div>
            )}
            {metadata.severity && (
              <div className="flex flex-col gap-1">
                <span className="text-[15px] sm:text-[16px] font-semibold text-black">Severity</span>
                <p className="text-[14px] text-[#35393f] capitalize">{metadata.severity}</p>
              </div>
            )}
            {metadata.medications && metadata.medications.length > 0 && (
              <div className="flex flex-col gap-2">
                <span className="text-[15px] sm:text-[16px] font-semibold text-black">Current Medications</span>
                <div className="flex flex-wrap gap-2">
                  {metadata.medications.map((med: string, i: number) => (
                    <span key={i} className="px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-full text-[12px] font-medium text-blue-700">
                      {med}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </>
        )

      case 'vaccinations':
        return (
          <>
            {metadata.vaccine_name && (
              <div className="flex flex-col gap-1">
                <span className="text-[15px] sm:text-[16px] font-semibold text-black">Vaccine Name</span>
                <p className="text-[14px] text-[#35393f]">{metadata.vaccine_name}</p>
              </div>
            )}
            {metadata.dose_number && (
              <div className="flex flex-col gap-1">
                <span className="text-[15px] sm:text-[16px] font-semibold text-black">Dose Number</span>
                <p className="text-[14px] text-[#35393f]">{metadata.dose_number}</p>
              </div>
            )}
            {metadata.administered_by && (
              <div className="flex flex-col gap-1">
                <span className="text-[15px] sm:text-[16px] font-semibold text-black">Administered By</span>
                <p className="text-[14px] text-[#35393f]">{metadata.administered_by}</p>
              </div>
            )}
            {metadata.next_dose_date && (
              <div className="flex flex-col gap-1">
                <span className="text-[15px] sm:text-[16px] font-semibold text-black">Next Dose Date</span>
                <p className="text-[14px] text-[#35393f]">{formatDate(metadata.next_dose_date)}</p>
              </div>
            )}
          </>
        )

      case 'past_treatments':
        return (
          <>
            {metadata.hospital && (
              <div className="flex flex-col gap-1">
                <span className="text-[15px] sm:text-[16px] font-semibold text-black">Hospital/Clinic</span>
                <p className="text-[14px] text-[#35393f]">{metadata.hospital}</p>
              </div>
            )}
            {metadata.doctor_name && (
              <div className="flex flex-col gap-1">
                <span className="text-[15px] sm:text-[16px] font-semibold text-black">Doctor</span>
                <p className="text-[14px] text-[#35393f]">{metadata.doctor_name}</p>
              </div>
            )}
            {metadata.diagnosis && (
              <div className="flex flex-col gap-1">
                <span className="text-[15px] sm:text-[16px] font-semibold text-black">Diagnosis</span>
                <p className="text-[14px] text-[#35393f]">{metadata.diagnosis}</p>
              </div>
            )}
            {metadata.treatment_type && (
              <div className="flex flex-col gap-1">
                <span className="text-[15px] sm:text-[16px] font-semibold text-black">Treatment Type</span>
                <p className="text-[14px] text-[#35393f]">{metadata.treatment_type}</p>
              </div>
            )}
          </>
        )

      case 'lab_results':
        return (
          <>
            {metadata.lab_name && (
              <div className="flex flex-col gap-1">
                <span className="text-[15px] sm:text-[16px] font-semibold text-black">Laboratory</span>
                <p className="text-[14px] text-[#35393f]">{metadata.lab_name}</p>
              </div>
            )}
            {metadata.test_type && (
              <div className="flex flex-col gap-1">
                <span className="text-[15px] sm:text-[16px] font-semibold text-black">Test Type</span>
                <p className="text-[14px] text-[#35393f]">{metadata.test_type}</p>
              </div>
            )}
            {metadata.result_summary && (
              <div className="flex flex-col gap-1">
                <span className="text-[15px] sm:text-[16px] font-semibold text-black">Result Summary</span>
                <p className="text-[14px] text-[#35393f]">{metadata.result_summary}</p>
              </div>
            )}
          </>
        )

      default:
        return null
    }
  }

  return (
    <DashboardLayout showProfile={false}>
      <div className="flex flex-col gap-6 sm:gap-8 pb-10">
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-4 sm:gap-6 min-w-0 flex-1">
            <button 
              onClick={() => navigate(-1)} 
              className="p-2 bg-[#f5f6f7] rounded-lg hover:bg-[#eeeffd] transition-colors shrink-0"
            >
              <ChevronLeft className="w-5 h-5 text-[#98a2b3]" />
            </button>
            <h1 className="text-[18px] sm:text-[20px] font-bold text-black truncate">{record.title}</h1>
          </div>
          {!isDoctor && (
            <Button 
              variant="ghost" 
              className="text-teal-primary font-bold shrink-0 text-sm sm:text-base"
              onClick={handleEdit}
            >
              Edit
            </Button>
          )}
        </div>

        {/* Info Card */}
        <div className="bg-[#f5f6f7] p-4 sm:p-6 rounded-xl flex items-center gap-4 sm:gap-6">
          <div 
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl flex items-center justify-center shadow-sm shrink-0" 
            style={{ backgroundColor: config.color }}
          >
            <img src={config.icon} alt="" className="w-7 h-7 sm:w-8 sm:h-8 invert" />
           </div>
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-[16px] sm:text-[18px] font-bold text-navy-dark truncate">{record.title}</span>
            <span className="text-[13px] sm:text-[14px] text-[#868484]">{config.label}</span>
            {record.status && (
              <span className={`text-[12px] font-medium mt-1 capitalize ${
                record.status === 'ongoing' ? 'text-teal-primary' : 
                record.status === 'completed' ? 'text-green-600' : 'text-gray-500'
              }`}>
                {record.status}
              </span>
            )}
           </div>
        </div>

        {/* Date Info */}
        {(record.start_date || record.end_date) && (
          <div className="flex flex-col gap-1">
            <span className="text-[15px] sm:text-[16px] font-semibold text-black">Duration</span>
            <p className="text-[14px] text-[#35393f]">
              {record.start_date && record.end_date 
                ? `${formatDate(record.start_date)} - ${formatDate(record.end_date)}`
                : record.start_date 
                  ? `Started ${formatDate(record.start_date)}`
                  : `Ended ${formatDate(record.end_date)}`
              }
              {record.status === 'ongoing' && ' (Ongoing)'}
            </p>
             </div>
        )}

        {/* Category Specific Content */}
        <div className="flex flex-col gap-6 sm:gap-8">
          {renderCategorySpecificContent()}
        </div>

        {/* Notes/Description */}
        {record.description && (
          <div className="flex flex-col gap-2">
            <span className="text-[15px] sm:text-[16px] font-semibold text-black">Notes</span>
            <p className="text-[14px] text-[#35393f] leading-relaxed">{record.description}</p>
          </div>
        )}

        {/* File Attachment */}
        {record.file_url && (
          <div className="flex flex-col gap-2">
            <span className="text-[15px] sm:text-[16px] font-semibold text-black">Attached File</span>
            <a 
              href={record.file_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 bg-[#f5f6f7] rounded-xl hover:bg-[#eeeffd] transition-colors"
            >
              <FileText className="w-5 h-5 text-teal-primary" />
              <span className="text-[14px] text-[#35393f] flex-1">View attached document</span>
              <Download className="w-4 h-4 text-[#98a2b3]" />
            </a>
          </div>
        )}

        {/* Warning/Alert box */}
        <div className="bg-navy-dark p-4 sm:p-6 rounded-xl flex flex-col gap-3 sm:gap-4">
           <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#cb1a14] rounded-lg flex items-center justify-center">
                 <AlertCircle className="w-5 h-5 text-white" />
              </div>
              <span className="text-[14px] text-[#98a2b3] font-medium">Important Information</span>
           </div>
           <p className="text-[14px] text-[#98a2b3] leading-relaxed">
            {record.category === 'allergies' 
              ? `${record.title} allergies require careful attention. Avoid known triggers and seek immediate medical attention if severe reactions occur.`
              : record.category === 'medications'
              ? `Take ${record.title} as prescribed. Do not stop or change dosage without consulting your healthcare provider.`
              : `This medical record should be reviewed with your healthcare provider for proper guidance.`
            }
           </p>
        </div>
      </div>
    </DashboardLayout>
  )
}
