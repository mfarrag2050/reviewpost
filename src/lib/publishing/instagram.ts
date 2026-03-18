import {
    PublishResult,
    EngagementData,
    MetaApiError,
    IgContainerResponse,
    IgPublishResponse,
    IgInsightsResponse,
} from './types';

const GRAPH_API = 'https://graph.facebook.com/v21.0';

// الحد الأقصى لانتظار جاهزية الـ container (30 ثانية)
const CONTAINER_POLL_INTERVAL = 2000;
const CONTAINER_POLL_MAX_ATTEMPTS = 15;

/**
 * Instagram Graph API publisher.
 * يستخدم two-step flow: إنشاء media container ثم نشره.
 * الصورة لازم تكون URL عام (مش ملف محلي).
 */
export class InstagramPublisher {

    /**
     * نشر صورة على Instagram.
     * Step 1: إنشاء media container
     * Step 2: انتظار جاهزية الـ container
     * Step 3: نشر الـ container
     */
    async publishPhoto(
        igUserId: string,
        imageUrl: string,
        caption: string,
        accessToken: string,
    ): Promise<PublishResult> {
        try {
            // Step 1: إنشاء media container
            const containerRes = await fetch(`${GRAPH_API}/${igUserId}/media`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    image_url: imageUrl,
                    caption,
                    access_token: accessToken,
                }),
            });

            if (!containerRes.ok) {
                const err = await containerRes.json() as MetaApiError;
                return this.handleApiError(err, containerRes.status);
            }

            const container = await containerRes.json() as IgContainerResponse;
            console.log(`[Instagram] Container created: ${container.id}`);

            // Step 2: انتظار جاهزية الـ container
            await this.waitForContainer(container.id, accessToken);

            // Step 3: نشر الـ container
            const publishRes = await fetch(`${GRAPH_API}/${igUserId}/media_publish`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    creation_id: container.id,
                    access_token: accessToken,
                }),
            });

            if (!publishRes.ok) {
                const err = await publishRes.json() as MetaApiError;
                return this.handleApiError(err, publishRes.status);
            }

            const published = await publishRes.json() as IgPublishResponse;
            console.log(`[Instagram] Published: ${published.id}`);

            return {
                success: true,
                platform: 'INSTAGRAM',
                externalPostId: published.id,
                status: 'PUBLISHED',
                publishedAt: new Date(),
            };
        } catch (err) {
            console.error('[Instagram] Publish error:', err);
            return {
                success: false,
                platform: 'INSTAGRAM',
                status: 'FAILED',
                error: String(err),
            };
        }
    }

    /**
     * جلب بيانات التفاعل (يفضّل بعد 24-48 ساعة من النشر).
     * المقاييس: impressions, reach, engagement, saved
     */
    async getInsights(
        mediaId: string,
        accessToken: string,
    ): Promise<EngagementData> {
        const metrics = 'impressions,reach,saved,likes,comments';
        const url = `${GRAPH_API}/${mediaId}/insights?metric=${metrics}&access_token=${accessToken}`;
        const res = await fetch(url);

        if (!res.ok) {
            const err = await res.json() as MetaApiError;
            throw new Error(`Instagram insights error: ${err.error.message} (code ${err.error.code})`);
        }

        const body = await res.json() as IgInsightsResponse;
        const data: EngagementData = {};

        for (const metric of body.data) {
            const value = metric.values[0]?.value ?? 0;
            switch (metric.name) {
                case 'impressions': data.impressions = value; break;
                case 'reach': data.reach = value; break;
                case 'saved': data.saves = value; break;
                case 'likes': data.likes = value; break;
                case 'comments': data.comments = value; break;
            }
        }

        // حساب الـ engagement الإجمالي
        data.engagement = (data.likes ?? 0) + (data.comments ?? 0) + (data.saves ?? 0);

        return data;
    }

    /** انتظار حتى يصبح الـ container جاهز للنشر */
    private async waitForContainer(containerId: string, accessToken: string): Promise<void> {
        for (let i = 0; i < CONTAINER_POLL_MAX_ATTEMPTS; i++) {
            const res = await fetch(
                `${GRAPH_API}/${containerId}?fields=status_code&access_token=${accessToken}`,
            );
            if (res.ok) {
                const body = await res.json() as { status_code: string };
                if (body.status_code === 'FINISHED') return;
                if (body.status_code === 'ERROR') {
                    throw new Error('Instagram container processing failed');
                }
            }
            await new Promise((r) => setTimeout(r, CONTAINER_POLL_INTERVAL));
        }
        throw new Error('Instagram container processing timed out');
    }

    /** تحويل خطأ Meta API لـ PublishResult */
    private handleApiError(err: MetaApiError, httpStatus: number): PublishResult {
        const code = err.error.code;
        let errorMsg = err.error.message;

        if (httpStatus === 401 || code === 190) {
            errorMsg = `Token expired or invalid: ${err.error.message}`;
        } else if (httpStatus === 429 || code === 4 || code === 32) {
            errorMsg = `Rate limited: ${err.error.message}`;
        } else if (httpStatus === 400) {
            errorMsg = `Invalid request: ${err.error.message}`;
        }

        return {
            success: false,
            platform: 'INSTAGRAM',
            status: 'FAILED',
            error: errorMsg,
        };
    }
}
