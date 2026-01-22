import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ChevronLeft, Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useQueryClient } from '@tanstack/react-query'
import DashboardLayout from '@/components/DashboardLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { MuiDatePicker } from '@/components/ui/mui-date-picker'
import { useAuthStore } from '@/store/useAuthStore'
import { createRecord, updateRecord } from '@/lib/api/records'
import type { MedicalRecord } from '@/types/database'

const vaccinationSchema = z.object({
  vaccine: z.string().min(1, 'Vaccine name is required'),
  vaccine_name: z.string().optional(),
  first_dose: z.date({ message: 'First dose date is required' }),
  second_dose: z.date().optional(),
  last_dose: z.date().optional(),
  side_effects: z.string().optional(),
  notes: z.string().optional(),
})

type VaccinationFormData = z.infer<typeof vaccinationSchema>

export default function AddVaccinations() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const editId = searchParams.get('edit')
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const [completed, setCompleted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingRecord, setEditingRecord] = useState<MedicalRecord | null>(null)

  const form = useForm<VaccinationFormData>({
    resolver: zodResolver(vaccinationSchema),
    defaultValues: {
      vaccine: '',
      vaccine_name: '',
      side_effects: '',
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
            form.setValue('vaccine', record.title)
            form.setValue('notes', record.description || '')
            
            // Set completed status
            setCompleted(record.status === 'completed')
            
            if (record.metadata) {
              form.setValue('vaccine_name', record.metadata.vaccine_name || '')
              form.setValue('side_effects', record.metadata.side_effects || '')
              
              if (record.metadata.first_dose) {
                form.setValue('first_dose', new Date(record.metadata.first_dose))
              }
              if (record.metadata.second_dose) {
                form.setValue('second_dose', new Date(record.metadata.second_dose))
              }
              if (record.metadata.last_dose) {
                form.setValue('last_dose', new Date(record.metadata.last_dose))
              }
            }
            
            // Fallback to start_date for first_dose
            if (record.start_date && !record.metadata?.first_dose) {
              form.setValue('first_dose', new Date(record.start_date))
            }
          }
        } catch (err) {
          console.error('Error parsing editing record:', err)
        }
      }
    }
  }, [editId, form])

  const onSubmit = async (data: VaccinationFormData) => {
    if (!user?.id) {
      setError('You must be logged in to add a vaccination')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      // Determine status based on completed switch
      const status: 'ongoing' | 'completed' | 'archived' = completed ? 'completed' : 'ongoing'

      const recordData = {
        category: 'vaccinations' as const,
        title: data.vaccine,
        description: data.notes || null,
        status,
        start_date: data.first_dose.toISOString(),
        end_date: data.last_dose?.toISOString() || data.second_dose?.toISOString() || null,
        metadata: {
          vaccine_name: data.vaccine_name || null,
          first_dose: data.first_dose.toISOString(),
          second_dose: data.second_dose?.toISOString() || null,
          last_dose: data.last_dose?.toISOString() || null,
          side_effects: data.side_effects || null,
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
      console.error('Error saving vaccination:', err)
      setError(err.message || 'Failed to save vaccination. Please try again.')
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
            {isEditMode ? 'Edit Vaccination' : 'Add Vaccinations'}
          </h1>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-6 sm:gap-8">
            <div className="flex items-center justify-between py-2">
              <span className="text-[14px] font-semibold text-black">Completed</span>
              <Switch checked={completed} onCheckedChange={setCompleted} />
            </div>

            <div className="flex flex-col gap-6">
              <FormField
                control={form.control}
                name="vaccine"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[#7a828f] text-[14px]">Vaccine <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g. Corona Virus Vaccine" 
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
                name="vaccine_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[#7a828f] text-[14px]">Vaccine Name (Optional)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g. Pfizer" 
                        className="border-0 border-b border-[#d0d5dd] rounded-none px-0 h-11 focus-visible:ring-0 focus-visible:border-teal-primary text-[#101928]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 gap-6">
                <FormField
                  control={form.control}
                  name="first_dose"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[#7a828f] text-[14px]">First Dose <span className="text-red-500">*</span></FormLabel>
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
                  name="second_dose"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[#7a828f] text-[14px]">Second Dose (Optional)</FormLabel>
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

                {completed && (
                  <FormField
                    control={form.control}
                    name="last_dose"
                    render={({ field }) => (
                      <FormItem className="animate-in fade-in slide-in-from-top-1">
                        <FormLabel className="text-[#7a828f] text-[14px]">Last Dose</FormLabel>
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
                )}
              </div>

              <FormField
                control={form.control}
                name="side_effects"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[#7a828f] text-[14px]">Side Effects (Optional)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g. Mild fever, fatigue" 
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
                        placeholder="Write something here" 
                        className="border-0 border-b border-[#d0d5dd] rounded-none px-0 h-11 focus-visible:ring-0 focus-visible:border-teal-primary text-[#101928]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {error && (
              <div className="text-[13px] text-red-600 bg-red-50 p-3 rounded-lg">
                {error}
              </div>
            )}

            <Button 
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 rounded-full bg-teal-primary text-white font-semibold mt-10 disabled:opacity-50 disabled:cursor-not-allowed"
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
