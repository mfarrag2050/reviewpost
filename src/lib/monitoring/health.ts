import { prisma } from '@/lib/prisma';
import { createLogger } from './logger';

const log = createLogger('HealthChecker');

export interface HealthCheckResult {
    service: string;
    status: 'ok' | 'error' | 'degraded';
    latencyMs: number;
    message?: string;
}

export interface FullHealthResult {
    status: 'healthy' | 'degraded' | 'unhealthy';
    timestamp: string;
    checks: HealthCheckResult[];
}

async function measureLatency<T>(fn: () => Promise<T>): Promise<{ result: T; latencyMs: number }> {
    const start = performance.now();
    const result = await fn();
    return { result, latencyMs: Math.round(performance.now() - start) };
}

export class HealthChecker {
    /** Ping PostgreSQL */
    async checkDatabase(): Promise<HealthCheckResult> {
        try {
            const { latencyMs } = await measureLatency(async () => {
                await prisma.$queryRaw`SELECT 1`;
            });
            return { service: 'postgresql', status: 'ok', latencyMs };
        } catch (err) {
            log.error('Database health check failed', {}, err);
            return {
                service: 'postgresql',
                status: 'error',
                latencyMs: 0,
                message: err instanceof Error ? err.message : 'Connection failed',
            };
        }
    }

    /** Ping Redis */
    async checkRedis(): Promise<HealthCheckResult> {
        try {
            const redisUrl = process.env.REDIS_URL;
            if (!redisUrl) {
                return { service: 'redis', status: 'degraded', latencyMs: 0, message: 'REDIS_URL not configured' };
            }

            // TCP ping على Redis port
            const url = new URL(redisUrl);
            const host = url.hostname;
            const port = parseInt(url.port || '6379');

            const { latencyMs } = await measureLatency(async () => {
                return new Promise<void>((resolve, reject) => {
                    const net = require('net') as typeof import('net');
                    const socket = net.createConnection({ host, port, timeout: 3000 }, () => {
                        socket.end();
                        resolve();
                    });
                    socket.on('error', reject);
                    socket.on('timeout', () => {
                        socket.destroy();
                        reject(new Error('Connection timeout'));
                    });
                });
            });
            return { service: 'redis', status: 'ok', latencyMs };
        } catch (err) {
            log.warn('Redis health check failed', { error: String(err) });
            return {
                service: 'redis',
                status: 'error',
                latencyMs: 0,
                message: err instanceof Error ? err.message : 'Connection failed',
            };
        }
    }

    /** Ping N8N */
    async checkN8N(): Promise<HealthCheckResult> {
        try {
            const n8nUrl = process.env.N8N_WEBHOOK_URL ?? 'https://flow.primeflow.co';
            const { latencyMs } = await measureLatency(async () => {
                const controller = new AbortController();
                const timeout = setTimeout(() => controller.abort(), 5000);
                try {
                    const res = await fetch(`${n8nUrl}/healthz`, {
                        signal: controller.signal,
                    });
                    // N8N قد يرجع 404 على /healthz بس الـ connection نفسها ناجحة
                    if (!res.ok && res.status !== 404) {
                        throw new Error(`HTTP ${res.status}`);
                    }
                } finally {
                    clearTimeout(timeout);
                }
            });
            return { service: 'n8n', status: 'ok', latencyMs };
        } catch (err) {
            log.warn('N8N health check failed', { error: String(err) });
            return {
                service: 'n8n',
                status: 'error',
                latencyMs: 0,
                message: err instanceof Error ? err.message : 'Connection failed',
            };
        }
    }

    /** Validate OpenAI API key */
    async checkOpenAI(): Promise<HealthCheckResult> {
        try {
            const apiKey = process.env.OPENAI_API_KEY;
            if (!apiKey) {
                return { service: 'openai', status: 'degraded', latencyMs: 0, message: 'OPENAI_API_KEY not configured' };
            }

            const { latencyMs } = await measureLatency(async () => {
                const controller = new AbortController();
                const timeout = setTimeout(() => controller.abort(), 5000);
                try {
                    const res = await fetch('https://api.openai.com/v1/models', {
                        headers: { 'Authorization': `Bearer ${apiKey}` },
                        signal: controller.signal,
                    });
                    if (!res.ok) throw new Error(`HTTP ${res.status}`);
                } finally {
                    clearTimeout(timeout);
                }
            });
            return { service: 'openai', status: 'ok', latencyMs };
        } catch (err) {
            return {
                service: 'openai',
                status: 'error',
                latencyMs: 0,
                message: err instanceof Error ? err.message : 'Validation failed',
            };
        }
    }

    /** Run all health checks in parallel */
    async getFullHealth(): Promise<FullHealthResult> {
        const checks = await Promise.all([
            this.checkDatabase(),
            this.checkRedis(),
            this.checkN8N(),
            this.checkOpenAI(),
        ]);

        const hasCriticalFailure = checks.some(
            (c) => c.status === 'error' && (c.service === 'postgresql'),
        );
        const hasAnyFailure = checks.some((c) => c.status === 'error');

        return {
            status: hasCriticalFailure ? 'unhealthy' : hasAnyFailure ? 'degraded' : 'healthy',
            timestamp: new Date().toISOString(),
            checks,
        };
    }
}

export const healthChecker = new HealthChecker();
