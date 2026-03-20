import { prisma } from '../prisma';
import { SallaAPI, SallaProduct } from './api';
import { SallaAuth } from './auth';
import { createLogger } from '../monitoring/logger';

const log = createLogger('ProductMatcher');

export interface MatchedProduct {
    id: number;
    name: string;
    image?: string;
    price?: { amount: number; currency: string };
    category?: string;
    sku?: string;
    score: number;
}

export interface EnrichedReview {
    reviewId: string;
    productName: string;
    productImageUrl: string | null;
    productPrice?: string;
    productCategory?: string;
    storeUrl?: string;
    productLink?: string;
}

export class ProductMatcher {
    private api: SallaAPI;
    private productCache: Map<string, SallaProduct[]> = new Map();

    constructor(auth?: SallaAuth) {
        this.api = new SallaAPI(auth ?? new SallaAuth());
    }

    /**
     * Find the best matching product for a review based on
     * product name, SKU, and text similarity.
     */
    matchReviewToProduct(
        review: { productId?: string | null; productName?: string | null; text?: string | null },
        products: SallaProduct[],
    ): MatchedProduct | null {
        if (!products.length) return null;

        let bestMatch: MatchedProduct | null = null;
        let bestScore = 0;

        for (const product of products) {
            let score = 0;

            if (review.productId && String(product.id) === review.productId) {
                score += 100;
            }

            if (review.productName && product.name) {
                score += this.textSimilarity(review.productName, product.name) * 50;
            }

            if (review.productName && product.sku) {
                if (review.productName.toLowerCase().includes(product.sku.toLowerCase())) {
                    score += 30;
                }
            }

            if (review.text && product.name) {
                const nameWords = product.name.toLowerCase().split(/\s+/);
                const reviewText = (review.text ?? '').toLowerCase();
                const matchedWords = nameWords.filter((w) => w.length > 2 && reviewText.includes(w));
                score += (matchedWords.length / Math.max(nameWords.length, 1)) * 20;
            }

            if (score > bestScore) {
                bestScore = score;
                bestMatch = {
                    id: product.id,
                    name: product.name,
                    image: product.main_image,
                    price: product.price,
                    sku: product.sku,
                    score,
                };
            }
        }

        if (bestMatch && bestMatch.score < 5) return null;

        return bestMatch;
    }

    /**
     * Fetch the main product image from Salla API by product ID.
     */
    async getProductImage(storeId: string, productId: number): Promise<string | null> {
        const products = await this.getCachedProducts(storeId);
        const product = products.find((p) => p.id === productId);
        return product?.main_image ?? null;
    }

    /**
     * Enrich a review with full product data: name, image, price, link.
     */
    async enrichReviewWithProduct(
        reviewId: string,
        storeId: string,
    ): Promise<EnrichedReview | null> {
        const review = await prisma.review.findUnique({
            where: { id: reviewId },
            select: {
                id: true,
                productId: true,
                productName: true,
                productImageUrl: true,
                text: true,
                sallaStoreId: true,
            },
        });

        if (!review) return null;

        const store = await prisma.sallaStore.findUnique({
            where: { id: storeId },
            select: { storeUrl: true },
        });

        const products = await this.getCachedProducts(storeId);
        const matched = this.matchReviewToProduct(review, products);

        if (!matched) {
            return {
                reviewId: review.id,
                productName: review.productName ?? '',
                productImageUrl: review.productImageUrl,
                storeUrl: store?.storeUrl ?? undefined,
            };
        }

        const productLink = store?.storeUrl
            ? `${store.storeUrl.replace(/\/$/, '')}/product/${matched.id}`
            : undefined;

        const productPrice = matched.price
            ? `${matched.price.amount} ${matched.price.currency}`
            : undefined;

        if (matched.image && matched.image !== review.productImageUrl) {
            await prisma.review.update({
                where: { id: reviewId },
                data: {
                    productName: matched.name,
                    productImageUrl: matched.image,
                },
            });
        }

        return {
            reviewId: review.id,
            productName: matched.name,
            productImageUrl: matched.image ?? review.productImageUrl,
            productPrice,
            storeUrl: store?.storeUrl ?? undefined,
            productLink,
        };
    }

    /**
     * Enrich all reviews for a store in batch (called after sync).
     */
    async enrichAllReviews(storeId: string): Promise<number> {
        const reviews = await prisma.review.findMany({
            where: { sallaStoreId: storeId, source: 'SALLA' },
            select: { id: true, productId: true, productName: true, productImageUrl: true, text: true },
        });

        const products = await this.getCachedProducts(storeId);
        let enriched = 0;

        for (const review of reviews) {
            const matched = this.matchReviewToProduct(review, products);
            if (!matched) continue;

            const needsUpdate =
                !review.productImageUrl ||
                review.productImageUrl !== matched.image ||
                review.productName !== matched.name;

            if (needsUpdate) {
                await prisma.review.update({
                    where: { id: review.id },
                    data: {
                        productName: matched.name,
                        productImageUrl: matched.image ?? review.productImageUrl,
                    },
                });
                enriched++;
            }
        }

        log.info('Product matching completed', { storeId, total: reviews.length, enriched });
        return enriched;
    }

    private async getCachedProducts(storeId: string): Promise<SallaProduct[]> {
        if (this.productCache.has(storeId)) {
            return this.productCache.get(storeId)!;
        }

        const allProducts: SallaProduct[] = [];
        let page = 1;
        let totalPages = 1;

        do {
            const { products, totalPages: tp } = await this.api.getProducts(storeId, page, 50);
            totalPages = tp;
            allProducts.push(...products);
            page++;
        } while (page <= totalPages);

        this.productCache.set(storeId, allProducts);
        return allProducts;
    }

    /**
     * Simple word-overlap similarity for Arabic + English text.
     * Normalized to 0–1 range.
     */
    private textSimilarity(a: string, b: string): number {
        const normalize = (s: string) =>
            s.toLowerCase()
                .replace(/[.,!?;:'"()[\]{}<>@#$%^&*+=~`|/\\-]/g, '')
                .split(/\s+/)
                .filter((w) => w.length > 1);

        const wordsA = normalize(a);
        const wordsB = new Set(normalize(b));

        if (!wordsA.length || !wordsB.size) return 0;

        const matches = wordsA.filter((w) => wordsB.has(w)).length;
        return matches / Math.max(wordsA.length, wordsB.size);
    }
}
