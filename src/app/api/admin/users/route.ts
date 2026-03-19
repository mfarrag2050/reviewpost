export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

const PAGE_SIZE = 20;

export async function GET(req: NextRequest) {
    try {
        await requireAdmin();
    } catch (err) {
        return err as NextResponse;
    }

    const { searchParams } = req.nextUrl;
    const page = Math.max(1, Number(searchParams.get('page') ?? 1));
    const search = searchParams.get('search') ?? '';
    const plan = searchParams.get('plan') ?? '';
    const status = searchParams.get('status') ?? '';
    const sortField = (searchParams.get('sortField') ?? 'createdAt') as 'name' | 'createdAt';
    const sortDir = (searchParams.get('sortDir') ?? 'desc') as 'asc' | 'desc';

    const currentMonth = (() => {
        const n = new Date();
        return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}`;
    })();

    try {
        const where = {
            AND: [
                search
                    ? {
                          OR: [
                              { name: { contains: search, mode: 'insensitive' as const } },
                              { email: { contains: search, mode: 'insensitive' as const } },
                          ],
                      }
                    : {},
                plan ? { currentPlan: { name: plan } } : {},
                status === 'active' ? { isActive: true } : status === 'suspended' ? { isActive: false } : {},
            ],
        };

        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where,
                include: {
                    currentPlan: { select: { name: true, postsLimit: true } },
                    _count: { select: { businesses: true } },
                    usages: { where: { month: currentMonth } },
                },
                orderBy: sortField === 'name' ? { name: sortDir } : { createdAt: sortDir },
                skip: (page - 1) * PAGE_SIZE,
                take: PAGE_SIZE,
            }),
            prisma.user.count({ where }),
        ]);

        const mapped = users.map((u) => ({
            id: u.id,
            name: u.name,
            email: u.email,
            role: u.role,
            planName: u.currentPlan?.name ?? null,
            postsUsed: u.usages[0]?.postsGenerated ?? 0,
            postsLimit: u.currentPlan?.postsLimit ?? 0,
            isActive: u.isActive,
            createdAt: u.createdAt.toISOString(),
            businessCount: u._count.businesses,
        }));

        return NextResponse.json({
            users: mapped,
            total,
            page,
            pages: Math.ceil(total / PAGE_SIZE),
        });
    } catch (err) {
        console.error('[admin/users GET]', err);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
