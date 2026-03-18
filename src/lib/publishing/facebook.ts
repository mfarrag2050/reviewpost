import {
    PublishResult,
    EngagementData,
    MetaApiError,
    FbPublishResponse,
    FbInsightsResponse,
} from './types';

const GRAPH_API = 'https://graph.facebook.com/v21.0';

/**
 * Facebook Pages API publisher.
 * ينشر صور على صفحات فيسبوك باستخدام Page Access Token.
 */
export class FacebookPublisher {

    /**
     * نشر صورة على صفحة فيسبوك.
     * يستخدم /{page-id}/photos endpoint مباشرة.
     */
    async publishPhoto(
        pageId: string,
        imageUrl: string,
        caption: string,
        accessToken: string,
    ): Promise<PublishResult> {
        try {
            const res = await fetch(`${GRAPH_API}/${pageId}/photos`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    url: imageUrl,
                    message: caption,
                    access_token: accessToken,
                }),
            });

            if (!res.ok) {
                const err = await res.json() as MetaApiError;
                return this.handleApiError(err, res.status);
            }

            const body = await res.json() as FbPublishResponse;
            const postId = body.post_id ?? body.id;
            console.log(`[Facebook] Published: ${postId}`);

            return {
                success: true,
                platform: 'FACEBOOK',
                externalPostId: postId,
                status: 'PUBLISHED',
                publishedAt: new Date(),
            };
        } catch (err) {
            console.error('[Facebook] Publish error:', err);
            return {
                success: false,
                platform: 'FACEBOOK',
                status: 'FAILED',
                error: String(err),
            };
        }
    }

    /**
     * جلب بيانات التفاعل من المنشور.
     * يجلب: likes, comments, shares + page post insights.
     */
    async getInsights(
        postId: string,
        accessToken: string,
    ): Promise<EngagementData> {
        // جلب الـ reactions و comments و shares من المنشور نفسه
        const fieldsUrl = `${GRAPH_API}/${postId}?fields=likes.summary(true),comments.summary(true),shares&access_token=${accessToken}`;
        const fieldsRes = await fetch(fieldsUrl);

        if (!fieldsRes.ok) {
            const err = await fieldsRes.json() as MetaApiError;
            throw new Error(`Facebook fields error: ${err.error.message} (code ${err.error.code})`);
        }

        const fieldsBody = await fieldsRes.json() as {
            likes?: { summary?: { total_count?: number } };
            comments?: { summary?: { total_count?: number } };
            shares?: { count?: number };
        };

        const likes = fieldsBody.likes?.summary?.total_count ?? 0;
        const comments = fieldsBody.comments?.summary?.total_count ?? 0;
        const shares = fieldsBody.shares?.count ?? 0;

        // جلب insights للـ reach و impressions
        const insightsUrl = `${GRAPH_API}/${postId}/insights?metric=post_impressions,post_impressions_unique&access_token=${accessToken}`;
        const insightsRes = await fetch(insightsUrl);

        let impressions = 0;
        let reach = 0;

        if (insightsRes.ok) {
            const insightsBody = await insightsRes.json() as FbInsightsResponse;
            for (const metric of insightsBody.data) {
                const value = metric.values[0]?.value;
                const numValue = typeof value === 'number' ? value : 0;
                switch (metric.name) {
                    case 'post_impressions': impressions = numValue; break;
                    case 'post_impressions_unique': reach = numValue; break;
                }
            }
        }

        return {
            impressions,
            reach,
            likes,
            comments,
            shares,
            engagement: likes + comments + shares,
        };
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
            platform: 'FACEBOOK',
            status: 'FAILED',
            error: errorMsg,
        };
    }
}
