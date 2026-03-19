/**
 * Shared email layout wrapper.
 * Tables-based responsive HTML email that supports Arabic RTL.
 */

const BRAND_COLOR = '#4F46E5';
const BRAND_LIGHT = '#EEF2FF';
const TEXT_PRIMARY = '#1F2937';
const TEXT_SECONDARY = '#6B7280';
const LOGO_URL = 'https://reviewpost.app/logo.png';

export interface LayoutOptions {
    rtl?: boolean;
    previewText?: string;
}

export function emailLayout(
    body: string,
    options: LayoutOptions = {},
): string {
    const dir = options.rtl ? 'rtl' : 'ltr';
    const align = options.rtl ? 'right' : 'left';
    const previewText = options.previewText ?? '';

    return `<!DOCTYPE html>
<html lang="${options.rtl ? 'ar' : 'en'}" dir="${dir}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>ReviewPost</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    body { margin: 0; padding: 0; width: 100% !important; height: 100% !important; }
    a[x-apple-data-detectors] { color: inherit !important; text-decoration: none !important; font-size: inherit !important; font-family: inherit !important; font-weight: inherit !important; line-height: inherit !important; }
    @media only screen and (max-width: 600px) {
      .email-container { width: 100% !important; max-width: 100% !important; }
      .email-body { padding: 20px 16px !important; }
      .stack-column { display: block !important; width: 100% !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #F3F4F6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <!-- Preview text -->
  <div style="display: none; max-height: 0; overflow: hidden;">${previewText}</div>
  <div style="display: none; max-height: 0; overflow: hidden;">&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;</div>

  <!-- Outer wrapper -->
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #F3F4F6;">
    <tr>
      <td align="center" style="padding: 32px 16px;">

        <!-- Email container -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" class="email-container" style="max-width: 600px; width: 100%; background-color: #FFFFFF; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, ${BRAND_COLOR}, #7C3AED); padding: 28px 32px; text-align: center;">
              <img src="${LOGO_URL}" alt="ReviewPost" width="140" style="display: inline-block; max-width: 140px; height: auto;" />
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td class="email-body" style="padding: 36px 32px; direction: ${dir}; text-align: ${align}; color: ${TEXT_PRIMARY}; font-size: 15px; line-height: 1.7;">
              ${body}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; background-color: ${BRAND_LIGHT}; direction: ${dir}; text-align: center; border-top: 1px solid #E5E7EB;">
              <p style="margin: 0 0 8px; font-size: 13px; color: ${TEXT_SECONDARY};">
                ReviewPost — ${options.rtl ? 'حوّل تقييمات عملائك إلى محتوى اجتماعي' : 'Turn your reviews into social content'}
              </p>
              <p style="margin: 0 0 8px; font-size: 12px; color: ${TEXT_SECONDARY};">
                <a href="{{unsubscribe_url}}" style="color: ${TEXT_SECONDARY}; text-decoration: underline;">
                  ${options.rtl ? 'إلغاء الاشتراك' : 'Unsubscribe'}
                </a>
                &nbsp;&middot;&nbsp;
                <a href="https://reviewpost.app/dashboard/settings?tab=notifications" style="color: ${TEXT_SECONDARY}; text-decoration: underline;">
                  ${options.rtl ? 'تفضيلات الإشعارات' : 'Notification Preferences'}
                </a>
              </p>
              <p style="margin: 0; font-size: 11px; color: #9CA3AF;">
                &copy; ${new Date().getFullYear()} ReviewPost. ${options.rtl ? 'جميع الحقوق محفوظة.' : 'All rights reserved.'}
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export { BRAND_COLOR, BRAND_LIGHT, TEXT_PRIMARY, TEXT_SECONDARY };
