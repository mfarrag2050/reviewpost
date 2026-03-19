import { prisma } from '@/lib/prisma';

// ─── Default brand theme (ReviewPost indigo) ─────────────────

export const DEFAULT_BRAND = {
    '--brand-primary': '#6366f1',
    '--brand-primary-light': '#e0e7ff',
    '--brand-primary-dark': '#4338ca',
    '--brand-secondary': '#8b5cf6',
    '--brand-secondary-light': '#ede9fe',
    '--brand-text': '#ffffff',
};

// ─── Types ───────────────────────────────────────────────────

export interface BrandTheme {
    '--brand-primary': string;
    '--brand-primary-light': string;
    '--brand-primary-dark': string;
    '--brand-secondary': string;
    '--brand-secondary-light': string;
    '--brand-text': string;
    logoUrl?: string;
    businessName?: string;
}

// ─── Color helpers ───────────────────────────────────────────

/** hex لـ RGB */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!m) return null;
    return { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) };
}

/** إنشاء نسخة فاتحة من اللون (opacity 10%) */
function lighten(hex: string): string {
    const rgb = hexToRgb(hex);
    if (!rgb) return hex + '1a';
    // Mix with white at 90%
    const r = Math.round(rgb.r + (255 - rgb.r) * 0.88);
    const g = Math.round(rgb.g + (255 - rgb.g) * 0.88);
    const b = Math.round(rgb.b + (255 - rgb.b) * 0.88);
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

/** إنشاء نسخة غامقة من اللون */
function darken(hex: string): string {
    const rgb = hexToRgb(hex);
    if (!rgb) return hex;
    const r = Math.round(rgb.r * 0.75);
    const g = Math.round(rgb.g * 0.75);
    const b = Math.round(rgb.b * 0.75);
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

/**
 * حساب نسبة التباين بين لونين (WCAG).
 * يرجع رقم بين 1 (نفس اللون) و 21 (أبيض على أسود).
 * WCAG AA يحتاج 4.5:1 على الأقل للنص العادي.
 */
export function contrastRatio(hex1: string, hex2: string): number {
    const lum = (hex: string) => {
        const rgb = hexToRgb(hex);
        if (!rgb) return 0;
        const [rs, gs, bs] = [rgb.r / 255, rgb.g / 255, rgb.b / 255].map((c) =>
            c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
        );
        return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
    };
    const l1 = lum(hex1);
    const l2 = lum(hex2);
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
}

// ─── Server-side: get brand from DB ──────────────────────────

/**
 * جلب إعدادات البراند من DB حسب userId.
 * يستخدم في Server Components (layout.tsx).
 */
export async function getBrandTheme(userId: string): Promise<BrandTheme> {
    try {
        const business = await prisma.business.findFirst({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            select: { brandColors: true, logoUrl: true, name: true },
        });

        if (!business?.brandColors) return { ...DEFAULT_BRAND };

        const bc = business.brandColors as Record<string, string>;
        const primary = bc.primary || DEFAULT_BRAND['--brand-primary'];
        const secondary = bc.secondary || DEFAULT_BRAND['--brand-secondary'];

        return {
            '--brand-primary': primary,
            '--brand-primary-light': lighten(primary),
            '--brand-primary-dark': darken(primary),
            '--brand-secondary': secondary,
            '--brand-secondary-light': lighten(secondary),
            '--brand-text': bc.text || '#ffffff',
            logoUrl: business.logoUrl ?? undefined,
            businessName: business.name,
        };
    } catch {
        return { ...DEFAULT_BRAND };
    }
}

/**
 * تحويل BrandTheme لـ CSS variables string للـ style attribute.
 */
export function brandThemeToCssVars(theme: BrandTheme): Record<string, string> {
    const vars: Record<string, string> = {};
    for (const [key, value] of Object.entries(theme)) {
        if (key.startsWith('--')) {
            vars[key] = value;
        }
    }
    return vars;
}
