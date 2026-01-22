import { useState, useRef, useEffect } from 'react'
import { ChevronLeft, Upload, Loader2, X } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import DashboardLayout from '@/components/DashboardLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { MuiDatePicker } from '@/components/ui/mui-date-picker'
import { useAuthStore } from '@/store/useAuthStore'
import { createRecord, updateRecord, uploadFile } from '@/lib/api/records'
import { useQueryClient } from '@tanstack/react-query'
import type { MedicalRecord } from '@/types/database'

const medicationSchema = z.object({
  medication_name: z.string().min(1, 'Medication name is required'),
  strength: z.string().min(1, 'Strength/Unit is required'),
  dosage: z.string().min(1, 'Dosage is required'),
  start_date: z.date({ message: 'Start date is required' }),
  end_date: z.date().optional(),
  notes: z.string().optional(),
})

type MedicationFormData = z.infer<typeof medicationSchema>

export default function AddMedication() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const editId = searchParams.get('edit')
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [existingFileUrl, setExistingFileUrl] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingRecord, setEditingRecord] = useState<MedicalRecord | null>(null)

  const form = useForm<MedicationFormData>({
    resolver: zodResolver(medicationSchema),
    defaultValues: {
      medication_name: '',
      strength: '',
      dosage: '',
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
            form.setValue('medication_name', record.title)
            form.setValue('notes', record.description || '')
            
            if (record.metadata) {
              form.setValue('strength', record.metadata.strength || '')
              form.setValue('dosage', record.metadata.dosage || '')
            }
            
            if (record.start_date) {
              form.setValue('start_date', new Date(record.start_date))
            }
            if (record.end_date) {
              form.setValue('end_date', new Date(record.end_date))
            }
            
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
    } else {
      setSelectedFile(null)
    }
  }

  const handleRemoveFile = () => {
    setSelectedFile(null)
    setExistingFileUrl(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const onSubmit = async (data: MedicationFormData) => {
    if (!user?.id) {
      setError('You must be logged in to add a medication')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      // Determine status based on dates
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      let status: 'ongoing' | 'completed' | 'archived' = 'ongoing'
      if (data.end_date) {
        const endDate = new Date(data.end_date)
        endDate.setHours(0, 0, 0, 0)
        if (endDate < today) {
          status = 'completed'
        }
      }

      let fileUrl = existingFileUrl || undefined
      let fileHash: string | undefined

      // Upload file if selected
      if (selectedFile) {
        try {
          const uploadResult = await uploadFile(user.id, selectedFile, 'medications')
          fileUrl = uploadResult.url
          fileHash = uploadResult.hash
        } catch (uploadError: any) {
          console.error('File upload error:', uploadError)
          setError(uploadError.message || 'Failed to upload file. Please check your storage bucket settings.')
          setIsSubmitting(false)
          return
        }
      }

      const recordData = {
        category: 'medications' as const,
        title: data.medication_name,
        description: data.notes || null,
        file_url: fileUrl,
        file_hash: fileHash,
        status,
        start_date: data.start_date.toISOString(),
        end_date: data.end_date?.toISOString() || null,
        metadata: {
          strength: data.strength,
          dosage: data.dosage,
        },
      }

      if (isEditMode && editingRecord) {
        await updateRecord(editingRecord.id, user.id, recordData)
      } else {
        await createRecord(user.id, recordData)
      }

      // Invalidate and refetch records
      queryClient.invalidateQueries({ queryKey: ['records', user.id] })

      // Clear editing data
      sessionStorage.removeItem('editingRecord')

      // Navigate back to dashboard
      navigate('/dashboard')
    } catch (err: any) {
      console.error('Error saving medication:', err)
      setError(err.message || 'Failed to save medication. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <DashboardLayout showProfile={false}>
      <div className="flex flex-col gap-6 sm:gap-8 pb-10">
        {/* Header */}
        <div className="flex items-center gap-4 sm:gap-6">
          <button onClick={() => navigate(-1)} className="p-2 bg-[#f5f6f7] rounded-lg hover:bg-[#eeeffd] transition-colors">
            <ChevronLeft className="w-5 h-5 text-[#98a2b3]" />
          </button>
          <h1 className="text-[18px] sm:text-[20px] font-bold text-black">
            {isEditMode ? 'Edit Medication' : 'Add Medication'}
          </h1>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-6">
            <FormField
              control={form.control}
              name="medication_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[#7a828f] text-[14px]">Medication Name <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g. Paracetamol" 
                      className="border-0 border-b border-[#d0d5dd] rounded-none px-0 h-11 focus-visible:ring-0 focus-visible:border-teal-primary text-[#101928]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="strength"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[#7a828f] text-[14px]">Strength/Unit <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g. 600 mg" 
                      className="border-0 border-b border-[#d0d5dd] rounded-none px-0 h-11 focus-visible:ring-0 focus-visible:border-teal-primary text-[#101928]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dosage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[#7a828f] text-[14px]">Dosage <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g. 1 morning / 1 night" 
                      className="border-0 border-b border-[#d0d5dd] rounded-none px-0 h-11 focus-visible:ring-0 focus-visible:border-teal-primary text-[#101928]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
              <FormField
                control={form.control}
                name="start_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[#7a828f] text-[14px]">Start Date <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <MuiDatePicker
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="DD/MM/YYYY"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="end_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[#7a828f] text-[14px]">End Date (Optional)</FormLabel>
                    <FormControl>
                      <MuiDatePicker
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="DD/MM/YYYY"
                        minDate={form.getValues('start_date')}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[#7a828f] text-[14px]">Notes (Optional)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Take medication as directed" 
                      className="border-0 border-b border-[#d0d5dd] rounded-none px-0 h-11 focus-visible:ring-0 focus-visible:border-teal-primary text-[#101928]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex flex-col gap-4 mt-4">
              <Label className="text-[#7a828f] text-[14px]">Upload Prescription (Optional)</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                onChange={handleFileSelect}
                className="hidden"
                id="prescription-upload"
              />
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center border-2 border-dashed border-[#d0d5dd] rounded-lg py-6 bg-[#f5f6f7] hover:bg-[#eeeffd] hover:border-teal-primary/50 transition-all cursor-pointer"
              >
                <div className="flex flex-col items-center gap-2">
                  <Upload className="w-6 h-6 text-[#98a2b3]" />
                  <span className="text-[14px] text-black font-semibold">
                    {selectedFile ? selectedFile.name : existingFileUrl ? 'File attached' : 'Upload prescription here'}
                  </span>
                  {selectedFile && (
                    <span className="text-[12px] text-[#8d8989]">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </span>
                  )}
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
              <div className="text-[14px] text-red-600 bg-red-50 p-3 rounded-lg">
                {error}
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full h-12 rounded-full bg-teal-primary text-white font-semibold mt-10"
              disabled={isSubmitting}
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
