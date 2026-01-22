// MDCN (Medical and Dental Council of Nigeria) Folio Number Verification
// Note: MDCN does not provide a public API. Manual verification is required.

/**
 * MDCN Folio Number Validation
 * 
 * Accepted formats:
 * - MDCN/R/90566 (with prefix)
 * - 90566 (digits only)
 * 
 * Rules:
 * - Digit length must be 5-7 digits
 * - No year suffixes (e.g., /2020)
 * - No extra slashes beyond MDCN/R/
 * - No letters after the digits
 */

const MDCN_REGEX = /^(?:MDCN\/R\/)?\d{5,7}$/i

/**
 * Check if MDCN folio number format is valid (client-side validation)
 * Accepts: MDCN/R/90566 or 90566 (5-7 digits)
 */
export function isValidMDCNFormat(mdcnNumber: string): boolean {
  const cleaned = mdcnNumber.trim().toUpperCase()
  return MDCN_REGEX.test(cleaned)
}

/**
 * Extract the numeric digits from an MDCN folio number
 */
export function extractMDCNDigits(mdcnNumber: string): string {
  const cleaned = mdcnNumber.trim().toUpperCase()
  // Remove MDCN/R/ prefix if present, leaving only digits
  return cleaned.replace(/^MDCN\/R\//, '')
}

/**
 * Normalize MDCN folio number to canonical format: MDCN/R/<digits>
 * This is the format that should be stored in the database
 */
export function normalizeMDCN(mdcnNumber: string): string {
  const digits = extractMDCNDigits(mdcnNumber)
  return `MDCN/R/${digits}`
}

/**
 * Validate and normalize MDCN folio number
 * Returns normalized format if valid, null if invalid
 */
export function validateAndNormalizeMDCN(mdcnNumber: string): string | null {
  if (!isValidMDCNFormat(mdcnNumber)) {
    return null
  }
  return normalizeMDCN(mdcnNumber)
}

/**
 * Manual Verification Workflow:
 * 
 * 1. Doctor signs up with MDCN folio number
 * 2. System validates format (isValidMDCNFormat)
 * 3. System normalizes to canonical format (normalizeMDCN)
 * 4. Stores as MDCN/R/<digits> in database
 * 5. Sets verification_status to 'pending' in database
 * 6. Admin reviews in Supabase dashboard
 * 7. Admin manually verifies via MDCN online portal (mdcn.gov.ng)
 * 8. Admin updates verification_status to 'verified' or 'rejected'
 * 9. Doctor receives email notification
 * 
 * To verify a doctor manually:
 * - Go to Supabase Dashboard → Table Editor → profiles
 * - Find the doctor by email or MDCN number
 * - Check MDCN number on MDCN portal: https://mdcn.gov.ng
 * - Update verification_status to 'verified' or 'rejected'
 * - Set verified_at timestamp
 */
