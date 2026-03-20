import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Privacy Policy — ReviewPost',
    description:
        'How ReviewPost collects, uses, and protects your data. GDPR and Saudi PDPL compliant.',
    openGraph: {
        title: 'Privacy Policy — ReviewPost',
        description: 'How ReviewPost collects, uses, and protects your data.',
        type: 'website',
        url: 'https://reviewpost.app/privacy',
    },
    robots: { index: true, follow: true },
};

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
