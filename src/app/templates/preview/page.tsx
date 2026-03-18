'use client';

import { useState } from 'react';

// Sample data for preview
const SAMPLE_CLASSIC = {
    label: 'Classic — Arabic RTL',
    html: `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8"/>
<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet"/>
<style>
  :root{--brand-primary:#7C3AED;--brand-secondary:#4F46E5;--brand-text:#ffffff;}
  *{margin:0;padding:0;box-sizing:border-box;}
  body{width:1080px;height:1080px;overflow:hidden;font-family:'Cairo',sans-serif;
    background:linear-gradient(145deg,#7C3AED 0%,#3b1e8c 100%);
    display:flex;flex-direction:column;align-items:center;justify-content:space-between;
    padding:64px 72px;position:relative;}
  body::before{content:'';position:absolute;width:600px;height:600px;border-radius:50%;
    background:rgba(255,255,255,0.04);top:-180px;right:-180px;}
  body::after{content:'';position:absolute;width:400px;height:400px;border-radius:50%;
    background:rgba(255,255,255,0.04);bottom:-120px;left:-120px;}
  .header{display:flex;align-items:center;gap:24px;width:100%;z-index:1;}
  .logo-wrap{width:96px;height:96px;border-radius:50%;background:rgba(255,255,255,0.15);
    border:3px solid rgba(255,255,255,0.4);overflow:hidden;flex-shrink:0;
    display:flex;align-items:center;justify-content:center;font-size:40px;}
  .business-name{font-size:36px;font-weight:700;color:rgba(255,255,255,0.95);}
  .quote-block{flex:1;display:flex;flex-direction:column;align-items:center;
    justify-content:center;width:100%;z-index:1;padding:0 8px;}
  .quote-mark{font-size:140px;line-height:0.6;color:rgba(255,255,255,0.15);
    font-family:Georgia,serif;margin-bottom:24px;align-self:flex-start;}
  .review-text{font-size:48px;font-weight:600;color:#fff;line-height:1.5;text-align:center;
    display:-webkit-box;-webkit-line-clamp:5;-webkit-box-orient:vertical;overflow:hidden;}
  .footer{display:flex;align-items:center;justify-content:space-between;width:100%;z-index:1;
    background:rgba(0,0,0,0.2);border-radius:20px;padding:24px 36px;
    backdrop-filter:blur(10px);border:1px solid rgba(255,255,255,0.1);}
  .author-info{display:flex;flex-direction:column;gap:6px;}
  .author-name{font-size:28px;font-weight:700;color:#fff;}
  .source-label{font-size:22px;color:rgba(255,255,255,0.6);}
  .stars{font-size:40px;color:#FFD700;letter-spacing:4px;}
</style>
</head>
<body>
  <div class="header">
    <div class="logo-wrap">🏪</div>
    <span class="business-name">مطعم الذواقة</span>
  </div>
  <div class="quote-block">
    <div class="quote-mark">"</div>
    <p class="review-text">تجربة رائعة جداً! الطعام كان شهياً ومميزاً، والخدمة ممتازة. سأعود بالتأكيد وأنصح كل من يبحث عن وجبة لذيذة أن يزور هذا المطعم الرائع.</p>
  </div>
  <div class="footer">
    <div class="author-info">
      <span class="author-name">أحمد العلي</span>
      <span class="source-label">via Google Reviews</span>
    </div>
    <div class="stars">★★★★★</div>
  </div>
</body>
</html>`,
};

const SAMPLE_BOLD = {
    label: 'Bold — English Dark',
    html: `
<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
<meta charset="UTF-8"/>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap" rel="stylesheet"/>
<style>
  :root{--brand-primary:#F59E0B;--brand-secondary:#EF4444;}
  *{margin:0;padding:0;box-sizing:border-box;}
  body{width:1080px;height:1080px;overflow:hidden;font-family:'Inter',sans-serif;
    background:#0d0d0d;display:flex;flex-direction:row;position:relative;}
  .accent-stripe{width:18px;height:100%;
    background:linear-gradient(180deg,#F59E0B,#EF4444);flex-shrink:0;}
  .content{flex:1;display:flex;flex-direction:column;padding:64px 72px 56px 56px;position:relative;}
  .stars-block{display:flex;flex-direction:column;gap:8px;margin-bottom:40px;}
  .stars{font-size:64px;letter-spacing:8px;color:#F59E0B;filter:drop-shadow(0 0 16px #F59E0B);}
  .rating-label{font-size:26px;font-weight:700;color:rgba(255,255,255,0.4);
    letter-spacing:3px;text-transform:uppercase;}
  .review-text{flex:1;font-size:54px;font-weight:900;color:#ffffff;line-height:1.35;
    display:-webkit-box;-webkit-line-clamp:6;-webkit-box-orient:vertical;overflow:hidden;}
  .watermark{position:absolute;bottom:120px;right:56px;font-size:300px;
    font-family:Georgia,serif;color:rgba(255,255,255,0.03);line-height:1;}
  .bottom-bar{display:flex;align-items:center;justify-content:space-between;
    padding-top:32px;border-top:1px solid rgba(255,255,255,0.08);z-index:1;}
  .logo-wrap{width:72px;height:72px;border-radius:16px;overflow:hidden;
    background:rgba(255,255,255,0.08);border:2px solid rgba(255,255,255,0.12);
    font-size:36px;display:flex;align-items:center;justify-content:center;}
  .author-name{font-size:28px;font-weight:700;color:#fff;}
  .business-name{font-size:24px;color:#F59E0B;margin-top:4px;}
</style>
</head>
<body>
  <div class="accent-stripe"></div>
  <div class="content">
    <div class="stars-block">
      <div class="stars">★★★★★</div>
      <div class="rating-label">5 / 5 · Google Reviews</div>
    </div>
    <p class="review-text">Absolutely incredible experience! The staff went above and beyond to make us feel welcome. Best service I've experienced in years.</p>
    <div class="watermark">"</div>
    <div class="bottom-bar">
      <div class="logo-wrap">☕</div>
      <div>
        <div class="author-name">Sarah Johnson</div>
        <div class="business-name">The Coffee Corner</div>
      </div>
    </div>
  </div>
</body>
</html>`,
};

const SAMPLE_PRODUCT = {
    label: 'Product — E-commerce Split',
    html: `
<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
<meta charset="UTF-8"/>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet"/>
<style>
  :root{--brand-primary:#059669;--brand-secondary:#10B981;}
  *{margin:0;padding:0;box-sizing:border-box;}
  body{width:1080px;height:1080px;overflow:hidden;font-family:'Inter',sans-serif;
    background:#f8f8f8;display:flex;flex-direction:row;}
  .product-panel{width:50%;height:100%;position:relative;overflow:hidden;background:#e0f2f1;}
  .product-panel-bg{width:100%;height:100%;background:linear-gradient(135deg,#a7f3d0,#6ee7b7,#34d399);
    display:flex;align-items:center;justify-content:center;font-size:160px;}
  .product-overlay{position:absolute;bottom:0;left:0;right:0;height:200px;
    background:linear-gradient(to top,rgba(0,0,0,0.6),transparent);
    padding:24px;display:flex;align-items:flex-end;}
  .product-name-overlay{font-size:28px;font-weight:700;color:#fff;line-height:1.3;}
  .review-panel{width:50%;height:100%;background:#fff;display:flex;flex-direction:column;
    padding:52px 48px;position:relative;}
  .review-panel::before{content:'';position:absolute;top:0;left:0;right:0;height:8px;
    background:linear-gradient(90deg,#059669,#10B981);}
  .product-label{font-size:22px;font-weight:700;color:#059669;
    letter-spacing:2px;text-transform:uppercase;margin-bottom:12px;margin-top:16px;}
  .product-name-text{font-size:36px;font-weight:800;color:#1a1a1a;
    line-height:1.3;margin-bottom:32px;}
  .stars{font-size:40px;color:#FFB800;letter-spacing:4px;margin-bottom:20px;}
  .review-text{flex:1;font-size:30px;font-weight:500;color:#333;line-height:1.6;
    font-style:italic;display:-webkit-box;-webkit-line-clamp:6;-webkit-box-orient:vertical;overflow:hidden;}
  .author-row{display:flex;align-items:center;gap:12px;margin-top:24px;
    padding-top:20px;border-top:1px solid #eee;}
  .author-avatar{width:44px;height:44px;border-radius:50%;background:#059669;
    display:flex;align-items:center;justify-content:center;
    font-size:18px;font-weight:700;color:#fff;flex-shrink:0;}
  .author-name{font-size:24px;font-weight:700;color:#1a1a1a;}
  .cta-button{display:block;width:100%;margin-top:24px;padding:20px;
    background:linear-gradient(135deg,#059669,#10B981);color:#fff;
    font-size:28px;font-weight:700;text-align:center;border-radius:16px;letter-spacing:1px;}
  .bottom-logo{display:flex;align-items:center;gap:12px;margin-top:20px;}
  .logo-icon{font-size:28px;}
  .biz-name-small{font-size:22px;font-weight:600;color:#888;}
</style>
</head>
<body>
  <div class="product-panel">
    <div class="product-panel-bg">👟</div>
    <div class="product-overlay">
      <div class="product-name-overlay">Air Max 270 — Black Edition</div>
    </div>
  </div>
  <div class="review-panel">
    <div class="product-label">Customer Review</div>
    <div class="product-name-text">Air Max 270 — Black Edition</div>
    <div class="stars">★★★★★</div>
    <p class="review-text">"These shoes are absolutely amazing! Super comfortable and the quality is outstanding. I've been wearing them daily for 3 months and they still look brand new."</p>
    <div class="author-row">
      <div class="author-avatar">M</div>
      <span class="author-name">Mohammed Al-Farsi</span>
    </div>
    <div class="cta-button">🛍 Shop Now</div>
    <div class="bottom-logo">
      <span class="logo-icon">🏬</span>
      <span class="biz-name-small">SneakerStore.sa</span>
    </div>
  </div>
</body>
</html>`,
};

const TEMPLATES = [SAMPLE_CLASSIC, SAMPLE_BOLD, SAMPLE_PRODUCT];

export default function TemplatePreviewPage() {
    const [scale, setScale] = useState(0.45);

    return (
        <div style={{ minHeight: '100vh', background: '#111', padding: '40px 24px', fontFamily: 'Inter, sans-serif' }}>
            {/* Header */}
            <div style={{ maxWidth: 1400, margin: '0 auto' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 40 }}>
                    <div>
                        <h1 style={{ color: '#fff', fontSize: 32, fontWeight: 800, margin: 0 }}>
                            📸 Template Preview
                        </h1>
                        <p style={{ color: '#888', fontSize: 16, marginTop: 6 }}>
                            ReviewPost — Instagram Post Templates (1080×1080px)
                        </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <label style={{ color: '#aaa', fontSize: 14 }}>Scale: {Math.round(scale * 100)}%</label>
                        <input
                            type="range"
                            min={20}
                            max={80}
                            value={scale * 100}
                            onChange={(e) => setScale(Number(e.target.value) / 100)}
                            style={{ width: 120 }}
                        />
                    </div>
                </div>

                {/* Template grid */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 64 }}>
                    {TEMPLATES.map((tpl) => (
                        <div key={tpl.label}>
                            <h2 style={{
                                color: '#7C3AED',
                                fontSize: 20,
                                fontWeight: 700,
                                marginBottom: 16,
                                paddingBottom: 12,
                                borderBottom: '1px solid #333',
                            }}>
                                {tpl.label}
                            </h2>

                            {/* Scaled iframe container */}
                            <div style={{
                                width: Math.round(1080 * scale),
                                height: Math.round(1080 * scale),
                                overflow: 'hidden',
                                borderRadius: 16,
                                boxShadow: '0 8px 64px rgba(0,0,0,0.8)',
                                border: '2px solid #222',
                                flexShrink: 0,
                            }}>
                                <div style={{ transform: `scale(${scale})`, transformOrigin: 'top left', width: 1080, height: 1080 }}>
                                    <iframe
                                        srcDoc={tpl.html}
                                        width={1080}
                                        height={1080}
                                        style={{ border: 'none', display: 'block' }}
                                        title={tpl.label}
                                        sandbox="allow-same-origin"
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div style={{ marginTop: 60, padding: '24px', background: '#1a1a1a', borderRadius: 12, border: '1px solid #333' }}>
                    <p style={{ color: '#666', fontSize: 14 }}>
                        💡 These templates are rendered by Puppeteer at 1080×1080px for Instagram.
                        Variables like <code style={{ color: '#7C3AED' }}>{'{{review_text}}'}</code> are replaced by <code style={{ color: '#7C3AED' }}>getTemplate(id, data)</code> in <code style={{ color: '#7C3AED' }}>src/lib/templates/index.ts</code>
                    </p>
                </div>
            </div>
        </div>
    );
}
