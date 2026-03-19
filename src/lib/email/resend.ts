import { Resend } from 'resend';
import { prisma } from '@/lib/prisma';
import { welcomeEmailTemplate, type WelcomeEmailData } from './templates/welcome';
import { weeklyReportTemplate, type WeeklyReportData } from './templates/weekly-report';
import { usageAlertTemplate, type UsageAlertData } from './templates/usage-alert';
import { postPublishedTemplate, type PostPublishedData } from './templates/post-published';
import { paymentFailedTemplate, type PaymentFailedData } from './templates/payment-failed';
import { subscriptionCanceledTemplate, type SubscriptionCanceledData } from './templates/payment-failed';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_ADDRESS = process.env.EMAIL_FROM_ADDRESS ?? 'ReviewPost <noreply@reviewpost.app>';

export type EmailType =
    | 'welcome'
    | 'weekly_report'
    | 'usage_alert'
    | 'usage_limit'
    | 'post_published'
    | 'payment_failed'
    | 'subscription_canceled';

interface SendResult {
    success: boolean;
    messageId?: string;
    error?: string;
}

/**
 * Check if a user has opted in to a specific notification type.
 * If no preferences exist, defaults to true for all except post_published (optional).
 */
async function shouldSendEmail(userId: string, emailType: EmailType): Promise<boolean> {
    try {
        const business = await prisma.business.findFirst({
            where: { userId },
            select: { brandColors: true },
            orderBy: { createdAt: 'desc' },
        });

        const prefs = (business?.brandColors as Record<string, unknown>)?.notifications as Record<string, boolean> | undefined;
        if (!prefs) return emailType !== 'post_published';

        switch (emailType) {
            case 'welcome': return true;
            case 'weekly_report': return prefs.weeklyReport !== false;
            case 'usage_alert': return prefs.usageAlert80 !== false;
            case 'usage_limit': return prefs.usageLimit100 !== false;
            case 'post_published': return prefs.postPublished === true;
            case 'payment_failed': return true;
            case 'subscription_canceled': return true;
            default: return true;
        }
    } catch {
        return true;
    }
}

function isRtlUser(language: string): boolean {
    return language === 'AR';
}

export class EmailService {
    private async send(to: string, subject: string, html: string): Promise<SendResult> {
        try {
            const { data, error } = await resend.emails.send({
                from: FROM_ADDRESS,
                to,
                subject,
                html,
            });

            if (error) {
                console.error('[Email] Resend error:', error);
                return { success: false, error: error.message };
            }

            console.log(`[Email] Sent to ${to}: "${subject}" (id: ${data?.id})`);
            return { success: true, messageId: data?.id };
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            console.error('[Email] Send failed:', message);
            return { success: false, error: message };
        }
    }

    async sendWelcomeEmail(user: { email: string; name?: string | null; language?: string }): Promise<SendResult> {
        const rtl = isRtlUser(user.language ?? 'EN');
        const template = welcomeEmailTemplate({
            userName: user.name ?? user.email.split('@')[0],
            rtl,
        });
        return this.send(user.email, template.subject, template.html);
    }

    async sendWeeklyReport(
        user: { id: string; email: string; name?: string | null; language?: string },
        stats: Omit<WeeklyReportData, 'userName' | 'rtl'>,
    ): Promise<SendResult> {
        if (!(await shouldSendEmail(user.id, 'weekly_report'))) {
            return { success: true, messageId: 'skipped-preference' };
        }

        const rtl = isRtlUser(user.language ?? 'EN');
        const template = weeklyReportTemplate({
            ...stats,
            userName: user.name ?? user.email.split('@')[0],
            rtl,
        });
        return this.send(user.email, template.subject, template.html);
    }

    async sendUsageAlert(
        user: { id: string; email: string; name?: string | null; language?: string },
        stats: Omit<UsageAlertData, 'userName' | 'rtl'>,
    ): Promise<SendResult> {
        const emailType = stats.percentage >= 100 ? 'usage_limit' : 'usage_alert';
        if (!(await shouldSendEmail(user.id, emailType))) {
            return { success: true, messageId: 'skipped-preference' };
        }

        const rtl = isRtlUser(user.language ?? 'EN');
        const template = usageAlertTemplate({
            ...stats,
            userName: user.name ?? user.email.split('@')[0],
            rtl,
        });
        return this.send(user.email, template.subject, template.html);
    }

    async sendUsageLimitReached(
        user: { id: string; email: string; name?: string | null; language?: string },
        stats: { postsUsed: number; postsLimit: number; planName: string },
    ): Promise<SendResult> {
        return this.sendUsageAlert(user, { ...stats, percentage: 100 });
    }

    async sendPostPublished(
        user: { id: string; email: string; name?: string | null; language?: string },
        post: Omit<PostPublishedData, 'userName' | 'rtl'>,
    ): Promise<SendResult> {
        if (!(await shouldSendEmail(user.id, 'post_published'))) {
            return { success: true, messageId: 'skipped-preference' };
        }

        const rtl = isRtlUser(user.language ?? 'EN');
        const template = postPublishedTemplate({
            ...post,
            userName: user.name ?? user.email.split('@')[0],
            rtl,
        });
        return this.send(user.email, template.subject, template.html);
    }

    async sendPaymentFailed(
        user: { id: string; email: string; name?: string | null; language?: string },
        planName: string,
    ): Promise<SendResult> {
        const rtl = isRtlUser(user.language ?? 'EN');
        const template = paymentFailedTemplate({
            userName: user.name ?? user.email.split('@')[0],
            planName,
            rtl,
        });
        return this.send(user.email, template.subject, template.html);
    }

    async sendSubscriptionCanceled(
        user: { id: string; email: string; name?: string | null; language?: string },
        data: { planName: string; periodEnd: string },
    ): Promise<SendResult> {
        const rtl = isRtlUser(user.language ?? 'EN');
        const template = subscriptionCanceledTemplate({
            userName: user.name ?? user.email.split('@')[0],
            planName: data.planName,
            periodEnd: data.periodEnd,
            rtl,
        });
        return this.send(user.email, template.subject, template.html);
    }
}

export const emailService = new EmailService();
