import { useState, useEffect } from 'react'
import { ChevronRight, LogOut, Shield, Key, HelpCircle, FileText, UserMinus, Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '@/components/DashboardLayout'
import { Switch } from '@/components/ui/switch'
import { useAuthStore } from '@/store/useAuthStore'
import { supabase } from '@/lib/supabase'

interface SettingItem {
  label: string
  icon: React.ComponentType<{ className?: string, style?: React.CSSProperties }>
  path?: string
  isSwitch?: boolean
  color?: string
}

interface SettingSection {
  title: string
  items: SettingItem[]
}

export default function Settings() {
  const navigate = useNavigate()
  const { logout, user } = useAuthStore()
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

  const handleItemClick = async (item: SettingItem) => {
    if (item.path) {
      if (item.path === '/signin' && item.label === 'Log Out') {
        await logout()
      }
      navigate(item.path)
    }
  }

  const sections: SettingSection[] = [
    {
      title: 'General',
      items: [
        { label: 'Access History', icon: FileText, path: '/settings/history' },
        { label: 'Enable Biometrics', icon: Shield, isSwitch: true },
        { label: 'Password & PIN', icon: Key, path: '/settings/security' },
      ]
    },
    {
      title: 'Support & Legal',
      items: [
        { label: 'Help & Contact Support', icon: HelpCircle, path: '/support' },
        { label: 'Privacy Policy', icon: Shield, path: '/privacy' },
        { label: 'Terms of Service', icon: FileText, path: '/terms' },
      ]
    },
    {
      title: 'Account Actions',
      items: [
        { label: 'Log Out', icon: LogOut, path: '/signin', color: '#35393f' },
        { label: 'Deactivate my Account', icon: UserMinus, path: '/deactivate', color: '#d42620' },
        { label: 'Delete my Account', icon: Trash2, path: '/delete', color: '#d42620' },
      ]
    }
  ]

  return (
    <DashboardLayout showProfile={false}>
      <div className="flex flex-col gap-8 sm:gap-10 pb-10">
        <h1 className="text-[18px] sm:text-[20px] font-bold text-navy-dark px-4">Settings</h1>

        {/* Profile Card */}
        <div 
          onClick={() => navigate('/settings/profile')}
          className="flex items-center justify-between px-4 py-2 hover:bg-gray-50 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-4">
            {profile?.avatar_url && (
              <img 
                src={profile.avatar_url} 
                alt={profile?.full_name || 'Profile'} 
                className="w-10 h-10 rounded-full object-cover" 
              />
            )}
            <div className="flex flex-col">
              <span className="text-[16px] font-medium text-black">
                {profile?.full_name || user?.full_name || 'User'}
              </span>
              {profile?.phone && (
                <span className="text-[14px] text-[#35393f]">{profile.phone}</span>
              )}
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-[#98a2b3]" />
        </div>

        {/* Setting Groups */}
        <div className="flex flex-col gap-8">
          {sections.map((section, idx) => (
            <div key={idx} className="flex flex-col">
              <div className="px-4 flex flex-col">
                {section.items.map((item, i) => (
                  <div 
                    key={i} 
                    onClick={() => item.path && handleItemClick(item)}
                    className="flex items-center justify-between py-5 border-b border-[#f6f3f3] last:border-0 cursor-pointer hover:bg-gray-50 -mx-4 px-4 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="w-5 h-5" style={{ color: item.color || '#35393f' }} />
                      <span className="text-[14px]" style={{ color: item.color || '#35393f' }}>{item.label}</span>
                    </div>
                    {item.isSwitch ? (
                      <Switch />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-[#98a2b3]" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  )
}