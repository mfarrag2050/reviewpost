import { prisma } from '../prisma';
import { SallaAPI, SallaProductReview } from './api';
import { SallaAuth } from './auth';
import { ProductMatcher } from './product-matcher';
import { createLogger } from '../monitoring/logger';

const log = createLogger('SallaSync');

export interface SyncResult {
    storeId: string;
    totalFound: number;
    saved: number;
    skippedDuplicate: number;
    skippedOld: number;
    enriched: number;
    errors: string[];
}

export class SallaSync {
    private api: SallaAPI;
    private matcher: ProductMatcher;

    constructor(auth?: SallaAuth) {
        const sallaAuth = auth ?? new SallaAuth();
        this.api = new SallaAPI(sallaAuth);
        this.matcher = new ProductMatcher(sallaAuth);
    }

    async syncReviews(storeId: string): Promise<SyncResult> {
        const result: SyncResult = {
            storeId,
            totalFound: 0,
            saved: 0,
            skippedDuplicate: 0,
            skippedOld: 0,
            enriched: 0,
            errors: [],
        };

        try {
            const store = await prisma.sallaStore.findUnique({ where: { id: storeId } });
            if (!store) throw new Error(`SallaStore ${storeId} not found`);
            if (!store.isActive) throw new Error(`SallaStore ${storeId} is deactivated`);

            const lastSyncAt = store.lastSyncAt;
            const allReviews = await this.api.getAllReviews(storeId);
            result.totalFound = allReviews.length;

            for (const review of allReviews) {
                const reviewDate = new Date(review.created_at);

                if (lastSyncAt && reviewDate <= lastSyncAt) {
                    result.skippedOld++;
                    continue;
                }

                try {
                    await this.upsertReview(store.id, review);
                    result.saved++;
                } catch (e: unknown) {
                    if (
                        e &&
                        typeof e === 'object' &&
                        'code' in e &&
                        (e as { code: string }).code === 'P2002'
                    ) {
                        result.skippedDuplicate++;
                    } else {
                        result.errors.push(`Review ${review.id}: ${String(e)}`);
                    }
                }
            }

            if (result.saved > 0) {
                try {
                    result.enriched = await this.matcher.enrichAllReviews(storeId);
                } catch (enrichErr) {
                    log.warn('Product matching failed (non-fatal)', { storeId, error: String(enrichErr) });
                }
            }

            await prisma.sallaStore.update({
                where: { id: storeId },
                data: { lastSyncAt: new Date() },
            });

            log.info('Sync completed', {
                storeId,
                totalFound: result.totalFound,
                saved: result.saved,
                enriched: result.enriched,
                skippedDupe: result.skippedDuplicate,
                skippedOld: result.skippedOld,
            });
        } catch (err) {
            result.errors.push(String(err));
            log.error('Sync failed', { storeId }, err);
        }

        return result;
    }

    /**
     * Save a single review from a real-time webhook (product.rating.created).
     * Looks up the store by merchantId, finds product info, and upserts.
     */
    async saveSingleReview(
        merchantId: string,
        reviewData: {
            id: number;
            rating: number;
            content: string;
            name: string;
            product_id: number;
            product_name?: string;
            product_image?: string;
            created_at: string;
        },
    ): Promise<void> {
        const store = await prisma.sallaStore.findUnique({
            where: { merchantId: String(merchantId) },
        });
        if (!store || !store.isActive) {
            log.warn('Ignoring review for unknown/inactive merchant', { merchantId });
            return;
        }

        const enriched: SallaProductReview & { productName: string; productImage?: string } = {
            id: reviewData.id,
            rating: reviewData.rating,
            content: reviewData.content,
            name: reviewData.name,
            product_id: reviewData.product_id,
            created_at: reviewData.created_at,
            productName: reviewData.product_name ?? `Product ${reviewData.product_id}`,
            productImage: reviewData.product_image,
        };

        await this.upsertReview(store.id, enriched);
        log.info('Real-time review saved', { merchantId, reviewId: reviewData.id });
    }

    private async upsertReview(
        sallaStoreId: string,
        review: SallaProductReview & { productName: string; productImage?: string },
    ): Promise<void> {
        const store = await prisma.sallaStore.findUnique({
            where: { id: sallaStoreId },
            select: { userId: true },
        });
        if (!store) throw new Error(`SallaStore ${sallaStoreId} not found`);

        const business = await prisma.business.findFirst({
            where: { userId: store.userId, platform: 'SALLA' },
            select: { id: true },
        });

        if (!business) {
            const newBusiness = await prisma.business.create({
                data: {
                    userId: store.userId,
                    name: review.productName,
                    platform: 'SALLA',
                    type: 'STORE',
                },
            });
            await this.createReview(newBusiness.id, sallaStoreId, review);
            return;
        }

        await this.createReview(business.id, sallaStoreId, review);
    }

    private async createReview(
        businessId: string,
        sallaStoreId: string,
        review: SallaProductReview & { productName: string; productImage?: string },
    ): Promise<void> {
        const externalId = `salla_${review.id}`;

        await prisma.review.upsert({
            where: {
                source_externalId: {
                    source: 'SALLA',
                    externalId,
                },
            },
            create: {
                businessId,
                sallaStoreId,
                source: 'SALLA',
                externalId,
                authorName: review.name,
                rating: review.rating,
                text: review.content || null,
                productId: String(review.product_id),
                productName: review.productName,
                productImageUrl: review.productImage ?? null,
                pulledAt: new Date(),
            },
            update: {},
        });
    }
}
