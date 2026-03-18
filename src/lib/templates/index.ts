import fs from 'fs';
import path from 'path';
import { TemplateData, TemplateId } from './types';

/** Generate ★ string from numeric rating */
function buildStars(rating: number): string {
    const filled = Math.round(Math.max(0, Math.min(5, rating)));
    return '★'.repeat(filled) + '☆'.repeat(5 - filled);
}

/** Get first character of author name for avatar */
function getInitial(name: string): string {
    return (name.trim()[0] ?? '?').toUpperCase();
}

/** Truncate text to max 200 characters */
function truncate(text: string, max = 200): string {
    if (text.length <= max) return text;
    return text.slice(0, max - 1).trimEnd() + '…';
}

/** Pick font family based on language */
function getFontFamily(language?: string): string {
    return language === 'AR'
        ? "'Cairo', 'Arial', sans-serif"
        : "'Inter', 'Helvetica Neue', sans-serif";
}

/** Determine HTML dir + lang attributes */
function getLangAttrs(language?: string): { dir: string; lang: string } {
    if (language === 'AR') return { dir: 'rtl', lang: 'ar' };
    if (language === 'TR') return { dir: 'ltr', lang: 'tr' };
    return { dir: 'ltr', lang: 'en' };
}

/**
 * Load an HTML template, inject all data variables, and return the final HTML.
 * Templates live in the same directory as this file.
 */
export function getTemplate(templateId: TemplateId, data: TemplateData): string {
    const templatePath = path.join(
        process.cwd(),
        'src',
        'lib',
        'templates',
        `${templateId}.html`,
    );

    let html = fs.readFileSync(templatePath, 'utf-8');

    const { dir, lang } = getLangAttrs(data.language);
    const fontFamily = getFontFamily(data.language);
    const stars = buildStars(data.rating);
    const reviewText = truncate(data.review_text);
    const authorInitial = getInitial(data.author_name);
    const source = data.source ?? 'Google Reviews';

    // Inject lang/dir attributes into <html> tag
    html = html.replace(/lang="ar" dir="rtl"/, `lang="${lang}" dir="${dir}"`);

    // Replace all template variables
    const replacements: Record<string, string> = {
        '{{brand_primary}}': data.brand_primary,
        '{{brand_secondary}}': data.brand_secondary,
        '{{brand_text}}': data.brand_text,
        '{{font_family}}': fontFamily,
        '{{review_text}}': reviewText,
        '{{author_name}}': data.author_name,
        '{{author_initial}}': authorInitial,
        '{{rating}}': String(data.rating),
        '{{stars}}': stars,
        '{{business_name}}': data.business_name,
        '{{logo_url}}': data.logo_url,
        '{{source}}': source,
        '{{product_name}}': data.product_name ?? '',
        '{{product_image_url}}': data.product_image_url ?? '',
        '{{product_link}}': data.product_link ?? '#',
    };

    for (const [token, value] of Object.entries(replacements)) {
        html = html.replaceAll(token, value);
    }

    return html;
}
