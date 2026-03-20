import OpenAI from 'openai';
import { Language, PostPlatform } from '../../generated/prisma';
import { getSystemPrompt, buildUserPrompt, getSallaSystemPrompt, buildSallaUserPrompt } from './prompts';
import {
    CaptionOptions,
    CaptionResult,
    BusinessContext,
    ReviewContext,
    ArabicCaptionOptions,
    ArabicCaptionResult,
    SallaReviewContext,
} from './types';

// Fallback default language
const DEFAULT_LANGUAGE: Language = 'AR';
const MODEL = 'gpt-4o-mini';
const TEMPERATURE = 0.8;
const MAX_TOKENS = 300;

/** Parsed raw JSON response from GPT */
interface RawCaptionResponse {
    caption: string;
    hashtags: string[];
    emoji: string;
    cta?: string;
}

/** Parse GPT output — handles both clean JSON and JSON embedded in markdown */
function parseGPTResponse(content: string): RawCaptionResponse {
    // Strip potential markdown code fences
    const cleaned = content.replace(/```(?:json)?\n?/g, '').trim();

    try {
        const parsed = JSON.parse(cleaned) as Partial<RawCaptionResponse>;
        return {
            caption: parsed.caption ?? '',
            hashtags: Array.isArray(parsed.hashtags) ? parsed.hashtags : [],
            emoji: parsed.emoji ?? '✨',
            cta: parsed.cta,
        };
    } catch {
        return { caption: cleaned, hashtags: [], emoji: '✨' };
    }
}

/** Assemble the final post text from components */
function assembleFullText(
    caption: string,
    hashtags: string[],
    emoji: string,
    options: CaptionOptions,
): string {
    const parts: string[] = [caption];

    if (options.includeHashtags && hashtags.length > 0) {
        // Ensure each hashtag starts with #
        const formatted = hashtags.map((h) =>
            h.startsWith('#') ? h : `#${h}`,
        );
        parts.push('');
        parts.push(formatted.join(' '));
    }

    // emoji already embedded in caption by GPT, but if separate we append it
    if (emoji && !caption.includes(emoji)) {
        parts[0] = `${emoji} ${caption}`;
    }

    return parts.join('\n').trim();
}

export class CaptionGenerator {
    private openai: OpenAI;

    constructor(apiKey: string) {
        this.openai = new OpenAI({ apiKey });
    }

    async generateCaption(
        review: ReviewContext,
        business: BusinessContext,
        options: Partial<CaptionOptions> & { platform: PostPlatform },
    ): Promise<CaptionResult> {
        const resolvedOptions: CaptionOptions = {
            platform: options.platform,
            language: options.language ?? business.language ?? DEFAULT_LANGUAGE,
            includeHashtags: options.includeHashtags ?? true,
            includeCTA: options.includeCTA ?? true,
        };

        const systemPrompt = getSystemPrompt(resolvedOptions.language);
        const userPrompt = buildUserPrompt({
            review: review.text ?? '',
            author: review.authorName ?? 'عميل / Customer',
            rating: review.rating ?? 5,
            business,
            options: resolvedOptions,
        });

        const response = await this.openai.chat.completions.create({
            model: MODEL,
            temperature: TEMPERATURE,
            max_tokens: MAX_TOKENS,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
            ],
            response_format: { type: 'json_object' },
        });

        const rawContent = response.choices[0]?.message?.content ?? '{}';
        const { caption, hashtags, emoji } = parseGPTResponse(rawContent);
        const fullText = assembleFullText(caption, hashtags, emoji, resolvedOptions);

        const usage = response.usage ?? { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };

        // Log token usage for monitoring
        console.log(
            `[CaptionGenerator] model=${MODEL} platform=${resolvedOptions.platform} lang=${resolvedOptions.language} ` +
            `prompt_tokens=${usage.prompt_tokens} completion_tokens=${usage.completion_tokens} total=${usage.total_tokens}`,
        );

        return {
            caption,
            hashtags,
            emoji,
            fullText,
            tokensUsed: {
                prompt: usage.prompt_tokens,
                completion: usage.completion_tokens,
                total: usage.total_tokens,
            },
            model: MODEL,
        };
    }

    /**
     * Generate an Arabic caption optimized for Salla e-commerce stores.
     * Supports formal and colloquial tones, product context, and Arabic hashtags.
     */
    async generateArabicCaption(
        review: SallaReviewContext,
        business: BusinessContext,
        options: ArabicCaptionOptions,
    ): Promise<ArabicCaptionResult> {
        const systemPrompt = getSallaSystemPrompt(options.tone);
        const userPrompt = buildSallaUserPrompt({
            review,
            business: { ...business, language: 'AR' },
            options,
        });

        const response = await this.openai.chat.completions.create({
            model: MODEL,
            temperature: TEMPERATURE,
            max_tokens: 400,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
            ],
            response_format: { type: 'json_object' },
        });

        const rawContent = response.choices[0]?.message?.content ?? '{}';
        const { caption, hashtags, emoji, cta } = parseGPTResponse(rawContent);

        const resolvedCaptionOpts: CaptionOptions = {
            platform: options.platform,
            language: 'AR' as Language,
            includeHashtags: options.includeHashtags,
            includeCTA: options.includeCTA,
        };
        const fullText = assembleFullText(caption, hashtags, emoji, resolvedCaptionOpts);

        const usage = response.usage ?? { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };

        console.log(
            `[CaptionGenerator:Arabic] model=${MODEL} tone=${options.tone} platform=${options.platform} ` +
            `prompt_tokens=${usage.prompt_tokens} completion_tokens=${usage.completion_tokens} total=${usage.total_tokens}`,
        );

        return {
            caption,
            hashtags,
            emoji,
            fullText,
            tokensUsed: {
                prompt: usage.prompt_tokens,
                completion: usage.completion_tokens,
                total: usage.total_tokens,
            },
            model: MODEL,
            tone: options.tone,
            ctaText: cta ?? 'اطلب الآن',
        };
    }
}
