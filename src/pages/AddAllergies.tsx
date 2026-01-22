import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ChevronLeft, Plus, X, Loader2, Upload } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useQueryClient } from '@tanstack/react-query'
import DashboardLayout from '@/components/DashboardLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { useAuthStore } from '@/store/useAuthStore'
import { createRecord, updateRecord, uploadFile } from '@/lib/api/records'
import type { MedicalRecord } from '@/types/database'

const allergySchema = z.object({
  allergen: z.string().min(1, 'Allergen name is required'),
  notes: z.string().optional(),
})

type AllergyFormData = z.infer<typeof allergySchema>

export default function AddAllergies() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const editId = searchParams.get('edit')
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [triggers, setTriggers] = useState<string[]>([])
  const [reactions, setReactions] = useState<string[]>([])
  const [newTrigger, setNewTrigger] = useState('')
  const [newReaction, setNewReaction] = useState('')
  const [showTriggerInput, setShowTriggerInput] = useState(false)
  const [showReactionInput, setShowReactionInput] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingRecord, setEditingRecord] = useState<MedicalRecord | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [existingFileUrl, setExistingFileUrl] = useState<string | null>(null)

  const form = useForm<AllergyFormData>({
    resolver: zodResolver(allergySchema),
    defaultValues: {
      allergen: '',
      notes: '',
    },
  })

  // Load editing record if in edit mode
  useEffect(() => {
    if (editId) {
      const editingRecordStr = sessionStorage.getItem('editingRecord')
      if (editingRecordStr) {
        try {
          const record = JSON.parse(editingRecordStr) as MedicalRecord
          if (record.id === editId) {
            setIsEditMode(true)
            setEditingRecord(record)
            
            // Populate form
            form.setValue('allergen', record.title)
            form.setValue('notes', record.description || '')
            
            // Populate metadata
            if (record.metadata) {
              setTriggers(record.metadata.triggers || [])
              setReactions(record.metadata.reactions || [])
            }
            
            // Set existing file URL
            if (record.file_url) {
              setExistingFileUrl(record.file_url)
            }
          }
        } catch (err) {
          console.error('Error parsing editing record:', err)
        }
      }
    }
  }, [editId, form])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        setError('File size must be less than 50MB')
        e.target.value = ''
        return
      }
      
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
      if (!allowedTypes.includes(file.type)) {
        setError('File type not supported. Please upload PDF, JPG, PNG, or DOC files.')
        e.target.value = ''
        return
      }
      
      setSelectedFile(file)
      setExistingFileUrl(null)
      setError(null)
    }
  }

  const handleRemoveFile = () => {
    setSelectedFile(null)
    setExistingFileUrl(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const onSubmit = async (data: AllergyFormData) => {
    if (!user?.id) return

    setIsSubmitting(true)
    setError(null)

    try {
      let fileUrl = existingFileUrl || undefined
      let fileHash: string | undefined

      // Upload new file if selected
      if (selectedFile) {
        try {
          const uploadResult = await uploadFile(user.id, selectedFile, 'allergies')
          fileUrl = uploadResult.url
          fileHash = uploadResult.hash
        } catch (uploadError: any) {
          console.error('File upload error:', uploadError)
          setError(uploadError.message || 'Failed to upload file.')
          setIsSubmitting(false)
          return
        }
      }

      const recordData = {
        category: 'allergies' as const,
        title: data.allergen,
        description: data.notes || null,
        status: 'ongoing' as const,
        file_url: fileUrl,
        file_hash: fileHash,
        metadata: {
          triggers: triggers,
          reactions: reactions,
        },
      }

      if (isEditMode && editingRecord) {
        // Update existing record
        await updateRecord(editingRecord.id, user.id, recordData)
      } else {
        // Create new record
        await createRecord(user.id, recordData)
      }

      // Invalidate and refetch records
      queryClient.invalidateQueries({ queryKey: ['records', user.id] })

      // Clear editing data
      sessionStorage.removeItem('editingRecord')

      // Navigate back to dashboard
      navigate('/dashboard')
    } catch (err: any) {
      console.error('Error saving allergy:', err)
      setError(err.message || 'Failed to save allergy. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <DashboardLayout showProfile={false}>
      <div className="flex flex-col gap-6 sm:gap-8 pb-10">
        <div className="flex items-center gap-4 sm:gap-6">
          <button onClick={() => navigate(-1)} className="p-2 bg-[#f5f6f7] rounded-lg hover:bg-[#eeeffd] transition-colors">
            <ChevronLeft className="w-5 h-5 text-[#98a2b3]" />
          </button>
          <h1 className="text-[18px] sm:text-[20px] font-bold text-black">
            {isEditMode ? 'Edit Allergy' : 'Add Allergies'}
          </h1>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-6 sm:gap-8">
            <FormField
              control={form.control}
              name="allergen"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[#7a828f] text-[14px]">Allergen <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g. Lactose Intolerance" 
                      className="border-0 border-b border-[#d0d5dd] rounded-none px-0 h-11 focus-visible:ring-0 focus-visible:border-teal-primary text-[#101928]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

          <div className="flex flex-col gap-3 sm:gap-4">
            <Label className="text-[#7a828f] text-[14px]">Triggers</Label>
            <div className="flex flex-wrap gap-2">
              {triggers.map((tag) => (
                <div 
                  key={tag} 
                  className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 bg-[#f5f6f7] rounded-lg text-[13px] sm:text-[14px] text-navy-dark font-medium border border-[#d0d5dd] group hover:bg-[#eeeffd] transition-colors"
                >
                  <span>{tag}</span>
                  <button
                    type="button"
                    onClick={() => setTriggers(triggers.filter(t => t !== tag))}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-red-100 rounded"
                  >
                    <X className="w-3 h-3 text-red-600" />
                  </button>
                </div>
              ))}
              {showTriggerInput ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={newTrigger}
                    onChange={(e) => setNewTrigger(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newTrigger.trim()) {
                        e.preventDefault()
                        setTriggers([...triggers, newTrigger.trim()])
                        setNewTrigger('')
                        setShowTriggerInput(false)
                      }
                      if (e.key === 'Escape') {
                        setShowTriggerInput(false)
                        setNewTrigger('')
                      }
                    }}
                    placeholder="Type and press Enter"
                    className="h-[36px] sm:h-[38px] w-32 sm:w-40 border border-[#d0d5dd] rounded-lg"
                    autoFocus
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setShowTriggerInput(false)
                      setNewTrigger('')
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <Button 
                  type="button"
                  variant="ghost" 
                  onClick={() => setShowTriggerInput(true)}
                  className="rounded-lg border-2 border-dashed border-[#d0d5dd] h-[36px] sm:h-[38px] px-3 sm:px-4 hover:bg-gray-50"
                >
                  <Plus className="w-4 h-4 text-[#98a2b3]" />
                </Button>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:gap-4">
            <Label className="text-[#7a828f] text-[14px]">Reactions</Label>
            <div className="flex flex-wrap gap-2">
              {reactions.map((tag) => (
                <div 
                  key={tag} 
                  className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 bg-[#fdf2f2] rounded-lg text-[13px] sm:text-[14px] text-[#ef4444] font-medium border border-[#fecaca] group hover:bg-[#fee2e2] transition-colors"
                >
                  <span>{tag}</span>
                  <button
                    type="button"
                    onClick={() => setReactions(reactions.filter(r => r !== tag))}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-red-200 rounded"
                  >
                    <X className="w-3 h-3 text-red-700" />
                  </button>
                </div>
              ))}
              {showReactionInput ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={newReaction}
                    onChange={(e) => setNewReaction(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newReaction.trim()) {
                        e.preventDefault()
                        setReactions([...reactions, newReaction.trim()])
                        setNewReaction('')
                        setShowReactionInput(false)
                      }
                      if (e.key === 'Escape') {
                        setShowReactionInput(false)
                        setNewReaction('')
                      }
                    }}
                    placeholder="Type and press Enter"
                    className="h-[36px] sm:h-[38px] w-32 sm:w-40 border border-[#fecaca] rounded-lg"
                    autoFocus
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setShowReactionInput(false)
                      setNewReaction('')
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <Button 
                  type="button"
                  variant="ghost" 
                  onClick={() => setShowReactionInput(true)}
                  className="rounded-lg border-2 border-dashed border-[#fecaca] h-[36px] sm:h-[38px] px-3 sm:px-4 hover:bg-red-50"
                >
                  <Plus className="w-4 h-4 text-[#ef4444]" />
                </Button>
              )}
            </div>
          </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[#7a828f] text-[14px]">Notes (Optional)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Add any additional notes" 
                      className="border-0 border-b border-[#d0d5dd] rounded-none px-0 h-11 focus-visible:ring-0 focus-visible:border-teal-primary text-[#101928]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* File Upload */}
            <div className="flex flex-col gap-3">
              <Label className="text-[#7a828f] text-[14px]">Upload Document (Optional)</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                onChange={handleFileSelect}
                className="hidden"
                id="allergy-upload"
              />
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center border-2 border-dashed border-[#d0d5dd] rounded-lg py-6 bg-[#f5f6f7] hover:bg-[#eeeffd] hover:border-teal-primary/50 transition-all cursor-pointer"
              >
                <div className="flex flex-col items-center gap-2">
                  <Upload className="w-6 h-6 text-[#98a2b3]" />
                  <span className="text-[14px] text-black font-semibold">
                    {selectedFile ? selectedFile.name : existingFileUrl ? 'File attached' : 'Upload document here'}
                  </span>
                  {(selectedFile || existingFileUrl) && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRemoveFile()
                      }}
                      className="text-[12px] text-red-600 hover:text-red-700 mt-1 flex items-center gap-1"
                    >
                      <X className="w-3 h-3" />
                      Remove file
                    </button>
                  )}
                </div>
              </div>
              <p className="text-[11px] text-[#8d8989]">
                Supported formats: PDF, JPG, PNG, DOC, DOCX (Max 50MB)
              </p>
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                {error}
              </div>
            )}

            <Button 
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 rounded-full bg-teal-primary text-white font-semibold mt-6 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {isEditMode ? 'Updating...' : 'Saving...'}
                </>
              ) : (
                isEditMode ? 'Update' : 'Save'
              )}
            </Button>
          </form>
        </Form>
      </div>
    </DashboardLayout>
  )
}
