import { supabase } from '../supabase'
import type { ShareToken, ShareMethod, ShareStatus } from '@/types/database'

export interface CreateShareData {
  method: ShareMethod
  record_ids: string[]
  expires_in_hours?: number // Default 1 hour
}

// Generate unique token
function generateToken(method: ShareMethod): string {
  if (method === 'code') {
    // Generate 5-digit code
    return Math.floor(10000 + Math.random() * 90000).toString()
  } else {
    // Generate UUID-like token for links
    return crypto.randomUUID()
  }
}

// Create share token
export async function createShare(
  userId: string,
  shareData: CreateShareData
): Promise<ShareToken> {
  const token = generateToken(shareData.method)
  const expiresInHours = shareData.expires_in_hours || 1
  const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000).toISOString()

  const { data, error } = await supabase
    .from('share_tokens')
    .insert({
      user_id: userId,
      method: shareData.method,
      token,
      record_ids: shareData.record_ids,
      expires_at: expiresAt,
      status: 'active',
    })
    .select()
    .single()

  if (error) throw error
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

// Access shared records (for doctors)
export async function accessSharedRecords(
  token: string,
  doctorUserId: string
): Promise<{ records: any[]; shareToken: ShareToken }> {
  const shareToken = await getShareByToken(token)
  
  if (!shareToken) {
    throw new Error('Invalid or expired share token')
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

  return {
    records: records || [],
    shareToken,
  }
}

// Generate share link
export function generateShareLink(token: string): string {
  // In production, this will use the actual domain
  // For now, use window.location.origin (works for both localhost and production)
  const baseUrl = import.meta.env.VITE_APP_URL || window.location.origin
  return `${baseUrl}/shared/${token}`
}
