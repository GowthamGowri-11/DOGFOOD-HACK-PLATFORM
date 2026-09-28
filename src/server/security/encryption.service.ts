import crypto from 'crypto';

/**
 * Server-Side Authenticated Encryption Service (AES-256-GCM)
 *
 * Protects sensitive marks and evaluation payload snapshots at rest.
 * Uses 256-bit encryption with an authenticated integrity tag to prevent tampering.
 */
export class EncryptionService {
  private static readonly ALGORITHM = 'aes-256-gcm';
  private static readonly IV_LENGTH = 12; // Standard recommended IV length for GCM (96 bits)
  private static readonly AUTH_TAG_LENGTH = 16; // 128-bit auth tag

  /**
   * Retrieves or derives a 32-byte (256-bit) encryption key from the environment.
   */
  private static getKey(): Buffer {
    const rawKey = process.env.ENCRYPTION_KEY || process.env.JWT_SECRET || 'antigravity-dogfood-secure-master-key-32b!';
    return crypto.createHash('sha256').update(rawKey).digest();
  }

  /**
   * Encrypts plaintext string or JSON object using AES-256-GCM.
   * Format: `iv:authTag:cipherText` (Base64 encoded)
   */
  public static encrypt(data: string | object): string {
    const text = typeof data === 'string' ? data : JSON.stringify(data);
    const key = this.getKey();
    const iv = crypto.randomBytes(this.IV_LENGTH);

    const cipher = crypto.createCipheriv(this.ALGORITHM, key, iv, {
      authTagLength: this.AUTH_TAG_LENGTH,
    });

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }

  /**
   * Decrypts an AES-256-GCM ciphertext payload and verifies its authentication tag.
   */
  public static decrypt<T = any>(payload: string): T {
    const parts = payload.split(':');
    if (parts.length !== 3) {
      throw new Error('INVALID_CIPHERTEXT_FORMAT: Expected iv:authTag:cipherText');
    }

    const [ivHex, authTagHex, encryptedHex] = parts;
    const key = this.getKey();
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    const decipher = crypto.createDecipheriv(this.ALGORITHM, key, iv, {
      authTagLength: this.AUTH_TAG_LENGTH,
    });

    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    try {
      return JSON.parse(decrypted) as T;
    } catch {
      return decrypted as unknown as T;
    }
  }

  /**
   * Safe decryption wrapper that returns null if decryption fails or format is invalid.
   */
  public static tryDecrypt<T = any>(payload: string | null | undefined, fallback: T): T {
    if (!payload) return fallback;
    try {
      return this.decrypt<T>(payload);
    } catch {
      return fallback;
    }
  }
}
