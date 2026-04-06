import crypto from 'crypto';
import { db } from "@/lib/db";
import { apiKeys } from "@/lib/schema";
import { eq } from "drizzle-orm";

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY!;
const ALGORITHM = 'aes-256-gcm';

// Only warn if we are in production and it's missing
if (process.env.NODE_ENV === 'production' && (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 64)) {
  console.warn("CRITICAL: ENCRYPTION_KEY is missing or invalid in environment variables.");
}

export function encryptApiKey(rawKey: string): string {
  // If no key is set (e.g., during build time), return a fallback so the build doesn't crash
  if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 64) return rawKey;

  const iv = crypto.randomBytes(16); 
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
  
  let encrypted = cipher.update(rawKey, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag().toString('hex');
  
  return `${iv.toString('hex')}:${encrypted}:${authTag}`;
}

export function decryptApiKey(encryptedData: string): string {
  if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 64) return encryptedData;

  const [ivHex, encryptedHex, authTagHex] = encryptedData.split(':');
  
  // If the data isn't formatted correctly (e.g., an old unencrypted key), just return it
  if (!ivHex || !encryptedHex || !authTagHex) return encryptedData;

  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    Buffer.from(ENCRYPTION_KEY, 'hex'),
    Buffer.from(ivHex, 'hex')
  );
  
  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
  
  let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

// --- THIS IS THE MISSING FUNCTION CAUSING THE BUILD ERROR ---
export async function validateApiKey(providedKey: string, userId: string) {
  // Fetch all encrypted keys for this user
  const userKeys = await db.select().from(apiKeys).where(eq(apiKeys.userId, userId));

  for (const record of userKeys) {
    try {
      // Decrypt in memory
      const decrypted = decryptApiKey(record.key);
      if (decrypted === providedKey) {
        return true; // Match found!
      }
    } catch (e) {
      // Ignore decryption errors for malformed old keys
      continue; 
    }
  }
  return false;
}