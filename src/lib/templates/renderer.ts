import puppeteer, { Browser } from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { getTemplate } from './index';
import { TemplateData, TemplateId } from './types';

// ─── Viewport definitions ─────────────────────────────────────

export type RenderFormat = 'INSTAGRAM' | 'FACEBOOK' | 'STORY';

const VIEWPORTS: Record<RenderFormat, { width: number; height: number }> = {
    INSTAGRAM: { width: 1080, height: 1080 },
    FACEBOOK: { width: 1200, height: 630 },
    STORY: { width: 1080, height: 1920 },
};

// ─── Options ─────────────────────────────────────────────────

export interface RenderOptions {
    format?: RenderFormat;
    quality?: number; // PNG is lossless but we keep for future JPEG support
}

export interface RenderResult {
    filePath: string;
    fileName: string;
    fileSize: number;   // bytes
    width: number;
    height: number;
    format: RenderFormat;
}

// ─── Storage helper ──────────────────────────────────────────

function getOutputDir(businessId: string): string {
    const date = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const dir = path.join(process.cwd(), 'storage', businessId, date);
    fs.mkdirSync(dir, { recursive: true });
    return dir;
}

function buildFileName(templateId: TemplateId, format: RenderFormat): string {
    const ts = Date.now();
    return `${templateId}_${format.toLowerCase()}_${ts}.png`;
}

// ─── Renderer ────────────────────────────────────────────────

export class ImageRenderer {
    private browser: Browser | null = null;

    /** Launch (or reuse) a headless Chrome instance */
    private async getBrowser(): Promise<Browser> {
        if (!this.browser || !this.browser.connected) {
            this.browser = await puppeteer.launch({
                headless: true,
                executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-gpu',
                    '--font-render-hinting=none',
                ],
            });
        }
        return this.browser;
    }

    /**
     * Render a template to PNG.
     *
     * @param templateId  which HTML template to use
     * @param data        variables to inject into the template
     * @param businessId  used for the output directory structure
     * @param options     format (INSTAGRAM/FACEBOOK/STORY), etc.
     */
    async renderTemplate(
        templateId: TemplateId,
        data: TemplateData,
        businessId: string,
        options: RenderOptions = {},
    ): Promise<RenderResult> {
        const format: RenderFormat = options.format ?? 'INSTAGRAM';
        const viewport = VIEWPORTS[format];

        // Build final HTML
        const html = getTemplate(templateId, data);

        // Open page
        const browser = await this.getBrowser();
        const page = await browser.newPage();

        try {
            await page.setViewport({ width: viewport.width, height: viewport.height });

            // Load HTML directly (no server needed — Puppeteer handles it)
            await page.setContent(html, {
                waitUntil: 'networkidle0', // wait for Google Fonts
                timeout: 30_000,
            });

            // Give fonts an extra moment to render
            await new Promise((r) => setTimeout(r, 500));

            // Determine output path
            const outputDir = getOutputDir(businessId);
            const fileName = buildFileName(templateId, format);
            const filePath = path.join(outputDir, fileName);

            // Screenshot
            await page.screenshot({
                path: filePath as `${string}.png`,
                type: 'png',
                clip: { x: 0, y: 0, width: viewport.width, height: viewport.height },
            });

            const { size: fileSize } = fs.statSync(filePath);

            console.log(
                `[ImageRenderer] rendered ${templateId}/${format} → ${filePath} (${(fileSize / 1024).toFixed(1)} KB)`,
            );

            return { filePath, fileName, fileSize, ...viewport, format };
        } finally {
            await page.close();
        }
    }

    /** Close the shared browser instance — call when done with a batch */
    async close(): Promise<void> {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
        }
    }
}

// ─── Convenience singleton for Next.js API routes ────────────
// We keep ONE browser alive across warm serverless invocations.

declare global {
    // eslint-disable-next-line no-var
    var __imageRenderer: ImageRenderer | undefined;
}

export function getImageRenderer(): ImageRenderer {
    if (!global.__imageRenderer) {
        global.__imageRenderer = new ImageRenderer();
    }
    return global.__imageRenderer;
}
