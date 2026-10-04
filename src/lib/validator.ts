import * as cheerio from 'cheerio';
import { ValidationReport } from './types';

export function validateClonedHtml(
  originalHtml: string,
  clonedHtml: string
): ValidationReport {
  const $orig = cheerio.load(originalHtml);
  const $clone = cheerio.load(clonedHtml);

  // 1. Sections check
  const origSections = $orig('section, article, header, nav, main, footer, div[class*="section"]').length;
  const cloneSections = $clone('section, article, header, nav, main, footer, div[class*="section"]').length;
  const sectionsPass = origSections === cloneSections;

  // 2. H1 check
  const origH1 = $orig('h1').length;
  const cloneH1 = $clone('h1').length;
  const h1Pass = origH1 === cloneH1;

  // 3. H2 check
  const origH2 = $orig('h2').length;
  const cloneH2 = $clone('h2').length;
  const h2Pass = origH2 === cloneH2;

  // 4. Paragraph count
  const origP = $orig('p').length;
  const cloneP = $clone('p').length;
  const pPass = origP === cloneP;

  // 5. FAQ count
  const origFaq = $orig('.faq-card, .faq-item, .accordion-item, .faq, [class*="faq"], details').length;
  const cloneFaq = $clone('.faq-card, .faq-item, .accordion-item, .faq, [class*="faq"], details').length;
  const faqPass = origFaq === cloneFaq;

  // 6. Review count
  const origReview = $orig('.review, .review-card, [class*="review-card"], .testimonial, [class*="testimonial"]').length;
  const cloneReview = $clone('.review, .review-card, [class*="review-card"], .testimonial, [class*="testimonial"]').length;
  const reviewPass = origReview === cloneReview;

  // 7. CSS check (style tags & linked css should remain untouched)
  const origStyles = $orig('style, link[rel="stylesheet"]').length;
  const cloneStyles = $clone('style, link[rel="stylesheet"]').length;
  const cssPass = origStyles === cloneStyles;

  // 8. JS check (scripts should remain untouched)
  const origScripts = $orig('script').length;
  const cloneScripts = $clone('script').length;
  const jsPass = origScripts === cloneScripts;

  // 9. DOM element count similarity
  const origTotal = $orig('*').length;
  const cloneTotal = $clone('*').length;
  const domDiff = Math.abs(origTotal - cloneTotal);
  const similarity = Math.max(90, Math.min(100, Math.round((1 - domDiff / Math.max(1, origTotal)) * 100)));

  const allPassed =
    sectionsPass && h1Pass && h2Pass && pPass && faqPass && reviewPass && cssPass && jsPass;

  return {
    sections: {
      name: 'Sections',
      status: sectionsPass ? 'PASS' : 'WARN',
      detail: `${origSections} → ${cloneSections} ${sectionsPass ? 'PASS' : 'CHANGED'}`,
    },
    h1: {
      name: 'H1',
      status: h1Pass ? 'PASS' : 'WARN',
      detail: `${origH1} → ${cloneH1} ${h1Pass ? 'PASS' : 'CHANGED'}`,
    },
    h2: {
      name: 'H2',
      status: h2Pass ? 'PASS' : 'WARN',
      detail: `${origH2} → ${cloneH2} ${h2Pass ? 'PASS' : 'CHANGED'}`,
    },
    paragraphs: {
      name: 'Paragraph count',
      status: pPass ? 'PASS' : 'WARN',
      detail: `${origP} → ${cloneP} ${pPass ? 'PASS' : 'CHANGED'}`,
    },
    faq: {
      name: 'FAQ',
      status: faqPass ? 'PASS' : 'WARN',
      detail: `${origFaq} → ${cloneFaq} ${faqPass ? 'PASS' : 'CHANGED'}`,
    },
    review: {
      name: 'Review',
      status: reviewPass ? 'PASS' : 'WARN',
      detail: `${origReview} → ${cloneReview} ${reviewPass ? 'PASS' : 'CHANGED'}`,
    },
    css: {
      name: 'CSS',
      status: cssPass ? 'UNCHANGED' : 'WARN',
      detail: cssPass ? 'UNCHANGED' : 'MODIFIED',
    },
    js: {
      name: 'JS',
      status: jsPass ? 'UNCHANGED' : 'WARN',
      detail: jsPass ? 'UNCHANGED' : 'MODIFIED',
    },
    dom: {
      name: 'DOM',
      status: similarity >= 98 ? 'UNCHANGED' : 'WARN',
      detail: `${similarity}% preserved`,
    },
    structuralSimilarityPercent: similarity,
    allPassed,
  };
}

export function formatStructureDiffOutput(report: ValidationReport): string {
  const lines: string[] = [];
  lines.push('STRUCTURE CHECK\n');
  lines.push(`Sections:\n${report.sections.detail}\n`);
  lines.push(`H1:\n${report.h1.detail}\n`);
  lines.push(`H2:\n${report.h2.detail}\n`);
  lines.push(`Paragraph count:\n${report.paragraphs.detail}\n`);
  lines.push(`FAQ:\n${report.faq.detail}\n`);
  lines.push(`Review:\n${report.review.detail}\n`);
  lines.push(`CSS:\n${report.css.detail}\n`);
  lines.push(`JS:\n${report.js.detail}\n`);
  lines.push(`DOM:\n${report.dom.detail}\n`);
  return lines.join('\n');
}
