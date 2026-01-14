import { ChevronLeft, Calendar, ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '@/components/DashboardLayout'

export default function PatientDetails() {
  const navigate = useNavigate()

  return (
    <DashboardLayout showProfile={false}>
      <div className="flex flex-col gap-10">
        {/* Header */}
        <div className="flex items-center gap-6">
          <button onClick={() => navigate(-1)} className="p-2 bg-[#f5f6f7] rounded-lg">
            <ChevronLeft className="w-5 h-5 text-[#98a2b3]" />
          </button>
          <h1 className="text-[20px] font-bold text-[#1a1a1a]">Patient Details</h1>
        </div>

        {/* Profile Info */}
        <div className="flex flex-col items-center gap-4">
          <img src="/assets/avatar-mary.jpg" alt="Profile" className="w-[100px] h-[100px] rounded-full" />
          <div className="text-center">
            <h2 className="text-[16px] font-medium text-[#1a1a1a]">MaryAnn Paul</h2>
            <p className="text-[14px] text-[#868484]">08123456789</p>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-2">
          {[
            { label: 'Gender', value: 'Female', icon: '/assets/stat-dots.svg' },
            { label: 'Age', value: '34', icon: '/assets/stat-dots.svg' },
            { label: 'Blood Group', value: 'O+', icon: '/assets/stat-dots.svg' },
            { label: 'Genotype', value: 'AA', icon: '/assets/stat-dots.svg' },
          ].map((stat) => (
            <div key={stat.label} className="flex flex-col items-center gap-1 p-2 sm:p-0">
              <img src={stat.icon} alt="" className="h-3 sm:h-3" />
              <span className="text-[14px] sm:text-[14px] font-medium">{stat.value}</span>
              <span className="text-[12px] sm:text-[12px] text-[#868484]">{stat.label}</span>
            </div>
          ))}
        </div>

        {/* Medical Records Section */}
        <div className="flex flex-col gap-6">
          <h3 className="text-[16px] font-semibold text-black">Medical Information</h3>
          
          <div className="flex flex-col gap-4">
            {/* Treatment Card */}
            {[
              { type: 'Malaria Treatment', hospital: 'Well Vine Hospital', date: '12/05/25 - 20/05/25' },
              { type: 'Typhoid Treatment', hospital: 'Well Vine Hospital', date: '12/05/25 - 20/05/25' },
              { type: 'Typhoid Treatment', hospital: 'Well Vine Hospital', date: '12/05/25 - 20/05/25' },
            ].map((record, i) => (
              <div key={i} className="flex items-center gap-4 bg-[#f5f6f7] p-4 rounded-lg">
                <div className="w-11 h-11 bg-purple-accent rounded-lg flex items-center justify-center">
                  <img src="/assets/treatment-icon.svg" alt="Treatment" className="w-6 h-6 invert" />
                </div>
                <div className="flex-1">
                  <h4 className="text-[16px] font-medium">{record.type}</h4>
                  <p className="text-[14px] text-[#444951]">{record.hospital}</p>
                  <div className="flex items-center gap-2 mt-1 text-[14px] text-[#444951]">
                    <Calendar className="w-4 h-4" />
                    <span>{record.date}</span>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-[#98a2b3]" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}