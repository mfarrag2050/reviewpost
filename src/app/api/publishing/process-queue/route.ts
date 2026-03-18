import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PublishingService } from '@/lib/publishing';

const service = new PublishingService();

/**
 * POST /api/publishing/process-queue
 *
 * يبحث عن كل البوستات اللي status=QUEUED و scheduled_at <= الآن،
 * ينشرها واحد واحد، ويرجع عدد اللي نجحت واللي فشلت.
 */
export async function POST() {
    try {
        const now = new Date();

        // جلب البوستات الجاهزة للنشر
        const queuedPosts = await prisma.post.findMany({
            where: {
                status: 'QUEUED',
                scheduledAt: { lte: now },
            },
            select: { id: true },
            orderBy: { scheduledAt: 'asc' },
            take: 50, // حد أقصى لكل دورة — تجنب timeout
        });

        if (queuedPosts.length === 0) {
            return NextResponse.json({
                success: true,
                message: 'No posts in queue',
                processed: 0,
                published: 0,
                failed: 0,
            });
        }

        let published = 0;
        let failed = 0;
        const errors: Array<{ postId: string; error: string }> = [];

        for (const post of queuedPosts) {
            try {
                const result = await service.publish(post.id);
                if (result.success) {
                    published++;
                } else {
                    failed++;
                    errors.push({ postId: post.id, error: result.error ?? 'Unknown' });
                }
            } catch (err) {
                failed++;
                errors.push({ postId: post.id, error: String(err) });
            }
        }

        console.log(`[process-queue] Processed ${queuedPosts.length}: ${published} published, ${failed} failed`);

        return NextResponse.json({
            success: true,
            processed: queuedPosts.length,
            published,
            failed,
            errors: errors.length > 0 ? errors : undefined,
        });
    } catch (err) {
        console.error('[/api/publishing/process-queue] Error:', err);
        return NextResponse.json(
            { error: 'Internal server error', detail: String(err) },
            { status: 500 },
        );
    }
}
