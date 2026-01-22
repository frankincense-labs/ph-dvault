import { supabase } from '../supabase'
import { encryptObject, decryptObject } from '../encryption'
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

// Check if encryption is enabled (key is set)
const isEncryptionEnabled = () => {
  return !!import.meta.env.VITE_ENCRYPTION_KEY
}

// Encrypt sensitive data before storing
async function encryptRecordData(recordData: CreateRecordData): Promise<CreateRecordData & { encrypted_data?: string; is_encrypted?: boolean }> {
  if (!isEncryptionEnabled()) {
    return recordData
  }

  try {
    // Extract sensitive data to encrypt
    const sensitiveData = {
      description: recordData.description,
      metadata: recordData.metadata,
    }

    // Encrypt the sensitive data as a single encrypted blob
    const encryptedData = await encryptObject(sensitiveData)

    // Return record with encrypted data
    return {
      ...recordData,
      description: null, // Clear plaintext
      metadata: {}, // Clear plaintext
      encrypted_data: encryptedData,
      is_encrypted: true,
    }
  } catch (error) {
    console.warn('Encryption failed, storing unencrypted:', error)
    return recordData
  }
}

// Decrypt sensitive data after retrieval
async function decryptRecordData(record: MedicalRecord): Promise<MedicalRecord> {
  if (!record.is_encrypted || !record.encrypted_data) {
    return record
  }

  if (!isEncryptionEnabled()) {
    console.warn('Record is encrypted but no encryption key available')
    return record
  }

  try {
    const decryptedData = await decryptObject<{ description: string | null; metadata: Record<string, any> }>(record.encrypted_data)
    
    return {
      ...record,
      description: decryptedData.description,
      metadata: decryptedData.metadata || {},
    }
  } catch (error) {
    console.error('Decryption failed:', error)
    return record
  }
}

// Log access to the access_logs table
async function logAccess(
  userId: string, 
  action: 'view' | 'create' | 'update' | 'delete' | 'share' | 'access_shared',
  recordId?: string,
  metadata?: Record<string, any>
): Promise<void> {
  try {
    await supabase
      .from('access_logs')
      .insert({
        user_id: userId,
        record_id: recordId || null,
        action,
        metadata: metadata || {},
      })
  } catch (error) {
    // Don't fail the main operation if logging fails
    console.warn('Failed to log access:', error)
  }
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

  // Decrypt all records
  const decryptedRecords = await Promise.all(
    (data || []).map(record => decryptRecordData(record as MedicalRecord))
  )

  return decryptedRecords
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

  // Decrypt the record
  const decryptedRecord = await decryptRecordData(data as MedicalRecord)

  // Log the view action
  await logAccess(userId, 'view', recordId, { category: decryptedRecord.category })

  return decryptedRecord
}

// Create record
export async function createRecord(userId: string, recordData: CreateRecordData) {
  // Encrypt sensitive data
  const encryptedRecordData = await encryptRecordData(recordData)

  const { data, error } = await supabase
    .from('medical_records')
    .insert({
      user_id: userId,
      ...encryptedRecordData,
    })
    .select()
    .single()

  if (error) throw error

  // Log the create action
  await logAccess(userId, 'create', data.id, { 
    category: recordData.category,
    title: recordData.title,
  })

  // Return decrypted version
  return await decryptRecordData(data as MedicalRecord)
}

// Update record
export async function updateRecord(
  recordId: string,
  userId: string,
  updates: Partial<CreateRecordData>
) {
  // If updating sensitive fields, encrypt them
  let encryptedUpdates: any = { ...updates }
  
  if (updates.description !== undefined || updates.metadata !== undefined) {
    // Fetch current record to merge metadata if needed
    const { data: currentRecord } = await supabase
      .from('medical_records')
      .select('*')
      .eq('id', recordId)
      .eq('user_id', userId)
      .single()

    if (currentRecord) {
      const decrypted = await decryptRecordData(currentRecord as MedicalRecord)
      
      const fullData: CreateRecordData = {
        category: decrypted.category,
        title: updates.title || decrypted.title,
        description: updates.description !== undefined ? updates.description : decrypted.description,
        metadata: updates.metadata !== undefined ? updates.metadata : decrypted.metadata,
        file_url: updates.file_url,
        file_hash: updates.file_hash,
        status: updates.status,
        start_date: updates.start_date,
        end_date: updates.end_date,
      }

      encryptedUpdates = await encryptRecordData(fullData)
    }
  }

  const { data, error } = await supabase
    .from('medical_records')
    .update({
      ...encryptedUpdates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', recordId)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) throw error

  // Log the update action
  await logAccess(userId, 'update', recordId, { 
    updatedFields: Object.keys(updates),
  })

  return await decryptRecordData(data as MedicalRecord)
}

// Delete record
export async function deleteRecord(recordId: string, userId: string) {
  // Get record info before deletion for logging
  const { data: record } = await supabase
    .from('medical_records')
    .select('category, title')
    .eq('id', recordId)
    .eq('user_id', userId)
    .single()

  const { error } = await supabase
    .from('medical_records')
    .delete()
    .eq('id', recordId)
    .eq('user_id', userId)

  if (error) throw error

  // Log the delete action
  await logAccess(userId, 'delete', recordId, { 
    category: record?.category,
    title: record?.title,
  })
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

// Export the logAccess function for use in other modules (e.g., shares)
export { logAccess }
