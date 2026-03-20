/** All data variables that can be injected into a template */
export interface TemplateData {
    // Review content
    review_text: string;
    author_name: string;
    rating: number; // 1–5
    // Business
    business_name: string;
    logo_url: string;
    // Brand colors (CSS hex values)
    brand_primary: string;
    brand_secondary: string;
    brand_text: string;
    // E-commerce (product template)
    product_name?: string;
    product_image_url?: string;
    product_link?: string;
    product_price?: string;
    // Layout
    language?: 'AR' | 'EN' | 'TR'; // controls dir + font
    source?: string; // e.g. "Google Reviews"
}

export type TemplateId =
    | 'classic'
    | 'bold'
    | 'product'
    | 'salla-classic'
    | 'salla-modern'
    | 'salla-product';
