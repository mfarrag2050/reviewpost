import { emailLayout, BRAND_COLOR } from './layout';

export interface PostPublishedData {
    userName: string;
    businessName: string;
    reviewAuthor: string;
    reviewRating: number;
    platform: string;
    caption: string | null;
    imageUrl: string | null;
    rtl?: boolean;
}

export function postPublishedTemplate(data: PostPublishedData): { subject: string; html: string } {
    const { userName, businessName, reviewAuthor, reviewRating, platform, caption, imageUrl, rtl } = data;

    const stars = '★'.repeat(reviewRating) + '☆'.repeat(Math.max(0, 5 - reviewRating));
    const truncatedCaption = caption
        ? (caption.length > 120 ? caption.slice(0, 120) + '…' : caption)
        : '';

    const imageBlock = imageUrl ? `
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 16px;">
            <tr>
                <td style="text-align: center;">
                    <img src="${imageUrl}" alt="Post preview" width="280" style="max-width: 280px; width: 100%; border-radius: 8px; border: 1px solid #E5E7EB;" />
                </td>
            </tr>
        </table>
    ` : '';

    if (rtl) {
        return {
            subject: `✅ تم نشر منشور جديد على ${platform} — ${businessName}`,
            html: emailLayout(`
                <h1 style="margin: 0 0 12px; font-size: 22px; font-weight: 700; color: #1F2937;">
                    ✅ تم نشر منشور جديد!
                </h1>
                <p style="margin: 0 0 20px; color: #4B5563;">
                    مرحباً ${userName}، تم نشر منشور جديد من تقييم عميل على <strong>${platform}</strong>.
                </p>

                ${imageBlock}

                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #F9FAFB; border-radius: 8px; margin-bottom: 24px;">
                    <tr>
                        <td style="padding: 16px;">
                            <p style="margin: 0 0 4px; font-size: 20px; color: #F59E0B; letter-spacing: 2px;">${stars}</p>
                            <p style="margin: 0 0 8px; font-size: 14px; color: #1F2937; font-style: italic;">"${truncatedCaption}"</p>
                            <p style="margin: 0; font-size: 12px; color: #6B7280;">
                                بواسطة ${reviewAuthor} · ${businessName} · ${platform}
                            </p>
                        </td>
                    </tr>
                </table>

                <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 auto;">
                    <tr>
                        <td style="border-radius: 8px; background-color: ${BRAND_COLOR};">
                            <a href="https://reviewpost.app/dashboard" style="display: inline-block; padding: 12px 28px; color: #FFFFFF; font-size: 14px; font-weight: 600; text-decoration: none;">
                                عرض المنشورات ←
                            </a>
                        </td>
                    </tr>
                </table>
            `, { rtl: true, previewText: `منشور جديد من تقييم ${reviewAuthor} نُشر على ${platform}` }),
        };
    }

    return {
        subject: `✅ New post published on ${platform} — ${businessName}`,
        html: emailLayout(`
            <h1 style="margin: 0 0 12px; font-size: 22px; font-weight: 700; color: #1F2937;">
                ✅ New Post Published!
            </h1>
            <p style="margin: 0 0 20px; color: #4B5563;">
                Hey ${userName}, a new post from a customer review was published on <strong>${platform}</strong>.
            </p>

            ${imageBlock}

            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #F9FAFB; border-radius: 8px; margin-bottom: 24px;">
                <tr>
                    <td style="padding: 16px;">
                        <p style="margin: 0 0 4px; font-size: 20px; color: #F59E0B; letter-spacing: 2px;">${stars}</p>
                        <p style="margin: 0 0 8px; font-size: 14px; color: #1F2937; font-style: italic;">"${truncatedCaption}"</p>
                        <p style="margin: 0; font-size: 12px; color: #6B7280;">
                            By ${reviewAuthor} · ${businessName} · ${platform}
                        </p>
                    </td>
                </tr>
            </table>

            <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 auto;">
                <tr>
                    <td style="border-radius: 8px; background-color: ${BRAND_COLOR};">
                        <a href="https://reviewpost.app/dashboard" style="display: inline-block; padding: 12px 28px; color: #FFFFFF; font-size: 14px; font-weight: 600; text-decoration: none;">
                            View Posts →
                        </a>
                    </td>
                </tr>
            </table>
        `, { rtl: false, previewText: `New post from ${reviewAuthor}'s review published on ${platform}` }),
    };
}
