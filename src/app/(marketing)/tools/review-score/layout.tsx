import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Free Review Social Score Calculator — ReviewPost',
    description:
        'Calculate your Google Reviews Social Score for free. See how your reviews perform as social media content, get a breakdown, and preview sample Instagram posts from your real reviews.',
    keywords: [
        'review social score',
        'google reviews score calculator',
        'review marketing score',
        'social media review posts',
        'instagram review posts',
        'free review tool',
        'review audit tool',
    ],
    openGraph: {
        title: 'Free Review Social Score Calculator',
        description:
            'Discover how well your Google reviews perform as social media content. Get your score, breakdown, and sample Instagram posts — free, no signup.',
        type: 'website',
        url: 'https://reviewpost.app/tools/review-score',
        siteName: 'ReviewPost',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Free Review Social Score Calculator — ReviewPost',
        description:
            'Calculate your review social score for free. See sample Instagram posts from your Google reviews.',
    },
    robots: { index: true, follow: true },
    alternates: {
        canonical: 'https://reviewpost.app/tools/review-score',
    },
};

export default function ReviewScoreLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
