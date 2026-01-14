// Database Types for PH-DVault

export type UserRole = 'patient' | 'doctor' | 'admin'

export type VerificationStatus = 'pending' | 'auto_matched' | 'verified' | 'rejected'

export type RecordCategory = 
  | 'allergies' 
  | 'chronic_conditions' 
  | 'lab_results' 
  | 'medications' 
  | 'past_treatments' 
  | 'vaccinations'

export type ShareMethod = 'link' | 'code'

export type ShareStatus = 'active' | 'expired' | 'revoked'

// User Profile
export interface UserProfile {
  id: string
  email: string
  role: UserRole
  full_name: string | null
  phone: string | null
  avatar_url: string | null
  blood_group: string | null
  genotype: string | null
  date_of_birth: string | null
  gender: string | null
  created_at: string
  updated_at: string
}

// Doctor Profile (extends user with verification)
export interface DoctorProfile extends UserProfile {
  role: 'doctor'
  mdcn_number: string | null
  verification_status: VerificationStatus
  verified_at: string | null
  specialization: string | null
}

// Medical Record
export interface MedicalRecord {
  id: string
  user_id: string
  category: RecordCategory
  title: string
  description: string | null
  file_url: string | null
  file_hash: string | null // SHA256 hash for tamper detection
  metadata: Record<string, any> // JSONB for category-specific data
  status: 'ongoing' | 'completed' | 'archived'
  start_date: string | null
  end_date: string | null
  created_at: string
  updated_at: string
}

// Share Token
export interface ShareToken {
  id: string
  user_id: string // Patient who created the share
  method: ShareMethod
  token: string // Unique token/code
  record_ids: string[] // Array of record IDs to share
  expires_at: string
  status: ShareStatus
  accessed_at: string | null
  accessed_by: string | null // Doctor user_id who accessed
  created_at: string
}

// Access Log (for audit trail)
export interface AccessLog {
  id: string
  user_id: string
  record_id: string | null
  action: 'view' | 'create' | 'update' | 'delete' | 'share' | 'access_shared'
  ip_address: string | null
  user_agent: string | null
  created_at: string
}

// Emergency Access Data (cached locally)
export interface EmergencyData {
  blood_group: string | null
  genotype: string | null
  allergies: string[]
  chronic_conditions: string[]
  emergency_contact: {
    name: string
    phone: string
    relationship: string
  } | null
}
