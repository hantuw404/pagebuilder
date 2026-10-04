import * as cheerio from 'cheerio';
import { ContentSlot, GeneratedContent, ReplacementMap } from './types';

export interface ExecuteReplacementOptions {
  originalHtml: string;
  replacementMap: ReplacementMap;
  generatedContent: GeneratedContent;
  contentSlots: ContentSlot[];
}

/**
 * Safe text setter that preserves structural child elements.
 *
 * Real-world templates (Magento product pages, template-based SEO / gambling landing
 * pages) frequently nest block elements inside headings (e.g. a <section> carrying the
 * whole FAQ inside an <h2>) or inline elements inside paragraphs (<p><a>..</a><img></p>).
 *
 * A naive `$(el).text(newText)` destroys ALL descendants — wiping FAQ structures, links
 * and images inside the target. To honour the PRD "structure-preserving" guarantee we
 * NEVER remove child elements:
 *
 * - If the element has NO element children → safe to replace its entire text.
 * - If the element HAS any element children → we replace only the loose (direct) text
 *   nodes belonging to the element itself and keep every descendant element untouched.
 *
 * @returns true if a replacement was applied.
 */
function safeSetText($: cheerio.CheerioAPI, el: any, newText: string): boolean {
  const $el = $(el);

  // Any element child (inline or block) means we must preserve the subtree.
  const hasElementChildren = $el.children().length > 0;

  if (!hasElementChildren) {
    $el.text(newText);
    return true;
  }

  // Structure-preserving mode: replace only direct text nodes, keep every child element.
  let replaced = false;
  $el.contents().each((_, node: any) => {
    if (node.type === 'text') {
      const original = (node.data || '').trim();
      if (original.length > 0) {
        if (!replaced) {
          node.data = newText;
          replaced = true;
        } else {
          node.data = '';
        }
      }
    }
  });

  // Pure wrapper (no direct text): the descendants are the source of truth — leave as-is.
  return replaced;
}

export function executeReplacement(options: ExecuteReplacementOptions): string {
  const { originalHtml, replacementMap, generatedContent, contentSlots } = options;
  const $ = cheerio.load(originalHtml);

  const oldBrand = replacementMap.brand.old;
  const newBrand = replacementMap.brand.new;

  // 0. Capture original H1 & Title mirror texts BEFORE any modifications.
  // Many sites (e.g. Magento product pages) repeat the exact H1/product-title text
  // in cloned wrapper elements (sticky header, mobile name, breadcrumbs, <title>, etc.).
  // These mirrors are NOT inside <h1> tags, so they must be synchronized explicitly.
  const newH1Text = generatedContent.h1[0] || generatedContent.rawMeta.metaTitle || '';
  const normalize = (s: string) => s.replace(/\s+/g, ' ').trim();

  const originalH1Text = normalize($('h1').first().text());
  const originalHeadTitleText = normalize($('head title').first().text());

  // 1. Title Replacement (Section 9, 23)
  if (generatedContent.rawMeta.metaTitle) {
    const $headTitles = $('head title');
    if ($headTitles.length > 0) {
      // Update the first head title, remove any duplicate <title> tags inside <head>
      $headTitles.each((idx, el) => {
        if (idx === 0) {
          $(el).text(generatedContent.rawMeta.metaTitle);
        } else {
          $(el).remove();
        }
      });
    } else if ($('title').length > 0) {
      $('title').first().text(generatedContent.rawMeta.metaTitle);
    } else {
      $('head').append(`<title>${generatedContent.rawMeta.metaTitle}</title>`);
    }
  }

  // 2. Meta Tags Replacement
  if (generatedContent.rawMeta.metaDescription) {
    if ($('meta[name="description" i]').length > 0) {
      $('meta[name="description" i]').attr('content', generatedContent.rawMeta.metaDescription);
    } else {
      $('head').append(`<meta name="description" content="${escapeAttr(generatedContent.rawMeta.metaDescription)}">`);
    }
  }

  if (generatedContent.rawMeta.ogTitle) {
    $('meta[property="og:title" i]').attr('content', generatedContent.rawMeta.ogTitle);
    $('meta[name="twitter:title" i]').attr('content', generatedContent.rawMeta.ogTitle);
  }

  if (generatedContent.rawMeta.ogDescription) {
    $('meta[property="og:description" i]').attr('content', generatedContent.rawMeta.ogDescription);
    $('meta[name="twitter:description" i]').attr('content', generatedContent.rawMeta.ogDescription);
  }

  if (generatedContent.rawMeta.canonical) {
    $('link[rel="canonical" i]').attr('href', generatedContent.rawMeta.canonical);
  }

  if (generatedContent.rawMeta.robots) {
    $('meta[name="robots" i]').attr('content', generatedContent.rawMeta.robots);
  }

  // 3. Content Slots Replacement (Section 26)
  // Prefer exact DOM targeting via the `data-src-slot` stamp produced by the parser.
  // This avoids index misalignment when the reference contains wrapper headings or
  // malformed nesting (e.g. a whole FAQ <section> nested inside an <h2>).
  const slotIdByType = (type: string): string[] =>
    contentSlots.filter((s) => s.type === type).map((s) => s.id);

  const stampedIds = new Set(
    $('[data-src-slot]').map((_, el: any) => $(el).attr('data-src-slot')).get()
  );

  // Replace H1s
  const h1Ids = slotIdByType('H1');
  generatedContent.h1.forEach((text, i) => {
    const stamp = h1Ids[i];
    if (stamp && stampedIds.has(stamp)) {
      safeSetText($, $(`[data-src-slot="${stamp}"]`).get(0), text);
    } else {
      const el = $('h1').get(i);
      if (el) safeSetText($, el, text);
    }
  });

  // Replace H2s
  const h2Ids = slotIdByType('H2');
  generatedContent.h2.forEach((text, i) => {
    const stamp = h2Ids[i];
    if (stamp && stampedIds.has(stamp)) {
      safeSetText($, $(`[data-src-slot="${stamp}"]`).get(0), text);
    } else {
      const el = $('h2').get(i);
      if (el) safeSetText($, el, text);
    }
  });

  // Replace H3s
  const h3Ids = slotIdByType('H3');
  generatedContent.h3.forEach((text, i) => {
    const stamp = h3Ids[i];
    if (stamp && stampedIds.has(stamp)) {
      safeSetText($, $(`[data-src-slot="${stamp}"]`).get(0), text);
    } else {
      const el = $('h3').get(i);
      if (el) safeSetText($, el, text);
    }
  });

  // 3.1 Mirror Synchronization (fixes partial/missing replacement of repeated titles)
  // Many sites repeat the EXACT old title/H1 text in multiple places: <title>, <strong>,
  // <h2>, sticky header, product name, and even loose text nodes inside wrapper divs
  // (e.g. megasicbo.com `.cqd-banner__container > .tp-text-note__body`).
  //
  // We replace EVERY text node (and leaf element) whose normalized content equals the
  // original title or original H1 with the new title/H1 text. This guarantees the new
  // title is applied consistently everywhere the old title appeared.
  const mirrorTargets: string[] = [originalH1Text, originalHeadTitleText].filter(
    (t) => t && t.length > 5
  );

  if (mirrorTargets.length > 0 && newH1Text) {
    const titleReplacement = generatedContent.rawMeta.metaTitle || newH1Text;
    const targets = new Set(mirrorTargets);

    // 3.1a Recursive text-node walker — handles loose text nodes inside wrapper divs
    // (e.g. <div class="tp-text-note__body"><button>..</button>OLD TITLE</div>).
    const walkAndReplace = (node: any) => {
      if (!node) return;
      if (node.type === 'tag' && ['script', 'style', 'noscript', 'template', 'title'].includes(node.name?.toLowerCase())) {
        return;
      }
      if (node.children && node.children.length > 0) {
        // Iterate over a snapshot since we may replace text node data.
        node.children.forEach((child: any) => {
          if (child.type === 'text' && child.data) {
            const norm = normalize(child.data);
            if (norm.length > 5 && targets.has(norm)) {
              // Preserve surrounding whitespace of the original text node.
              const leading = (child.data.match(/^\s*/) || [''])[0];
              const trailing = (child.data.match(/\s*$/) || [''])[0];
              child.data = `${leading}${titleReplacement}${trailing}`;
            }
          } else {
            walkAndReplace(child);
          }
        });
      }
    };

    const bodyNode = $('body').get(0);
    if (bodyNode) walkAndReplace(bodyNode);

    // 3.1b Leaf-element pass — also covers any element whose whole text equals a target
    // (e.g. <strong>OLD TITLE</strong>), setting the full new text safely.
    $('*').each((_, el: any) => {
      const tag = el.tagName?.toLowerCase();
      if (['script', 'style', 'noscript', 'template', 'title'].includes(tag)) return;

      const $el = $(el);
      if ($el.children().length > 0) return; // leaf only

      const text = normalize($el.text());
      if (targets.has(text)) {
        $el.text(text === originalHeadTitleText ? titleReplacement : newH1Text);
      }
    });
  }

  // Replace FAQ if existing
  // Question selectors include <strong>/<b> because many templates use bold text for questions.
  const FAQ_Q_SELECTOR = 'dt, .faq-q, [class*="faq-q"], .faq-question, [class*="faq-question"], .question, [class*="question"], summary, h3, h4, h5, strong, b, button';
  const FAQ_A_SELECTOR = 'dd, .faq-a, [class*="faq-a"], .faq-answer, [class*="faq-answer"], .answer, [class*="answer"], p, div';

  let faqIdx = 0;

  // 1. Explicit FAQ item cards (.faq-card, .faq-item, .accordion-item, .faq-box, ...)
  const $faqItems = $(
    '.faq-card, .faq-item, .accordion-item, .faq-box, [class*="faq-card"], [class*="faq-item"], [class*="faq-box"], [class*="qa-item"]'
  );
  $faqItems.each((_, item) => {
    if (faqIdx >= generatedContent.faqs.length) return;
    const $item = $(item);
    const qEl = $item.find(FAQ_Q_SELECTOR).first();
    if (qEl.length === 0) return; // do not consume an index if there is no question target

    const $a = $item.find(FAQ_A_SELECTOR).not(qEl).first();
    const faq = generatedContent.faqs[faqIdx++];
    safeSetText($, qEl.get(0), faq.question);
    if ($a.length > 0) {
      safeSetText($, $a.get(0), faq.answer);
    }
  });

  // 2. Generic containers or details
  if (faqIdx === 0) {
    $('.faq, [class*="faq"], [id*="faq"], details').each((_, container) => {
      if (faqIdx >= generatedContent.faqs.length) return;
      const $c = $(container);
      if ($c.find('.faq-card, .faq-item, .accordion-item, .faq-box, [class*="faq-box"]').length > 0) return;

      if (container.tagName.toLowerCase() === 'details') {
        const $summary = $c.find('summary').first();
        const $a = $c.find('p, div').not('summary').first();
        if ($summary.length === 0) return;
        const faq = generatedContent.faqs[faqIdx++];
        safeSetText($, $summary.get(0), faq.question);
        if ($a.length > 0) safeSetText($, $a.get(0), faq.answer);
      } else {
        const q = $c.find(FAQ_Q_SELECTOR).first();
        if (q.length === 0) return;
        const a = $c.find(FAQ_A_SELECTOR).not(q).first();
        const faq = generatedContent.faqs[faqIdx++];
        safeSetText($, q.get(0), faq.question);
        if (a.length > 0) safeSetText($, a.get(0), faq.answer);
      }
    });
  }

  // Replace Paragraphs (prefer slot stamps for exact targeting)
  const pIds = slotIdByType('PARAGRAPH');
  if (pIds.length > 0 && stampedIds.size > 0) {
    generatedContent.paragraphs.forEach((text, i) => {
      const stamp = pIds[i];
      if (!stamp || !stampedIds.has(stamp)) return;
      const el = $(`[data-src-slot="${stamp}"]`).get(0);
      if (el) safeSetText($, el, text);
    });
  } else {
    let pIdx = 0;
    $('p').each((_, el) => {
      const $el = $(el);
      if ($el.closest('nav, header, footer, script, style, .faq, [class*="faq"], .review, [class*="review"], [class*="testimonial"]').length > 0) {
        return;
      }
      if (pIdx < generatedContent.paragraphs.length) {
        safeSetText($, el, generatedContent.paragraphs[pIdx++]);
      }
    });
  }

  // Replace Reviews (e.g. .review in megasicbo.com)
  let revIdx = 0;
  $('.review, .review-card, [class*="review-card"], [class*="review-item"], .testimonial, [class*="testimonial"]').each((_, el) => {
    const $el = $(el);
    if ($el.find('.review, .review-card, .testimonial').length > 0 && !$el.hasClass('review')) {
      return;
    }
    const rawText = $el.text().trim();
    if (/review terbaru|ulasan terbaru/i.test(rawText)) return;

    if (revIdx < generatedContent.reviews.length) {
      const r = generatedContent.reviews[revIdx++];
      const authorEl = $el.find('.review-name, [class*="review-name"], .author, [class*="author"], .name').first();
      if (authorEl.length > 0 && r.author) {
        authorEl.text(r.author);
      }
      const target = $el.find('.review-text, [class*="review-text"], blockquote, .testimonial-text, p').first();
      if (target.length > 0) {
        target.text(r.text);
      } else {
        $el.text(r.text);
      }
    }
  });

  // 4. Asset Replacement (Section 14, 15, 16)
  const assetMap = replacementMap.assets || {};
  Object.entries(assetMap).forEach(([oldUrl, newUrl]) => {
    if (!newUrl || newUrl.trim() === '' || newUrl === oldUrl) return;

    // img src
    $(`img[src="${oldUrl}"]`).attr('src', newUrl);
    $('img').each((_, el) => {
      const $img = $(el);
      if ($img.attr('src') === oldUrl) $img.attr('src', newUrl);
      const srcset = $img.attr('srcset');
      if (srcset && srcset.includes(oldUrl)) {
        $img.attr('srcset', srcset.split(oldUrl).join(newUrl));
      }
    });

    // picture source
    $('picture source').each((_, el) => {
      const $src = $(el);
      const srcset = $src.attr('srcset');
      if (srcset && srcset.includes(oldUrl)) {
        $src.attr('srcset', srcset.split(oldUrl).join(newUrl));
      }
    });

    // link icon
    $(`link[rel*="icon" i][href="${oldUrl}"]`).attr('href', newUrl);

    // og:image
    $(`meta[property="og:image" i][content="${oldUrl}"]`).attr('content', newUrl);

    // background image in styles
    $('[style*="url"]').each((_, el) => {
      const $el = $(el);
      const style = $el.attr('style') || '';
      if (style.includes(oldUrl)) {
        $el.attr('style', style.split(oldUrl).join(newUrl));
      }
    });
  });

  // 5. Link Replacement (Section 17, 18, 19, 21)
  const linkMap = replacementMap.links || {};
  Object.entries(linkMap).forEach(([oldLink, newLink]) => {
    if (!newLink || newLink.trim() === '' || newLink === oldLink) return;

    // Exact href match
    $(`a[href="${oldLink}"]`).attr('href', newLink);
    $(`link[href="${oldLink}"]`).attr('href', newLink);
    $(`form[action="${oldLink}"]`).attr('action', newLink);
  });

  // 6. Semantic Brand Replacement in Text Nodes (Section 8)
  // Safely replace old brand in body text nodes without altering script/style/attributes
  if (oldBrand && oldBrand !== 'UNKNOWN_BRAND' && oldBrand.length >= 3) {
    const brandRegex = new RegExp(escapeRegex(oldBrand), 'gi');

    // Replace in title & meta alt
    $('img').each((_, el) => {
      const alt = $(el).attr('alt');
      if (alt && brandRegex.test(alt)) {
        $(el).attr('alt', alt.replace(brandRegex, newBrand));
      }
      const titleAttr = $(el).attr('title');
      if (titleAttr && brandRegex.test(titleAttr)) {
        $(el).attr('title', titleAttr.replace(brandRegex, newBrand));
      }
    });

    // Replace in aria-labels
    $('[aria-label]').each((_, el) => {
      const label = $(el).attr('aria-label');
      if (label && brandRegex.test(label)) {
        $(el).attr('aria-label', label.replace(brandRegex, newBrand));
      }
    });

    // Recursive walk on all text nodes inside body, skipping script, style, noscript, template
    const walkTextNodes = (node: any) => {
      if (!node) return;
      if (node.type === 'tag' && ['script', 'style', 'noscript', 'template'].includes(node.name?.toLowerCase())) {
        return;
      }
      if (node.type === 'text' && node.data) {
        if (brandRegex.test(node.data)) {
          node.data = node.data.replace(brandRegex, newBrand);
        }
      }
      if (node.children && node.children.length > 0) {
        node.children.forEach((child: any) => walkTextNodes(child));
      }
    };

    const bodyNode = $('body').get(0);
    if (bodyNode) {
      walkTextNodes(bodyNode);
    }
  }

  // 7. Strip internal slot markers (data-src-slot) — they are internal bookkeeping only
  // and must never leak into the final exported HTML.
  $('[data-src-slot]').removeAttr('data-src-slot');

  return $.html();
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function escapeAttr(str: string): string {
  return str.replace(/"/g, '&quot;');
}
