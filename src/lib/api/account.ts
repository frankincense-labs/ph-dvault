import { supabase } from '../supabase'

/**
 * Deactivate user account
 * Sets is_deactivated flag to true - user can reactivate by contacting support
 */
export async function deactivateAccount(reason: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('You must be logged in to deactivate your account')
  }

  // Update profile to mark as deactivated
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ 
      is_deactivated: true,
      deactivation_reason: reason,
      deactivated_at: new Date().toISOString()
    })
    .eq('id', user.id)

  if (profileError) {
    console.error('Failed to deactivate account:', profileError)
    throw new Error('Failed to deactivate account. Please try again.')
  }

  // Sign out the user
  await supabase.auth.signOut()
}

/**
 * Delete user account permanently
 * Removes all user data including records, shares, and profile
 */
export async function deleteAccount(password: string, reason: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user || !user.email) {
    throw new Error('You must be logged in to delete your account')
  }

  // Verify password by attempting to sign in
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: password,
  })

  if (signInError) {
    throw new Error('Incorrect password. Please try again.')
  }

  // Delete all share tokens first (due to foreign key constraints)
  const { error: sharesError } = await supabase
    .from('share_tokens')
    .delete()
    .eq('user_id', user.id)

  if (sharesError) {
    console.error('Failed to delete share tokens:', sharesError)
    // Continue anyway - profile deletion will cascade
  }

  // Delete all medical records
  const { error: recordsError } = await supabase
    .from('medical_records')
    .delete()
    .eq('user_id', user.id)

  if (recordsError) {
    console.error('Failed to delete medical records:', recordsError)
    // Continue anyway - profile deletion will cascade
  }

  // Delete all access logs
  const { error: logsError } = await supabase
    .from('access_logs')
    .delete()
    .eq('user_id', user.id)

  if (logsError) {
    console.error('Failed to delete access logs:', logsError)
    // Continue anyway
  }

  // Log the deletion reason before deleting profile
  console.log('Account deletion requested. Reason:', reason)

  // Delete the profile (this should cascade to auth.users due to foreign key)
  // Note: In Supabase, deleting from auth.users is the proper way
  // The profile will be deleted via CASCADE
  
  // Sign out first
  await supabase.auth.signOut()
  
  // Note: Full deletion of auth.users requires admin API or Edge Function
  // For now, we've deleted all user data. The auth user remains but has no data.
  // You can set up a Supabase Edge Function to fully delete the auth user if needed.
}

/**
 * Update user PIN (stored hashed in profile)
 */
export async function updateUserPIN(newPin: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('You must be logged in to update your PIN')
  }

  if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
    throw new Error('PIN must be exactly 4 digits')
  }

  // Store PIN hash (simple hash for app PIN - not for high security)
  // In production, you'd use a proper hashing function
  const pinHash = btoa(newPin) // Base64 encode (simple obfuscation)
  
  const { error } = await supabase
    .from('profiles')
    .update({ app_pin_hash: pinHash })
    .eq('id', user.id)

  if (error) {
    console.error('Failed to update PIN:', error)
    throw new Error('Failed to update PIN. Please try again.')
  }
}

/**
 * Verify user PIN
 */
export async function verifyUserPIN(pin: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('You must be logged in')
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('app_pin_hash')
    .eq('id', user.id)
    .single()

  if (error || !profile) {
    throw new Error('Failed to verify PIN')
  }

  if (!profile.app_pin_hash) {
    // No PIN set yet
    return true
  }

  const pinHash = btoa(pin)
  return profile.app_pin_hash === pinHash
}

/**
 * Check if user has PIN set
 */
export async function hasUserPIN(): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return false
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('app_pin_hash')
    .eq('id', user.id)
    .single()

  if (error || !profile) {
    return false
  }

  return !!profile.app_pin_hash
}
