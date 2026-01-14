// MDCN (Medical and Dental Council of Nigeria) Verification
// Note: MDCN does not provide a public API. Manual verification is required.

/**
 * Check if MDCN number format is valid (client-side validation)
 * 
 * MDCN numbers typically follow patterns like:
 * - MDCN/12345/2020
 * - MDCN-12345-2020
 * - 12345/2020
 * - MDCN12345
 */
export function isValidMDCNFormat(mdcnNumber: string): boolean {
  const cleaned = mdcnNumber.trim().toUpperCase()
  const patterns = [
    /^MDCN\/\d+\/\d{4}$/,           // MDCN/12345/2020
    /^MDCN-\d+-\d{4}$/,             // MDCN-12345-2020
    /^\d+\/\d{4}$/,                 // 12345/2020
    /^MDCN\d+$/,                    // MDCN12345
  ]
  return patterns.some(pattern => pattern.test(cleaned))
}

/**
 * Manual Verification Workflow:
 * 
 * 1. Doctor signs up with MDCN number
 * 2. System validates format (this function)
 * 3. Sets verification_status to 'pending' in database
 * 4. Admin reviews in Supabase dashboard
 * 5. Admin manually verifies via MDCN online portal (mdcn.gov.ng)
 * 6. Admin updates verification_status to 'verified' or 'rejected'
 * 7. Doctor receives email notification
 * 
 * To verify a doctor manually:
 * - Go to Supabase Dashboard → Table Editor → profiles
 * - Find the doctor by email or MDCN number
 * - Check MDCN number on MDCN portal: https://mdcn.gov.ng
 * - Update verification_status to 'verified' or 'rejected'
 * - Set verified_at timestamp
 */
