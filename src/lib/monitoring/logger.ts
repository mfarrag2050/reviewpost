export type LogLevel = 'INFO' | 'WARN' | 'ERROR';

export interface LogEntry {
    timestamp: string;
    level: LogLevel;
    message: string;
    metadata?: Record<string, unknown>;
    stack?: string;
}

// ─── In-memory log buffer ────────────────────────────────────

const MAX_ENTRIES = 500;
const logBuffer: LogEntry[] = [];

/**
 * Structured logger — logs to console in dev, stores last 500 entries
 * in memory for the admin /api/admin/system logs endpoint.
 */
export class Logger {
    private context: string;

    constructor(context: string) {
        this.context = context;
    }

    info(message: string, meta?: Record<string, unknown>): void {
        this.log('INFO', message, meta);
    }

    warn(message: string, meta?: Record<string, unknown>): void {
        this.log('WARN', message, meta);
    }

    error(message: string, meta?: Record<string, unknown>, error?: unknown): void {
        const stack = error instanceof Error ? error.stack : undefined;
        this.log('ERROR', message, meta, stack);
    }

    private log(level: LogLevel, message: string, meta?: Record<string, unknown>, stack?: string): void {
        const entry: LogEntry = {
            timestamp: new Date().toISOString(),
            level,
            message: `[${this.context}] ${message}`,
            metadata: meta,
            stack,
        };

        // حفظ في الـ buffer
        logBuffer.unshift(entry);
        if (logBuffer.length > MAX_ENTRIES) logBuffer.splice(MAX_ENTRIES);

        // طباعة بالـ console
        const prefix = `[${level}][${this.context}]`;
        switch (level) {
            case 'ERROR':
                console.error(prefix, message, meta ?? '', stack ?? '');
                break;
            case 'WARN':
                console.warn(prefix, message, meta ?? '');
                break;
            default:
                console.log(prefix, message, meta ?? '');
        }
    }
}

/**
 * جلب آخر entries من الـ buffer.
 */
export function getLogEntries(limit = 100): LogEntry[] {
    return logBuffer.slice(0, limit);
}

/**
 * إنشاء logger جديد بـ context محدد.
 */
export function createLogger(context: string): Logger {
    return new Logger(context);
}
