import { google } from 'googleapis';
import { prisma } from '../prisma';
import { encrypt, decrypt } from '../encryption';
import {
    GoogleReview,
    GoogleLocation,
    PullResult,
    STAR_RATING_MAP,
} from './types';

// Re-export encryption for backward compatibility (billing, publishing use these)
export { encrypt, decrypt };

/** Thin typed wrapper around Google APIs that lack full typings in googleapis */
interface GmbReviewsResponse {
    reviews?: GoogleReview[];
    nextPageToken?: string;
}

interface GmbLocationsResponse {
    locations?: Array<{ name: string; title?: string; storeCode?: string; metadata?: { placeId?: string } }>;
    nextPageToken?: string;
}

interface GmbAccountsResponse {
    accounts?: Array<{ name: string; accountName: string; type: string }>;
}

// ─── Rate-limiter: sliding window, max 10 req/min ───────────

class RateLimiter {
    private timestamps: number[] = [];
    private readonly maxRequests: number;
    private readonly windowMs: number;

    constructor(maxRequests = 10, windowMs = 60_000) {
        this.maxRequests = maxRequests;
        this.windowMs = windowMs;
    }

    async throttle(): Promise<void> {
        const now = Date.now();
        this.timestamps = this.timestamps.filter((t) => now - t < this.windowMs);
        if (this.timestamps.length >= this.maxRequests) {
            const oldest = this.timestamps[0];
            const waitMs = this.windowMs - (now - oldest) + 50;
            await new Promise((r) => setTimeout(r, waitMs));
            return this.throttle();
        }
        this.timestamps.push(Date.now());
    }
}

// ─── Exponential-backoff wrapper ─────────────────────────────

async function withRetry<T>(
    fn: () => Promise<T>,
    maxAttempts = 4,
): Promise<T> {
    let attempt = 0;
    while (true) {
        try {
            return await fn();
        } catch (err: unknown) {
            attempt++;
            const status =
                err &&
                    typeof err === 'object' &&
                    'code' in err
                    ? (err as { code: number }).code
                    : (err as { status?: number })?.status;

            if (status === 429 && attempt < maxAttempts) {
                const delay = 1000 * 2 ** attempt + Math.random() * 500;
                console.warn(`[GoogleReviews] Rate-limited (429). Retry ${attempt}/${maxAttempts} in ${delay.toFixed(0)}ms`);
                await new Promise((r) => setTimeout(r, delay));
            } else {
                throw err;
            }
        }
    }
}

// ─── Service ─────────────────────────────────────────────────

export class GoogleReviewsService {
    private rateLimiter = new RateLimiter(10, 60_000);

    /** Build an OAuth2 client pre-configured from env */
    private getOAuth2Client() {
        return new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            process.env.GOOGLE_REDIRECT_URI ?? `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/google-business/callback`,
        );
    }

    /** Step 1 of OAuth: exchange auth code for tokens, then store encrypted */
    async authenticate(code: string, businessId: string): Promise<void> {
        const oauth2Client = this.getOAuth2Client();
        const { tokens } = await oauth2Client.getToken(code);

        if (!tokens.access_token) throw new Error('No access token returned');

        await prisma.oAuthToken.upsert({
            where: { businessId },
            create: {
                businessId,
                provider: 'google',
                encryptedAccessToken: encrypt(tokens.access_token),
                encryptedRefreshToken: tokens.refresh_token ? encrypt(tokens.refresh_token) : '',
                expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : new Date(Date.now() + 3600_000),
                scope: tokens.scope ?? '',
            },
            update: {
                encryptedAccessToken: encrypt(tokens.access_token),
                encryptedRefreshToken: tokens.refresh_token ? encrypt(tokens.refresh_token) : '',
                expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : new Date(Date.now() + 3600_000),
                scope: tokens.scope ?? '',
            },
        });
    }

    /** Restore an oauth2Client with stored tokens for a given businessId */
    private async getAuthClientForBusiness(businessId: string) {
        const stored = await prisma.oAuthToken.findUnique({ where: { businessId } });
        if (!stored) throw new Error(`No OAuth token found for business ${businessId}`);

        const oauth2Client = this.getOAuth2Client();
        oauth2Client.setCredentials({
            access_token: decrypt(stored.encryptedAccessToken),
            refresh_token: stored.encryptedRefreshToken ? decrypt(stored.encryptedRefreshToken) : undefined,
            expiry_date: stored.expiresAt.getTime(),
        });

        // Persist refreshed tokens automatically
        oauth2Client.on('tokens', async (tokens) => {
            await prisma.oAuthToken.update({
                where: { businessId },
                data: {
                    encryptedAccessToken: tokens.access_token ? encrypt(tokens.access_token) : stored.encryptedAccessToken,
                    encryptedRefreshToken: tokens.refresh_token ? encrypt(tokens.refresh_token) : stored.encryptedRefreshToken,
                    expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : stored.expiresAt,
                },
            });
        });

        return oauth2Client;
    }

    /** List Google My Business accounts and their locations */
    async getLocations(businessId: string, accountId?: string): Promise<GoogleLocation[]> {
        const auth = await this.getAuthClientForBusiness(businessId);
        const { token } = await auth.getAccessToken();
        if (!token) throw new Error('Could not retrieve access token for Google API');

        const headers = { Authorization: `Bearer ${token}` };

        await this.rateLimiter.throttle();

        // If no accountId, list accounts first and use the primary one
        let resolvedAccountId = accountId;
        if (!resolvedAccountId) {
            const accountsRes = await withRetry(async () => {
                const r = await fetch(
                    'https://mybusinessaccountmanagement.googleapis.com/v1/accounts',
                    { headers },
                );
                if (!r.ok) throw Object.assign(new Error(r.statusText), { status: r.status });
                return r.json() as Promise<GmbAccountsResponse>;
            });
            const accounts = accountsRes.accounts ?? [];
            if (!accounts.length) return [];
            resolvedAccountId = accounts[0].name; // e.g. "accounts/123456"
        }

        await this.rateLimiter.throttle();
        const locationsRes = await withRetry(async () => {
            const r = await fetch(
                `https://mybusinessbusinessinformation.googleapis.com/v1/${resolvedAccountId}/locations?readMask=name,title,metadata`,
                { headers },
            );
            if (!r.ok) throw Object.assign(new Error(r.statusText), { status: r.status });
            return r.json() as Promise<GmbLocationsResponse>;
        });

        const locations = locationsRes.locations ?? [];
        return locations.map((loc) => ({
            name: loc.name,
            locationName: loc.title ?? loc.storeCode ?? '',
            placeId: loc.metadata?.placeId,
        }));
    }

    /** Fetch reviews for a location with pagination, returning those newer than `since` */
    async getReviews(
        businessId: string,
        locationName: string,
        since?: Date,
    ): Promise<GoogleReview[]> {
        const auth = await this.getAuthClientForBusiness(businessId);
        const { token } = await auth.getAccessToken();
        if (!token) throw new Error('Could not retrieve access token for Google API');

        const headers = { Authorization: `Bearer ${token}` };
        const allReviews: GoogleReview[] = [];
        let pageToken: string | undefined;

        do {
            await this.rateLimiter.throttle();

            const url = new URL(
                `https://mybusiness.googleapis.com/v4/${locationName}/reviews`,
            );
            url.searchParams.set('pageSize', '50');
            if (pageToken) url.searchParams.set('pageToken', pageToken);

            const res = await withRetry(async () => {
                const r = await fetch(url.toString(), { headers });
                if (!r.ok) throw Object.assign(new Error(r.statusText), { status: r.status });
                return r.json() as Promise<GmbReviewsResponse>;
            });

            const reviews: GoogleReview[] = res.reviews ?? [];
            let reachedOld = false;

            for (const r of reviews) {
                if (since && new Date(r.createTime) <= since) {
                    reachedOld = true;
                    break;
                }
                allReviews.push(r);
            }

            if (reachedOld) break;
            pageToken = res.nextPageToken;
        } while (pageToken);

        return allReviews;
    }

    /**
     * Main entry: pull new reviews for a business, filter >= 4 stars,
     * upsert into DB, return detailed PullResult.
     */
    async pullNewReviews(businessId: string): Promise<PullResult> {
        const result: PullResult = {
            businessId,
            totalFound: 0,
            saved: 0,
            skippedDuplicate: 0,
            skippedLowRating: 0,
            errors: [],
        };

        try {
            // Find the most recent review we already have for this business
            const lastReview = await prisma.review.findFirst({
                where: { businessId, source: 'GOOGLE' },
                orderBy: { pulledAt: 'desc' },
                select: { pulledAt: true },
            });
            const since = lastReview?.pulledAt ?? undefined;

            // Resolve the locationName from Business.googlePlaceId or stored token's scope
            const business = await prisma.business.findUnique({ where: { id: businessId } });
            if (!business) throw new Error(`Business ${businessId} not found`);

            // Get locations (uses first account)
            const locations = await this.getLocations(businessId);
            if (!locations.length) {
                result.errors.push('No Google Business locations found');
                return result;
            }

            // Prefer location whose placeId matches business.googlePlaceId, else use first
            const targetLocation =
                (business.googlePlaceId
                    ? locations.find((l) => l.placeId === business.googlePlaceId)
                    : undefined) ?? locations[0];

            const reviews = await this.getReviews(businessId, targetLocation.name, since);
            result.totalFound = reviews.length;

            for (const review of reviews) {
                const rating = STAR_RATING_MAP[review.starRating] ?? 0;

                if (rating < 4) {
                    result.skippedLowRating++;
                    continue;
                }

                try {
                    await prisma.review.upsert({
                        where: {
                            source_externalId: {
                                source: 'GOOGLE',
                                externalId: review.reviewId,
                            },
                        },
                        create: {
                            businessId,
                            source: 'GOOGLE',
                            externalId: review.reviewId,
                            authorName: review.reviewer.displayName,
                            rating,
                            text: review.comment ?? null,
                            pulledAt: new Date(),
                        },
                        update: {}, // Don't overwrite existing
                    });
                    result.saved++;
                } catch (e: unknown) {
                    // Unique constraint = duplicate; ignore
                    if (
                        e &&
                        typeof e === 'object' &&
                        'code' in e &&
                        (e as { code: string }).code === 'P2002'
                    ) {
                        result.skippedDuplicate++;
                    } else {
                        result.errors.push(`Review ${review.reviewId}: ${String(e)}`);
                    }
                }
            }
        } catch (err) {
            result.errors.push(String(err));
        }

        console.log(`[GoogleReviews] businessId=${businessId} found=${result.totalFound} saved=${result.saved} skippedDupe=${result.skippedDuplicate} skippedLow=${result.skippedLowRating}`);

        return result;
    }
}
