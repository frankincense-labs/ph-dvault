import { useState } from 'react'
import { ChevronLeft, Calendar, Eye, FileText, Loader2, Filter, X, ChevronDown } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import DashboardLayout from '@/components/DashboardLayout'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useAuthStore } from '@/store/useAuthStore'
import { supabase } from '@/lib/supabase'
import type { AccessLog, RecordCategory } from '@/types/database'

type DateFilter = '7days' | '30days' | '90days' | 'all' | 'custom'

// Helper function to generate dates within last 30 days from Jan 14, 2026
const getDateWithinLast30Days = (daysAgo: number, hour: number = 10, minute: number = 30) => {
  const baseDate = new Date('2026-01-14') // January 14, 2026
  const date = new Date(baseDate)
  date.setDate(date.getDate() - daysAgo)
  date.setHours(hour, minute, 0, 0) // Set specific time
  return date
}

// Format date for display
const formatHistoryDate = (date: Date) => {
  return format(date, 'd MMM, yyyy')
}

// Format time for display
const formatHistoryTime = (date: Date) => {
  return format(date, 'h:mm a')
}

export default function SettingsHistory() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [dateFilter, setDateFilter] = useState<DateFilter>('30days')
  const [selectedCategory, setSelectedCategory] = useState<RecordCategory | 'all'>('all')
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [selectedItem, setSelectedItem] = useState<any>(null)
  const [showFilterMenu, setShowFilterMenu] = useState(false)

  // Calculate date range based on filter
  const getDateRange = (filter: DateFilter) => {
    const baseDate = new Date('2026-01-14') // January 14, 2026
    const endDate = new Date(baseDate)
    endDate.setHours(23, 59, 59, 999)
    
    const startDate = new Date(baseDate)
    
    switch (filter) {
      case '7days':
        startDate.setDate(startDate.getDate() - 7)
        break
      case '30days':
        startDate.setDate(startDate.getDate() - 30)
        break
      case '90days':
        startDate.setDate(startDate.getDate() - 90)
        break
      case 'all':
        startDate.setFullYear(2020) // Far back date
        break
      default:
        startDate.setDate(startDate.getDate() - 30)
    }
    
    return { startDate, endDate }
  }

  // Fetch share tokens to get access history with doctor names
  const { data: shareTokens = [], isLoading: sharesLoading } = useQuery({
    queryKey: ['shareTokensHistory', user?.id, dateFilter],
    queryFn: async () => {
      if (!user?.id) return []
      
      const { startDate, endDate } = getDateRange(dateFilter)
      
      // Get share tokens that were accessed
      const { data, error } = await supabase
        .from('share_tokens')
        .select(`
          *,
          accessed_by_profile:profiles!share_tokens_accessed_by_fkey(full_name, role)
        `)
        .eq('user_id', user.id)
        .not('accessed_at', 'is', null)
        .gte('accessed_at', startDate.toISOString())
        .lte('accessed_at', endDate.toISOString())
        .order('accessed_at', { ascending: false })

      if (error) throw error
      return data || []
    },
    enabled: !!user?.id,
  })

  // Fetch access logs from database
  const { data: accessLogs = [], isLoading: logsLoading } = useQuery({
    queryKey: ['accessLogs', user?.id, dateFilter, selectedCategory],
    queryFn: async () => {
      if (!user?.id) return []
      
      const { startDate, endDate } = getDateRange(dateFilter)
      
      let query = supabase
        .from('access_logs')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: false })

      const { data, error } = await query

      if (error) throw error
      return data as AccessLog[]
    },
    enabled: !!user?.id,
  })

  const isLoading = sharesLoading || logsLoading

  // For demo purposes, if no logs exist, show sample data with correct dates and times
  const sampleAccessHistory = [
    { 
      type: 'Link Access', 
      date: getDateWithinLast30Days(3, 10, 30), // 3 days ago (Jan 11, 2026) at 10:30 AM
      time: getDateWithinLast30Days(3, 10, 30),
      records: 3,
      accessedBy: 'Dr. John Smith',
      status: 'Active'
    },
    { 
      type: 'Code Access', 
      date: getDateWithinLast30Days(7, 14, 15), // 7 days ago (Jan 7, 2026) at 2:15 PM
      time: getDateWithinLast30Days(7, 14, 15),
      records: 5,
      accessedBy: 'Emergency Department',
      status: 'Expired'
    },
    { 
      type: 'Direct Access', 
      date: getDateWithinLast30Days(12, 9, 0), // 12 days ago (Jan 2, 2026) at 9:00 AM
      time: getDateWithinLast30Days(12, 9, 0),
      records: 2,
      accessedBy: 'You',
      status: 'Completed'
    },
  ]

  // Combine share tokens and access logs into unified history
  const accessHistory = (() => {
    const history: any[] = []
    
    // Add share token accesses (when doctors accessed shared records)
    shareTokens.forEach((share: any) => {
      if (share.accessed_at) {
        const accessedDate = new Date(share.accessed_at)
        const doctorName = share.accessed_by_profile?.full_name || 'Unknown Doctor'
        const isExpired = new Date(share.expires_at) < new Date()
        
        history.push({
          id: share.id,
          type: share.method === 'link' ? 'Link Access' : 'Code Access',
          date: accessedDate,
          time: accessedDate,
          records: share.record_ids?.length || 0,
          accessedBy: doctorName,
          status: share.status === 'active' && !isExpired ? 'Active' : 
                  share.status === 'expired' || isExpired ? 'Expired' : 
                  share.status === 'revoked' ? 'Revoked' : 'Completed',
          shareToken: share
        })
      }
    })
    
    // Add access logs (other actions)
    accessLogs.forEach((log: AccessLog) => {
      const logDate = new Date(log.created_at)
      history.push({
        id: log.id,
        type: log.action === 'access_shared' ? 'Link Access' : 
              log.action === 'share' ? 'Code Access' : 
              log.action === 'view' ? 'Direct Access' : 'Direct Access',
        date: logDate,
        time: logDate,
        records: 1,
        accessedBy: 'You',
        status: 'Completed' as const,
        accessLog: log
      })
    })
    
    // Sort by date (most recent first)
    history.sort((a, b) => b.date.getTime() - a.date.getTime())
    
    // Return combined history or sample data if empty
    return history.length > 0 ? history : sampleAccessHistory
  })()

  return (
    <DashboardLayout showProfile={false}>
      <div className="flex flex-col gap-6 sm:gap-8 pb-10">
        {/* Header */}
        <div className="flex items-center gap-4 sm:gap-6">
          <button onClick={() => navigate(-1)} className="p-2 bg-[#f5f6f7] rounded-lg hover:bg-[#eeeffd] transition-colors">
            <ChevronLeft className="w-5 h-5 text-[#98a2b3]" />
          </button>
          <h1 className="text-[18px] sm:text-[20px] font-bold text-black">Access History</h1>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Date Filter */}
          <Popover open={showFilterMenu} onOpenChange={setShowFilterMenu}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="flex items-center gap-2 bg-[#f5f6f7] border-[#d0d5dd] hover:bg-[#eeeffd]"
              >
                <Filter className="w-4 h-4 text-[#667185]" />
                <span className="text-[12px] sm:text-[13px] text-[#101928]">
                  {dateFilter === '7days' ? 'Last 7 days' :
                   dateFilter === '30days' ? 'Last 30 days' :
                   dateFilter === '90days' ? 'Last 90 days' :
                   dateFilter === 'all' ? 'All time' : 'Custom'}
                </span>
                <ChevronDown className="w-4 h-4 text-[#667185]" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-2 rounded-none" align="start">
              <div className="flex flex-col gap-1">
                {[
                  { value: '7days', label: 'Last 7 days' },
                  { value: '30days', label: 'Last 30 days' },
                  { value: '90days', label: 'Last 90 days' },
                  { value: 'all', label: 'All time' },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setDateFilter(option.value as DateFilter)
                      setShowFilterMenu(false)
                    }}
                    className={`px-3 py-2 text-left text-sm rounded-none transition-colors ${
                      dateFilter === option.value
                        ? 'bg-teal-primary text-white font-medium'
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          {/* Category Filter */}
          {selectedCategory !== 'all' && (
            <div className="flex items-center gap-2 bg-teal-50 border border-teal-200 px-3 py-1.5 rounded-lg">
              <span className="text-[12px] text-teal-700 capitalize">
                {selectedCategory.replace('_', ' ')}
              </span>
              <button
                onClick={() => setSelectedCategory('all')}
                className="text-teal-700 hover:text-teal-900"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>

        {/* History List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-teal-primary" />
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {accessHistory.map((item, i) => (
              <div 
                key={item.id || i} 
                className="flex items-start justify-between p-4 sm:p-5 bg-white border border-[#e5e7eb] rounded-xl shadow-sm hover:shadow-md hover:border-teal-primary/20 transition-all cursor-pointer group"
                onClick={() => {
                  setSelectedItem(item)
                  setShowDetailsDialog(true)
                }}
              >
                <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
                  <div className="w-10 h-10 sm:w-11 sm:h-11 bg-gradient-to-br from-teal-50 to-teal-100 rounded-lg flex items-center justify-center shrink-0 group-hover:from-teal-100 group-hover:to-teal-200 transition-colors">
                    <Eye className="w-5 h-5 text-teal-600" />
                  </div>
                  <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-[14px] sm:text-[15px] font-semibold text-gray-900">{item.type}</h4>
                      <span className={`px-2.5 py-1 rounded-md text-[10px] sm:text-[11px] font-medium ${
                        item.status === 'Active' ? 'bg-green-50 text-green-700 border border-green-200' :
                        item.status === 'Expired' ? 'bg-gray-50 text-gray-600 border border-gray-200' :
                        item.status === 'Revoked' ? 'bg-red-50 text-red-700 border border-red-200' :
                        'bg-blue-50 text-blue-700 border border-blue-200'
                      }`}>
                        {item.status}
                      </span>
                    </div>
                    <p className="text-[13px] sm:text-[14px] font-medium text-gray-700">{item.accessedBy}</p>
                    <div className="flex items-center gap-2 text-[11px] sm:text-[12px] text-gray-500 flex-wrap">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{formatHistoryDate(item.date)} • {formatHistoryTime(item.time)}</span>
                      </div>
                      <span className="text-gray-300">•</span>
                      <div className="flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        <span>{item.records} Record{item.records !== 1 ? 's' : ''}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State (if no history) */}
        {accessHistory.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
            <div className="w-16 h-16 bg-[#f5f6f7] rounded-full flex items-center justify-center">
              <Eye className="w-8 h-8 text-[#98a2b3]" />
            </div>
            <div className="flex flex-col gap-2">
              <h3 className="text-[16px] font-semibold text-black">No Access History</h3>
              <p className="text-[13px] text-[#8d8989]">Your access history will appear here</p>
            </div>
          </div>
        )}
      </div>

      {/* Access Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="bg-white border-0 shadow-2xl rounded-[12px] p-4 sm:p-6 max-w-[90vw] sm:max-w-[500px] mx-auto">
          <DialogHeader>
            <DialogTitle className="text-[18px] font-bold text-black">Access Details</DialogTitle>
            <DialogDescription className="text-[14px] text-[#8d8989] pt-2">
              Information about this access event
            </DialogDescription>
          </DialogHeader>
          {selectedItem && (
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200">
                <span className="text-[13px] font-medium text-gray-600">Type</span>
                <span className="text-[14px] font-semibold text-gray-900">{selectedItem.type}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200">
                <span className="text-[13px] font-medium text-gray-600">Accessed By</span>
                <span className="text-[14px] font-semibold text-gray-900">{selectedItem.accessedBy}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200">
                <span className="text-[13px] font-medium text-gray-600">Date & Time</span>
                <span className="text-[14px] font-semibold text-gray-900">
                  {formatHistoryDate(selectedItem.date)} • {formatHistoryTime(selectedItem.time)}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200">
                <span className="text-[13px] font-medium text-gray-600">Records</span>
                <span className="text-[14px] font-semibold text-gray-900">{selectedItem.records} Record{selectedItem.records !== 1 ? 's' : ''}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200">
                <span className="text-[13px] font-medium text-gray-600">Status</span>
                <span className={`px-2.5 py-1 rounded-md text-[11px] font-medium ${
                  selectedItem.status === 'Active' ? 'bg-green-50 text-green-700 border border-green-200' :
                  selectedItem.status === 'Expired' ? 'bg-gray-50 text-gray-600 border border-gray-200' :
                  selectedItem.status === 'Revoked' ? 'bg-red-50 text-red-700 border border-red-200' :
                  'bg-blue-50 text-blue-700 border border-blue-200'
                }`}>
                  {selectedItem.status}
                </span>
              </div>
            </div>
          )}
          <div className="mt-6">
            <Button
              onClick={() => setShowDetailsDialog(false)}
              className="w-full bg-teal-primary text-white hover:bg-teal-600"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
