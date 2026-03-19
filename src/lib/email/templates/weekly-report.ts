import { emailLayout, BRAND_COLOR } from './layout';

export interface WeeklyReportData {
    userName: string;
    postsPublished: number;
    totalEngagement: number;
    topPostCaption: string | null;
    topPostPlatform: string | null;
    topPostEngagement: number;
    reviewsPulled: number;
    weekLabel: string;
    rtl?: boolean;
}

export function weeklyReportTemplate(data: WeeklyReportData): { subject: string; html: string } {
    const { userName, postsPublished, totalEngagement, topPostCaption, topPostPlatform, topPostEngagement, reviewsPulled, weekLabel, rtl } = data;

    const truncatedCaption = topPostCaption
        ? (topPostCaption.length > 80 ? topPostCaption.slice(0, 80) + '…' : topPostCaption)
        : null;

    function statCell(value: string | number, label: string): string {
        return `<td style="padding: 12px; text-align: center; width: 33%;">
            <p style="margin: 0; font-size: 28px; font-weight: 700; color: ${BRAND_COLOR};">${value}</p>
            <p style="margin: 4px 0 0; font-size: 12px; color: #6B7280; text-transform: uppercase; letter-spacing: 0.5px;">${label}</p>
        </td>`;
    }

    if (rtl) {
        return {
            subject: `📊 تقريرك الأسبوعي — ${weekLabel}`,
            html: emailLayout(`
                <h1 style="margin: 0 0 8px; font-size: 22px; font-weight: 700; color: #1F2937;">
                    📊 التقرير الأسبوعي
                </h1>
                <p style="margin: 0 0 24px; color: #6B7280;">مرحباً ${userName}، إليك ملخص أدائك لهذا الأسبوع (${weekLabel})</p>

                <!-- Stats -->
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #F9FAFB; border-radius: 8px; margin-bottom: 24px;">
                    <tr>
                        ${statCell(postsPublished, 'منشورات')}
                        ${statCell(reviewsPulled, 'تقييمات')}
                        ${statCell(totalEngagement, 'تفاعل')}
                    </tr>
                </table>

                ${truncatedCaption ? `
                <!-- Top post -->
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 24px;">
                    <tr>
                        <td style="padding: 16px; background-color: #FEF3C7; border-radius: 8px;">
                            <p style="margin: 0 0 8px; font-size: 13px; font-weight: 600; color: #92400E;">🏆 أفضل منشور هذا الأسبوع</p>
                            <p style="margin: 0 0 6px; font-size: 14px; color: #1F2937;">"${truncatedCaption}"</p>
                            <p style="margin: 0; font-size: 12px; color: #6B7280;">${topPostPlatform} · ${topPostEngagement} تفاعل</p>
                        </td>
                    </tr>
                </table>
                ` : ''}

                <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 auto;">
                    <tr>
                        <td style="border-radius: 8px; background-color: ${BRAND_COLOR};">
                            <a href="https://reviewpost.app/dashboard" style="display: inline-block; padding: 12px 28px; color: #FFFFFF; font-size: 14px; font-weight: 600; text-decoration: none;">
                                شاهد التفاصيل ←
                            </a>
                        </td>
                    </tr>
                </table>
            `, { rtl: true, previewText: `${postsPublished} منشورات نُشرت هذا الأسبوع · ${totalEngagement} تفاعل` }),
        };
    }

    return {
        subject: `📊 Your Weekly Report — ${weekLabel}`,
        html: emailLayout(`
            <h1 style="margin: 0 0 8px; font-size: 22px; font-weight: 700; color: #1F2937;">
                📊 Weekly Report
            </h1>
            <p style="margin: 0 0 24px; color: #6B7280;">Hey ${userName}, here's your performance summary for ${weekLabel}</p>

            <!-- Stats -->
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #F9FAFB; border-radius: 8px; margin-bottom: 24px;">
                <tr>
                    ${statCell(postsPublished, 'Posts')}
                    ${statCell(reviewsPulled, 'Reviews')}
                    ${statCell(totalEngagement, 'Engagement')}
                </tr>
            </table>

            ${truncatedCaption ? `
            <!-- Top post -->
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 24px;">
                <tr>
                    <td style="padding: 16px; background-color: #FEF3C7; border-radius: 8px;">
                        <p style="margin: 0 0 8px; font-size: 13px; font-weight: 600; color: #92400E;">🏆 Top performing post this week</p>
                        <p style="margin: 0 0 6px; font-size: 14px; color: #1F2937;">"${truncatedCaption}"</p>
                        <p style="margin: 0; font-size: 12px; color: #6B7280;">${topPostPlatform} · ${topPostEngagement} engagements</p>
                    </td>
                </tr>
            </table>
            ` : ''}

            <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 auto;">
                <tr>
                    <td style="border-radius: 8px; background-color: ${BRAND_COLOR};">
                        <a href="https://reviewpost.app/dashboard" style="display: inline-block; padding: 12px 28px; color: #FFFFFF; font-size: 14px; font-weight: 600; text-decoration: none;">
                            View Details →
                        </a>
                    </td>
                </tr>
            </table>
        `, { rtl: false, previewText: `${postsPublished} posts published this week · ${totalEngagement} engagements` }),
    };
}
