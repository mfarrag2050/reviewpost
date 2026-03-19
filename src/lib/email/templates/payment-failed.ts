import { emailLayout, BRAND_COLOR } from './layout';

export interface PaymentFailedData {
    userName: string;
    planName: string;
    rtl?: boolean;
}

export function paymentFailedTemplate(data: PaymentFailedData): { subject: string; html: string } {
    const { userName, planName, rtl } = data;

    if (rtl) {
        return {
            subject: '❌ فشل الدفع — يرجى تحديث طريقة الدفع',
            html: emailLayout(`
                <h1 style="margin: 0 0 12px; font-size: 22px; font-weight: 700; color: #DC2626;">
                    ❌ فشل الدفع
                </h1>
                <p style="margin: 0 0 20px; color: #4B5563;">
                    مرحباً ${userName}، لم نتمكن من تحصيل رسوم خطة <strong>${planName}</strong>. يرجى تحديث طريقة الدفع لتجنب انقطاع الخدمة.
                </p>

                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 24px;">
                    <tr>
                        <td style="padding: 16px; background-color: #FEF2F2; border-radius: 8px; border-right: 4px solid #DC2626;">
                            <p style="margin: 0 0 8px; font-weight: 600; color: #991B1B;">⚠️ ماذا يحدث الآن؟</p>
                            <ul style="margin: 0; padding-right: 20px; color: #4B5563; font-size: 14px;">
                                <li style="margin-bottom: 6px;">سنحاول مرة أخرى خلال الأيام القادمة</li>
                                <li style="margin-bottom: 6px;">إذا استمر الفشل، سيتم تعليق حسابك</li>
                                <li>قم بتحديث طريقة الدفع الآن لتجنب أي انقطاع</li>
                            </ul>
                        </td>
                    </tr>
                </table>

                <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 auto;">
                    <tr>
                        <td style="border-radius: 8px; background-color: ${BRAND_COLOR};">
                            <a href="https://reviewpost.app/dashboard/settings?tab=account" style="display: inline-block; padding: 14px 32px; color: #FFFFFF; font-size: 15px; font-weight: 600; text-decoration: none;">
                                تحديث طريقة الدفع ←
                            </a>
                        </td>
                    </tr>
                </table>

                <p style="margin: 24px 0 0; font-size: 13px; color: #9CA3AF;">
                    إذا كنت تعتقد أن هذا خطأ، تواصل معنا عبر support@reviewpost.app
                </p>
            `, { rtl: true, previewText: 'فشل الدفع لخطتك — يرجى تحديث طريقة الدفع' }),
        };
    }

    return {
        subject: '❌ Payment failed — please update your payment method',
        html: emailLayout(`
            <h1 style="margin: 0 0 12px; font-size: 22px; font-weight: 700; color: #DC2626;">
                ❌ Payment Failed
            </h1>
            <p style="margin: 0 0 20px; color: #4B5563;">
                Hey ${userName}, we were unable to charge your <strong>${planName}</strong> plan. Please update your payment method to avoid service interruption.
            </p>

            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 24px;">
                <tr>
                    <td style="padding: 16px; background-color: #FEF2F2; border-radius: 8px; border-left: 4px solid #DC2626;">
                        <p style="margin: 0 0 8px; font-weight: 600; color: #991B1B;">⚠️ What happens next?</p>
                        <ul style="margin: 0; padding-left: 20px; color: #4B5563; font-size: 14px;">
                            <li style="margin-bottom: 6px;">We'll retry the charge in the next few days</li>
                            <li style="margin-bottom: 6px;">If it keeps failing, your account will be suspended</li>
                            <li>Update your payment method now to avoid any disruption</li>
                        </ul>
                    </td>
                </tr>
            </table>

            <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 auto;">
                <tr>
                    <td style="border-radius: 8px; background-color: ${BRAND_COLOR};">
                        <a href="https://reviewpost.app/dashboard/settings?tab=account" style="display: inline-block; padding: 14px 32px; color: #FFFFFF; font-size: 15px; font-weight: 600; text-decoration: none;">
                            Update Payment Method →
                        </a>
                    </td>
                </tr>
            </table>

            <p style="margin: 24px 0 0; font-size: 13px; color: #9CA3AF;">
                If you believe this is an error, contact us at support@reviewpost.app
            </p>
        `, { rtl: false, previewText: 'Your plan payment failed — please update your payment method' }),
    };
}

// ─── Subscription Canceled Template ──────────────────────────────────────────

export interface SubscriptionCanceledData {
    userName: string;
    planName: string;
    periodEnd: string;
    rtl?: boolean;
}

export function subscriptionCanceledTemplate(data: SubscriptionCanceledData): { subject: string; html: string } {
    const { userName, planName, periodEnd, rtl } = data;

    if (rtl) {
        return {
            subject: '📋 تأكيد إلغاء الاشتراك',
            html: emailLayout(`
                <h1 style="margin: 0 0 12px; font-size: 22px; font-weight: 700; color: #1F2937;">
                    📋 تم إلغاء اشتراكك
                </h1>
                <p style="margin: 0 0 20px; color: #4B5563;">
                    مرحباً ${userName}، تم إلغاء اشتراكك في خطة <strong>${planName}</strong>.
                </p>

                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 24px;">
                    <tr>
                        <td style="padding: 16px; background-color: #F9FAFB; border-radius: 8px;">
                            <p style="margin: 0 0 8px; font-size: 14px; color: #4B5563;">
                                يمكنك الاستمرار في استخدام الخدمة حتى <strong>${periodEnd}</strong>.
                                بعد ذلك سيتحول حسابك إلى الخطة المجانية.
                            </p>
                            <p style="margin: 8px 0 0; font-size: 13px; color: #6B7280;">
                                يمكنك إعادة الاشتراك في أي وقت من إعدادات حسابك.
                            </p>
                        </td>
                    </tr>
                </table>

                <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 auto;">
                    <tr>
                        <td style="border-radius: 8px; background-color: ${BRAND_COLOR};">
                            <a href="https://reviewpost.app/dashboard/settings?tab=account" style="display: inline-block; padding: 12px 28px; color: #FFFFFF; font-size: 14px; font-weight: 600; text-decoration: none;">
                                إعادة الاشتراك ←
                            </a>
                        </td>
                    </tr>
                </table>
            `, { rtl: true, previewText: `تم إلغاء خطة ${planName} — تنتهي في ${periodEnd}` }),
        };
    }

    return {
        subject: '📋 Subscription cancellation confirmed',
        html: emailLayout(`
            <h1 style="margin: 0 0 12px; font-size: 22px; font-weight: 700; color: #1F2937;">
                📋 Subscription Canceled
            </h1>
            <p style="margin: 0 0 20px; color: #4B5563;">
                Hey ${userName}, your <strong>${planName}</strong> subscription has been canceled.
            </p>

            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 24px;">
                <tr>
                    <td style="padding: 16px; background-color: #F9FAFB; border-radius: 8px;">
                        <p style="margin: 0 0 8px; font-size: 14px; color: #4B5563;">
                            You can continue using the service until <strong>${periodEnd}</strong>.
                            After that, your account will revert to the free tier.
                        </p>
                        <p style="margin: 8px 0 0; font-size: 13px; color: #6B7280;">
                            You can resubscribe at any time from your account settings.
                        </p>
                    </td>
                </tr>
            </table>

            <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 auto;">
                <tr>
                    <td style="border-radius: 8px; background-color: ${BRAND_COLOR};">
                        <a href="https://reviewpost.app/dashboard/settings?tab=account" style="display: inline-block; padding: 12px 28px; color: #FFFFFF; font-size: 14px; font-weight: 600; text-decoration: none;">
                            Resubscribe →
                        </a>
                    </td>
                </tr>
            </table>
        `, { rtl: false, previewText: `Your ${planName} plan canceled — access continues until ${periodEnd}` }),
    };
}
