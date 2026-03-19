export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';

// ── In-memory rate limiter (5 requests per IP per day) ─────────────────────
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 24 * 60 * 60 * 1000;

function checkRateLimit(ip: string): boolean {
    const now = Date.now();
    const entry = rateLimitMap.get(ip);
    if (!entry || now > entry.resetAt) {
        rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
        return true;
    }
    if (entry.count >= RATE_LIMIT) return false;
    entry.count++;
    return true;
}

// ── Types ──────────────────────────────────────────────────────────────────
interface PlaceResult {
    place_id: string;
    name: string;
    formatted_address: string;
    rating: number;
    user_ratings_total: number;
    photos?: { photo_reference: string }[];
    types?: string[];
    geometry?: { location: { lat: number; lng: number } };
}

interface ReviewResult {
    author_name: string;
    rating: number;
    text: string;
    time: number;
    profile_photo_url?: string;
    relative_time_description?: string;
}

interface PlaceDetails {
    name: string;
    formatted_address: string;
    rating: number;
    user_ratings_total: number;
    reviews?: ReviewResult[];
    photos?: { photo_reference: string }[];
    types?: string[];
    url?: string;
}

interface ScoreBreakdown {
    volume: number;
    quality: number;
    freshness: number;
    detail: number;
}

interface SamplePost {
    reviewText: string;
    authorName: string;
    rating: number;
    caption: string;
}

export interface ReviewScoreResponse {
    business: {
        name: string;
        address: string;
        rating: number;
        totalReviews: number;
        photoUrl: string | null;
        types: string[];
        placeId: string;
    };
    score: number;
    breakdown: ScoreBreakdown;
    percentile: number;
    samplePosts: SamplePost[];
    scoreId: string;
}

// ── Google Places helpers ─────────────────────────────────────────────────
const GOOGLE_API_KEY = () => process.env.GOOGLE_BUSINESS_API_KEY ?? '';

async function searchPlace(query: string): Promise<PlaceResult | null> {
    const url = new URL('https://maps.googleapis.com/maps/api/place/findplacefromtext/json');
    url.searchParams.set('input', query);
    url.searchParams.set('inputtype', 'textquery');
    url.searchParams.set('fields', 'place_id,name,formatted_address,rating,user_ratings_total,photos,types,geometry');
    url.searchParams.set('key', GOOGLE_API_KEY());

    const res = await fetch(url.toString());
    const data = await res.json();

    if (data.candidates && data.candidates.length > 0) {
        return data.candidates[0];
    }
    return null;
}

async function getPlaceDetails(placeId: string): Promise<PlaceDetails | null> {
    const url = new URL('https://maps.googleapis.com/maps/api/place/details/json');
    url.searchParams.set('place_id', placeId);
    url.searchParams.set('fields', 'name,formatted_address,rating,user_ratings_total,reviews,photos,types,url');
    url.searchParams.set('key', GOOGLE_API_KEY());

    const res = await fetch(url.toString());
    const data = await res.json();

    return data.result ?? null;
}

function getPhotoUrl(photoRef: string, maxWidth = 400): string {
    return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photo_reference=${photoRef}&key=${GOOGLE_API_KEY()}`;
}

// ── Score calculation ─────────────────────────────────────────────────────
function calculateScore(details: PlaceDetails): { score: number; breakdown: ScoreBreakdown } {
    const reviews = details.reviews ?? [];
    const totalReviews = details.user_ratings_total ?? reviews.length;
    const avgRating = details.rating ?? 0;

    // Volume (0-10): logarithmic scale, 100+ reviews = 10
    const volumeRaw = Math.min(10, Math.log10(Math.max(1, totalReviews)) * 4.3);
    const volume = Math.round(volumeRaw);

    // Quality (0-10): based on average rating
    const quality = Math.round(Math.min(10, (avgRating / 5) * 10));

    // Freshness (0-10): based on how recent the reviews are
    const now = Date.now() / 1000;
    let freshnessSum = 0;
    const recentReviews = reviews.slice(0, 5);
    for (const r of recentReviews) {
        const ageInDays = (now - r.time) / 86400;
        if (ageInDays <= 7) freshnessSum += 10;
        else if (ageInDays <= 30) freshnessSum += 8;
        else if (ageInDays <= 90) freshnessSum += 6;
        else if (ageInDays <= 180) freshnessSum += 4;
        else if (ageInDays <= 365) freshnessSum += 2;
        else freshnessSum += 1;
    }
    const freshness = recentReviews.length > 0
        ? Math.round(freshnessSum / recentReviews.length)
        : 3;

    // Detail (0-10): average review text length
    let detailSum = 0;
    for (const r of reviews) {
        const len = (r.text ?? '').length;
        if (len >= 200) detailSum += 10;
        else if (len >= 100) detailSum += 8;
        else if (len >= 50) detailSum += 6;
        else if (len >= 20) detailSum += 4;
        else detailSum += 2;
    }
    const detail = reviews.length > 0
        ? Math.round(detailSum / reviews.length)
        : 3;

    // Total score (0-100): weighted average
    const score = Math.round(
        volume * 2.5 +   // 25%
        quality * 3.0 +  // 30%
        freshness * 2.5 + // 25%
        detail * 2.0      // 20%
    );

    return { score: Math.min(100, Math.max(0, score)), breakdown: { volume, quality, freshness, detail } };
}

function estimatePercentile(score: number, types: string[]): number {
    // Rough estimation based on industry averages
    if (score >= 85) return 5;
    if (score >= 75) return 15;
    if (score >= 65) return 30;
    if (score >= 55) return 45;
    if (score >= 45) return 60;
    if (score >= 35) return 75;
    return 90;
}

// ── Sample post generation via OpenAI ─────────────────────────────────────
async function generateSamplePosts(
    businessName: string,
    reviews: ReviewResult[],
): Promise<SamplePost[]> {
    const topReviews = reviews
        .filter((r) => r.rating >= 4 && (r.text ?? '').length >= 20)
        .slice(0, 3);

    if (topReviews.length === 0) {
        return reviews.slice(0, 3).map((r) => ({
            reviewText: r.text || 'Great experience!',
            authorName: r.author_name,
            rating: r.rating,
            caption: `"${(r.text || 'Great experience!').slice(0, 100)}" — ${r.author_name} ⭐️ Thank you for your kind words! #${businessName.replace(/\s+/g, '')} #Reviews`,
        }));
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        return topReviews.map((r) => ({
            reviewText: r.text,
            authorName: r.author_name,
            rating: r.rating,
            caption: `"${r.text.slice(0, 120)}${r.text.length > 120 ? '…' : ''}" — ${r.author_name} ⭐️`.concat(
                `\n\nThank you for your amazing feedback! 🙏\n\n#${businessName.replace(/[^a-zA-Z0-9]/g, '')} #CustomerReviews #5Stars`,
            ),
        }));
    }

    try {
        const reviewTexts = topReviews.map((r, i) =>
            `Review ${i + 1} (${r.rating}★ by ${r.author_name}): "${r.text}"`,
        ).join('\n');

        const res = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [
                    {
                        role: 'system',
                        content: `You write engaging Instagram captions for businesses to showcase their customer reviews. Keep captions under 200 characters. Include relevant emojis and 3-4 hashtags. Be warm and authentic. Return valid JSON only.`,
                    },
                    {
                        role: 'user',
                        content: `Business: "${businessName}"\n\n${reviewTexts}\n\nGenerate an Instagram caption for each review. Return a JSON array of 3 objects: [{"caption": "..."}]`,
                    },
                ],
                temperature: 0.7,
                max_tokens: 600,
            }),
        });

        const data = await res.json();
        const content = data.choices?.[0]?.message?.content ?? '';

        const jsonMatch = content.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
            const captions = JSON.parse(jsonMatch[0]) as { caption: string }[];
            return topReviews.map((r, i) => ({
                reviewText: r.text,
                authorName: r.author_name,
                rating: r.rating,
                caption: captions[i]?.caption ?? `"${r.text.slice(0, 100)}" — ${r.author_name}`,
            }));
        }
    } catch (err) {
        console.error('[review-score] OpenAI error:', err);
    }

    return topReviews.map((r) => ({
        reviewText: r.text,
        authorName: r.author_name,
        rating: r.rating,
        caption: `"${r.text.slice(0, 120)}${r.text.length > 120 ? '…' : ''}" — ${r.author_name} ⭐️\n\nThank you! 🙏 #${businessName.replace(/[^a-zA-Z0-9]/g, '')} #Reviews`,
    }));
}

// ── Main handler ──────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
        ?? req.headers.get('x-real-ip')
        ?? 'unknown';

    if (!checkRateLimit(ip)) {
        return NextResponse.json(
            { error: 'Rate limit exceeded. You can check up to 5 businesses per day.' },
            { status: 429 },
        );
    }

    try {
        const body = await req.json() as { query?: string };
        const query = body.query?.trim();

        if (!query || query.length < 2) {
            return NextResponse.json({ error: 'Please enter a business name or Google Maps URL' }, { status: 400 });
        }

        // Extract place ID from Google Maps URL if provided
        let placeId: string | null = null;
        const placeIdMatch = query.match(/place_id[=:]([^&\s]+)/i);
        if (placeIdMatch) {
            placeId = placeIdMatch[1];
        }

        // Search for place
        let place: PlaceResult | null = null;
        if (!placeId) {
            place = await searchPlace(query);
            if (!place) {
                return NextResponse.json(
                    { error: 'Business not found. Try searching with the exact business name and city.' },
                    { status: 404 },
                );
            }
            placeId = place.place_id;
        }

        // Get place details with reviews
        const details = await getPlaceDetails(placeId);
        if (!details) {
            return NextResponse.json({ error: 'Could not fetch business details' }, { status: 404 });
        }

        const photoUrl = details.photos?.[0]?.photo_reference
            ? getPhotoUrl(details.photos[0].photo_reference)
            : null;

        const { score, breakdown } = calculateScore(details);
        const percentile = estimatePercentile(score, details.types ?? []);

        const samplePosts = await generateSamplePosts(
            details.name,
            details.reviews ?? [],
        );

        // Generate a shareable score ID (deterministic from placeId)
        const scoreId = Buffer.from(placeId).toString('base64url').slice(0, 16);

        const result: ReviewScoreResponse = {
            business: {
                name: details.name,
                address: details.formatted_address,
                rating: details.rating,
                totalReviews: details.user_ratings_total,
                photoUrl,
                types: details.types ?? [],
                placeId,
            },
            score,
            breakdown,
            percentile,
            samplePosts,
            scoreId,
        };

        return NextResponse.json(result);
    } catch (err) {
        console.error('[api/tools/review-score]', err);
        return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
    }
}
