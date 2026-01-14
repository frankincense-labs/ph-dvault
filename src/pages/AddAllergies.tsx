import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Plus, X, Loader2 } from 'lucide-react'
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
import { createRecord } from '@/lib/api/records'

const allergySchema = z.object({
  allergen: z.string().min(1, 'Allergen name is required'),
  notes: z.string().optional(),
})

type AllergyFormData = z.infer<typeof allergySchema>

export default function AddAllergies() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const [triggers, setTriggers] = useState<string[]>([])
  const [reactions, setReactions] = useState<string[]>([])
  const [newTrigger, setNewTrigger] = useState('')
  const [newReaction, setNewReaction] = useState('')
  const [showTriggerInput, setShowTriggerInput] = useState(false)
  const [showReactionInput, setShowReactionInput] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<AllergyFormData>({
    resolver: zodResolver(allergySchema),
    defaultValues: {
      allergen: '',
      notes: '',
    },
  })

  const onSubmit = async (data: AllergyFormData) => {
    if (!user?.id) return

    setIsSubmitting(true)
    setError(null)

    try {
      await createRecord(user.id, {
        category: 'allergies',
        title: data.allergen,
        description: data.notes || null,
        status: 'ongoing',
        metadata: {
          triggers: triggers,
          reactions: reactions,
        },
      })

      // Invalidate and refetch records
      queryClient.invalidateQueries({ queryKey: ['records', user.id] })

      // Navigate back to dashboard
      navigate('/dashboard')
    } catch (err: any) {
      console.error('Error adding allergy:', err)
      setError(err.message || 'Failed to add allergy. Please try again.')
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
          <h1 className="text-[18px] sm:text-[20px] font-bold text-black">Add Allergies</h1>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-6 sm:gap-8">
            <FormField
              control={form.control}
              name="allergen"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[#7a828f] text-[14px]">Allergen</FormLabel>
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
            <Label className="text-[#7a828f] text-[14px]">Reaction</Label>
            <div className="flex flex-wrap gap-2">
              {reactions.map((tag) => (
                <div 
                  key={tag} 
                  className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 bg-[#fdf2f2] rounded-lg text-[13px] sm:text-[14px] text-[#ef4444] font-medium border border-[#fecaca] group hover:bg-[#fee2e2] transition-colors"
                >
                  <span>{tag}</span>
                  <button
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
                  <FormLabel className="text-[#7a828f] text-[14px]">Notes</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Write Something here" 
                      className="border-0 border-b border-[#d0d5dd] rounded-none px-0 h-11 focus-visible:ring-0 focus-visible:border-teal-primary text-[#101928]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                {error}
              </div>
            )}

            <Button 
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 rounded-full bg-teal-primary text-white font-semibold mt-10 disabled:opacity-50"
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