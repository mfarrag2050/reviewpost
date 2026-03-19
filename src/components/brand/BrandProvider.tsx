'use client';

import { createContext, useContext, useEffect, useState, useMemo } from 'react';
import type { BrandTheme } from '@/lib/brand';
import { DEFAULT_BRAND } from '@/lib/brand';

interface BrandContextValue {
    theme: BrandTheme;
    setTheme: (t: Partial<BrandTheme>) => void;
    logoUrl?: string;
    businessName?: string;
}

const BrandContext = createContext<BrandContextValue>({
    theme: { ...DEFAULT_BRAND },
    setTheme: () => {},
});

export const useBrand = () => useContext(BrandContext);

interface Props {
    children: React.ReactNode;
    /** Initial theme from server (SSR) */
    initialTheme: BrandTheme;
}

/**
 * BrandProvider — يحقن CSS variables بالـ DOM.
 * أي child component يقدر يستخدم var(--brand-primary) الخ.
 * يحدّث real-time لما يتغير الثيم (مثلاً من Settings).
 */
export function BrandProvider({ children, initialTheme }: Props) {
    const [theme, setThemeRaw] = useState<BrandTheme>(initialTheme);

    const setTheme = (partial: Partial<BrandTheme>) => {
        setThemeRaw((prev) => ({ ...prev, ...partial }));
    };

    // حقن CSS variables بالـ root element
    useEffect(() => {
        const root = document.documentElement;
        for (const [key, value] of Object.entries(theme)) {
            if (key.startsWith('--') && typeof value === 'string') {
                root.style.setProperty(key, value);
            }
        }
        return () => {
            // تنظيف عند unmount
            for (const key of Object.keys(theme)) {
                if (key.startsWith('--')) {
                    root.style.removeProperty(key);
                }
            }
        };
    }, [theme]);

    const value = useMemo(() => ({
        theme,
        setTheme,
        logoUrl: theme.logoUrl,
        businessName: theme.businessName,
    }), [theme]);

    return (
        <BrandContext.Provider value={value}>
            {children}
        </BrandContext.Provider>
    );
}
