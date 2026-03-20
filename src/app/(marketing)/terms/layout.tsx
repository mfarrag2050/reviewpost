import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Terms of Service — ReviewPost',
    description:
        'Terms and conditions governing the use of ReviewPost platform for automated social media content generation.',
    openGraph: {
        title: 'Terms of Service — ReviewPost',
        description: 'Terms and conditions for using ReviewPost.',
        type: 'website',
        url: 'https://reviewpost.app/terms',
    },
    robots: { index: true, follow: true },
};

export default function TermsLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
