export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { getLogEntries, createLogger } from '@/lib/monitoring/logger';
import { healthChecker } from '@/lib/monitoring/health';

const log = createLogger('AdminSystem');

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

export async function GET() {
    try {
        await requireAdmin();
    } catch (err) {
        return err as NextResponse;
    }

    try {
        const [rows, health] = await Promise.all([
            prisma.systemSetting.findMany({
                where: { key: { in: [...SETTING_KEYS] } },
            }),
            healthChecker.getFullHealth(),
        ]);

        const settings: Partial<Record<SettingKey, string>> = {};
        for (const row of rows) {
            settings[row.key as SettingKey] = row.value;
        }

        return NextResponse.json({
            settings,
            health,
            logs: getLogEntries(100),
        });
    } catch (err) {
        log.error('Failed to fetch system data', {}, err);
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

        log.info('System settings updated', {
            keys: Object.keys(body.settings).filter((k) => SETTING_KEYS.includes(k as SettingKey)),
        });

        return NextResponse.json({ success: true });
    } catch (err) {
        log.error('Failed to update system settings', {}, err);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
