import * as cheerio from 'cheerio';
import {
  PageMetadata,
  MetadataStatus,
  ExtractedAsset,
  ExtractedLink,
  ContentSlot,
  AssetRole,
  BlueprintItem,
} from './types';

function createMetaStatus(value: string | null | undefined): MetadataStatus {
  if (value && value.trim().length > 0) {
    return {
      found: true,
      value: value.trim(),
      status: 'FOUND',
    };
  }
  return {
    found: false,
    value: null,
    status: 'NOT FOUND',
  };
}

export interface ParsedHtmlResult {
  metadata: PageMetadata;
  assets: ExtractedAsset[];
  links: ExtractedLink[];
  contentSlots: ContentSlot[];
  blueprint: BlueprintItem[];
  detectedOldBrand: string;
  rawHtml: string;
  domTreeOutline: string[];
  additionalElements: string[];
}

export function parseReferenceHtml(html: string, baseUrl: string = ''): ParsedHtmlResult {
  const $ = cheerio.load(html);

  // 1. Metadata Extraction (Section 5)
  const title = $('head title').first().text() || $('title').first().text();
  const metaDesc = $('meta[name="description" i]').attr('content');
  const metaKeywords = $('meta[name="keywords" i]').attr('content');
  const robots = $('meta[name="robots" i]').attr('content');
  const canonical = $('link[rel="canonical" i]').attr('href');
  const ogTitle = $('meta[property="og:title" i]').attr('content');
  const ogDesc = $('meta[property="og:description" i]').attr('content');
  const ogImage = $('meta[property="og:image" i]').attr('content');
  const ogUrl = $('meta[property="og:url" i]').attr('content');
  const twitterCard = $('meta[name="twitter:card" i]').attr('content');
  const twitterTitle = $('meta[name="twitter:title" i]').attr('content');
  const twitterDesc = $('meta[name="twitter:description" i]').attr('content');

  let jsonLdVal: string | null = null;
  const jsonLdTag = $('script[type="application/ld+json"]').first();
  if (jsonLdTag.length > 0) {
    jsonLdVal = jsonLdTag.html()?.trim() || null;
  }

  const metadata: PageMetadata = {
    title: createMetaStatus(title),
    description: createMetaStatus(metaDesc),
    keywords: createMetaStatus(metaKeywords),
    robots: createMetaStatus(robots),
    canonical: createMetaStatus(canonical),
    ogTitle: createMetaStatus(ogTitle),
    ogDescription: createMetaStatus(ogDesc),
    ogImage: createMetaStatus(ogImage),
    ogUrl: createMetaStatus(ogUrl),
    twitterCard: createMetaStatus(twitterCard),
    twitterTitle: createMetaStatus(twitterTitle),
    twitterDescription: createMetaStatus(twitterDesc),
    jsonLd: createMetaStatus(jsonLdVal),
  };

  // 2. Old Brand Detection (Section 8)
  const detectedOldBrand = detectOldBrand($, metadata);

  // 3. Asset Extraction & Grouping (Section 14, 15)
  const assetMap = new Map<string, { role: AssetRole; count: number }>();

  function registerAsset(url: string | undefined | null, defaultRole: AssetRole) {
    if (!url) return;
    const cleanUrl = url.trim();
    if (!cleanUrl || cleanUrl.startsWith('data:image/svg+xml;base64') || cleanUrl.startsWith('javascript:')) {
      return;
    }

    let role = defaultRole;
    const lower = cleanUrl.toLowerCase();
    if (lower.includes('logo')) role = 'LOGO';
    else if (lower.includes('favicon') || lower.endsWith('.ico')) role = 'FAVICON';
    else if (lower.includes('hero') || lower.includes('banner')) role = 'HERO';
    else if (lower.includes('icon')) role = 'ICON';

    const existing = assetMap.get(cleanUrl);
    if (existing) {
      existing.count += 1;
      if (existing.role === 'IMAGE' && role !== 'IMAGE') {
        existing.role = role;
      }
    } else {
      assetMap.set(cleanUrl, { role, count: 1 });
    }
  }

  // Favicons
  $('link[rel*="icon" i]').each((_, el) => {
    registerAsset($(el).attr('href'), 'FAVICON');
  });

  // OG Image
  if (ogImage) {
    registerAsset(ogImage, 'IMAGE');
  }

  // img elements
  $('img').each((_, el) => {
    const $el = $(el);
    const src = $el.attr('src');
    const alt = $el.attr('alt') || '';
    const className = $el.attr('class') || '';
    const id = $el.attr('id') || '';

    let role: AssetRole = 'IMAGE';
    const combined = `${src} ${alt} ${className} ${id}`.toLowerCase();
    if (combined.includes('logo')) role = 'LOGO';
    else if (combined.includes('hero') || combined.includes('banner')) role = 'HERO';
    else if (combined.includes('icon')) role = 'ICON';

    registerAsset(src, role);

    const srcset = $el.attr('srcset');
    if (srcset) {
      srcset.split(',').forEach((part) => {
        const item = part.trim().split(/\s+/)[0];
        if (item) registerAsset(item, role);
      });
    }
  });

  // Picture source elements
  $('picture source').each((_, el) => {
    const srcset = $(el).attr('srcset');
    if (srcset) {
      srcset.split(',').forEach((part) => {
        const item = part.trim().split(/\s+/)[0];
        if (item) registerAsset(item, 'IMAGE');
      });
    }
  });

  // Video poster
  $('video').each((_, el) => {
    registerAsset($(el).attr('poster'), 'VIDEO_POSTER');
  });

  // CSS inline background-image
  $('[style*="background"]').each((_, el) => {
    const style = $(el).attr('style') || '';
    const match = /url\(['"]?([^'"()]+)['"]?\)/gi.exec(style);
    if (match && match[1]) {
      registerAsset(match[1], 'BACKGROUND');
    }
  });

  const assets: ExtractedAsset[] = Array.from(assetMap.entries()).map(([originalUrl, val]) => ({
    originalUrl,
    role: val.role,
    occurrences: val.count,
    keepOriginal: true,
  }));

  // 4. Link Extraction & Grouping (Section 17, 18, 19, 20)
  const linkMap = new Map<
    string,
    { count: number; isRelative: boolean; category: ExtractedLink['category'] }
  >();

  function registerLink(rawHref: string | undefined | null, contextTag: string) {
    if (!rawHref) return;
    const href = rawHref.trim();
    if (!href || href.startsWith('#') || href.startsWith('javascript:')) return;

    const isRelative = !/^https?:\/\//i.test(href) && !href.startsWith('//');
    const lower = href.toLowerCase();

    let category: ExtractedLink['category'] = 'other';
    if (
      lower.includes('register') ||
      lower.includes('daftar') ||
      lower.includes('login') ||
      lower.includes('masuk') ||
      lower.includes('cta') ||
      lower.includes('join')
    ) {
      category = 'cta';
    } else if (
      lower.includes('facebook.com') ||
      lower.includes('twitter.com') ||
      lower.includes('instagram.com') ||
      lower.includes('t.me') ||
      lower.includes('telegram') ||
      lower.includes('whatsapp')
    ) {
      category = 'social';
    } else if (contextTag === 'nav' || lower.includes('menu') || lower.includes('nav')) {
      category = 'navigation';
    } else if (isRelative) {
      category = 'internal';
    } else {
      category = 'external';
    }

    const existing = linkMap.get(href);
    if (existing) {
      existing.count += 1;
      if (existing.category === 'other' && (category as string) !== 'other') {
        existing.category = category;
      }
    } else {
      linkMap.set(href, { count: 1, isRelative, category });
    }
  }

  $('a').each((_, el) => {
    const $el = $(el);
    const parentNav = $el.closest('nav, header, .nav, .menu').length > 0;
    registerLink($el.attr('href'), parentNav ? 'nav' : 'a');
  });

  $('form').each((_, el) => {
    registerLink($(el).attr('action'), 'form');
  });

  const links: ExtractedLink[] = Array.from(linkMap.entries()).map(([originalUrl, val]) => ({
    originalUrl,
    isRelative: val.isRelative,
    occurrences: val.count,
    category: val.category,
    keepOriginal: true,
  }));

  // 5. Replaceable Element Detection & Content Slots (Section 7, 26)
  const contentSlots: ContentSlot[] = [];
  let slotIndex = 1;

  // Text that belongs ONLY to this element, excluding any nested element children.
  // Critical for malformed templates where a whole <section> (e.g. FAQ) is nested
  // inside a heading — the naive `.text()` would return the entire descendant content.
  function directText($el: cheerio.Cheerio<any>): string {
    let text = '';
    $el.contents().each((_, node: any) => {
      if (node.type === 'text') {
        text += ' ' + (node.data || '');
      }
    });
    return text.replace(/\s+/g, ' ').trim();
  }

  function addSlot(
    el: any,
    type: ContentSlot['type'],
    selector: string,
    idx: number
  ) {
    const $el = $(el);

    // Use direct text (exclude descendants) so wrapper elements are not mistaken as content.
    let text = directText($el);

    // Skip pure wrapper elements (they own no direct text but embed block children).
    // Those are structural containers, not content slots, and must stay LOCKED.
    if (!text && $el.children().length > 0) return;

    // For elements without element children, fall back to full text (covers <p>text</p>).
    if (!text) {
      text = $el.text().replace(/\s+/g, ' ').trim();
    }

    if (!text || text.length < 2) return;

    const words = text.split(/\s+/).filter(Boolean).length;
    const id = `CONTENT-${String(slotIndex++).padStart(3, '0')}`;

    // Stamp the DOM element so the replacement engine can target the exact node
    // (PRD Section 25/26: replacement must not rely on string matching alone).
    $el.attr('data-src-slot', id);

    contentSlots.push({
      id,
      type,
      selector,
      index: idx,
      originalText: text,
      originalWordCount: words,
      newText: '',
    });
  }

  // Tag H1
  $('h1').each((idx, el) => {
    addSlot(el, 'H1', 'h1', idx);
  });

  // Tag H2
  $('h2').each((idx, el) => {
    addSlot(el, 'H2', 'h2', idx);
  });

  // Tag H3
  $('h3').each((idx, el) => {
    addSlot(el, 'H3', 'h3', idx);
  });

  // Tag FAQ if identified
  const faqQuestions: any[] = [];
  const faqAnswers: any[] = [];
  const visitedQuestions = new Set<any>();

  // 1. Look for explicit FAQ item cards (e.g. .faq-card in megasicbo.com, .faq-box in tuttobene.cl)
  $('.faq-card, .faq-item, .accordion-item, .faq-box, [class*="faq-card"], [class*="faq-item"], [class*="faq-box"], [class*="qa-item"]').each((_, item) => {
    const $item = $(item);
    const q$ = $item.find('.faq-q, [class*="faq-q"], .faq-question, [class*="faq-question"], .question, [class*="question"], dt, h3, h4, h5, strong, b, summary').first();
    const qEl = q$.get(0);
    if (!qEl) return;

    const aEl = $item.find('.faq-a, [class*="faq-a"], .faq-answer, [class*="faq-answer"], .answer, [class*="answer"], dd, p, div').not(q$).first().get(0);
    if (aEl && !visitedQuestions.has(qEl)) {
      visitedQuestions.add(qEl);
      faqQuestions.push(qEl);
      faqAnswers.push(aEl);
    }
  });

  // 2. Generic containers or <details>
  $('.faq, [class*="faq"], [id*="faq"], details').each((_, container) => {
    const $c = $(container);
    if ($c.find('.faq-card, .faq-item, .accordion-item, .faq-box, [class*="faq-box"]').length > 0) {
      return;
    }

    if (container.tagName.toLowerCase() === 'details') {
      const summary = $c.find('summary').first().get(0);
      if (summary && !visitedQuestions.has(summary)) {
        visitedQuestions.add(summary);
        faqQuestions.push(summary);
        const textNodes = $c.find('p, div').not('summary').first().get(0);
        if (textNodes) faqAnswers.push(textNodes);
      }
    } else {
      const q = $c.find('dt, .faq-q, [class*="faq-q"], .faq-question, .question, h3, h4, button').first().get(0);
      const a = $c.find('dd, .faq-a, [class*="faq-a"], .faq-answer, .answer, p').first().get(0);
      if (q && a && !visitedQuestions.has(q)) {
        visitedQuestions.add(q);
        faqQuestions.push(q);
        faqAnswers.push(a);
      }
    }
  });

  // 3. Fallback: Standalone question headings ending with ? followed by sibling answer
  if (faqQuestions.length === 0) {
    $('h2, h3, h4, h5, dt, strong, b, summary, .faq-q, [class*="question"]').each((_, el) => {
      if (visitedQuestions.has(el)) return;
      const text = $(el).text().trim();
      if (
        (text.endsWith('?') ||
          /^(apa|bagaimana|kapan|mengapa|dimana|berapa|apakah|who|what|where|how|why)\b/i.test(text)) &&
        text.length >= 8 &&
        text.length <= 150
      ) {
        const nextEl = $(el).next('p, dd, div').first().get(0);
        if (nextEl) {
          const aText = $(nextEl).text().trim();
          if (aText && aText.length >= 5 && !aText.endsWith('?')) {
            visitedQuestions.add(el);
            faqQuestions.push(el);
            faqAnswers.push(nextEl);
          }
        }
      }
    });
  }

  faqQuestions.forEach((q, idx) => {
    addSlot(q, 'FAQ_QUESTION', '.faq-question', idx);
  });
  faqAnswers.forEach((a, idx) => {
    addSlot(a, 'FAQ_ANSWER', '.faq-answer', idx);
  });

  // Tag Reviews if identified (universal class matching or star rating cards)
  const reviewTexts: any[] = [];
  const visitedReviews = new Set<any>();

  $('.review, .review-card, [class*="review"], .testimonial, [class*="testimonial"], .testi, [class*="ulasan"], [class*="feedback"]').each((_, item) => {
    const $item = $(item);
    // Skip outer wrapper if it contains individual review items
    if ($item.find('.review, .review-card, .testimonial, [class*="review-item"]').length > 0 && !$item.hasClass('review')) {
      return;
    }
    const textEl = $item.find('.review-text, [class*="review-text"], blockquote, .testimonial-text, p').first().get(0) || item;
    const rawText = $(textEl).text().trim();

    if (rawText && rawText.length > 5 && !/review terbaru|ulasan terbaru|daftar ulasan/i.test(rawText) && !visitedReviews.has(textEl)) {
      visitedReviews.add(textEl);
      reviewTexts.push(textEl);
    }
  });

  // Fallback: Cards containing star ratings (⭐⭐⭐⭐, ★★★★)
  if (reviewTexts.length === 0) {
    $('div, section, article, li').each((_, item) => {
      const $item = $(item);
      if ($item.find('div, section, article').length > 5) return;
      const text = $item.text().trim();
      if ((/⭐⭐⭐⭐|★★★★/i.test(text) || $item.find('[class*="star"], [class*="rating"]').length > 0) && text.length > 15) {
        if (visitedReviews.has(item)) return;
        const textEl = $item.find('p, blockquote, .comment, [class*="text"]').first().get(0) || item;
        const comment = $(textEl).text().trim();
        if (comment.length > 10 && !visitedReviews.has(textEl)) {
          visitedReviews.add(textEl);
          reviewTexts.push(textEl);
        }
      }
    });
  }

  reviewTexts.forEach((t, idx) => {
    addSlot(t, 'REVIEW_TEXT', '.review-text', idx);
  });

  // Tag Paragraphs (excluding those already claimed as FAQ or Review or inside script/style/nav)
  // Also exclude UI/utility containers (product info, add-to-cart, gallery, sticky bars, etc.)
  // so buttons and product labels are NOT treated as article content slots.
  const UI_CONTEXT_SELECTOR = [
    'nav', 'header', 'footer', 'script', 'style', 'noscript', 'template',
    '.faq', '[class*="faq"]', '.review', '[class*="review"]', '[class*="testimonial"]',
    'form', '[id*="addtocart"]', '[class*="add-to-cart"]', '[class*="addtocart"]',
    '[class*="product-info"]', '[class*="product-options"]', '[class*="product-add"]',
    '[class*="sticky"]', '[class*="gallery"]', '[class*="closer-look"]', '[class*="thumb"]',
    '[class*="breadcrumb"]', '[class*="toolbar"]', '[class*="pager"]', '[class*="sidebar"]',
    '[class*="swatch"]', '[class*="rating"]', '[class*="price"]', '[class*="stock"]',
    '[class*="shipping"]', '[class*="return-policy"]', '[class*="wishlist"]', '[class*="compare"]',
    '[class*="cookie"]', '[class*="banner"]', '[class*="modal"]', '[class*="popup"]',
    '[class*="cart"]', '[class*="checkout"]', '[class*="mini-cart"]', '[class*="pdp-buy"]',
    '[class*="quantity"]', '[class*="tocart"]', 'button',
  ].join(', ');

  $('p').each((idx, el) => {
    const $el = $(el);
    if ($el.closest(UI_CONTEXT_SELECTOR).length > 0) {
      return;
    }
    addSlot(el, 'PARAGRAPH', 'p', idx);
  });

  // 6. Structure Blueprint & DOM Outline (Section 6, 30)
  const blueprint: BlueprintItem[] = [];
  const domTreeOutline: string[] = ['BODY'];
  let order = 1;

  $('body > *').each((_, el) => {
    const tag = el.tagName.toUpperCase();
    if (['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE'].includes(tag)) return;

    const $el = $(el);
    const id = $el.attr('id') ? `#${$el.attr('id')}` : '';
    const cls = $el.attr('class') ? `.${$el.attr('class')?.trim().split(/\s+/)[0]}` : '';
    const sectionName = `${tag}${id || cls}`;

    const childElements: string[] = [];
    $el.find('h1, h2, h3, p, img, a, button, table, ul, ol').each((_, child) => {
      const cTag = child.tagName.toUpperCase();
      if (!childElements.includes(cTag)) {
        childElements.push(cTag);
      }
    });

    blueprint.push({
      order: order++,
      section: sectionName,
      elements: childElements.slice(0, 8),
    });

    domTreeOutline.push(`├── ${sectionName} (${childElements.slice(0, 4).join(', ')})`);
  });

  // 7. Additional Elements Check (Section 29)
  const additionalElements: string[] = [];
  if ($('nav, .nav, .menu').length > 0) additionalElements.push('Navigation');
  if ($('.breadcrumb, [class*="breadcrumb"]').length > 0) additionalElements.push('Breadcrumb');
  if ($('table').length > 0) additionalElements.push('Data Table');
  if ($('form').length > 0) additionalElements.push('Form');
  if ($('footer, .footer').length > 0) additionalElements.push('Footer');
  if ($('.badge, [class*="badge"]').length > 0) additionalElements.push('Badges');
  if ($('.cta, [class*="cta"], a[class*="btn"]').length > 0) additionalElements.push('CTA Buttons');

  return {
    metadata,
    assets,
    links,
    contentSlots,
    blueprint,
    detectedOldBrand,
    // Return the STAMPED html (with data-src-slot markers) so the replacement engine
    // can target exact DOM nodes. This is functionally identical to the original markup.
    rawHtml: $.html(),
    domTreeOutline,
    additionalElements,
  };
}

function detectOldBrand($: cheerio.CheerioAPI, metadata: PageMetadata): string {
  // Strategy 1: Title split by |, -, —, :
  if (metadata.title.value) {
    const parts = metadata.title.value.split(/[|\-—–:]/).map((s) => s.trim());
    if (parts.length > 1) {
      for (const part of parts) {
        if (part.length >= 3 && part.length <= 25 && !/slot|login|daftar|situs|link|gacor/i.test(part)) {
          return part;
        }
      }
      return parts[0];
    }
  }

  // Strategy 2: Look at logo alt or title
  const logoAlt = $('img[src*="logo" i], img[class*="logo" i]').first().attr('alt');
  if (logoAlt && logoAlt.trim().length > 2 && logoAlt.trim().length < 30) {
    return logoAlt.trim();
  }

  // Strategy 3: First H1 segment
  const h1 = $('h1').first().text().trim();
  if (h1) {
    const parts = h1.split(/[|\-—–:]/).map((s) => s.trim());
    return parts[0];
  }

  return 'UNKNOWN_BRAND';
}
