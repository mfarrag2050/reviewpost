'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

type Lang = 'EN' | 'AR' | 'TR';

const LANGS: { code: Lang; flag: string; label: string }[] = [
    { code: 'EN', flag: '\u{1F1EC}\u{1F1E7}', label: 'EN' },
    { code: 'AR', flag: '\u{1F1F8}\u{1F1E6}', label: 'AR' },
    { code: 'TR', flag: '\u{1F1F9}\u{1F1F7}', label: 'TR' },
];

const LAST_UPDATED = '2026-03-20';

interface Section {
    title: string;
    content: string[];
}

interface Content {
    title: string;
    lastUpdated: string;
    intro: string;
    sections: Section[];
    contact: { title: string; text: string };
}

const CONTENT: Record<Lang, Content> = {
    EN: {
        title: 'Privacy Policy',
        lastUpdated: `Last updated: ${LAST_UPDATED}`,
        intro: 'ReviewPost ("we", "our", or "us") is operated by PrimeFlow Solutions. This Privacy Policy explains how we collect, use, store, and protect your personal data when you use our platform at reviewpost.app.',
        sections: [
            {
                title: '1. Data We Collect',
                content: [
                    'Account Information: Email address, name, and password hash when you create an account.',
                    'Business Data: Business name, logo, brand colors, Google Place ID, and social media account connections.',
                    'Store Data (Salla/Shopify): Store name, merchant ID, product catalog, and customer reviews pulled via authorized API access.',
                    'Review Content: Customer reviews including reviewer name, rating, review text, product name, and product images.',
                    'Usage Data: Posts generated, posts published, feature usage, and session analytics.',
                    'Payment Data: Processed securely by Stripe and Moyasar. We do not store full credit card numbers.',
                ],
            },
            {
                title: '2. How We Use Your Data',
                content: [
                    'Generate AI-powered social media captions from your customer reviews using OpenAI GPT-4o-mini.',
                    'Create branded image posts using your business logo, colors, and review content.',
                    'Publish content to your connected Instagram, Facebook, and X (Twitter) accounts via Meta and X APIs.',
                    'Track usage to enforce fair-use limits per your subscription plan.',
                    'Send transactional emails (welcome, usage alerts, payment receipts) via Resend.',
                    'Improve our services through anonymized, aggregated analytics.',
                ],
            },
            {
                title: '3. Data Storage & Security',
                content: [
                    'All data is stored in PostgreSQL databases hosted on secure European/MENA infrastructure.',
                    'OAuth tokens and API keys are encrypted at rest using AES-256-GCM encryption.',
                    'All data in transit is encrypted via TLS 1.3.',
                    'Access to production systems is restricted to authorized personnel only.',
                    'We perform regular security audits and follow OWASP security best practices.',
                ],
            },
            {
                title: '4. Third-Party Services',
                content: [
                    'OpenAI (GPT-4o-mini): Processes review text to generate social media captions. Review text is sent to OpenAI API but not used to train their models (per our API agreement).',
                    'Meta (Facebook/Instagram): Receives generated posts for publishing to your connected accounts.',
                    'Google Business Profile API: Reads your business reviews with your explicit OAuth authorization.',
                    'Salla API: Accesses your store data and product reviews with your explicit authorization.',
                    'Stripe & Moyasar: Process subscription payments securely. PCI-DSS compliant.',
                    'Resend: Delivers transactional emails on our behalf.',
                ],
            },
            {
                title: '5. Data Retention',
                content: [
                    'Your account data is retained while your account is active.',
                    'Upon account cancellation, all your personal data, business data, reviews, and generated content are permanently deleted within 30 days.',
                    'OAuth tokens are immediately revoked upon disconnection or account cancellation.',
                    'Anonymized, aggregated usage statistics may be retained for analytics purposes.',
                ],
            },
            {
                title: '6. Your Rights (GDPR & Saudi PDPL)',
                content: [
                    'We comply with the EU General Data Protection Regulation (GDPR) and the Saudi Personal Data Protection Law (PDPL - \u0646\u0638\u0627\u0645 \u062D\u0645\u0627\u064A\u0629 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0634\u062E\u0635\u064A\u0629). You have the right to:',
                    'Access: Request a copy of all personal data we hold about you.',
                    'Rectification: Request correction of inaccurate data.',
                    'Erasure: Request deletion of your data ("right to be forgotten").',
                    'Portability: Request your data in a machine-readable format.',
                    'Objection: Object to processing of your data for specific purposes.',
                    'Withdrawal: Withdraw consent at any time by disconnecting services or cancelling your account.',
                    'To exercise any of these rights, contact us at the email below.',
                ],
            },
            {
                title: '7. Cookies',
                content: [
                    'We use essential cookies for authentication and session management.',
                    'We use localStorage to remember your language preference.',
                    'We do not use third-party tracking cookies or advertising cookies.',
                ],
            },
            {
                title: '8. Children\'s Privacy',
                content: [
                    'ReviewPost is not intended for use by individuals under 18 years of age. We do not knowingly collect personal data from children.',
                ],
            },
            {
                title: '9. Changes to This Policy',
                content: [
                    'We may update this Privacy Policy from time to time. We will notify you of significant changes via email or an in-app notification. Continued use of the service after changes constitutes acceptance.',
                ],
            },
        ],
        contact: {
            title: '10. Contact Us',
            text: 'If you have questions about this Privacy Policy or wish to exercise your data rights, contact us at:',
        },
    },
    AR: {
        title: '\u0633\u064A\u0627\u0633\u0629 \u0627\u0644\u062E\u0635\u0648\u0635\u064A\u0629',
        lastUpdated: `\u0622\u062E\u0631 \u062A\u062D\u062F\u064A\u062B: ${LAST_UPDATED}`,
        intro: '\u064A\u064F\u062F\u0627\u0631 ReviewPost ("\u0646\u062D\u0646"، "\u0644\u0646\u0627"، "\u062E\u062F\u0645\u062A\u0646\u0627") \u0645\u0646 \u0642\u0628\u0644 PrimeFlow Solutions. \u062A\u0648\u0636\u062D \u0633\u064A\u0627\u0633\u0629 \u0627\u0644\u062E\u0635\u0648\u0635\u064A\u0629 \u0647\u0630\u0647 \u0643\u064A\u0641 \u0646\u062C\u0645\u0639 \u0648\u0646\u0633\u062A\u062E\u062F\u0645 \u0648\u0646\u062E\u0632\u0651\u0646 \u0648\u0646\u062D\u0645\u064A \u0628\u064A\u0627\u0646\u0627\u062A\u0643 \u0627\u0644\u0634\u062E\u0635\u064A\u0629 \u0639\u0646\u062F \u0627\u0633\u062A\u062E\u062F\u0627\u0645\u0643 \u0644\u0645\u0646\u0635\u062A\u0646\u0627 \u0639\u0628\u0631 reviewpost.app.',
        sections: [
            {
                title: '\u0661. \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u062A\u064A \u0646\u062C\u0645\u0639\u0647\u0627',
                content: [
                    '\u0645\u0639\u0644\u0648\u0645\u0627\u062A \u0627\u0644\u062D\u0633\u0627\u0628: \u0627\u0644\u0628\u0631\u064A\u062F \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A\u060C \u0627\u0644\u0627\u0633\u0645\u060C \u0648\u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u0627\u0644\u0645\u064F\u0634\u0641\u0651\u0631\u0629 \u0639\u0646\u062F \u0625\u0646\u0634\u0627\u0621 \u062D\u0633\u0627\u0628.',
                    '\u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0646\u0634\u0627\u0637 \u0627\u0644\u062A\u062C\u0627\u0631\u064A: \u0627\u0633\u0645 \u0627\u0644\u0645\u062A\u062C\u0631\u060C \u0627\u0644\u0634\u0639\u0627\u0631\u060C \u0623\u0644\u0648\u0627\u0646 \u0627\u0644\u0639\u0644\u0627\u0645\u0629 \u0627\u0644\u062A\u062C\u0627\u0631\u064A\u0629\u060C \u0645\u0639\u0631\u0651\u0641 Google Place\u060C \u0648\u0631\u0628\u0637 \u062D\u0633\u0627\u0628\u0627\u062A \u0627\u0644\u062A\u0648\u0627\u0635\u0644 \u0627\u0644\u0627\u062C\u062A\u0645\u0627\u0639\u064A.',
                    '\u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0645\u062A\u062C\u0631 (\u0633\u0644\u0629/Shopify): \u0627\u0633\u0645 \u0627\u0644\u0645\u062A\u062C\u0631\u060C \u0645\u0639\u0631\u0651\u0641 \u0627\u0644\u062A\u0627\u062C\u0631\u060C \u0643\u062A\u0627\u0644\u0648\u062C \u0627\u0644\u0645\u0646\u062A\u062C\u0627\u062A\u060C \u0648\u062A\u0642\u064A\u064A\u0645\u0627\u062A \u0627\u0644\u0639\u0645\u0644\u0627\u0621 \u0639\u0628\u0631 API \u0627\u0644\u0645\u064F\u0635\u0631\u0651\u062D \u0628\u0647.',
                    '\u0645\u062D\u062A\u0648\u0649 \u0627\u0644\u062A\u0642\u064A\u064A\u0645\u0627\u062A: \u062A\u0642\u064A\u064A\u0645\u0627\u062A \u0627\u0644\u0639\u0645\u0644\u0627\u0621 \u0628\u0645\u0627 \u0641\u064A\u0647\u0627 \u0627\u0633\u0645 \u0627\u0644\u0645\u064F\u0642\u064A\u0651\u0645\u060C \u0627\u0644\u062A\u0642\u064A\u064A\u0645\u060C \u0646\u0635 \u0627\u0644\u0645\u0631\u0627\u062C\u0639\u0629\u060C \u0627\u0633\u0645 \u0627\u0644\u0645\u0646\u062A\u062C\u060C \u0648\u0635\u0648\u0631 \u0627\u0644\u0645\u0646\u062A\u062C.',
                    '\u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0627\u0633\u062A\u062E\u062F\u0627\u0645: \u0627\u0644\u0645\u0646\u0634\u0648\u0631\u0627\u062A \u0627\u0644\u0645\u064F\u0646\u0634\u0623\u0629\u060C \u0627\u0644\u0645\u0646\u0634\u0648\u0631\u0627\u062A \u0627\u0644\u0645\u0646\u0634\u0648\u0631\u0629\u060C \u0648\u0625\u062D\u0635\u0627\u0626\u064A\u0627\u062A \u0627\u0644\u062C\u0644\u0633\u0627\u062A.',
                    '\u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u062F\u0641\u0639: \u062A\u062A\u0645 \u0645\u0639\u0627\u0644\u062C\u062A\u0647\u0627 \u0628\u0623\u0645\u0627\u0646 \u0639\u0628\u0631 Stripe \u0648Moyasar. \u0644\u0627 \u0646\u062E\u0632\u0651\u0646 \u0623\u0631\u0642\u0627\u0645 \u0628\u0637\u0627\u0642\u0627\u062A \u0627\u0644\u0627\u0626\u062A\u0645\u0627\u0646 \u0627\u0644\u0643\u0627\u0645\u0644\u0629.',
                ],
            },
            {
                title: '\u0662. \u0643\u064A\u0641 \u0646\u0633\u062A\u062E\u062F\u0645 \u0628\u064A\u0627\u0646\u0627\u062A\u0643',
                content: [
                    '\u0625\u0646\u0634\u0627\u0621 \u062A\u0639\u0644\u064A\u0642\u0627\u062A \u0633\u0648\u0634\u064A\u0627\u0644 \u0645\u064A\u062F\u064A\u0627 \u0628\u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064A \u0645\u0646 \u062A\u0642\u064A\u064A\u0645\u0627\u062A \u0639\u0645\u0644\u0627\u0626\u0643 \u0628\u0627\u0633\u062A\u062E\u062F\u0627\u0645 OpenAI GPT-4o-mini.',
                    '\u062A\u0635\u0645\u064A\u0645 \u0635\u0648\u0631 \u0645\u0646\u0634\u0648\u0631\u0627\u062A \u0628\u0647\u0648\u064A\u062A\u0643 \u0627\u0644\u0628\u0635\u0631\u064A\u0629 \u0628\u0627\u0633\u062A\u062E\u062F\u0627\u0645 \u0634\u0639\u0627\u0631\u0643 \u0648\u0623\u0644\u0648\u0627\u0646\u0643 \u0648\u0645\u062D\u062A\u0648\u0649 \u0627\u0644\u062A\u0642\u064A\u064A\u0645.',
                    '\u0646\u0634\u0631 \u0627\u0644\u0645\u062D\u062A\u0648\u0649 \u0639\u0644\u0649 \u062D\u0633\u0627\u0628\u0627\u062A\u0643 \u0627\u0644\u0645\u062A\u0635\u0644\u0629 \u0639\u0628\u0631 Instagram \u0648Facebook \u0648X.',
                    '\u062A\u062A\u0628\u0639 \u0627\u0644\u0627\u0633\u062A\u062E\u062F\u0627\u0645 \u0644\u062A\u0637\u0628\u064A\u0642 \u062D\u062F\u0648\u062F \u0627\u0644\u0627\u0633\u062A\u062E\u062F\u0627\u0645 \u0627\u0644\u0639\u0627\u062F\u0644 \u062D\u0633\u0628 \u062E\u0637\u062A\u0643.',
                    '\u0625\u0631\u0633\u0627\u0644 \u0631\u0633\u0627\u0626\u0644 \u0628\u0631\u064A\u062F \u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A \u062A\u062A\u0639\u0644\u0642 \u0628\u0627\u0644\u0645\u0639\u0627\u0645\u0644\u0627\u062A (\u062A\u0631\u062D\u064A\u0628\u060C \u062A\u0646\u0628\u064A\u0647\u0627\u062A \u0627\u0633\u062A\u062E\u062F\u0627\u0645\u060C \u0625\u064A\u0635\u0627\u0644\u0627\u062A \u062F\u0641\u0639).',
                    '\u062A\u062D\u0633\u064A\u0646 \u062E\u062F\u0645\u0627\u062A\u0646\u0627 \u0645\u0646 \u062E\u0644\u0627\u0644 \u0625\u062D\u0635\u0627\u0626\u064A\u0627\u062A \u0645\u062C\u0645\u0651\u0639\u0629 \u0648\u0645\u062C\u0647\u0648\u0644\u0629 \u0627\u0644\u0647\u0648\u064A\u0629.',
                ],
            },
            {
                title: '\u0663. \u062A\u062E\u0632\u064A\u0646 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A \u0648\u0627\u0644\u0623\u0645\u0627\u0646',
                content: [
                    '\u062C\u0645\u064A\u0639 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A \u0645\u062E\u0632\u0651\u0646\u0629 \u0641\u064A \u0642\u0648\u0627\u0639\u062F \u0628\u064A\u0627\u0646\u0627\u062A PostgreSQL \u0639\u0644\u0649 \u0628\u0646\u064A\u0629 \u062A\u062D\u062A\u064A\u0629 \u0622\u0645\u0646\u0629.',
                    '\u0631\u0645\u0648\u0632 OAuth \u0648\u0645\u0641\u0627\u062A\u064A\u062D API \u0645\u0634\u0641\u0651\u0631\u0629 \u0628\u062A\u0634\u0641\u064A\u0631 AES-256-GCM.',
                    '\u062C\u0645\u064A\u0639 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A \u0623\u062B\u0646\u0627\u0621 \u0627\u0644\u0646\u0642\u0644 \u0645\u0634\u0641\u0651\u0631\u0629 \u0639\u0628\u0631 TLS 1.3.',
                    '\u0627\u0644\u0648\u0635\u0648\u0644 \u0625\u0644\u0649 \u0623\u0646\u0638\u0645\u0629 \u0627\u0644\u0625\u0646\u062A\u0627\u062C \u0645\u0642\u064A\u0651\u062F \u0644\u0644\u0645\u0648\u0638\u0641\u064A\u0646 \u0627\u0644\u0645\u0635\u0631\u0651\u062D \u0644\u0647\u0645 \u0641\u0642\u0637.',
                    '\u0646\u062C\u0631\u064A \u062A\u062F\u0642\u064A\u0642\u0627\u062A \u0623\u0645\u0646\u064A\u0629 \u0645\u0646\u062A\u0638\u0645\u0629 \u0648\u0646\u062A\u0628\u0639 \u0623\u0641\u0636\u0644 \u0645\u0645\u0627\u0631\u0633\u0627\u062A OWASP.',
                ],
            },
            {
                title: '\u0664. \u0627\u0644\u062E\u062F\u0645\u0627\u062A \u0627\u0644\u062E\u0627\u0631\u062C\u064A\u0629',
                content: [
                    'OpenAI (GPT-4o-mini): \u064A\u0639\u0627\u0644\u062C \u0646\u0635 \u0627\u0644\u062A\u0642\u064A\u064A\u0645 \u0644\u0625\u0646\u0634\u0627\u0621 \u062A\u0639\u0644\u064A\u0642\u0627\u062A. \u0627\u0644\u0646\u0635 \u0644\u0627 \u064A\u064F\u0633\u062A\u062E\u062F\u0645 \u0644\u062A\u062F\u0631\u064A\u0628 \u0646\u0645\u0627\u0630\u062C\u0647\u0645.',
                    'Meta (Facebook/Instagram): \u064A\u0633\u062A\u0642\u0628\u0644 \u0627\u0644\u0645\u0646\u0634\u0648\u0631\u0627\u062A \u0644\u0646\u0634\u0631\u0647\u0627 \u0639\u0644\u0649 \u062D\u0633\u0627\u0628\u0627\u062A\u0643.',
                    'Google Business Profile API: \u064A\u0642\u0631\u0623 \u062A\u0642\u064A\u064A\u0645\u0627\u062A\u0643 \u0628\u062A\u0635\u0631\u064A\u062D OAuth \u0627\u0644\u0635\u0631\u064A\u062D.',
                    'Salla API: \u064A\u0635\u0644 \u0625\u0644\u0649 \u0628\u064A\u0627\u0646\u0627\u062A \u0645\u062A\u062C\u0631\u0643 \u0648\u062A\u0642\u064A\u064A\u0645\u0627\u062A \u0627\u0644\u0645\u0646\u062A\u062C\u0627\u062A \u0628\u062A\u0635\u0631\u064A\u062D\u0643.',
                    'Stripe \u0648Moyasar: \u064A\u0639\u0627\u0644\u062C\u0627\u0646 \u0627\u0644\u0645\u062F\u0641\u0648\u0639\u0627\u062A \u0628\u0623\u0645\u0627\u0646. \u0645\u062A\u0648\u0627\u0641\u0642\u0627\u0646 \u0645\u0639 PCI-DSS.',
                    'Resend: \u064A\u0631\u0633\u0644 \u0631\u0633\u0627\u0626\u0644 \u0627\u0644\u0628\u0631\u064A\u062F \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A \u0646\u064A\u0627\u0628\u0629\u064B \u0639\u0646\u0627.',
                ],
            },
            {
                title: '\u0665. \u0627\u0644\u0627\u062D\u062A\u0641\u0627\u0638 \u0628\u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A',
                content: [
                    '\u0646\u062D\u062A\u0641\u0638 \u0628\u0628\u064A\u0627\u0646\u0627\u062A \u062D\u0633\u0627\u0628\u0643 \u0637\u0627\u0644\u0645\u0627 \u062D\u0633\u0627\u0628\u0643 \u0646\u0634\u0637.',
                    '\u0639\u0646\u062F \u0625\u0644\u063A\u0627\u0621 \u0627\u0644\u062D\u0633\u0627\u0628\u060C \u062A\u064F\u062D\u0630\u0641 \u062C\u0645\u064A\u0639 \u0628\u064A\u0627\u0646\u0627\u062A\u0643 \u0646\u0647\u0627\u0626\u064A\u0627\u064B \u062E\u0644\u0627\u0644 30 \u064A\u0648\u0645\u0627\u064B.',
                    '\u062A\u064F\u0644\u063A\u0649 \u0631\u0645\u0648\u0632 OAuth \u0641\u0648\u0631\u0627\u064B \u0639\u0646\u062F \u0641\u0635\u0644 \u0627\u0644\u062E\u062F\u0645\u0629 \u0623\u0648 \u0625\u0644\u063A\u0627\u0621 \u0627\u0644\u062D\u0633\u0627\u0628.',
                    '\u0642\u062F \u0646\u062D\u062A\u0641\u0638 \u0628\u0625\u062D\u0635\u0627\u0626\u064A\u0627\u062A \u0627\u0633\u062A\u062E\u062F\u0627\u0645 \u0645\u062C\u0647\u0648\u0644\u0629 \u0648\u0645\u062C\u0645\u0651\u0639\u0629 \u0644\u0623\u063A\u0631\u0627\u0636 \u0627\u0644\u062A\u062D\u0644\u064A\u0644.',
                ],
            },
            {
                title: '\u0666. \u062D\u0642\u0648\u0642\u0643 (GDPR \u0648\u0646\u0638\u0627\u0645 \u062D\u0645\u0627\u064A\u0629 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0634\u062E\u0635\u064A\u0629 \u0627\u0644\u0633\u0639\u0648\u062F\u064A)',
                content: [
                    '\u0646\u0645\u062A\u062B\u0644 \u0644\u0644\u0627\u0626\u062D\u0629 \u0627\u0644\u0639\u0627\u0645\u0629 \u0644\u062D\u0645\u0627\u064A\u0629 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A (GDPR) \u0648\u0646\u0638\u0627\u0645 \u062D\u0645\u0627\u064A\u0629 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0634\u062E\u0635\u064A\u0629 \u0627\u0644\u0633\u0639\u0648\u062F\u064A (PDPL). \u0644\u0643 \u0627\u0644\u062D\u0642 \u0641\u064A:',
                    '\u0627\u0644\u0648\u0635\u0648\u0644: \u0637\u0644\u0628 \u0646\u0633\u062E\u0629 \u0645\u0646 \u062C\u0645\u064A\u0639 \u0628\u064A\u0627\u0646\u0627\u062A\u0643 \u0627\u0644\u0634\u062E\u0635\u064A\u0629.',
                    '\u0627\u0644\u062A\u0635\u062D\u064A\u062D: \u0637\u0644\u0628 \u062A\u0635\u062D\u064A\u062D \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A \u063A\u064A\u0631 \u0627\u0644\u062F\u0642\u064A\u0642\u0629.',
                    '\u0627\u0644\u062D\u0630\u0641: \u0637\u0644\u0628 \u062D\u0630\u0641 \u0628\u064A\u0627\u0646\u0627\u062A\u0643 ("\u0627\u0644\u062D\u0642 \u0641\u064A \u0627\u0644\u0646\u0633\u064A\u0627\u0646").',
                    '\u0627\u0644\u0646\u0642\u0644: \u0637\u0644\u0628 \u0628\u064A\u0627\u0646\u0627\u062A\u0643 \u0628\u062A\u0646\u0633\u064A\u0642 \u0642\u0627\u0628\u0644 \u0644\u0644\u0642\u0631\u0627\u0621\u0629 \u0622\u0644\u064A\u0627\u064B.',
                    '\u0627\u0644\u0627\u0639\u062A\u0631\u0627\u0636: \u0627\u0644\u0627\u0639\u062A\u0631\u0627\u0636 \u0639\u0644\u0649 \u0645\u0639\u0627\u0644\u062C\u0629 \u0628\u064A\u0627\u0646\u0627\u062A\u0643 \u0644\u0623\u063A\u0631\u0627\u0636 \u0645\u062D\u062F\u062F\u0629.',
                    '\u0633\u062D\u0628 \u0627\u0644\u0645\u0648\u0627\u0641\u0642\u0629: \u0633\u062D\u0628 \u0627\u0644\u0645\u0648\u0627\u0641\u0642\u0629 \u0641\u064A \u0623\u064A \u0648\u0642\u062A \u0628\u0641\u0635\u0644 \u0627\u0644\u062E\u062F\u0645\u0627\u062A \u0623\u0648 \u0625\u0644\u063A\u0627\u0621 \u062D\u0633\u0627\u0628\u0643.',
                    '\u0644\u0645\u0645\u0627\u0631\u0633\u0629 \u0623\u064A \u0645\u0646 \u0647\u0630\u0647 \u0627\u0644\u062D\u0642\u0648\u0642\u060C \u062A\u0648\u0627\u0635\u0644 \u0645\u0639\u0646\u0627 \u0639\u0628\u0631 \u0627\u0644\u0628\u0631\u064A\u062F \u0623\u062F\u0646\u0627\u0647.',
                ],
            },
            {
                title: '\u0667. \u0645\u0644\u0641\u0627\u062A \u062A\u0639\u0631\u064A\u0641 \u0627\u0644\u0627\u0631\u062A\u0628\u0627\u0637 (Cookies)',
                content: [
                    '\u0646\u0633\u062A\u062E\u062F\u0645 \u0645\u0644\u0641\u0627\u062A \u062A\u0639\u0631\u064A\u0641 \u0627\u0631\u062A\u0628\u0627\u0637 \u0623\u0633\u0627\u0633\u064A\u0629 \u0644\u0644\u0645\u0635\u0627\u062F\u0642\u0629 \u0648\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u062C\u0644\u0633\u0627\u062A.',
                    '\u0646\u0633\u062A\u062E\u062F\u0645 localStorage \u0644\u062A\u0630\u0643\u0651\u0631 \u062A\u0641\u0636\u064A\u0644 \u0627\u0644\u0644\u063A\u0629.',
                    '\u0644\u0627 \u0646\u0633\u062A\u062E\u062F\u0645 \u0645\u0644\u0641\u0627\u062A \u062A\u062A\u0628\u0639 \u0623\u0648 \u0625\u0639\u0644\u0627\u0646\u0627\u062A \u0645\u0646 \u0623\u0637\u0631\u0627\u0641 \u062E\u0627\u0631\u062C\u064A\u0629.',
                ],
            },
            {
                title: '\u0668. \u062E\u0635\u0648\u0635\u064A\u0629 \u0627\u0644\u0623\u0637\u0641\u0627\u0644',
                content: [
                    'ReviewPost \u063A\u064A\u0631 \u0645\u062E\u0635\u0635 \u0644\u0644\u0627\u0633\u062A\u062E\u062F\u0627\u0645 \u0645\u0646 \u0642\u0628\u0644 \u0627\u0644\u0623\u0634\u062E\u0627\u0635 \u062F\u0648\u0646 18 \u0639\u0627\u0645\u0627\u064B. \u0644\u0627 \u0646\u062C\u0645\u0639 \u0628\u064A\u0627\u0646\u0627\u062A \u0634\u062E\u0635\u064A\u0629 \u0645\u0646 \u0627\u0644\u0623\u0637\u0641\u0627\u0644 \u0639\u0646 \u0639\u0644\u0645.',
                ],
            },
            {
                title: '\u0669. \u062A\u063A\u064A\u064A\u0631\u0627\u062A \u0639\u0644\u0649 \u0647\u0630\u0647 \u0627\u0644\u0633\u064A\u0627\u0633\u0629',
                content: [
                    '\u0642\u062F \u0646\u062D\u062F\u0651\u062B \u0633\u064A\u0627\u0633\u0629 \u0627\u0644\u062E\u0635\u0648\u0635\u064A\u0629 \u0645\u0646 \u0648\u0642\u062A \u0644\u0622\u062E\u0631. \u0633\u0646\u064F\u0628\u0644\u063A\u0643 \u0628\u0627\u0644\u062A\u063A\u064A\u064A\u0631\u0627\u062A \u0627\u0644\u062C\u0648\u0647\u0631\u064A\u0629 \u0639\u0628\u0631 \u0627\u0644\u0628\u0631\u064A\u062F \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A \u0623\u0648 \u0625\u0634\u0639\u0627\u0631 \u062F\u0627\u062E\u0644 \u0627\u0644\u062A\u0637\u0628\u064A\u0642. \u0627\u0633\u062A\u0645\u0631\u0627\u0631 \u0627\u0633\u062A\u062E\u062F\u0627\u0645 \u0627\u0644\u062E\u062F\u0645\u0629 \u0628\u0639\u062F \u0627\u0644\u062A\u063A\u064A\u064A\u0631\u0627\u062A \u064A\u0639\u0646\u064A \u0627\u0644\u0645\u0648\u0627\u0641\u0642\u0629.',
                ],
            },
        ],
        contact: {
            title: '\u0661\u0660. \u062A\u0648\u0627\u0635\u0644 \u0645\u0639\u0646\u0627',
            text: '\u0625\u0630\u0627 \u0643\u0627\u0646 \u0644\u062F\u064A\u0643 \u0623\u0633\u0626\u0644\u0629 \u062D\u0648\u0644 \u0633\u064A\u0627\u0633\u0629 \u0627\u0644\u062E\u0635\u0648\u0635\u064A\u0629 \u0623\u0648 \u062A\u0631\u063A\u0628 \u0641\u064A \u0645\u0645\u0627\u0631\u0633\u0629 \u062D\u0642\u0648\u0642\u0643\u060C \u062A\u0648\u0627\u0635\u0644 \u0645\u0639\u0646\u0627 \u0639\u0628\u0631:',
        },
    },
    TR: {
        title: 'Gizlilik Politikas\u0131',
        lastUpdated: `Son g\u00FCncelleme: ${LAST_UPDATED}`,
        intro: 'ReviewPost ("biz", "bizim", "hizmetimiz") PrimeFlow Solutions taraf\u0131ndan i\u015Fletilmektedir. Bu Gizlilik Politikas\u0131, reviewpost.app platformumuzu kulland\u0131\u011F\u0131n\u0131zda ki\u015Fisel verilerinizi nas\u0131l toplad\u0131\u011F\u0131m\u0131z\u0131, kulland\u0131\u011F\u0131m\u0131z\u0131, saklad\u0131\u011F\u0131m\u0131z\u0131 ve korudu\u011Fumuzu a\u00E7\u0131klar.',
        sections: [
            {
                title: '1. Toplad\u0131\u011F\u0131m\u0131z Veriler',
                content: [
                    'Hesap Bilgileri: Hesap olu\u015Ftururken e-posta adresi, ad ve \u015Fifreli parola.',
                    '\u0130\u015Fletme Verileri: \u0130\u015Fletme ad\u0131, logo, marka renkleri, Google Place ID ve sosyal medya hesap ba\u011Flant\u0131lar\u0131.',
                    'Ma\u011Faza Verileri (Salla/Shopify): Ma\u011Faza ad\u0131, \u00FCye i\u015Fyeri ID, \u00FCr\u00FCn katalo\u011Fu ve yetkili API eri\u015Fimi ile \u00E7ekilen m\u00FC\u015Fteri yorumlar\u0131.',
                    'Yorum \u0130\u00E7eri\u011Fi: Yorumcu ad\u0131, puan, yorum metni, \u00FCr\u00FCn ad\u0131 ve \u00FCr\u00FCn g\u00F6rselleri dahil m\u00FC\u015Fteri yorumlar\u0131.',
                    'Kullan\u0131m Verileri: Olu\u015Fturulan g\u00F6nderiler, yay\u0131nlanan g\u00F6nderiler ve oturum analizleri.',
                    '\u00D6deme Verileri: Stripe ve Moyasar taraf\u0131ndan g\u00FCvenli bir \u015Fekilde i\u015Flenir. Tam kredi kart\u0131 numaralar\u0131n\u0131 saklamay\u0131z.',
                ],
            },
            {
                title: '2. Verilerinizi Nas\u0131l Kullan\u0131r\u0131z',
                content: [
                    'OpenAI GPT-4o-mini kullanarak m\u00FC\u015Fteri yorumlar\u0131n\u0131zdan yapay zeka destekli sosyal medya ba\u015Fl\u0131klar\u0131 olu\u015Fturmak.',
                    'Logonuz, renkleriniz ve yorum i\u00E7eri\u011Finizle markal\u0131 g\u00F6rsel g\u00F6nderiler tasarlamak.',
                    'Ba\u011Fl\u0131 Instagram, Facebook ve X hesaplar\u0131n\u0131za i\u00E7erik yay\u0131nlamak.',
                    'Abonelik plan\u0131n\u0131za g\u00F6re adil kullan\u0131m limitlerini uygulamak.',
                    '\u0130\u015Flem e-postalar\u0131 g\u00F6ndermek (ho\u015F geldiniz, kullan\u0131m uyar\u0131lar\u0131, \u00F6deme makbuzlar\u0131).',
                    'Anonim, toplu analizlerle hizmetlerimizi iyile\u015Ftirmek.',
                ],
            },
            {
                title: '3. Veri Depolama ve G\u00FCvenlik',
                content: [
                    'T\u00FCm veriler g\u00FCvenli altyap\u0131da bar\u0131nd\u0131r\u0131lan PostgreSQL veritabanlar\u0131nda saklan\u0131r.',
                    'OAuth belirte\u00E7leri ve API anahtarlar\u0131 AES-256-GCM \u015Fifreleme ile korunur.',
                    'Aktar\u0131m s\u0131ras\u0131ndaki t\u00FCm veriler TLS 1.3 ile \u015Fifrelenir.',
                    '\u00DCretim sistemlerine eri\u015Fim yaln\u0131zca yetkili personelle s\u0131n\u0131rl\u0131d\u0131r.',
                    'D\u00FCzenli g\u00FCvenlik denetimleri yap\u0131l\u0131r ve OWASP en iyi uygulamalar\u0131 takip edilir.',
                ],
            },
            {
                title: '4. \u00DC\u00E7\u00FCnc\u00FC Taraf Hizmetleri',
                content: [
                    'OpenAI (GPT-4o-mini): Ba\u015Fl\u0131k olu\u015Fturmak i\u00E7in yorum metnini i\u015Fler. Metin, modellerini e\u011Fitmek i\u00E7in kullan\u0131lmaz.',
                    'Meta (Facebook/Instagram): Ba\u011Fl\u0131 hesaplar\u0131n\u0131za yay\u0131n yapmak i\u00E7in g\u00F6nderileri al\u0131r.',
                    'Google Business Profile API: A\u00E7\u0131k OAuth yetkilendirmenizle yorumlar\u0131n\u0131z\u0131 okur.',
                    'Salla API: Yetkinizle ma\u011Faza verilerinize ve \u00FCr\u00FCn yorumlar\u0131n\u0131za eri\u015Fir.',
                    'Stripe ve Moyasar: \u00D6demeleri g\u00FCvenli bir \u015Fekilde i\u015Fler. PCI-DSS uyumludur.',
                    'Resend: Bizim ad\u0131m\u0131za i\u015Flem e-postalar\u0131 g\u00F6nderir.',
                ],
            },
            {
                title: '5. Veri Saklama',
                content: [
                    'Hesap verileriniz hesab\u0131n\u0131z aktif oldu\u011Fu s\u00FCrece saklan\u0131r.',
                    'Hesap iptali \u00FCzerine t\u00FCm ki\u015Fisel verileriniz 30 g\u00FCn i\u00E7inde kal\u0131c\u0131 olarak silinir.',
                    'OAuth belirte\u00E7leri ba\u011Flant\u0131 kesme veya hesap iptali \u00FCzerine derhal iptal edilir.',
                    'Anonim, toplu kullan\u0131m istatistikleri analiz ama\u00E7l\u0131 saklanabilir.',
                ],
            },
            {
                title: '6. Haklar\u0131n\u0131z (GDPR ve KVKK)',
                content: [
                    'AB Genel Veri Koruma Y\u00F6netmeli\u011Fi (GDPR) ve ilgili yerel veri koruma yasalar\u0131na uyuyoruz. A\u015Fa\u011F\u0131daki haklara sahipsiniz:',
                    'Eri\u015Fim: Ki\u015Fisel verilerinizin bir kopyas\u0131n\u0131 talep etme.',
                    'D\u00FCzeltme: Yanl\u0131\u015F verilerin d\u00FCzeltilmesini talep etme.',
                    'Silme: Verilerinizin silinmesini talep etme ("unutulma hakk\u0131").',
                    'Ta\u015F\u0131nabilirlik: Verilerinizi makine taraf\u0131ndan okunabilir formatta talep etme.',
                    '\u0130tiraz: Verilerinizin belirli ama\u00E7larla i\u015Flenmesine itiraz etme.',
                    'Onay\u0131 Geri \u00C7ekme: Hizmetleri ay\u0131rarak veya hesab\u0131n\u0131z\u0131 iptal ederek istedi\u011Finiz zaman onay\u0131n\u0131z\u0131 geri \u00E7ekme.',
                    'Bu haklar\u0131n\u0131z\u0131 kullanmak i\u00E7in a\u015Fa\u011F\u0131daki e-posta \u00FCzerinden bize ula\u015F\u0131n.',
                ],
            },
            {
                title: '7. \u00C7erezler',
                content: [
                    'Kimlik do\u011Frulama ve oturum y\u00F6netimi i\u00E7in temel \u00E7erezler kullan\u0131r\u0131z.',
                    'Dil tercihinizi hat\u0131rlamak i\u00E7in localStorage kullan\u0131r\u0131z.',
                    '\u00DC\u00E7\u00FCnc\u00FC taraf izleme veya reklam \u00E7erezleri kullanmay\u0131z.',
                ],
            },
            {
                title: '8. \u00C7ocuklar\u0131n Gizlili\u011Fi',
                content: [
                    'ReviewPost, 18 ya\u015F\u0131n alt\u0131ndaki bireyler taraf\u0131ndan kullan\u0131lmak \u00FCzere tasarlanmam\u0131\u015Ft\u0131r. Bilerek \u00E7ocuklardan ki\u015Fisel veri toplamay\u0131z.',
                ],
            },
            {
                title: '9. Bu Politikadaki De\u011Fi\u015Fiklikler',
                content: [
                    'Bu Gizlilik Politikas\u0131n\u0131 zaman zaman g\u00FCncelleyebiliriz. \u00D6nemli de\u011Fi\u015Fiklikler hakk\u0131nda sizi e-posta veya uygulama i\u00E7i bildirimle bilgilendirece\u011Fiz. De\u011Fi\u015Fikliklerden sonra hizmeti kullanmaya devam etmeniz kabul anlam\u0131na gelir.',
                ],
            },
        ],
        contact: {
            title: '10. \u0130leti\u015Fim',
            text: 'Bu Gizlilik Politikas\u0131 hakk\u0131nda sorular\u0131n\u0131z varsa veya veri haklar\u0131n\u0131z\u0131 kullanmak istiyorsan\u0131z, bize ula\u015F\u0131n:',
        },
    },
};

function LangSwitcher({ lang, setLang }: { lang: Lang; setLang: (l: Lang) => void }) {
    const [open, setOpen] = useState(false);
    return (
        <div className="relative">
            <button onClick={() => setOpen((v) => !v)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors border border-gray-200">
                <span>{LANGS.find((l) => l.code === lang)?.flag}</span>
                <span>{lang}</span>
                <svg className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>
            {open && (
                <div className="absolute top-full mt-1 right-0 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-50 min-w-[100px]">
                    {LANGS.map((l) => (
                        <button key={l.code} onClick={() => { setLang(l.code); setOpen(false); }} className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 transition-colors ${lang === l.code ? 'font-semibold text-indigo-600' : 'text-gray-700'}`}>
                            <span>{l.flag}</span>
                            <span>{l.label}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

export default function PrivacyPolicyPage() {
    const [lang, setLang] = useState<Lang>('EN');
    const isRtl = lang === 'AR';

    useEffect(() => {
        try {
            const saved = localStorage.getItem('reviewpost-lang') as Lang | null;
            if (saved && CONTENT[saved]) setLang(saved);
        } catch { /* ignore */ }
    }, []);

    const handleLangChange = (l: Lang) => {
        setLang(l);
        try { localStorage.setItem('reviewpost-lang', l); } catch { /* ignore */ }
    };

    const c = CONTENT[lang];

    return (
        <div dir={isRtl ? 'rtl' : 'ltr'} className="min-h-screen bg-white">
            <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-md shadow-indigo-200">
                            <span className="text-white text-sm font-bold">R</span>
                        </div>
                        <span className="font-bold text-gray-900 text-lg tracking-tight">ReviewPost</span>
                    </Link>
                    <LangSwitcher lang={lang} setLang={handleLangChange} />
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
                <div className="mb-10">
                    <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight mb-3">{c.title}</h1>
                    <p className="text-sm text-gray-400">{c.lastUpdated}</p>
                </div>

                <p className="text-gray-600 leading-relaxed mb-10 text-lg border-l-4 border-indigo-200 pl-4 rtl:border-l-0 rtl:border-r-4 rtl:pl-0 rtl:pr-4">
                    {c.intro}
                </p>

                <div className="space-y-10">
                    {c.sections.map((section) => (
                        <section key={section.title}>
                            <h2 className="text-xl font-bold text-gray-900 mb-4">{section.title}</h2>
                            <ul className="space-y-2.5">
                                {section.content.map((item, i) => (
                                    <li key={i} className="flex items-start gap-3 text-gray-600 leading-relaxed">
                                        <span className="text-indigo-400 mt-1.5 flex-shrink-0">&#x2022;</span>
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    ))}

                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-4">{c.contact.title}</h2>
                        <p className="text-gray-600 leading-relaxed mb-4">{c.contact.text}</p>
                        <div className="bg-gray-50 rounded-2xl border border-gray-100 p-6 space-y-2">
                            <p className="text-gray-800 font-semibold">PrimeFlow Solutions</p>
                            <p className="text-gray-600">
                                Email: <a href="mailto:mfarrag@primeflow.co" className="text-indigo-600 hover:underline">mfarrag@primeflow.co</a>
                            </p>
                            <p className="text-gray-600">
                                Website: <a href="https://reviewpost.app" className="text-indigo-600 hover:underline">reviewpost.app</a>
                            </p>
                        </div>
                    </section>
                </div>
            </main>

            <footer className="border-t border-gray-100 py-8">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-400">
                    <span>&copy; 2025 ReviewPost. All rights reserved.</span>
                    <div className="flex gap-6">
                        <Link href="/privacy" className="text-indigo-600 font-medium">{lang === 'AR' ? '\u0633\u064A\u0627\u0633\u0629 \u0627\u0644\u062E\u0635\u0648\u0635\u064A\u0629' : lang === 'TR' ? 'Gizlilik' : 'Privacy'}</Link>
                        <Link href="/terms" className="hover:text-gray-600 transition-colors">{lang === 'AR' ? '\u0634\u0631\u0648\u0637 \u0627\u0644\u062E\u062F\u0645\u0629' : lang === 'TR' ? 'Kullan\u0131m \u015Eartlar\u0131' : 'Terms'}</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
