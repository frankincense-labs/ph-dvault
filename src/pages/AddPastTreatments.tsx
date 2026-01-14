import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Upload, Calendar as CalendarIcon, X, Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { format } from 'date-fns'
import { useQueryClient } from '@tanstack/react-query'
import DashboardLayout from '@/components/DashboardLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { useAuthStore } from '@/store/useAuthStore'
import { createRecord, uploadFile } from '@/lib/api/records'

const pastTreatmentSchema = z.object({
  name: z.string().min(1, 'Treatment name is required'),
  hospital: z.string().optional(),
  start_date: z.date({ message: 'Start date is required' }),
  end_date: z.date().optional(),
  doctor: z.string().optional(),
  notes: z.string().optional(),
})

type PastTreatmentFormData = z.infer<typeof pastTreatmentSchema>

export default function AddPastTreatments() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<PastTreatmentFormData>({
    resolver: zodResolver(pastTreatmentSchema),
    defaultValues: {
      name: '',
      hospital: '',
      doctor: '',
      notes: '',
    },
  })

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
      setError(null)
    } else {
      setSelectedFile(null)
    }
  }

  const handleRemoveFile = () => {
    setSelectedFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const onSubmit = async (data: PastTreatmentFormData) => {
    if (!user?.id) {
      setError('You must be logged in to add a past treatment')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      // Determine status based on dates
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      let status: 'ongoing' | 'completed' | 'archived' = 'completed'
      if (data.end_date) {
        const endDate = new Date(data.end_date)
        endDate.setHours(0, 0, 0, 0)
        if (endDate >= today) {
          status = 'ongoing'
        }
      }

      // Upload file if selected
      let fileUrl: string | undefined
      let fileHash: string | undefined
      if (selectedFile) {
        try {
          const uploadResult = await uploadFile(user.id, selectedFile, 'past_treatments')
          fileUrl = uploadResult.url
          fileHash = uploadResult.hash
        } catch (uploadError: any) {
          console.error('File upload error:', uploadError)
          setError(uploadError.message || 'Failed to upload file. Please check your storage bucket settings.')
          setIsSubmitting(false)
          return
        }
      }

      // Create record
      await createRecord(user.id, {
        category: 'past_treatments',
        title: data.name,
        description: data.notes || null,
        file_url: fileUrl,
        file_hash: fileHash,
        status,
        start_date: data.start_date.toISOString(),
        end_date: data.end_date?.toISOString() || null,
        metadata: {
          hospital: data.hospital || null,
          doctor: data.doctor || null,
        },
      })

      // Invalidate and refetch records
      queryClient.invalidateQueries({ queryKey: ['records', user.id] })

      // Navigate back to dashboard
      navigate('/dashboard')
    } catch (err: any) {
      console.error('Error adding past treatment:', err)
      setError(err.message || 'Failed to add past treatment. Please try again.')
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
          <h1 className="text-[18px] sm:text-[20px] font-bold text-black">Add Past Treatments</h1>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5 sm:gap-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[#7a828f] text-[14px]">Name</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g. Malaria treatment" 
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
              name="hospital"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[#7a828f] text-[14px]">Hospital/Clinic Name</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g. Well Vine Hospital" 
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
                    <FormLabel className="text-[#7a828f] text-[14px]">Start Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="ghost"
                            className="w-full justify-start text-left font-normal border-0 border-b border-[#d0d5dd] rounded-none px-0 h-11 hover:bg-transparent"
                          >
                            {field.value ? (
                              format(field.value, 'dd/MM/yyyy')
                            ) : (
                              <span className="text-[#98a2b3]">DD/MM/YYYY</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 text-[#667185]" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
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
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="ghost"
                            className="w-full justify-start text-left font-normal border-0 border-b border-[#d0d5dd] rounded-none px-0 h-11 hover:bg-transparent"
                          >
                            {field.value ? (
                              format(field.value, 'dd/MM/yyyy')
                            ) : (
                              <span className="text-[#98a2b3]">DD/MM/YYYY</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 text-[#667185]" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="doctor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[#7a828f] text-[14px]">Attending Doctor</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g. Dr. Okon" 
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

            <div className="flex flex-col gap-4 mt-4">
              <Label className="text-[#7a828f] text-[14px]">Upload Medical Report (Optional)</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                onChange={handleFileSelect}
                className="hidden"
                id="medical-report-upload"
              />
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center border-2 border-dashed border-[#d0d5dd] rounded-xl py-10 bg-[#f5f6f7] hover:bg-[#eeeffd] hover:border-teal-primary/50 transition-all cursor-pointer"
              >
                <div className="flex flex-col items-center gap-2">
                  <Upload className="w-6 h-6 text-[#98a2b3]" />
                  <span className="text-[14px] text-black font-semibold">
                    {selectedFile ? selectedFile.name : 'Upload medical report here'}
                  </span>
                  {selectedFile && (
                    <>
                      <span className="text-[12px] text-[#8d8989]">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </span>
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
                    </>
                  )}
                </div>
              </div>
              {error && (
                <div className="text-[13px] text-red-600 bg-red-50 p-3 rounded-lg">
                  {error}
                </div>
              )}
              <p className="text-[11px] text-[#8d8989]">
                Supported formats: PDF, JPG, PNG, DOC, DOCX (Max 50MB)
              </p>
            </div>

            <Button 
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 rounded-full bg-teal-primary text-white font-semibold mt-10 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save'
              )}
            </Button>
          </form>
        </Form>
      </div>
    </DashboardLayout>
  )
}