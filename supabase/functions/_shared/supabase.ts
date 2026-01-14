import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
const anonKey = Deno.env.get('SUPABASE_ANON_KEY') || ''

if (!supabaseUrl || !serviceRoleKey || !anonKey) {
  throw new Error('Missing Supabase environment variables for Edge Functions')
}

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
})

export const supabaseAnon = createClient(supabaseUrl, anonKey, {
  auth: { persistSession: false },
})
