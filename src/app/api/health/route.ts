export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { healthChecker } from '@/lib/monitoring/health';

/**
 * GET /api/health
 *
 * Public endpoint for uptime monitoring (UptimeRobot, etc.).
 * Returns 200 if healthy, 503 if any critical service is down.
 */
export async function GET() {
    const result = await healthChecker.getFullHealth();

    const httpStatus = result.status === 'unhealthy' ? 503 : 200;

    return NextResponse.json(result, { status: httpStatus });
}
