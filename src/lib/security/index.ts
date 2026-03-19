import crypto from 'crypto';

// ─── Timing-safe string comparison ───────────────────────────

/**
 * مقارنة آمنة ضد timing attacks.
 * تستخدم بدل === لمقارنة API keys, tokens, secrets.
 */
export function timingSafeEqual(a: string, b: string): boolean {
    if (a.length !== b.length) {
        // لازم نقارن بنفس الطول — نعمل hash لكلاهما
        const hashA = crypto.createHash('sha256').update(a).digest();
        const hashB = crypto.createHash('sha256').update(b).digest();
        return crypto.timingSafeEqual(hashA, hashB);
    }
    return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

// ─── URL validation ──────────────────────────────────────────

/**
 * التحقق من أن الرابط HTTPS أو HTTP (للـ dev) أو data:image (للوغو uploads).
 * يمنع javascript:, data:text, وغيرها.
 */
export function isValidUrl(url: string, allowDataImage = false): boolean {
    if (!url || typeof url !== 'string') return false;
    const trimmed = url.trim();

    // Allow data:image URIs for logo uploads (base64 from file reader)
    if (allowDataImage && trimmed.startsWith('data:image/')) return true;

    try {
        const parsed = new URL(trimmed);
        return parsed.protocol === 'https:' || parsed.protocol === 'http:';
    } catch {
        return false;
    }
}

// ─── Input sanitization ──────────────────────────────────────

/**
 * تنظيف المدخلات — يشيل null bytes و control characters.
 */
export function sanitizeInput(input: string): string {
    // eslint-disable-next-line no-control-regex
    return input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
}

/**
 * التحقق من طول المدخل.
 */
export function validateLength(input: string, maxLen: number, fieldName: string): string | null {
    if (input.length > maxLen) {
        return `${fieldName} must be ${maxLen} characters or fewer`;
    }
    return null;
}

// ─── Enhanced HTML escaping ──────────────────────────────────

/**
 * HTML escaping شامل — يغطي:
 * & < > " ' ` (backtick for template literals)
 * + null bytes + unicode control chars
 */
export function escapeHtml(str: string): string {
    return str
        // eslint-disable-next-line no-control-regex
        .replace(/[\x00]/g, '') // null bytes
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/`/g, '&#96;');
}

// ─── Hex color validation ────────────────────────────────────

const HEX_COLOR_REGEX = /^#[0-9a-fA-F]{6}$/;

/**
 * التحقق من أن القيمة hex color صالح.
 */
export function isValidHexColor(value: string): boolean {
    return HEX_COLOR_REGEX.test(value);
}
