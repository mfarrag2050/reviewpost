/** المنصات المدعومة للنشر */
export type PublishPlatform = 'INSTAGRAM' | 'FACEBOOK';

/** حالة عملية النشر */
export type PublishStatus = 'PUBLISHED' | 'FAILED';

/** نتيجة عملية النشر */
export interface PublishResult {
    success: boolean;
    platform: PublishPlatform;
    /** معرّف المنشور على المنصة */
    externalPostId?: string;
    status: PublishStatus;
    error?: string;
    publishedAt?: Date;
}

/** بيانات التفاعل من المنصة */
export interface EngagementData {
    impressions?: number;
    reach?: number;
    engagement?: number;
    saves?: number;
    likes?: number;
    comments?: number;
    shares?: number;
}

/** خطأ من Meta Graph API */
export interface MetaApiError {
    error: {
        message: string;
        type: string;
        code: number;
        error_subcode?: number;
        fbtrace_id?: string;
    };
}

/** استجابة إنشاء media container على Instagram */
export interface IgContainerResponse {
    id: string;
}

/** استجابة النشر */
export interface IgPublishResponse {
    id: string;
}

/** استجابة insights من Instagram */
export interface IgInsightsResponse {
    data: Array<{
        name: string;
        period: string;
        values: Array<{ value: number }>;
        title: string;
        id: string;
    }>;
}

/** استجابة النشر على Facebook */
export interface FbPublishResponse {
    id: string;
    post_id?: string;
}

/** استجابة insights من Facebook */
export interface FbInsightsResponse {
    data: Array<{
        name: string;
        period: string;
        values: Array<{ value: number | Record<string, number> }>;
    }>;
}
