import { SallaAuth } from './auth';
import { createLogger } from '../monitoring/logger';

const log = createLogger('SallaAPI');

const BASE_URL = 'https://api.salla.dev/admin/v2';

// Rate limiter: max 5 req/sec to avoid Salla API throttling
const REQUEST_INTERVAL_MS = 200;
let lastRequestAt = 0;

async function throttle(): Promise<void> {
    const now = Date.now();
    const elapsed = now - lastRequestAt;
    if (elapsed < REQUEST_INTERVAL_MS) {
        await new Promise((r) => setTimeout(r, REQUEST_INTERVAL_MS - elapsed));
    }
    lastRequestAt = Date.now();
}

// ─── Retry with exponential backoff ──────────────────────────

async function withRetry<T>(
    fn: () => Promise<T>,
    maxAttempts = 3,
    label = 'SallaAPI',
): Promise<T> {
    let attempt = 0;
    while (true) {
        try {
            return await fn();
        } catch (err) {
            attempt++;
            const status = (err as { status?: number })?.status;

            // Retry on 429 (rate limit) or 5xx (server error)
            if (attempt < maxAttempts && (status === 429 || (status && status >= 500))) {
                const delay = 1000 * 2 ** attempt + Math.random() * 500;
                log.warn(`${label} Retry ${attempt}/${maxAttempts} in ${delay.toFixed(0)}ms (status ${status})`);
                await new Promise((r) => setTimeout(r, delay));
            } else {
                throw err;
            }
        }
    }
}

// ─── Types ──────────────────────────────────────────────────────

export interface SallaStoreInfo {
    id: number;
    name: string;
    email: string;
    avatar: string;
    plan: string;
    domain: string;
    description: string;
}

export interface SallaProduct {
    id: number;
    name: string;
    main_image?: string;
    sku?: string;
    status: string;
    price: { amount: number; currency: string };
    rating?: { average: number; count: number };
}

export interface SallaProductReview {
    id: number;
    rating: number;
    content: string;
    name: string;
    email?: string;
    created_at: string;
    product_id: number;
}

interface SallaPaginatedResponse<T> {
    status: number;
    data: T[];
    pagination?: {
        current_page: number;
        per_page: number;
        total: number;
        total_pages: number;
    };
}

interface SallaSingleResponse<T> {
    status: number;
    data: T;
}

// ─── Service ────────────────────────────────────────────────────

export class SallaAPI {
    private auth: SallaAuth;

    constructor(auth?: SallaAuth) {
        this.auth = auth ?? new SallaAuth();
    }

    private async request<T>(
        storeId: string,
        path: string,
        params?: Record<string, string>,
    ): Promise<T> {
        await throttle();

        return withRetry(async () => {
            const token = await this.auth.getAccessToken(storeId);
            const url = new URL(`${BASE_URL}${path}`);
            if (params) {
                for (const [k, v] of Object.entries(params)) {
                    url.searchParams.set(k, v);
                }
            }

            const res = await fetch(url.toString(), {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: 'application/json',
                },
            });

            if (!res.ok) {
                const body = await res.text();
                log.error('Salla API request failed', {
                    storeId,
                    path,
                    status: res.status,
                    body: body.slice(0, 500),
                });
                const err = new Error(`Salla API ${path} failed: ${res.status}`);
                (err as unknown as Record<string, unknown>).status = res.status;
                throw err;
            }

            return res.json() as Promise<T>;
        }, 3, `SallaAPI:${path}`);
    }

    async getStoreInfo(storeId: string): Promise<SallaStoreInfo> {
        const res = await this.request<SallaSingleResponse<SallaStoreInfo>>(
            storeId,
            '/store/info',
        );
        return res.data;
    }

    async getProducts(
        storeId: string,
        page = 1,
        limit = 20,
    ): Promise<{ products: SallaProduct[]; totalPages: number }> {
        const res = await this.request<SallaPaginatedResponse<SallaProduct>>(
            storeId,
            '/products',
            { page: String(page), per_page: String(limit) },
        );
        return {
            products: res.data ?? [],
            totalPages: res.pagination?.total_pages ?? 1,
        };
    }

    async getProductReviews(
        storeId: string,
        productId: number,
        page = 1,
        limit = 20,
    ): Promise<{ reviews: SallaProductReview[]; totalPages: number }> {
        const res = await this.request<SallaPaginatedResponse<SallaProductReview>>(
            storeId,
            `/products/${productId}/reviews`,
            { page: String(page), per_page: String(limit) },
        );
        return {
            reviews: (res.data ?? []).map((r) => ({ ...r, product_id: productId })),
            totalPages: res.pagination?.total_pages ?? 1,
        };
    }

    /**
     * Paginate through all products and fetch all their reviews.
     * Includes rate limiting and null guards for empty stores.
     */
    async getAllReviews(
        storeId: string,
    ): Promise<Array<SallaProductReview & { productName: string; productImage?: string }>> {
        const allReviews: Array<SallaProductReview & { productName: string; productImage?: string }> = [];

        let productPage = 1;
        let productTotalPages = 1;

        do {
            const { products, totalPages } = await this.getProducts(storeId, productPage, 50);
            productTotalPages = totalPages;

            if (!products.length) break;

            for (const product of products) {
                // Skip products with no reviews
                if (product.rating && product.rating.count === 0) continue;

                let reviewPage = 1;
                let reviewTotalPages = 1;

                do {
                    const { reviews, totalPages: rtp } = await this.getProductReviews(
                        storeId,
                        product.id,
                        reviewPage,
                        50,
                    );
                    reviewTotalPages = rtp;

                    if (!reviews.length) break;

                    for (const review of reviews) {
                        allReviews.push({
                            ...review,
                            productName: product.name,
                            productImage: product.main_image,
                        });
                    }

                    reviewPage++;
                } while (reviewPage <= reviewTotalPages);
            }

            productPage++;
        } while (productPage <= productTotalPages);

        log.info('Fetched all Salla reviews', { storeId, total: allReviews.length });
        return allReviews;
    }
}
