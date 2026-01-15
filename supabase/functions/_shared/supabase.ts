import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('PROJECT_URL') || ''
const serviceRoleKey = Deno.env.get('PROJECT_SERVICE_ROLE_KEY') || ''
const anonKey = Deno.env.get('PROJECT_ANON_KEY') || ''

if (!supabaseUrl || !serviceRoleKey || !anonKey) {
  throw new Error('Missing Edge Function environment variables')
}

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
})

export const supabaseAnon = createClient(supabaseUrl, anonKey, {
  auth: { persistSession: false },
})
