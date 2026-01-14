import { ChevronLeft, Mail, MessageCircle, Phone, HelpCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '@/components/DashboardLayout'
import { Button } from '@/components/ui/button'

export default function Support() {
  const navigate = useNavigate()

  const supportOptions = [
    {
      icon: Mail,
      title: 'Email Support',
      description: 'Send us an email and we\'ll get back to you within 24 hours',
      action: 'support@phdvault.com',
      color: '#3b82f6'
    },
    {
      icon: MessageCircle,
      title: 'Live Chat',
      description: 'Chat with our support team in real-time',
      action: 'Start Chat',
      color: '#10b880'
    },
    {
      icon: Phone,
      title: 'Phone Support',
      description: 'Call us for immediate assistance',
      action: '+234 800 123 4567',
      color: '#f59e08'
    },
  ]

  const faqs = [
    {
      question: 'How do I share my medical records?',
      answer: 'You can share your records by generating a secure link or access code from the Share page. Both options allow you to set an expiration time.'
    },
    {
      question: 'Is my data encrypted?',
      answer: 'Yes, all your medical data is encrypted using AES-256 encryption before being stored in our secure database.'
    },
    {
      question: 'Can I delete my account?',
      answer: 'Yes, you can delete your account from the Settings page. This will permanently remove all your data.'
    },
    {
      question: 'How do I change my password?',
      answer: 'Go to Settings > Password & PIN to change your password or PIN.'
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
          <h1 className="text-[18px] sm:text-[20px] font-bold text-black">Help & Support</h1>
        </div>

        {/* Support Options */}
        <div className="flex flex-col gap-4">
          <h2 className="text-[16px] font-semibold text-black">Contact Us</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {supportOptions.map((option, i) => (
              <div key={i} className="flex flex-col gap-3 p-4 bg-white border border-[#f5f6f7] rounded-xl">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${option.color}20` }}>
                  <option.icon className="w-5 h-5" style={{ color: option.color }} />
                </div>
                <div className="flex flex-col gap-1">
                  <h3 className="text-[14px] font-semibold text-black">{option.title}</h3>
                  <p className="text-[12px] text-[#8d8989]">{option.description}</p>
                </div>
                <Button 
                  variant="outline" 
                  className="w-full mt-2 text-[13px]"
                  onClick={() => {
                    if (option.title === 'Email Support') {
                      window.location.href = `mailto:${option.action}`
                    } else if (option.title === 'Phone Support') {
                      window.location.href = `tel:${option.action}`
                    }
                  }}
                >
                  {option.action}
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* FAQs */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-teal-primary" />
            <h2 className="text-[16px] font-semibold text-black">Frequently Asked Questions</h2>
          </div>
          <div className="flex flex-col gap-3">
            {faqs.map((faq, i) => (
              <div key={i} className="p-4 bg-white border border-[#f5f6f7] rounded-xl">
                <h3 className="text-[14px] font-semibold text-black mb-2">{faq.question}</h3>
                <p className="text-[13px] text-[#8d8989]">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
