import { ChevronLeft, FileText } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '@/components/DashboardLayout'

export default function Terms() {
  const navigate = useNavigate()

  const sections = [
    {
      title: '1. Acceptance of Terms',
      content: 'By accessing and using PH-DVault, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to these terms, please do not use our service.'
    },
    {
      title: '2. Description of Service',
      content: 'PH-DVault is a personal health data vault that allows you to store, manage, and share your medical records securely. We provide a platform for storing encrypted health information and sharing it with authorized healthcare providers.'
    },
    {
      title: '3. User Responsibilities',
      content: 'You are responsible for maintaining the confidentiality of your account credentials. You agree to provide accurate and complete information and to update such information as necessary. You are solely responsible for all activities that occur under your account.'
    },
    {
      title: '4. Data Accuracy',
      content: 'You are responsible for the accuracy of the medical information you upload to PH-DVault. We do not verify or validate the medical data you provide. Always consult with healthcare professionals for medical advice.'
    },
    {
      title: '5. Prohibited Uses',
      content: 'You may not use PH-DVault for any illegal or unauthorized purpose. You may not attempt to gain unauthorized access to any portion of the service, other accounts, or computer systems connected to the service.'
    },
    {
      title: '6. Intellectual Property',
      content: 'All content, features, and functionality of PH-DVault are owned by us and are protected by international copyright, trademark, and other intellectual property laws.'
    },
    {
      title: '7. Limitation of Liability',
      content: 'PH-DVault is provided "as is" without warranties of any kind. We shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the service.'
    },
    {
      title: '8. Termination',
      content: 'We reserve the right to terminate or suspend your account and access to the service immediately, without prior notice, for any breach of these Terms of Service.'
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
            <FileText className="w-5 h-5 text-teal-primary" />
            <h1 className="text-[18px] sm:text-[20px] font-bold text-black">Terms of Service</h1>
          </div>
        </div>

        {/* Last Updated */}
        <div className="p-3 bg-[#f5f6f7] rounded-lg">
          <p className="text-[12px] text-[#8d8989]">Last Updated: February 12, 2025</p>
        </div>

        {/* Introduction */}
        <div className="flex flex-col gap-3">
          <p className="text-[14px] text-[#1a1a1a] leading-relaxed">
            Please read these Terms of Service carefully before using PH-DVault. These terms govern your access to and use of our service.
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
            If you have any questions about these Terms of Service, please contact us at{' '}
            <a href="mailto:legal@phdvault.com" className="text-teal-primary underline">legal@phdvault.com</a>
          </p>
        </div>
      </div>
    </DashboardLayout>
  )
}
