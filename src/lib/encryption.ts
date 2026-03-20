/**
 * Shared AES-256-GCM encryption/decryption module.
 * Used by Google OAuth, Salla, and any future integrations.
 * Format: iv(hex):authTag(hex):ciphertext(hex)
 */
import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const ENC_KEY_HEX = process.env.TOKEN_ENCRYPTION_KEY ?? '';

function getEncKey(): Buffer {
    if (!ENC_KEY_HEX || ENC_KEY_HEX.length !== 64) {
        throw new Error('TOKEN_ENCRYPTION_KEY must be a 64-char hex string (32 bytes)');
    }
    return Buffer.from(ENC_KEY_HEX, 'hex');
}

export function encrypt(plaintext: string): string {
    const key = getEncKey();
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}

export function decrypt(ciphertext: string): string {
    const key = getEncKey();
    const [ivHex, tagHex, dataHex] = ciphertext.split(':');
    if (!ivHex || !tagHex || !dataHex) throw new Error('Invalid ciphertext format');
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(tagHex, 'hex');
    const data = Buffer.from(dataHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    return decipher.update(data).toString('utf8') + decipher.final('utf8');
}
