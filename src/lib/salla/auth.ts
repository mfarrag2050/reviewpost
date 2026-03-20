import crypto from 'crypto';
import { prisma } from '../prisma';
import { createLogger } from '../monitoring/logger';

const log = createLogger('SallaAuth');

// ─── Encryption helpers (AES-256-GCM) — same as Google module ──

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

// ─── Types ──────────────────────────────────────────────────────

export interface SallaAuthorizePayload {
    event: string;
    merchant: number;
    data: {
        access_token: string;
        expires: number;
        refresh_token: string;
        scope: string;
        token_type: string;
    };
    store?: {
        id?: number;
        name?: string;
        url?: string;
    };
    created_at: string;
}

interface SallaTokenResponse {
    access_token: string;
    expires_in: number;
    refresh_token: string;
    token_type: string;
    scope: string;
}

// ─── Service ────────────────────────────────────────────────────

const SALLA_TOKEN_URL = 'https://accounts.salla.sa/oauth2/token';

export class SallaAuth {
    /**
     * Processes the app.store.authorize webhook that Salla sends when
     * a merchant installs the app. Extracts tokens and saves them encrypted.
     */
    async handleAppAuthorize(payload: SallaAuthorizePayload, userId: string): Promise<string> {
        const { merchant, data, store } = payload;
        const merchantId = String(merchant);

        if (!data.access_token || !data.refresh_token) {
            throw new Error('Missing access_token or refresh_token in authorize payload');
        }

        const expiresAt = new Date(Date.now() + data.expires * 1000);

        const sallaStore = await prisma.sallaStore.upsert({
            where: { merchantId },
            create: {
                userId,
                merchantId,
                storeName: store?.name ?? `Store ${merchantId}`,
                storeUrl: store?.url ?? null,
                encryptedAccessToken: encrypt(data.access_token),
                encryptedRefreshToken: encrypt(data.refresh_token),
                tokenExpiresAt: expiresAt,
                isActive: true,
            },
            update: {
                encryptedAccessToken: encrypt(data.access_token),
                encryptedRefreshToken: encrypt(data.refresh_token),
                tokenExpiresAt: expiresAt,
                storeName: store?.name ?? undefined,
                storeUrl: store?.url ?? undefined,
                isActive: true,
            },
        });

        log.info('Salla store authorized', { merchantId, storeId: sallaStore.id });
        return sallaStore.id;
    }

    /**
     * Refresh an expired access token using the stored refresh_token.
     * Returns the new decrypted access token.
     */
    async refreshToken(storeId: string): Promise<string> {
        const store = await prisma.sallaStore.findUnique({ where: { id: storeId } });
        if (!store) throw new Error(`SallaStore ${storeId} not found`);
        if (!store.isActive) throw new Error(`SallaStore ${storeId} is deactivated`);

        const refreshToken = decrypt(store.encryptedRefreshToken);

        const res = await fetch(SALLA_TOKEN_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                grant_type: 'refresh_token',
                client_id: process.env.SALLA_CLIENT_ID,
                client_secret: process.env.SALLA_CLIENT_SECRET,
                refresh_token: refreshToken,
            }),
        });

        if (!res.ok) {
            const errBody = await res.text();
            log.error('Token refresh failed', { storeId, status: res.status, body: errBody });
            throw new Error(`Salla token refresh failed: ${res.status}`);
        }

        const tokens: SallaTokenResponse = await res.json();
        const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

        await prisma.sallaStore.update({
            where: { id: storeId },
            data: {
                encryptedAccessToken: encrypt(tokens.access_token),
                encryptedRefreshToken: encrypt(tokens.refresh_token),
                tokenExpiresAt: expiresAt,
            },
        });

        log.info('Salla token refreshed', { storeId });
        return tokens.access_token;
    }

    /**
     * Get a valid access token for a store, refreshing if expired.
     */
    async getAccessToken(storeId: string): Promise<string> {
        const store = await prisma.sallaStore.findUnique({ where: { id: storeId } });
        if (!store) throw new Error(`SallaStore ${storeId} not found`);
        if (!store.isActive) throw new Error(`SallaStore ${storeId} is deactivated`);

        const bufferMs = 5 * 60 * 1000; // refresh 5 min before expiry
        if (store.tokenExpiresAt.getTime() - bufferMs < Date.now()) {
            return this.refreshToken(storeId);
        }

        return decrypt(store.encryptedAccessToken);
    }

    /**
     * Deactivate a store when app.store.revoke webhook is received.
     */
    async deactivateStore(merchantId: string): Promise<void> {
        const store = await prisma.sallaStore.findUnique({ where: { merchantId: String(merchantId) } });
        if (!store) {
            log.warn('Revoke received for unknown merchant', { merchantId });
            return;
        }

        await prisma.sallaStore.update({
            where: { id: store.id },
            data: { isActive: false },
        });

        log.info('Salla store deactivated', { merchantId, storeId: store.id });
    }
}
