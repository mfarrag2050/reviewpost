import { emailLayout, BRAND_COLOR } from './layout';

export interface UsageAlertData {
    userName: string;
    percentage: number;
    postsUsed: number;
    postsLimit: number;
    planName: string;
    rtl?: boolean;
}

export function usageAlertTemplate(data: UsageAlertData): { subject: string; html: string } {
    const { userName, percentage, postsUsed, postsLimit, planName, rtl } = data;
    const remaining = postsLimit - postsUsed;
    const isAtLimit = percentage >= 100;

    const barColor = isAtLimit ? '#DC2626' : percentage >= 90 ? '#F59E0B' : BRAND_COLOR;
    const barWidth = Math.min(100, percentage);

    const progressBar = `
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 16px 0;">
            <tr>
                <td style="padding: 0;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #E5E7EB; border-radius: 6px; height: 12px;">
                        <tr>
                            <td width="${barWidth}%" style="background-color: ${barColor}; border-radius: 6px; height: 12px;"></td>
                            <td style="height: 12px;"></td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    `;

    if (rtl) {
        const subject = isAtLimit
            ? `🚨 وصلت إلى الحد الأقصى — ${postsLimit} منشور`
            : `⚠️ تنبيه الاستخدام — ${percentage}% من حدك الشهري`;

        return {
            subject,
            html: emailLayout(`
                <h1 style="margin: 0 0 12px; font-size: 22px; font-weight: 700; color: ${isAtLimit ? '#DC2626' : '#1F2937'};">
                    ${isAtLimit ? '🚨 وصلت إلى الحد الأقصى' : '⚠️ تنبيه الاستخدام'}
                </h1>
                <p style="margin: 0 0 20px; color: #4B5563;">
                    مرحباً ${userName}، ${isAtLimit
                        ? `لقد استخدمت جميع المنشورات المتاحة (${postsLimit}) في خطة ${planName}.`
                        : `لقد استخدمت ${percentage}% من حد المنشورات الشهري في خطة ${planName}.`
                    }
                </p>

                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #F9FAFB; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
                    <tr>
                        <td style="padding: 20px;">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                <tr>
                                    <td><p style="margin: 0; font-size: 14px; color: #4B5563;">المنشورات المستخدمة</p></td>
                                    <td style="text-align: left;"><p style="margin: 0; font-size: 14px; font-weight: 700; color: #1F2937;">${postsUsed} / ${postsLimit}</p></td>
                                </tr>
                            </table>
                            ${progressBar}
                            <p style="margin: 8px 0 0; font-size: 13px; color: ${isAtLimit ? '#DC2626' : '#6B7280'};">
                                ${isAtLimit ? 'لا يمكنك إنشاء منشورات جديدة حتى تترقي أو ينتهي الشهر' : `${remaining} منشورات متبقية هذا الشهر`}
                            </p>
                        </td>
                    </tr>
                </table>

                <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 auto;">
                    <tr>
                        <td style="border-radius: 8px; background-color: ${BRAND_COLOR};">
                            <a href="https://reviewpost.app/dashboard/settings?tab=account" style="display: inline-block; padding: 12px 28px; color: #FFFFFF; font-size: 14px; font-weight: 600; text-decoration: none;">
                                ${isAtLimit ? 'ترقية الخطة ←' : 'عرض الاستخدام ←'}
                            </a>
                        </td>
                    </tr>
                </table>
            `, { rtl: true, previewText: isAtLimit ? `وصلت إلى حد ${postsLimit} منشور — ترقي للمتابعة` : `${percentage}% من حدك الشهري مستخدم` }),
        };
    }

    const subject = isAtLimit
        ? `🚨 Usage limit reached — ${postsLimit} posts`
        : `⚠️ Usage alert — ${percentage}% of your monthly limit`;

    return {
        subject,
        html: emailLayout(`
            <h1 style="margin: 0 0 12px; font-size: 22px; font-weight: 700; color: ${isAtLimit ? '#DC2626' : '#1F2937'};">
                ${isAtLimit ? '🚨 Usage Limit Reached' : '⚠️ Usage Alert'}
            </h1>
            <p style="margin: 0 0 20px; color: #4B5563;">
                Hey ${userName}, ${isAtLimit
                    ? `you've used all ${postsLimit} posts available on your ${planName} plan.`
                    : `you've used ${percentage}% of your monthly post limit on the ${planName} plan.`
                }
            </p>

            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #F9FAFB; border-radius: 8px; margin-bottom: 24px;">
                <tr>
                    <td style="padding: 20px;">
                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                            <tr>
                                <td><p style="margin: 0; font-size: 14px; color: #4B5563;">Posts used</p></td>
                                <td style="text-align: right;"><p style="margin: 0; font-size: 14px; font-weight: 700; color: #1F2937;">${postsUsed} / ${postsLimit}</p></td>
                            </tr>
                        </table>
                        ${progressBar}
                        <p style="margin: 8px 0 0; font-size: 13px; color: ${isAtLimit ? '#DC2626' : '#6B7280'};">
                            ${isAtLimit ? 'You cannot create new posts until you upgrade or the month resets' : `${remaining} posts remaining this month`}
                        </p>
                    </td>
                </tr>
            </table>

            <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 auto;">
                <tr>
                    <td style="border-radius: 8px; background-color: ${BRAND_COLOR};">
                        <a href="https://reviewpost.app/dashboard/settings?tab=account" style="display: inline-block; padding: 12px 28px; color: #FFFFFF; font-size: 14px; font-weight: 600; text-decoration: none;">
                            ${isAtLimit ? 'Upgrade Plan →' : 'View Usage →'}
                        </a>
                    </td>
                </tr>
            </table>
        `, { rtl: false, previewText: isAtLimit ? `You've hit your ${postsLimit} post limit — upgrade to continue` : `${percentage}% of your monthly limit used` }),
    };
}
