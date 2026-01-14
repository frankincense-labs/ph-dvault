import { useState, useEffect } from 'react'
import BottomNav from './BottomNav'
import Sidebar from './Sidebar'
import { Menu } from 'lucide-react'
import { useAuthStore } from '@/store/useAuthStore'
import { supabase } from '@/lib/supabase'

interface DashboardLayoutProps {
  children: React.ReactNode
  showProfile?: boolean
}

export default function DashboardLayout({ children, showProfile = true }: DashboardLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { user } = useAuthStore()
  const [profile, setProfile] = useState<any>(null)

  useEffect(() => {
    if (user?.id) {
      supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
        .then(({ data }) => setProfile(data))
    }
  }, [user])

  const getFirstName = (fullName: string | null) => {
    if (!fullName) return 'User'
    return fullName.split(' ')[0]
  }

  const displayName = profile?.full_name || user?.full_name || 'User'
  const firstName = getFirstName(displayName)
  const avatarUrl = profile?.avatar_url || null

  return (
    <div className="min-h-screen bg-white flex relative overflow-x-hidden">
      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Desktop Sidebar */}
      <Sidebar isMobileOpen={mobileMenuOpen} onMobileClose={() => setMobileMenuOpen(false)} firstName={firstName} />

      {/* Main Content Area */}
      <div className="flex-1 lg:ml-[270px] pb-24 sm:pb-32 lg:pb-8 min-w-0 w-full overflow-x-hidden">
        <div className="w-full max-w-full mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 lg:px-10 lg:py-10 lg:max-w-screen-xl">
          {/* Mobile Header */}
          <div className="flex items-center justify-between mb-6 sm:mb-8 lg:hidden">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Menu className="w-6 h-6 text-[#1a1a1a]" />
            </button>
            <span className="text-[16px] sm:text-[17px] font-semibold">9:41</span>
            <img src="/assets/stat-dots.svg" alt="Status" className="h-3" />
          </div>

          {showProfile && (
            <div className="flex items-center justify-between mb-6 sm:mb-8 gap-3">
              <div className="flex flex-col min-w-0 flex-1">
                <h1 className="text-[18px] sm:text-[20px] lg:text-[24px] font-bold text-[#1a1a1a] truncate">
                  Hello, {displayName}!
                </h1>
                <p className="text-[13px] sm:text-[14px] lg:text-[16px] text-[#b8b8b8]">Here is your health summary</p>
              </div>
              {avatarUrl && (
              <img 
                  src={avatarUrl} 
                  alt={displayName} 
                  className="w-10 h-10 sm:w-11 sm:h-11 lg:w-14 lg:h-14 rounded-full object-cover shrink-0" 
              />
              )}
            </div>
          )}

          <main>
            {children}
          </main>
        </div>
      </div>

      {/* Mobile Bottom Nav */}
      <div className="lg:hidden">
        <BottomNav />
      </div>
    </div>
  )
}