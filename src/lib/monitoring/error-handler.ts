import { NextRequest, NextResponse } from 'next/server';
import { createLogger } from './logger';

const log = createLogger('ErrorHandler');

/**
 * إرسال تنبيه Telegram للأخطاء الحرجة.
 */
async function sendTelegramAlert(route: string, error: Error): Promise<void> {
    try {
        const botToken = process.env.TELEGRAM_BOT_TOKEN;
        const chatId = process.env.ALERT_TELEGRAM_CHAT_ID ?? process.env.TELEGRAM_CHAT_ID;
        if (!botToken || !chatId) return;

        const text = `🚨 *Critical Error — ReviewPost*\n\n` +
            `*Route:* \`${route}\`\n` +
            `*Error:* ${error.message}\n` +
            `*Time:* ${new Date().toISOString()}\n` +
            `*Stack:* \`${(error.stack ?? '').split('\n').slice(0, 3).join('\n')}\``;

        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text,
                parse_mode: 'Markdown',
            }),
        });
    } catch {
        // لا نريد أن يفشل التنبيه يوقف الـ response
    }
}

type RouteHandler = (req: NextRequest) => Promise<NextResponse>;

/**
 * Global error wrapper for API routes.
 * يلتقط الأخطاء، يسجلها، يرسل تنبيه Telegram للأخطاء الحرجة،
 * ويرجع response مناسب.
 */
export function wrapApiHandler(routeName: string, handler: RouteHandler): RouteHandler {
    return async (req: NextRequest): Promise<NextResponse> => {
        try {
            return await handler(req);
        } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            const isNextResponse = err instanceof NextResponse;

            // إذا كان NextResponse (مثل من requireAuth) — مرره مباشرة
            if (isNextResponse) return err as unknown as NextResponse;

            log.error(`Unhandled error in ${routeName}`, {
                route: routeName,
                method: req.method,
                url: req.url,
            }, error);

            // إرسال تنبيه Telegram (async — لا ننتظره)
            sendTelegramAlert(routeName, error);

            return NextResponse.json(
                {
                    error: 'Internal server error',
                    message: process.env.NODE_ENV === 'development' ? error.message : undefined,
                },
                { status: 500 },
            );
        }
    };
}
