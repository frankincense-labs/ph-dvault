// AES-256 Encryption utilities for sensitive medical data

const ENCRYPTION_KEY = import.meta.env.VITE_ENCRYPTION_KEY

if (!ENCRYPTION_KEY) {
  console.warn('VITE_ENCRYPTION_KEY not set. Encryption will use a default key (not secure for production)')
}

// Convert base64 key to CryptoKey
async function getEncryptionKey(): Promise<CryptoKey> {
  const keyData = ENCRYPTION_KEY 
    ? Uint8Array.from(atob(ENCRYPTION_KEY), c => c.charCodeAt(0))
    : new Uint8Array(32).fill(0) // Default key (not secure)

  return crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

// Encrypt data
export async function encrypt(data: string): Promise<string> {
  const key = await getEncryptionKey()
  const iv = crypto.getRandomValues(new Uint8Array(12)) // 96-bit IV for GCM
  const encodedData = new TextEncoder().encode(data)

  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encodedData
  )

  // Combine IV and encrypted data
  const combined = new Uint8Array(iv.length + encrypted.byteLength)
  combined.set(iv)
  combined.set(new Uint8Array(encrypted), iv.length)

  // Convert to base64 for storage
  return btoa(String.fromCharCode(...combined))
}

// Decrypt data
export async function decrypt(encryptedData: string): Promise<string> {
  const key = await getEncryptionKey()
  const combined = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0))

  // Extract IV and encrypted data
  const iv = combined.slice(0, 12)
  const encrypted = combined.slice(12)

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    encrypted
  )

  return new TextDecoder().decode(decrypted)
}

// Encrypt object (converts to JSON first)
export async function encryptObject<T>(obj: T): Promise<string> {
  const json = JSON.stringify(obj)
  return encrypt(json)
}

// Decrypt object
export async function decryptObject<T>(encrypted: string): Promise<T> {
  const decrypted = await decrypt(encrypted)
  return JSON.parse(decrypted) as T
}
