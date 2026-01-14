interface AuthLayoutProps {
  illustration: string
  title: string
  subtitle?: string
  children: React.ReactNode
}

export default function AuthLayout({ illustration, title, subtitle, children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left side - Illustration */}
      <div 
        className="hidden lg:flex lg:w-[680px] xl:w-[720px] rounded-[20px] m-4 lg:m-8 p-8 lg:p-14 flex-col justify-between"
        style={{ backgroundColor: '#229a94' }}
      >
        <div className="flex flex-col gap-6 lg:gap-7">
          <h1 className="heading-2xl max-w-[570px] text-white">{title}</h1>
          <div className="flex-1 flex items-center justify-center min-h-[300px]">
            <img src={illustration} alt="Illustration" className="max-w-full h-auto max-h-[400px] object-contain" />
          </div>
        </div>
        {subtitle && (
          <p className="hero-text max-w-[372px] text-white/90">{subtitle}</p>
        )}
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 w-full">
        <div className="w-full max-w-[528px]">
          {children}
        </div>
      </div>
    </div>
  )
}