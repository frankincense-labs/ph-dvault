import { supabase } from '../supabase'
import type { MedicalRecord, RecordCategory } from '@/types/database'

export interface CreateRecordData {
  category: RecordCategory
  title: string
  description?: string | null
  file_url?: string
  file_hash?: string
  metadata?: Record<string, any>
  status?: 'ongoing' | 'completed' | 'archived'
  start_date?: string | null
  end_date?: string | null
}

// Get all records for current user
export async function getRecords(userId: string, category?: RecordCategory) {
  let query = supabase
    .from('medical_records')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (category) {
    query = query.eq('category', category)
  }

  const { data, error } = await query
  if (error) throw error
  return data as MedicalRecord[]
}

// Get single record
export async function getRecord(recordId: string, userId: string) {
  const { data, error } = await supabase
    .from('medical_records')
    .select('*')
    .eq('id', recordId)
    .eq('user_id', userId)
    .single()

  if (error) throw error
  return data as MedicalRecord
}

// Create record
export async function createRecord(userId: string, recordData: CreateRecordData) {
  const { data, error } = await supabase
    .from('medical_records')
    .insert({
      user_id: userId,
      ...recordData,
    })
    .select()
    .single()

  if (error) throw error
  return data as MedicalRecord
}

// Update record
export async function updateRecord(
  recordId: string,
  userId: string,
  updates: Partial<CreateRecordData>
) {
  const { data, error } = await supabase
    .from('medical_records')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', recordId)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) throw error
  return data as MedicalRecord
}

// Delete record
export async function deleteRecord(recordId: string, userId: string) {
  const { error } = await supabase
    .from('medical_records')
    .delete()
    .eq('id', recordId)
    .eq('user_id', userId)

  if (error) throw error
}

// Upload file to Supabase Storage
export async function uploadFile(
  userId: string,
  file: File,
  category: RecordCategory
): Promise<{ url: string; hash: string }> {
  const fileExt = file.name.split('.').pop()
  const fileName = `${userId}/${category}/${Date.now()}.${fileExt}`
  const filePath = `medical-records/${fileName}`

  // Calculate file hash (SHA256) before upload
  const arrayBuffer = await file.arrayBuffer()
  const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

  // Upload file
  const { error: uploadError } = await supabase.storage
    .from('medical-files')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    })

  if (uploadError) {
    console.error('Storage upload error:', uploadError)
    // Provide more helpful error messages
    if (uploadError.message.includes('Bucket not found')) {
      throw new Error('Storage bucket not found. Please create the "medical-files" bucket in Supabase Storage.')
    }
    if (uploadError.message.includes('new row violates row-level security')) {
      throw new Error('Permission denied. Please check your storage bucket policies.')
    }
    if (uploadError.message.includes('File size')) {
      throw new Error('File is too large. Maximum size is 50MB.')
    }
    throw new Error(uploadError.message || 'Failed to upload file')
  }

  // Get public URL (or signed URL if bucket is private)
  const { data: urlData } = supabase.storage
    .from('medical-files')
    .getPublicUrl(filePath)

  return {
    url: urlData.publicUrl,
    hash,
  }
}

// Delete file from storage
export async function deleteFile(fileUrl: string) {
  // Extract file path from URL
  const urlParts = fileUrl.split('/medical-files/')
  if (urlParts.length < 2) return

  const filePath = urlParts[1]
  const { error } = await supabase.storage
    .from('medical-files')
    .remove([filePath])

  if (error) throw error
}
