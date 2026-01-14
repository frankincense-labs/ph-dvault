import { NavLink } from 'react-router-dom'
import { Home, Share2, Settings } from 'lucide-react'

export default function BottomNav() {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-[#eeeffd] border-t border-[#cccccc] px-6 py-4 lg:py-6">
      <div className="max-w-screen-xl mx-auto flex items-center justify-around">
        <NavLink 
          to="/dashboard" 
          className={({ isActive }) => `flex flex-col items-center gap-1 ${isActive ? 'text-teal-primary font-semibold' : 'text-[#444951]'}`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[14px]">Home</span>
        </NavLink>
        
        <NavLink 
          to="/share" 
          className={({ isActive }) => `flex flex-col items-center gap-1 ${isActive ? 'text-teal-primary font-semibold' : 'text-[#444951]'}`}
        >
          <Share2 className="w-5 h-5" />
          <span className="text-[14px]">Share</span>
        </NavLink>
        
        <NavLink 
          to="/settings" 
          className={({ isActive }) => `flex flex-col items-center gap-1 ${isActive ? 'text-teal-primary font-semibold' : 'text-[#444951]'}`}
        >
          <Settings className="w-5 h-5" />
          <span className="text-[14px]">Settings</span>
        </NavLink>
      </div>
      {/* Home Indicator line */}
      <div className="mt-4 flex justify-center lg:hidden">
        <div className="w-[134px] h-[5px] bg-[#1a1a1a] rounded-full" />
      </div>
    </div>
  )
}