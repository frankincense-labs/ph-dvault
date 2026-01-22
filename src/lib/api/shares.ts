import { supabase } from '../supabase'
import { logAccess } from './records'
import type { ShareToken, ShareMethod } from '@/types/database'

export interface CreateShareData {
  method: ShareMethod
  record_ids: string[]
  expires_in_hours?: number // Default 1 hour
}

// Generate unique token (UUID for links)
function generateToken(): string {
  return crypto.randomUUID()
}

// Generate 5-digit verification PIN
function generatePIN(): string {
  return Math.floor(10000 + Math.random() * 90000).toString()
}

// Create share token with PIN
export async function createShare(
  userId: string,
  shareData: CreateShareData
): Promise<ShareToken> {
  const token = generateToken()
  const pin = generatePIN() // Always generate a PIN for verification
  const expiresInHours = shareData.expires_in_hours || 1
  const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000).toISOString()

  const { data, error } = await supabase
    .from('share_tokens')
    .insert({
      user_id: userId,
      method: shareData.method,
      token,
      pin,
      record_ids: shareData.record_ids,
      expires_at: expiresAt,
      status: 'active',
    })
    .select()
    .single()

  if (error) throw error

  // Log the share creation
  await logAccess(userId, 'share', undefined, {
    shareId: data.id,
    method: shareData.method,
    recordCount: shareData.record_ids.length,
    expiresInHours: expiresInHours,
  })

  return data as ShareToken
}

// Get share token by token string
export async function getShareByToken(token: string): Promise<ShareToken | null> {
  const { data, error } = await supabase
    .from('share_tokens')
    .select('*')
    .eq('token', token)
    .eq('status', 'active')
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null // Not found
    throw error
  }

  // Check if expired
  if (new Date(data.expires_at) < new Date()) {
    // Mark as expired
    await supabase
      .from('share_tokens')
      .update({ status: 'expired' })
      .eq('id', data.id)
    return null
  }

  return data as ShareToken
}

// Get all active shares for user
export async function getActiveShares(userId: string) {
  const now = new Date().toISOString()
  const { data, error } = await supabase
    .from('share_tokens')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .gte('expires_at', now) // Only get shares that haven't expired
    .order('created_at', { ascending: false })

  if (error) throw error
  
  // Double-check client-side to ensure no expired shares slip through
  const activeShares = (data || []).filter((share: ShareToken) => {
    return new Date(share.expires_at) >= new Date()
  })
  
  return activeShares as ShareToken[]
}

// Get share history for user
export async function getShareHistory(userId: string, limit = 50) {
  const { data, error } = await supabase
    .from('share_tokens')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data as ShareToken[]
}

// Revoke share
export async function revokeShare(shareId: string, userId: string) {
  const { error } = await supabase
    .from('share_tokens')
    .update({ status: 'revoked' })
    .eq('id', shareId)
    .eq('user_id', userId)

  if (error) throw error
}

// Access shared records (for doctors) - requires both token and PIN
export async function accessSharedRecords(
  token: string,
  doctorUserId: string,
  pin?: string
): Promise<{ records: any[]; shareToken: ShareToken }> {
  const shareToken = await getShareByToken(token)
  
  if (!shareToken) {
    throw new Error('Invalid or expired share token')
  }

  // Verify PIN if the share has one
  if (shareToken.pin && shareToken.pin !== pin) {
    throw new Error('Invalid verification PIN')
  }

  // Mark as accessed
  await supabase
    .from('share_tokens')
    .update({
      accessed_at: new Date().toISOString(),
      accessed_by: doctorUserId,
    })
    .eq('id', shareToken.id)

  // Get the shared records
  const { data: records, error } = await supabase
    .from('medical_records')
    .select('*')
    .in('id', shareToken.record_ids)

  if (error) throw error

  // Log the access by doctor
  await logAccess(doctorUserId, 'access_shared', undefined, {
    shareId: shareToken.id,
    patientId: shareToken.user_id,
    recordCount: records?.length || 0,
  })

  return {
    records: records || [],
    shareToken,
  }
}

// Check if a share token requires PIN verification
export async function checkShareRequiresPIN(token: string): Promise<boolean> {
  const shareToken = await getShareByToken(token)
  return shareToken?.pin !== null && shareToken?.pin !== undefined
}

// Generate share link
export function generateShareLink(token: string): string {
  // In production, this will use the actual domain
  // For now, use window.location.origin (works for both localhost and production)
  const baseUrl = import.meta.env.VITE_APP_URL || window.location.origin
  return `${baseUrl}/shared/${token}`
}
