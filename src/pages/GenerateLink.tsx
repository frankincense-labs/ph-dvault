import { useState, useEffect } from 'react'
import { ChevronLeft, Link as LinkIcon, Copy, Check, Loader2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import DashboardLayout from '@/components/DashboardLayout'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { useAuthStore } from '@/store/useAuthStore'
import { getRecords } from '@/lib/api/records'
import { createShare, generateShareLink } from '@/lib/api/shares'
import { format } from 'date-fns'
import type { MedicalRecord, ShareToken } from '@/types/database'

export default function GenerateLink() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [step, setStep] = useState(1) // 1: Select, 2: Success
  const [copied, setCopied] = useState(false)
  const [selectedRecordIds, setSelectedRecordIds] = useState<string[]>([])
  const [expiryDuration, setExpiryDuration] = useState('1hr')
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [shareToken, setShareToken] = useState<ShareToken | null>(null)
  const [shareLink, setShareLink] = useState<string>('')

  // Fetch user's records
  const { data: records = [], isLoading: recordsLoading } = useQuery({
    queryKey: ['records', user?.id],
    queryFn: () => getRecords(user!.id),
    enabled: !!user?.id,
  })

  const handleRecordToggle = (recordId: string) => {
    setSelectedRecordIds(prev => 
      prev.includes(recordId) 
        ? prev.filter(id => id !== recordId)
        : [...prev, recordId]
    )
  }

  const getExpiryHours = (duration: string): number => {
    switch (duration) {
      case '15mins': return 0.25
      case '1hr': return 1
      case '24hrs': return 24
      default: return 1
    }
  }

  const handleGenerate = async () => {
    if (selectedRecordIds.length === 0) {
      setError('Please select at least one record')
      return
    }

    setIsGenerating(true)
    setError(null)

    try {
      const newShare = await createShare(user!.id, {
        method: 'link',
        record_ids: selectedRecordIds,
        expires_in_hours: getExpiryHours(expiryDuration),
      })

      const link = generateShareLink(newShare.token)
      setShareToken(newShare)
      setShareLink(link)
      setStep(2)
    } catch (err: any) {
      setError(err.message || 'Failed to generate link')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleRegenerate = () => {
    setStep(1)
    setSelectedRecordIds([])
    setShareToken(null)
    setShareLink('')
    setError(null)
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(shareLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const getExpiryText = () => {
    if (!shareToken) return ''
    const expiresAt = new Date(shareToken.expires_at)
    const now = new Date()
    const diffMs = expiresAt.getTime() - now.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    
    if (diffMins < 60) return `${diffMins} minutes`
    const hours = Math.floor(diffMins / 60)
    return `${hours} hour${hours > 1 ? 's' : ''}`
  }

  return (
    <DashboardLayout showProfile={false}>
      <div className="flex flex-col gap-6 sm:gap-8 pb-10">
        {/* Header */}
        <div className="flex items-center gap-4 sm:gap-6">
          <button onClick={() => navigate(-1)} className="p-2 bg-[#f5f6f7] rounded-lg hover:bg-[#eeeffd] transition-colors">
            <ChevronLeft className="w-5 h-5 text-[#98a2b3]" />
          </button>
          <h1 className="text-[18px] sm:text-[20px] font-bold text-black">Share Link</h1>
        </div>

        {step === 1 ? (
          <>
            {/* Record Selection */}
            <div className="flex flex-col gap-4">
              <h2 className="text-[16px] font-semibold">Select Record(s)</h2>
              {recordsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-teal-primary" />
                </div>
              ) : records.length === 0 ? (
                <p className="text-[14px] text-[#8d8989] py-4">No records available. Add records first.</p>
              ) : (
                <div className="flex flex-col gap-4">
                  {records.map((record: MedicalRecord) => (
                    <div key={record.id} className="flex items-center gap-3">
                      <Checkbox 
                        id={record.id} 
                        checked={selectedRecordIds.includes(record.id)}
                        onCheckedChange={() => handleRecordToggle(record.id)}
                        className="w-5 h-5 border-2 border-teal-primary text-teal-primary" 
                      />
                      <label htmlFor={record.id} className="text-[14px] text-black cursor-pointer flex-1">
                        <span className="font-medium">{record.title}</span>
                        {record.category && (
                          <span className="text-[12px] text-[#8d8989] ml-2">
                            ({record.category.replace('_', ' ')})
                          </span>
                        )}
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Expiry Selection */}
            <div className="flex flex-col gap-4">
              <h2 className="text-[16px] font-semibold">Choose Expiry Duration</h2>
              <RadioGroup value={expiryDuration} onValueChange={setExpiryDuration} className="flex flex-col gap-4">
                {[
                  { id: '15mins', label: '15 mins' },
                  { id: '1hr', label: '1 hr' },
                  { id: '24hrs', label: '24 hrs' },
                ].map((opt) => (
                  <div key={opt.id} className="flex items-center gap-3">
                    <RadioGroupItem value={opt.id} id={opt.id} className="w-5 h-5 border-2 border-teal-primary" />
                    <label htmlFor={opt.id} className="text-[14px] text-black cursor-pointer">{opt.label}</label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                {error}
              </div>
            )}

            <Button 
              onClick={handleGenerate}
              disabled={isGenerating || selectedRecordIds.length === 0 || records.length === 0}
              className="w-full h-12 rounded-full bg-teal-primary text-white font-semibold mt-10 disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                'Generate Link'
              )}
            </Button>
          </>
        ) : (
          <div className="flex flex-col items-center gap-6 sm:gap-10 pt-4 sm:pt-10">
            <div className="flex flex-col items-center gap-6 sm:gap-8 text-center bg-white p-6 sm:p-8 rounded-xl border border-[#f5f6f7] shadow-sm w-full">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-teal-primary rounded-full flex items-center justify-center text-white">
                <LinkIcon className="w-7 h-7 sm:w-8 sm:h-8" />
              </div>
              <div className="flex flex-col gap-2">
                <h2 className="text-[16px] sm:text-[18px] font-bold text-black">Link Generated!</h2>
                <p className="text-[13px] sm:text-[14px] text-[#8d8989]">Below is the link to share to viewers.</p>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 bg-[#f5f6f7] p-3 sm:p-4 rounded-lg w-full min-w-0">
                <LinkIcon className="w-4 h-4 text-navy-dark shrink-0 flex-shrink-0" />
                <span className="text-[12px] sm:text-[13px] text-navy-dark break-all text-left flex-1 min-w-0">
                  {shareLink}
                </span>
              </div>
              {shareToken && (
                <p className="text-[12px] sm:text-[13px] text-[#8d8989]">
                  Expires in {getExpiryText()}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-4 w-full">
              <Button 
                onClick={handleCopy}
                className="w-full h-12 rounded-full bg-teal-primary text-white font-semibold flex items-center justify-center gap-2"
              >
                {copied ? (
                  <>
                    <Check className="w-5 h-5" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-5 h-5" />
                    Copy Link
                  </>
                )}
              </Button>
              <Button variant="ghost" onClick={handleRegenerate} className="text-teal-primary font-semibold">
                Re-Generate
              </Button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}