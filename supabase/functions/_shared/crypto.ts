export function generateOtp(length = 8): string {
  const min = 10 ** (length - 1)
  const max = 10 ** length - 1
  const code = Math.floor(Math.random() * (max - min + 1)) + min
  return String(code)
}

export async function hashOtp(otp: string): Promise<string> {
  const data = new TextEncoder().encode(otp)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
}

function base64ToBytes(base64: string): Uint8Array {
  const raw = atob(base64)
  const bytes = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i += 1) {
    bytes[i] = raw.charCodeAt(i)
  }
  return bytes
}

function bytesToBase64(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes))
}

export async function encryptPassword(password: string, keyBase64: string) {
  const keyBytes = base64ToBytes(keyBase64)
  const key = await crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'AES-GCM' },
    false,
    ['encrypt'],
  )

  const iv = crypto.getRandomValues(new Uint8Array(12))
  const encoded = new TextEncoder().encode(password)
  const cipherBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoded,
  )

  return {
    encrypted: bytesToBase64(new Uint8Array(cipherBuffer)),
    iv: bytesToBase64(iv),
  }
}

export async function decryptPassword(encrypted: string, ivBase64: string, keyBase64: string) {
  const keyBytes = base64ToBytes(keyBase64)
  const key = await crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'AES-GCM' },
    false,
    ['decrypt'],
  )
  const iv = base64ToBytes(ivBase64)
  const cipherBytes = base64ToBytes(encrypted)
  const plainBuffer = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    cipherBytes,
  )
  return new TextDecoder().decode(plainBuffer)
}
