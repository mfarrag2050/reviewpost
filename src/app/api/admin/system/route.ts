export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

const SETTING_KEYS = [
    'ai_model',
    'ai_temperature',
    'ai_fallback_model',
    'email_provider',
    'email_from',
    'telegram_bot_token',
    'telegram_chat_id',
    'maintenance_mode',
] as const;

type SettingKey = typeof SETTING_KEYS[number];

// In-memory log buffer (recent entries, rotated every restart)
const logBuffer: { timestamp: string; level: string; message: string }[] = [];
const MAX_LOGS = 100;

// Hook into console for server-side log capture
if (typeof window === 'undefined' && !(global as Record<string, unknown>).__adminLogHooked) {
    (global as Record<string, unknown>).__adminLogHooked = true;
    const origWarn = console.warn.bind(console);
    const origError = console.error.bind(console);
    console.warn = (...args: unknown[]) => {
        addLog('WARN', args.map(String).join(' '));
        origWarn(...args);
    };
    console.error = (...args: unknown[]) => {
        addLog('ERROR', args.map(String).join(' '));
        origError(...args);
    };
}

function addLog(level: string, message: string) {
    logBuffer.unshift({ timestamp: new Date().toISOString(), level, message });
    if (logBuffer.length > MAX_LOGS) logBuffer.splice(MAX_LOGS);
}

export async function GET() {
    try {
        await requireAdmin();
    } catch (err) {
        return err as NextResponse;
    }

    try {
        const rows = await prisma.systemSetting.findMany({
            where: { key: { in: [...SETTING_KEYS] } },
        });

        const settings: Partial<Record<SettingKey, string>> = {};
        for (const row of rows) {
            settings[row.key as SettingKey] = row.value;
        }

        return NextResponse.json({ settings, logs: logBuffer.slice(0, MAX_LOGS) });
    } catch (err) {
        console.error('[admin/system GET]', err);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    try {
        await requireAdmin();
    } catch (err) {
        return err as NextResponse;
    }

    try {
        const body = await req.json() as { settings: Record<string, string> };

        if (!body.settings || typeof body.settings !== 'object') {
            return NextResponse.json({ error: 'settings object required' }, { status: 400 });
        }

        // Upsert each setting
        await Promise.all(
            Object.entries(body.settings)
                .filter(([key]) => SETTING_KEYS.includes(key as SettingKey))
                .map(([key, value]) =>
                    prisma.systemSetting.upsert({
                        where: { key },
                        create: { key, value: String(value) },
                        update: { value: String(value) },
                    })
                )
        );

        addLog('INFO', `System settings updated`);

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('[admin/system PATCH]', err);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
