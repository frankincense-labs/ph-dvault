import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, AlertTriangle, Heart, Droplets, Activity, Phone, RefreshCw, Loader2, WifiOff, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getEmergencyData, saveEmergencyData, buildEmergencyData, clearEmergencyData } from '@/lib/emergency'
import { useAuthStore } from '@/store/useAuthStore'
import { supabase } from '@/lib/supabase'
import { getRecords } from '@/lib/api/records'
import type { EmergencyData } from '@/types/database'

export default function EmergencyMode() {
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuthStore()
  const [emergencyData, setEmergencyData] = useState<EmergencyData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const [isOffline, setIsOffline] = useState(!navigator.onLine)
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null)

  // Check online status
  useEffect(() => {
    const handleOnline = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Load emergency data on mount
  useEffect(() => {
    loadEmergencyData()
  }, [])

  const loadEmergencyData = () => {
    setIsLoading(true)
    try {
      const data = getEmergencyData()
      setEmergencyData(data)
      
      // Get last sync time from localStorage
      const syncTime = localStorage.getItem('ph-dvault-emergency-sync-time')
      setLastSyncTime(syncTime)
    } finally {
      setIsLoading(false)
    }
  }

  // Sync emergency data from server
  const syncEmergencyData = async () => {
    if (!user?.id || !isAuthenticated) {
      alert('Please sign in to sync your emergency data')
      return
    }

    setIsSyncing(true)
    try {
      // Fetch profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileError) throw profileError

      // Fetch records
      const records = await getRecords(user.id)

      // Build emergency data
      const data = await buildEmergencyData(profile, records)
      
      // Save to localStorage
      saveEmergencyData(data)
      setEmergencyData(data)

      // Update sync time
      const now = new Date().toISOString()
      localStorage.setItem('ph-dvault-emergency-sync-time', now)
      setLastSyncTime(now)

      alert('Emergency data synced successfully!')
    } catch (error: any) {
      console.error('Sync failed:', error)
      alert(error.message || 'Failed to sync emergency data')
    } finally {
      setIsSyncing(false)
    }
  }

  // Clear emergency data
  const handleClearData = () => {
    if (confirm('Are you sure you want to clear your emergency data? You will need to sync again to restore it.')) {
      clearEmergencyData()
      localStorage.removeItem('ph-dvault-emergency-sync-time')
      setEmergencyData(null)
      setLastSyncTime(null)
    }
  }

  const formatSyncTime = (isoString: string | null) => {
    if (!isoString) return 'Never'
    const date = new Date(isoString)
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="w-8 h-8 animate-spin text-red-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-white">
      {/* Header */}
      <div className="bg-red-600 text-white px-4 py-4 sm:py-5 sticky top-0 z-10">
        <div className="max-w-lg mx-auto flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)} 
            className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6" />
            <h1 className="text-[18px] sm:text-[20px] font-bold">Emergency Mode</h1>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 sm:py-8">
        {/* Offline Banner */}
        {isOffline && (
          <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-xl mb-6">
            <WifiOff className="w-5 h-5 shrink-0" />
            <p className="text-[13px] font-medium">You're offline. Showing cached emergency data.</p>
          </div>
        )}

        {/* Sync Status */}
        <div className="flex items-center justify-between bg-white border border-gray-200 rounded-xl p-4 mb-6 shadow-sm">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-gray-500" />
            <div>
              <p className="text-[13px] text-gray-500">Last synced</p>
              <p className="text-[14px] font-medium text-gray-900">{formatSyncTime(lastSyncTime)}</p>
            </div>
          </div>
          <Button
            onClick={syncEmergencyData}
            disabled={isSyncing || isOffline}
            variant="outline"
            className="flex items-center gap-2 border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            {isSyncing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            Sync
          </Button>
        </div>

        {!emergencyData ? (
          /* No Data State */
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
              <AlertTriangle className="w-10 h-10 text-red-600" />
            </div>
            <h2 className="text-[18px] font-bold text-gray-900 mb-2">No Emergency Data</h2>
            <p className="text-[14px] text-gray-600 mb-6 max-w-xs">
              Sync your emergency data now so it's available even when you're offline.
            </p>
            <Button
              onClick={syncEmergencyData}
              disabled={isSyncing || !isAuthenticated}
              className="bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
            >
              {isSyncing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Syncing...
                </>
              ) : (
                'Sync Emergency Data'
              )}
            </Button>
            {!isAuthenticated && (
              <p className="text-[12px] text-amber-600 mt-3">Sign in to sync your data</p>
            )}
          </div>
        ) : (
          /* Emergency Data Display */
          <div className="flex flex-col gap-5">
            {/* Critical Info Card */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
              <div className="bg-red-600 text-white px-4 py-3">
                <h2 className="text-[15px] font-bold flex items-center gap-2">
                  <Heart className="w-4 h-4" />
                  Critical Information
                </h2>
              </div>
              <div className="p-4 grid grid-cols-2 gap-4">
                <div className="flex flex-col items-center p-4 bg-red-50 rounded-xl">
                  <Droplets className="w-6 h-6 text-red-600 mb-2" />
                  <p className="text-[12px] text-gray-500 mb-1">Blood Group</p>
                  <p className="text-[20px] font-bold text-gray-900">
                    {emergencyData.blood_group || '—'}
                  </p>
                </div>
                <div className="flex flex-col items-center p-4 bg-red-50 rounded-xl">
                  <Activity className="w-6 h-6 text-red-600 mb-2" />
                  <p className="text-[12px] text-gray-500 mb-1">Genotype</p>
                  <p className="text-[20px] font-bold text-gray-900">
                    {emergencyData.genotype || '—'}
                  </p>
                </div>
              </div>
            </div>

            {/* Allergies */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
              <div className="bg-amber-500 text-white px-4 py-3">
                <h2 className="text-[15px] font-bold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Allergies
                </h2>
              </div>
              <div className="p-4">
                {emergencyData.allergies.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {emergencyData.allergies.map((allergy, i) => (
                      <span 
                        key={i} 
                        className="px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-full text-[13px] font-medium text-amber-800"
                      >
                        {allergy}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-[14px] text-gray-500">No known allergies</p>
                )}
              </div>
            </div>

            {/* Chronic Conditions */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
              <div className="bg-purple-600 text-white px-4 py-3">
                <h2 className="text-[15px] font-bold flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  Chronic Conditions
                </h2>
              </div>
              <div className="p-4">
                {emergencyData.chronic_conditions.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {emergencyData.chronic_conditions.map((condition, i) => (
                      <span 
                        key={i} 
                        className="px-3 py-1.5 bg-purple-50 border border-purple-200 rounded-full text-[13px] font-medium text-purple-800"
                      >
                        {condition}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-[14px] text-gray-500">No chronic conditions</p>
                )}
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
              <div className="bg-teal-600 text-white px-4 py-3">
                <h2 className="text-[15px] font-bold flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Emergency Contact
                </h2>
              </div>
              <div className="p-4">
                {emergencyData.emergency_contact ? (
                  <div className="flex flex-col gap-2">
                    <p className="text-[16px] font-semibold text-gray-900">
                      {emergencyData.emergency_contact.name}
                    </p>
                    <p className="text-[14px] text-gray-600">
                      {emergencyData.emergency_contact.relationship}
                    </p>
                    <a 
                      href={`tel:${emergencyData.emergency_contact.phone}`}
                      className="flex items-center gap-2 text-teal-600 font-medium text-[15px] mt-2"
                    >
                      <Phone className="w-4 h-4" />
                      {emergencyData.emergency_contact.phone}
                    </a>
                  </div>
                ) : (
                  <p className="text-[14px] text-gray-500">No emergency contact set</p>
                )}
              </div>
            </div>

            {/* Clear Data Button */}
            <Button
              variant="outline"
              onClick={handleClearData}
              className="w-full border-gray-300 text-gray-600 hover:bg-gray-50 mt-4"
            >
              Clear Cached Data
            </Button>
          </div>
        )}

        {/* Info Note */}
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <p className="text-[13px] text-blue-800 leading-relaxed">
            <strong>About Emergency Mode:</strong> This data is stored locally on your device and can be accessed even without an internet connection. Sync regularly to keep it up to date.
          </p>
        </div>
      </div>
    </div>
  )
}
