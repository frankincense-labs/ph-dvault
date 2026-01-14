import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Loader2, AlertCircle } from 'lucide-react'
import { useAuthStore } from '@/store/useAuthStore'
import { accessSharedRecords, getShareByToken } from '@/lib/api/shares'

export default function SharedLink() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const { user, isAuthenticated, role } = useAuthStore()
  const [isValidating, setIsValidating] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setError('Invalid share link')
        setIsValidating(false)
        return
      }

      try {
        // Check if token is valid
        const share = await getShareByToken(token)
        
        if (!share) {
          setError('This share link has expired or is invalid')
          setIsValidating(false)
          return
        }

        // If user is a doctor and authenticated, automatically access the records
        if (isAuthenticated && role === 'doctor' && user?.id) {
          try {
            const result = await accessSharedRecords(token, user.id)
            
            // Store shared records in sessionStorage for the details page
            sessionStorage.setItem('sharedRecords', JSON.stringify(result.records))
            sessionStorage.setItem('shareToken', JSON.stringify(result.shareToken))
            
            // Navigate to patient details page
            navigate('/details')
          } catch (err: any) {
            setError(err.message || 'Failed to access shared records')
            setIsValidating(false)
          }
        } else {
          // If not a doctor or not authenticated, redirect to doctor access page
          // Store token in sessionStorage so it can be pre-filled
          sessionStorage.setItem('pendingShareToken', token)
          navigate('/doctor-access')
        }
      } catch (err: any) {
        setError(err.message || 'Invalid or expired share link')
        setIsValidating(false)
      }
    }

    validateToken()
  }, [token, isAuthenticated, role, user?.id, navigate])

  // Show loading state
  if (isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-teal-primary" />
          <p className="text-sm text-gray-600">Validating share link...</p>
        </div>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white p-4">
        <div className="flex flex-col items-center gap-4 max-w-md text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-black mb-2">Invalid Share Link</h2>
            <p className="text-sm text-gray-600">{error}</p>
          </div>
          <button
            onClick={() => navigate('/signin')}
            className="px-6 py-2 bg-teal-primary text-white rounded-full font-semibold hover:bg-teal-600 transition-colors"
          >
            Sign In
          </button>
        </div>
      </div>
    )
  }

  // This shouldn't be reached, but just in case
  return null
}
