export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

export async function GET() {
    try {
        await requireAdmin();
    } catch (err) {
        return err as NextResponse;
    }

    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    try {
        const [
            totalUsers,
            totalPostsPublished,
            activeSubscriptions,
            newSignupsThisWeek,
            usersWithUsage,
            plansWithUsers,
        ] = await Promise.all([
            prisma.user.count(),
            prisma.post.count({ where: { status: 'PUBLISHED' } }),
            prisma.user.count({ where: { planId: { not: null } } }),
            prisma.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
            prisma.usage.findMany({
                where: { month: currentMonth },
                include: {
                    user: {
                        include: { currentPlan: true },
                    },
                },
            }),
            prisma.plan.findMany({
                include: { _count: { select: { users: true } } },
                where: { isActive: true },
            }),
        ]);

        // Signups per day for last 7 days
        const signupsByDay: { date: string; count: number }[] = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date(now);
            d.setDate(d.getDate() - i);
            const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
            const dayEnd = new Date(dayStart);
            dayEnd.setDate(dayEnd.getDate() + 1);
            const count = await prisma.user.count({
                where: { createdAt: { gte: dayStart, lt: dayEnd } },
            });
            signupsByDay.push({ date: dayStart.toISOString().split('T')[0], count });
        }

        // Heavy users: >80% of plan limit
        const heavyUsers = usersWithUsage
            .filter((u) => {
                const limit = u.user.currentPlan?.postsLimit ?? 0;
                return limit > 0 && u.postsGenerated / limit >= 0.8;
            })
            .map((u) => ({
                id: u.userId,
                name: u.user.name,
                email: u.user.email,
                planName: u.user.currentPlan?.name ?? 'None',
                postsUsed: u.postsGenerated,
                postsLimit: u.user.currentPlan?.postsLimit ?? 0,
                usagePct: Math.round((u.postsGenerated / (u.user.currentPlan?.postsLimit ?? 1)) * 100),
            }))
            .sort((a, b) => b.usagePct - a.usagePct);

        // MRR: sum of plan prices × user count
        const mrr = plansWithUsers
            .filter((p) => p.interval === 'MONTHLY')
            .reduce((sum, p) => sum + Number(p.price) * p._count.users, 0);

        // Health checks
        let dbStatus: 'ok' | 'error' = 'ok';
        try {
            await prisma.$queryRaw`SELECT 1`;
        } catch {
            dbStatus = 'error';
        }

        let redisStatus: 'ok' | 'error' | 'unknown' = 'unknown';
        try {
            if (process.env.REDIS_URL) {
                const url = new URL(process.env.REDIS_URL);
                const { createConnection } = await import('net');
                await new Promise<void>((resolve, reject) => {
                    const socket = createConnection(
                        { host: url.hostname, port: Number(url.port || 6379) },
                        () => { socket.destroy(); resolve(); }
                    );
                    socket.setTimeout(2000);
                    socket.on('error', reject);
                    socket.on('timeout', () => reject(new Error('timeout')));
                });
                redisStatus = 'ok';
            }
        } catch {
            redisStatus = 'error';
        }

        let n8nStatus: 'ok' | 'error' | 'unknown' = 'unknown';
        try {
            if (process.env.N8N_WEBHOOK_URL) {
                const n8nBase = new URL(process.env.N8N_WEBHOOK_URL).origin;
                const res = await fetch(n8nBase, { signal: AbortSignal.timeout(3000) });
                n8nStatus = res.ok || res.status === 404 ? 'ok' : 'error';
            }
        } catch {
            n8nStatus = 'error';
        }

        return NextResponse.json({
            totalUsers,
            totalPostsPublished,
            mrr: Math.round(mrr),
            activeSubscriptions,
            newSignupsThisWeek,
            signupsByDay,
            heavyUsers,
            health: { db: dbStatus, redis: redisStatus, n8n: n8nStatus },
        });
    } catch (err) {
        console.error('[admin/stats]', err);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
