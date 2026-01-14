import { ChevronLeft, Shield } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '@/components/DashboardLayout'

export default function Privacy() {
  const navigate = useNavigate()

  const sections = [
    {
      title: '1. Information We Collect',
      content: 'We collect information that you provide directly to us, including your name, email address, phone number, and medical records. We also collect information automatically when you use our service, such as device information and usage data.'
    },
    {
      title: '2. How We Use Your Information',
      content: 'We use the information we collect to provide, maintain, and improve our services, process transactions, send you technical notices and support messages, and respond to your comments and questions.'
    },
    {
      title: '3. Data Security',
      content: 'We implement appropriate technical and organizational measures to protect your personal information. All medical data is encrypted using AES-256 encryption before storage. We use secure servers and follow industry best practices.'
    },
    {
      title: '4. Data Sharing',
      content: 'We do not sell, trade, or rent your personal information to third parties. We may share your information only with your explicit consent, such as when you generate a share link or access code.'
    },
    {
      title: '5. Your Rights',
      content: 'You have the right to access, update, or delete your personal information at any time. You can also request a copy of your data or withdraw consent for data processing.'
    },
    {
      title: '6. Data Retention',
      content: 'We retain your personal information for as long as necessary to provide our services and comply with legal obligations. You can request deletion of your account and data at any time.'
    },
    {
      title: '7. Changes to This Policy',
      content: 'We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Last Updated" date.'
    },
  ]

  return (
    <DashboardLayout showProfile={false}>
      <div className="flex flex-col gap-6 sm:gap-8 pb-10">
        {/* Header */}
        <div className="flex items-center gap-4 sm:gap-6">
          <button onClick={() => navigate(-1)} className="p-2 bg-[#f5f6f7] rounded-lg hover:bg-[#eeeffd] transition-colors">
            <ChevronLeft className="w-5 h-5 text-[#98a2b3]" />
          </button>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-teal-primary" />
            <h1 className="text-[18px] sm:text-[20px] font-bold text-black">Privacy Policy</h1>
          </div>
        </div>

        {/* Last Updated */}
        <div className="p-3 bg-[#f5f6f7] rounded-lg">
          <p className="text-[12px] text-[#8d8989]">Last Updated: February 12, 2025</p>
        </div>

        {/* Introduction */}
        <div className="flex flex-col gap-3">
          <p className="text-[14px] text-[#1a1a1a] leading-relaxed">
            At PH-DVault, we are committed to protecting your privacy and ensuring the security of your personal health information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our service.
          </p>
        </div>

        {/* Sections */}
        <div className="flex flex-col gap-6">
          {sections.map((section, i) => (
            <div key={i} className="flex flex-col gap-3">
              <h2 className="text-[16px] font-semibold text-black">{section.title}</h2>
              <p className="text-[14px] text-[#8d8989] leading-relaxed">{section.content}</p>
            </div>
          ))}
        </div>

        {/* Contact */}
        <div className="p-4 bg-[#f5f6f7] rounded-xl">
          <h3 className="text-[14px] font-semibold text-black mb-2">Contact Us</h3>
          <p className="text-[13px] text-[#8d8989]">
            If you have any questions about this Privacy Policy, please contact us at{' '}
            <a href="mailto:privacy@phdvault.com" className="text-teal-primary underline">privacy@phdvault.com</a>
          </p>
        </div>
      </div>
    </DashboardLayout>
  )
}
