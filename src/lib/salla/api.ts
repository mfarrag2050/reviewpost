import { SallaAuth } from './auth';
import { createLogger } from '../monitoring/logger';

const log = createLogger('SallaAPI');

const BASE_URL = 'https://api.salla.dev/admin/v2';

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
            throw new Error(`Salla API ${path} failed: ${res.status}`);
        }

        return res.json() as Promise<T>;
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
            products: res.data,
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
            reviews: res.data.map((r) => ({ ...r, product_id: productId })),
            totalPages: res.pagination?.total_pages ?? 1,
        };
    }

    /**
     * Paginate through all products and fetch all their reviews.
     * Returns a flat array of reviews enriched with product metadata.
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

            for (const product of products) {
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
