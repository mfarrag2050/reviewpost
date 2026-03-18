import { PostPlatform, Language } from '../../generated/prisma';

// Re-export Prisma enums for convenience
export { PostPlatform, Language };

/** The three AI key modes a user can be on */
export type AIKeyMode = 'SHARED' | 'BYOK' | 'MANAGED';

/** Input to caption generation */
export interface CaptionRequest {
    reviewId: string;
    platform: PostPlatform;
    language?: Language;
    includeHashtags?: boolean;
    includeCTA?: boolean;
}

/** Result returned by the caption generator */
export interface CaptionResult {
    caption: string;
    hashtags: string[];
    emoji: string;
    fullText: string; // caption + hashtags + emoji assembled
    tokensUsed: {
        prompt: number;
        completion: number;
        total: number;
    };
    model: string;
}

/** Context about the business passed to prompt builder */
export interface BusinessContext {
    name: string;
    type: string;
    language: Language;
}

/** Full review context passed to generator */
export interface ReviewContext {
    id: string;
    authorName: string | null;
    rating: number | null;
    text: string | null;
    source: string;
}

/** Options controlling caption style */
export interface CaptionOptions {
    platform: PostPlatform;
    language: Language;
    includeHashtags: boolean;
    includeCTA: boolean;
}
