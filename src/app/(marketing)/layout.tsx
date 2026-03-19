import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'ReviewPost — Turn Reviews into Social Media Posts, Automatically',
    description:
        'ReviewPost pulls your Google reviews, creates beautifully branded content, and auto-publishes to Instagram & Facebook. Free 14-day trial. No credit card required.',
    keywords: [
        'Google reviews to Instagram',
        'auto post reviews social media',
        'review marketing automation',
        'Salla social media posts',
        'restaurant review posts',
    ],
    openGraph: {
        title: 'ReviewPost — Turn Reviews into Social Media Posts',
        description:
            'Connect Google Business, auto-generate branded posts from your best reviews, and publish to Instagram & Facebook.',
        type: 'website',
        url: 'https://reviewpost.app',
        siteName: 'ReviewPost',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'ReviewPost',
        description: 'Turn reviews into social media content. Automatically.',
        site: '@reviewpost',
    },
    robots: { index: true, follow: true },
};

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
