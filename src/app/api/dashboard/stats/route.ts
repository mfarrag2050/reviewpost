import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
    const session = await auth();
    if (!session?.user?.userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.userId;
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const [usage, businesses] = await Promise.all([
        prisma.usage.findUnique({
            where: { userId_month: { userId, month } },
        }),
        prisma.business.findMany({
            where: { userId },
            select: { id: true },
        }),
    ]);

    const businessIds = businesses.map((b) => b.id);

    const [recentPosts, upcomingPosts] = await Promise.all([
        prisma.post.findMany({
            where: { businessId: { in: businessIds } },
            orderBy: { createdAt: 'desc' },
            take: 10,
            include: {
                review: { select: { authorName: true, rating: true } },
                business: { select: { name: true } },
            },
        }),
        prisma.post.findMany({
            where: {
                businessId: { in: businessIds },
                status: 'QUEUED',
                scheduledAt: { gte: now },
            },
            orderBy: { scheduledAt: 'asc' },
            take: 5,
            include: {
                business: { select: { name: true } },
            },
        }),
    ]);

    // Calculate engagement rate from published posts with engagement data
    let totalEngagement = 0;
    let totalReach = 0;
    recentPosts.forEach((post) => {
        const ed = post.engagementData as Record<string, number> | null;
        if (ed && ed.reach > 0) {
            totalEngagement += (ed.likes ?? 0) + (ed.comments ?? 0);
            totalReach += ed.reach;
        }
    });
    const engagementRate =
        totalReach > 0 ? ((totalEngagement / totalReach) * 100).toFixed(1) : '0.0';

    return NextResponse.json({
        stats: {
            postsGenerated: usage?.postsGenerated ?? 0,
            postsPublished: usage?.postsPublished ?? 0,
            reviewsPulled: usage?.reviewsPulled ?? 0,
            engagementRate,
        },
        recentPosts: recentPosts.map((p) => ({
            id: p.id,
            caption: p.caption,
            imageUrl: p.imageUrl,
            platform: p.platform,
            status: p.status,
            scheduledAt: p.scheduledAt,
            publishedAt: p.publishedAt,
            engagementData: p.engagementData,
            businessName: p.business.name,
            reviewAuthor: p.review.authorName,
            reviewRating: p.review.rating,
            createdAt: p.createdAt,
        })),
        upcomingPosts: upcomingPosts.map((p) => ({
            id: p.id,
            caption: p.caption,
            platform: p.platform,
            scheduledAt: p.scheduledAt,
            businessName: p.business.name,
        })),
    });
}
