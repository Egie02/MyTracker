/**
 * Simple hash for local-only use. Replace with scrypt/argon2 in production.
 * Uses crypto.subtle when available (web), otherwise a simple hash for React Native.
 */
async function sha256Hex(text: string): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  // Fallback: simple hash for RN environments without crypto.subtle
  let h = 0;
  for (let i = 0; i < text.length; i++) {
    h = (Math.imul(31, h) + text.charCodeAt(i)) | 0;
  }
  return Math.abs(h).toString(16) + text.length.toString(16);
}

export async function hashPassword(password: string): Promise<string> {
  const hex = await sha256Hex(password + 'money-tracker-salt');
  return `sha256:${hex}`;
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const computed = await hashPassword(password);
  return computed === storedHash;
}
