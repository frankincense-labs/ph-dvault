import { CountrySelector, usePhoneInput } from 'react-international-phone'
import 'react-international-phone/style.css'
import { cn } from '@/lib/utils'

interface PhoneInputProps {
  value: string
  onChange: (phone: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function PhoneInput({ value, onChange, placeholder = 'Enter phone number', disabled, className }: PhoneInputProps) {
  const phoneInput = usePhoneInput({
    defaultCountry: 'ng', // Default to Nigeria
    value,
    onChange: (data) => {
      onChange(data.phone)
    },
  })

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <CountrySelector
        selectedCountry={phoneInput.country.iso2}
        onSelect={(country) => phoneInput.setCountry(country.iso2)}
        disabled={disabled}
        renderButtonWrapper={({ children, rootProps }) => (
          <button
            {...rootProps}
            type="button"
            className="flex items-center gap-1.5 px-3 h-12 border border-[#cbd5e1] rounded-l-full bg-[#f8f9fa] hover:bg-[#f0f1f2] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={disabled}
          >
            {children}
          </button>
        )}
      />
      <input
        type="tel"
        value={phoneInput.inputValue}
        onChange={phoneInput.handlePhoneValueChange}
        placeholder={placeholder}
        disabled={disabled}
        className="flex-1 h-12 px-4 border border-[#cbd5e1] border-l-0 rounded-r-full bg-white text-[#101928] placeholder:text-[#98a2b3] focus:outline-none focus:ring-2 focus:ring-teal-primary focus:border-teal-primary disabled:opacity-50 disabled:cursor-not-allowed"
        ref={phoneInput.inputRef}
      />
    </div>
  )
}

// Utility to validate phone number (basic validation)
export function isValidPhoneNumber(phone: string): boolean {
  // Remove all non-digit characters except +
  const cleaned = phone.replace(/[^\d+]/g, '')
  // Must have at least 10 digits (excluding country code +)
  const digits = cleaned.replace(/\+/g, '')
  return digits.length >= 10 && digits.length <= 15
}
