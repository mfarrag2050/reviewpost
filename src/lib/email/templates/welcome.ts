import { emailLayout, BRAND_COLOR } from './layout';

export interface WelcomeEmailData {
    userName: string;
    rtl?: boolean;
}

export function welcomeEmailTemplate(data: WelcomeEmailData): { subject: string; html: string } {
    const { userName, rtl } = data;

    if (rtl) {
        return {
            subject: `مرحباً ${userName}! 🎉 حسابك في ReviewPost جاهز`,
            html: emailLayout(`
                <h1 style="margin: 0 0 16px; font-size: 24px; font-weight: 700; color: #1F2937;">
                    مرحباً ${userName}! 🎉
                </h1>
                <p style="margin: 0 0 20px;">
                    أهلاً وسهلاً بك في <strong>ReviewPost</strong> — المنصة التي تحوّل تقييمات عملائك إلى منشورات اجتماعية احترافية تلقائياً.
                </p>

                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 24px 0;">
                    <tr>
                        <td style="padding: 16px; background-color: #F9FAFB; border-radius: 8px; border-right: 4px solid ${BRAND_COLOR};">
                            <p style="margin: 0 0 8px; font-weight: 600; color: #1F2937;">✨ خطواتك القادمة:</p>
                            <ol style="margin: 0; padding-right: 20px; color: #4B5563;">
                                <li style="margin-bottom: 6px;">أضف نشاطك التجاري وربطه بحساب Google</li>
                                <li style="margin-bottom: 6px;">اختر القالب المناسب وخصّص ألوان علامتك</li>
                                <li style="margin-bottom: 6px;">اربط حساب Instagram أو Facebook</li>
                                <li>شاهد المنشورات تُنشأ تلقائياً من تقييماتك!</li>
                            </ol>
                        </td>
                    </tr>
                </table>

                <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 28px auto;">
                    <tr>
                        <td style="border-radius: 8px; background-color: ${BRAND_COLOR};">
                            <a href="https://reviewpost.app/dashboard" style="display: inline-block; padding: 14px 32px; color: #FFFFFF; font-size: 15px; font-weight: 600; text-decoration: none;">
                                ابدأ الآن →
                            </a>
                        </td>
                    </tr>
                </table>

                <p style="margin: 24px 0 0; font-size: 13px; color: #9CA3AF;">
                    إذا كان لديك أي استفسار، تواصل معنا عبر support@reviewpost.app
                </p>
            `, { rtl: true, previewText: 'مرحباً بك في ReviewPost! حسابك جاهز، ابدأ بتحويل تقييماتك إلى محتوى.' }),
        };
    }

    return {
        subject: `Welcome ${userName}! 🎉 Your ReviewPost account is ready`,
        html: emailLayout(`
            <h1 style="margin: 0 0 16px; font-size: 24px; font-weight: 700; color: #1F2937;">
                Welcome ${userName}! 🎉
            </h1>
            <p style="margin: 0 0 20px;">
                Thanks for joining <strong>ReviewPost</strong> — the platform that automatically turns your customer reviews into professional social media posts.
            </p>

            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 24px 0;">
                <tr>
                    <td style="padding: 16px; background-color: #F9FAFB; border-radius: 8px; border-left: 4px solid ${BRAND_COLOR};">
                        <p style="margin: 0 0 8px; font-weight: 600; color: #1F2937;">✨ Your next steps:</p>
                        <ol style="margin: 0; padding-left: 20px; color: #4B5563;">
                            <li style="margin-bottom: 6px;">Add your business and connect Google Reviews</li>
                            <li style="margin-bottom: 6px;">Pick a template and customize your brand colors</li>
                            <li style="margin-bottom: 6px;">Connect your Instagram or Facebook account</li>
                            <li>Watch posts get created automatically from your reviews!</li>
                        </ol>
                    </td>
                </tr>
            </table>

            <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 28px auto;">
                <tr>
                    <td style="border-radius: 8px; background-color: ${BRAND_COLOR};">
                        <a href="https://reviewpost.app/dashboard" style="display: inline-block; padding: 14px 32px; color: #FFFFFF; font-size: 15px; font-weight: 600; text-decoration: none;">
                            Get Started →
                        </a>
                    </td>
                </tr>
            </table>

            <p style="margin: 24px 0 0; font-size: 13px; color: #9CA3AF;">
                If you have any questions, reach us at support@reviewpost.app
            </p>
        `, { rtl: false, previewText: 'Welcome to ReviewPost! Your account is ready — start turning reviews into content.' }),
    };
}
