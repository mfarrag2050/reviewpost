import { prisma } from '../prisma';
import { decrypt, encrypt } from '../reviews/google';
import { InstagramPublisher } from './instagram';
import { FacebookPublisher } from './facebook';
import { PublishResult, PublishPlatform, EngagementData } from './types';

const instagram = new InstagramPublisher();
const facebook = new FacebookPublisher();

// ─── Retry مع exponential backoff ─────────────────────────

async function withRetry<T>(
    fn: () => Promise<T>,
    maxAttempts = 3,
    label = 'PublishingService',
): Promise<T> {
    let attempt = 0;
    while (true) {
        try {
            return await fn();
        } catch (err) {
            attempt++;
            if (attempt >= maxAttempts) throw err;
            const delay = 1000 * 2 ** attempt + Math.random() * 500;
            console.warn(`[${label}] Attempt ${attempt}/${maxAttempts} failed. Retrying in ${delay.toFixed(0)}ms`);
            await new Promise((r) => setTimeout(r, delay));
        }
    }
}

// ─── Token refresh helper ─────────────────────────────────

/**
 * تجديد Meta access token باستخدام long-lived token exchange.
 * إذا الـ token منتهي الصلاحية، يحاول يجدده ويحفظ الجديد بالـ DB.
 */
async function refreshMetaToken(businessId: string, currentToken: string): Promise<string> {
    const appId = process.env.META_APP_ID;
    const appSecret = process.env.META_APP_SECRET;
    if (!appId || !appSecret) {
        throw new Error('META_APP_ID and META_APP_SECRET required for token refresh');
    }

    const url = `https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${currentToken}`;
    const res = await fetch(url);

    if (!res.ok) {
        throw new Error(`Token refresh failed: ${res.statusText}`);
    }

    const body = await res.json() as { access_token: string; expires_in?: number };
    const newToken = body.access_token;
    const expiresIn = body.expires_in ?? 5184000; // 60 يوم افتراضي

    // حفظ الـ token الجديد مشفّر بالـ DB
    await prisma.oAuthToken.update({
        where: { businessId },
        data: {
            encryptedAccessToken: encrypt(newToken),
            expiresAt: new Date(Date.now() + expiresIn * 1000),
        },
    });

    console.log(`[PublishingService] Token refreshed for business ${businessId}`);
    return newToken;
}

// ─── PublishingService ────────────────────────────────────

export class PublishingService {

    /**
     * نشر بوست على المنصة المحددة.
     * يحمّل الـ OAuth token من DB، ينشر، ويحدّث حالة البوست.
     */
    async publish(postId: string): Promise<PublishResult> {
        // تحميل البوست مع البيانات المرتبطة
        const post = await prisma.post.findUnique({
            where: { id: postId },
            include: {
                business: {
                    include: { oauthToken: true },
                },
                review: true,
            },
        });

        if (!post) throw new Error(`Post ${postId} not found`);
        if (!post.imageUrl) throw new Error(`Post ${postId} has no image URL`);

        const { business } = post;
        if (!business.oauthToken) {
            return this.failPost(postId, 'No OAuth token found for business');
        }

        // فك تشفير الـ token
        let accessToken: string;
        try {
            accessToken = decrypt(business.oauthToken.encryptedAccessToken);
        } catch {
            return this.failPost(postId, 'Failed to decrypt access token');
        }

        // التحقق من صلاحية الـ token — تجديد إذا منتهي
        if (business.oauthToken.expiresAt < new Date()) {
            try {
                accessToken = await refreshMetaToken(business.id, accessToken);
            } catch (err) {
                return this.failPost(postId, `Token refresh failed: ${String(err)}`);
            }
        }

        const platform = post.platform as PublishPlatform;
        const caption = post.caption ?? '';
        const imageUrl = post.imageUrl;

        // نشر مع retry
        let result: PublishResult;
        try {
            result = await withRetry(async () => {
                switch (platform) {
                    case 'INSTAGRAM': {
                        // Instagram يحتاج igUserId — نستخدم facebookPageId لجلبه
                        const igUserId = await this.getInstagramUserId(business.facebookPageId, accessToken);
                        return instagram.publishPhoto(igUserId, imageUrl, caption, accessToken);
                    }
                    case 'FACEBOOK': {
                        if (!business.facebookPageId) {
                            throw new Error('Business has no facebookPageId');
                        }
                        return facebook.publishPhoto(business.facebookPageId, imageUrl, caption, accessToken);
                    }
                    default:
                        throw new Error(`Unsupported platform: ${platform}`);
                }
            }, 3, `Publishing:${platform}`);
        } catch (err) {
            return this.failPost(postId, String(err));
        }

        // تحديث حالة البوست بالـ DB
        if (result.success) {
            await prisma.post.update({
                where: { id: postId },
                data: {
                    status: 'PUBLISHED',
                    publishedAt: result.publishedAt ?? new Date(),
                    engagementData: { externalPostId: result.externalPostId },
                },
            });
        } else {
            await this.failPost(postId, result.error ?? 'Unknown error');
        }

        console.log(`[PublishingService] Post ${postId} → ${result.status} on ${platform}`);
        return result;
    }

    /**
     * جلب بيانات التفاعل وتحديثها بالـ DB.
     */
    async pullInsights(postId: string): Promise<EngagementData> {
        const post = await prisma.post.findUnique({
            where: { id: postId },
            include: {
                business: { include: { oauthToken: true } },
            },
        });

        if (!post) throw new Error(`Post ${postId} not found`);
        if (post.status !== 'PUBLISHED') throw new Error(`Post ${postId} is not published`);

        const existing = (post.engagementData ?? {}) as Record<string, unknown>;
        const externalPostId = existing.externalPostId as string | undefined;
        if (!externalPostId) throw new Error(`Post ${postId} has no external post ID`);

        if (!post.business.oauthToken) throw new Error('No OAuth token for business');

        let accessToken = decrypt(post.business.oauthToken.encryptedAccessToken);

        // تجديد token إذا منتهي
        if (post.business.oauthToken.expiresAt < new Date()) {
            accessToken = await refreshMetaToken(post.business.id, accessToken);
        }

        const platform = post.platform as PublishPlatform;
        let insights: EngagementData;

        switch (platform) {
            case 'INSTAGRAM':
                insights = await instagram.getInsights(externalPostId, accessToken);
                break;
            case 'FACEBOOK':
                insights = await facebook.getInsights(externalPostId, accessToken);
                break;
            default:
                throw new Error(`Unsupported platform for insights: ${platform}`);
        }

        // تحديث الـ engagement_data مع الحفاظ على externalPostId
        await prisma.post.update({
            where: { id: postId },
            data: {
                engagementData: {
                    externalPostId,
                    ...insights,
                    updatedAt: new Date().toISOString(),
                },
            },
        });

        console.log(`[PublishingService] Insights updated for post ${postId}:`, insights);
        return insights;
    }

    /**
     * جلب Instagram Business Account ID من Facebook Page.
     */
    private async getInstagramUserId(
        facebookPageId: string | null,
        accessToken: string,
    ): Promise<string> {
        if (!facebookPageId) {
            throw new Error('Business has no facebookPageId — required for Instagram publishing');
        }

        const url = `https://graph.facebook.com/v21.0/${facebookPageId}?fields=instagram_business_account&access_token=${accessToken}`;
        const res = await fetch(url);

        if (!res.ok) {
            throw new Error(`Failed to get Instagram account: ${res.statusText}`);
        }

        const body = await res.json() as {
            instagram_business_account?: { id: string };
        };

        if (!body.instagram_business_account?.id) {
            throw new Error('No Instagram Business Account linked to this Facebook Page');
        }

        return body.instagram_business_account.id;
    }

    /** تسجيل فشل البوست بالـ DB */
    private async failPost(postId: string, error: string): Promise<PublishResult> {
        await prisma.post.update({
            where: { id: postId },
            data: {
                status: 'FAILED',
                engagementData: { error, failedAt: new Date().toISOString() },
            },
        });

        return {
            success: false,
            platform: 'INSTAGRAM', // سيتم تحديثها من المستدعي
            status: 'FAILED',
            error,
        };
    }
}
