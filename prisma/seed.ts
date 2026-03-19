import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0]);

// ─── Plan definitions ────────────────────────────────────────────────────────

const GB = BigInt(1024 * 1024 * 1024);

const PLAN_BASES = [
    {
        name: 'STARTER',
        displayName: 'Starter',
        sortOrder: 1,
        postsLimit: 30,
        reviewsLimit: 100,
        storageLimit: GB,
        platformsAllowed: ['INSTAGRAM', 'FACEBOOK'],
        templatesLimit: 2,
        prices: { USD: 19, SAR: 79, TL: 299 },
        features: {
            USD: [
                '30 posts / month',
                '1 business profile',
                'Classic + Bold templates',
                'Instagram & Facebook',
                'Email support',
            ],
            SAR: [
                '٣٠ منشوراً / شهر',
                'ملف تجاري واحد',
                'قالبا الكلاسيكي والجريء',
                'Instagram وFacebook',
                'دعم بالبريد الإلكتروني',
            ],
            TL: [
                '30 gönderi / ay',
                '1 işletme profili',
                'Klasik + Cesur şablonlar',
                'Instagram ve Facebook',
                'E-posta desteği',
            ],
        },
    },
    {
        name: 'GROWTH',
        displayName: 'Growth',
        sortOrder: 2,
        postsLimit: 150,
        reviewsLimit: 500,
        storageLimit: BigInt(5) * GB,
        platformsAllowed: ['INSTAGRAM', 'FACEBOOK', 'TWITTER'],
        templatesLimit: 3,
        prices: { USD: 39, SAR: 149, TL: 599 },
        features: {
            USD: [
                '150 posts / month',
                '3 business profiles',
                'All 3 templates',
                'Instagram, Facebook + X',
                'Priority support',
                'Weekly analytics',
            ],
            SAR: [
                '١٥٠ منشوراً / شهر',
                '٣ ملفات تجارية',
                'جميع القوالب الثلاثة',
                'Instagram وFacebook وX',
                'دعم ذو أولوية',
                'تقرير تحليلات أسبوعي',
            ],
            TL: [
                '150 gönderi / ay',
                '3 işletme profili',
                'Tüm 3 şablon',
                'Instagram, Facebook + X',
                'Öncelikli destek',
                'Haftalık analitik',
            ],
        },
    },
    {
        name: 'AGENCY',
        displayName: 'Agency',
        sortOrder: 3,
        postsLimit: 500,
        reviewsLimit: 2000,
        storageLimit: BigInt(20) * GB,
        platformsAllowed: ['INSTAGRAM', 'FACEBOOK', 'TWITTER', 'TIKTOK'],
        templatesLimit: 10,
        prices: { USD: 99, SAR: 379, TL: 1499 },
        features: {
            USD: [
                '500 posts / month',
                '10 business profiles',
                'All templates + custom',
                'All platforms',
                'Dedicated support',
                'API access',
                'White-label',
            ],
            SAR: [
                '٥٠٠ منشور / شهر',
                '١٠ ملفات تجارية',
                'جميع القوالب + مخصصة',
                'جميع المنصات',
                'دعم مخصص',
                'وصول API',
                'العلامة البيضاء',
            ],
            TL: [
                '500 gönderi / ay',
                '10 işletme profili',
                'Tüm şablonlar + özel',
                'Tüm platformlar',
                'Özel destek',
                'API erişimi',
                'White-label',
            ],
        },
    },
] as const;

type Currency = 'USD' | 'SAR' | 'TL';
const CURRENCIES: Currency[] = ['USD', 'SAR', 'TL'];
const INTERVALS = ['MONTHLY', 'YEARLY'] as const;

// ─── Seed ────────────────────────────────────────────────────────────────────

async function main() {
    console.log('🌱 Seeding plans...');

    let created = 0;
    let updated = 0;

    for (const base of PLAN_BASES) {
        for (const currency of CURRENCIES) {
            const monthlyPrice = base.prices[currency];
            // Yearly = monthly × 12 × 0.8 (20% discount), rounded to 2 decimals
            const yearlyPrice = Math.round(monthlyPrice * 12 * 0.8 * 100) / 100;

            for (const interval of INTERVALS) {
                const price = interval === 'MONTHLY' ? monthlyPrice : yearlyPrice;

                const data = {
                    name: base.name,
                    displayName: base.displayName,
                    price: price,
                    currency,
                    interval,
                    postsLimit: base.postsLimit,
                    reviewsLimit: base.reviewsLimit,
                    storageLimit: base.storageLimit,
                    platformsAllowed: [...base.platformsAllowed],
                    templatesLimit: base.templatesLimit,
                    features: [...base.features[currency]],
                    isActive: true,
                    sortOrder: base.sortOrder,
                };

                const existing = await prisma.plan.findUnique({
                    where: { name_currency_interval: { name: base.name, currency, interval } },
                });

                if (existing) {
                    await prisma.plan.update({ where: { id: existing.id }, data });
                    updated++;
                } else {
                    await prisma.plan.create({ data });
                    created++;
                }
            }
        }
    }

    console.log(`✅ Done: ${created} created, ${updated} updated (${created + updated} total plan records)`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
