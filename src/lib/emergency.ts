// Emergency Mode - Offline access to critical health information
import type { EmergencyData } from '@/types/database'

const EMERGENCY_STORAGE_KEY = 'ph-dvault-emergency-data'

// Save emergency data to localStorage (for offline access)
export function saveEmergencyData(data: EmergencyData): void {
  try {
    localStorage.setItem(EMERGENCY_STORAGE_KEY, JSON.stringify(data))
  } catch (error) {
    console.error('Failed to save emergency data:', error)
  }
}

// Get emergency data from localStorage
export function getEmergencyData(): EmergencyData | null {
  try {
    const data = localStorage.getItem(EMERGENCY_STORAGE_KEY)
    return data ? JSON.parse(data) : null
  } catch (error) {
    console.error('Failed to get emergency data:', error)
    return null
  }
}

// Clear emergency data
export function clearEmergencyData(): void {
  try {
    localStorage.removeItem(EMERGENCY_STORAGE_KEY)
  } catch (error) {
    console.error('Failed to clear emergency data:', error)
  }
}

// Build emergency data from user profile and records
export async function buildEmergencyData(
  profile: any,
  records: any[]
): Promise<EmergencyData> {
  const allergies = records
    .filter(r => r.category === 'allergies' && r.status !== 'archived')
    .map(r => r.title)

  const chronicConditions = records
    .filter(r => r.category === 'chronic_conditions' && r.status !== 'archived')
    .map(r => r.title)

  return {
    blood_group: profile.blood_group,
    genotype: profile.genotype,
    allergies,
    chronic_conditions: chronicConditions,
    emergency_contact: profile.emergency_contact || null,
  }
}
