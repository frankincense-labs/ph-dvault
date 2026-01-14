import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Calendar as CalendarIcon, Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { format } from 'date-fns'
import { useQueryClient } from '@tanstack/react-query'
import DashboardLayout from '@/components/DashboardLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { useAuthStore } from '@/store/useAuthStore'
import { createRecord } from '@/lib/api/records'

const vaccinationSchema = z.object({
  vaccine: z.string().min(1, 'Vaccine name is required'),
  vaccine_name: z.string().optional(),
  first_dose: z.date({ required_error: 'First dose date is required' }),
  second_dose: z.date().optional(),
  last_dose: z.date().optional(),
  side_effects: z.string().optional(),
  notes: z.string().optional(),
})

type VaccinationFormData = z.infer<typeof vaccinationSchema>

export default function AddVaccinations() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const [completed, setCompleted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<VaccinationFormData>({
    resolver: zodResolver(vaccinationSchema),
    defaultValues: {
      vaccine: '',
      vaccine_name: '',
      side_effects: '',
      notes: '',
    },
  })

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

      // Get the latest dose date for start_date
      const dates = [data.first_dose, data.second_dose, data.last_dose].filter(Boolean) as Date[]
      const latestDate = dates.length > 0 ? new Date(Math.max(...dates.map(d => d.getTime()))) : data.first_dose

      // Create record
      await createRecord(user.id, {
        category: 'vaccinations',
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
      })

      // Invalidate and refetch records
      queryClient.invalidateQueries({ queryKey: ['records', user.id] })

      // Navigate back to dashboard
      navigate('/dashboard')
    } catch (err: any) {
      console.error('Error adding vaccination:', err)
      setError(err.message || 'Failed to add vaccination. Please try again.')
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
          <h1 className="text-[18px] sm:text-[20px] font-bold text-black">Add Vaccinations</h1>
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
                    <FormLabel className="text-[#7a828f] text-[14px]">Vaccine</FormLabel>
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
                    <FormLabel className="text-[#7a828f] text-[14px]">Vaccine Name</FormLabel>
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
                      <FormLabel className="text-[#7a828f] text-[14px]">First Dose</FormLabel>
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
                  name="second_dose"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[#7a828f] text-[14px]">Second Dose (Optional)</FormLabel>
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

                {completed && (
                  <FormField
                    control={form.control}
                    name="last_dose"
                    render={({ field }) => (
                      <FormItem className="animate-in fade-in slide-in-from-top-1">
                        <FormLabel className="text-[#7a828f] text-[14px]">Last Dose</FormLabel>
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