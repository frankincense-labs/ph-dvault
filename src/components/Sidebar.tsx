import { NavLink, useNavigate } from 'react-router-dom'
import { Home, Share2, Settings, LogOut, X } from 'lucide-react'
import { useAuthStore } from '@/store/useAuthStore'

interface SidebarProps {
  isMobileOpen?: boolean
  onMobileClose?: () => void
  firstName?: string
}

export default function Sidebar({ isMobileOpen = false, onMobileClose, firstName = 'User' }: SidebarProps) {
  const navigate = useNavigate()
  const { logout } = useAuthStore()
  
  const navItems = [
    { label: 'Home', icon: Home, path: '/dashboard' },
    { label: 'Share', icon: Share2, path: '/share' },
    { label: 'Settings', icon: Settings, path: '/settings' },
  ]

  const handleNavClick = () => {
    if (onMobileClose) {
      onMobileClose()
    }
  }

  const handleLogout = async () => {
    await logout()
    navigate('/signin')
    if (onMobileClose) {
      onMobileClose()
    }
  }

  return (
    <>
      {/* Mobile Sidebar */}
      <div 
        className={`lg:hidden fixed left-0 top-0 h-screen w-[270px] bg-white border-r border-[#dfe2e7] z-50 transform transition-transform duration-300 ease-in-out ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full py-8 px-4">
          {/* Mobile Header with Close Button */}
          <div className="flex items-center justify-between mb-6 px-4">
            <div className="flex items-center gap-3">
              <img src="/assets/logo.svg" alt="Logo" className="w-8 h-8" />
              <span className="text-[18px] font-bold text-black">PH-DVault</span>
            </div>
            <button
              onClick={handleNavClick}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-[#444951]" />
            </button>
          </div>

          {/* Brand/User Header */}
          <div className="flex flex-col gap-5 px-4 mb-10">
            <div className="pt-5 border-t border-[#dfe2e7]">
              <p className="text-[18px] font-bold text-[#1a1a1a]">Hello, <span className="text-teal-primary font-bold">{firstName}</span></p>
            </div>
          </div>

          {/* Nav Links */}
          <nav className="flex-1 flex flex-col gap-2">
            {navItems.map((item, index) => (
              <NavLink
                key={item.label}
                to={item.path}
                onClick={handleNavClick}
                className={({ isActive }) => 
                  `flex items-center gap-3 px-4 py-4 rounded-xl transition-all duration-200 ${
                    isActive 
                      ? 'bg-[#eef2f2] text-teal-primary font-semibold shadow-sm' 
                      : 'text-[#444951] hover:bg-gray-50 hover:translate-x-1'
                  }`
                }
                style={{ 
                  animationDelay: `${index * 50}ms`,
                  animationFillMode: 'both'
                }}
              >
                <item.icon className="w-5 h-5 transition-transform duration-200 group-hover:scale-110" />
                <span className="text-[14px]">{item.label}</span>
              </NavLink>
            ))}
          </nav>

          {/* Logout at bottom */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-4 rounded-xl text-[#cb1a14] bg-[#fdf2f2] hover:bg-red-100 transition-colors mt-auto"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-[14px] font-medium">Log Out</span>
          </button>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex flex-col w-[270px] h-screen fixed left-0 top-0 bg-white border-r border-[#dfe2e7] py-8 px-4">
      {/* Brand/User Header */}
      <div className="flex flex-col gap-5 px-4 mb-10">
        <div className="flex items-center gap-3">
          <img src="/assets/logo.svg" alt="Logo" className="w-8 h-8" />
          <span className="text-[18px] font-bold text-black">PH-DVault</span>
        </div>
        <div className="pt-5 border-t border-[#dfe2e7]">
           <p className="text-[18px] font-bold text-[#1a1a1a]">Hello, <span className="text-teal-primary font-bold">{firstName}</span></p>
        </div>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 flex flex-col gap-2">
        {navItems.map((item) => (
          <NavLink
            key={item.label}
            to={item.path}
            className={({ isActive }) => 
              `flex items-center gap-3 px-4 py-4 rounded-xl transition-colors ${
                isActive 
                  ? 'bg-[#eef2f2] text-teal-primary font-semibold' 
                  : 'text-[#444951] hover:bg-gray-50'
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            <span className="text-[14px]">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Logout at bottom */}
      <button
        onClick={handleLogout}
        className="flex items-center gap-3 px-4 py-4 rounded-xl text-[#cb1a14] bg-[#fdf2f2] hover:bg-red-100 transition-colors mt-auto"
      >
        <LogOut className="w-5 h-5" />
        <span className="text-[14px] font-medium">Log Out</span>
      </button>
    </div>
    </>
  )
}