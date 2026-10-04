import { ParsedHtmlResult } from './parser';
import { AnalysisReport, StructureCounts } from './types';

export function analyzeReference(
  parsed: ParsedHtmlResult,
  targetUrl: string,
  newTitle: string,
  newBrand: string
): AnalysisReport {
  const h1Slots = parsed.contentSlots.filter((s) => s.type === 'H1');
  const h2Slots = parsed.contentSlots.filter((s) => s.type === 'H2');
  const h3Slots = parsed.contentSlots.filter((s) => s.type === 'H3');
  const h4Slots = parsed.contentSlots.filter((s) => s.type === 'H4');
  const pSlots = parsed.contentSlots.filter((s) => s.type === 'PARAGRAPH');
  const faqQSlots = parsed.contentSlots.filter((s) => s.type === 'FAQ_QUESTION');
  const reviewSlots = parsed.contentSlots.filter((s) => s.type === 'REVIEW_TEXT');

  const totalWords = parsed.contentSlots.reduce((acc, slot) => acc + slot.originalWordCount, 0);

  // Determine writing style based on vocabulary
  const allText = parsed.contentSlots.map((s) => s.originalText).join(' ');
  let writingStyle = 'Informatif, SEO-focused, persuasif promosi';
  if (/ilmiah|penelitian|data statistik/i.test(allText)) {
    writingStyle = 'Akademik & Formal';
  } else if (/tutorial|cara|langkah/i.test(allText)) {
    writingStyle = 'Edukasi & Panduan Praktis';
  } else if (/slot|gacor|maxwin|jackpot|rtp/i.test(allText)) {
    writingStyle = 'iGaming / Promosi Kasino Online Santai & Mengajak';
  }

  const structure: StructureCounts = {
    h1: h1Slots.length,
    h2: h2Slots.length,
    h3: h3Slots.length,
    h4: h4Slots.length,
    paragraphs: pSlots.length,
    faqCount: faqQSlots.length,
    reviewCount: reviewSlots.length,
    totalWords,
    writingStyle,
  };

  // Keyword extraction from New Title (Section 9, 12)
  const keywords = extractKeywordsFromTitle(newTitle, newBrand);

  const report: AnalysisReport = {
    url: targetUrl,
    detectedOldBrand: parsed.detectedOldBrand,
    metadata: parsed.metadata,
    structure,
    faq: {
      hasFaq: faqQSlots.length > 0,
      count: faqQSlots.length,
      pattern: faqQSlots.length > 0 ? 'Accordion / Q&A Definition List' : 'Tidak ada FAQ',
    },
    review: {
      hasReview: reviewSlots.length > 0,
      count: reviewSlots.length,
      pattern: reviewSlots.length > 0 ? 'User Testimonial Cards' : 'Tidak ada Review',
      isPlaceholder: reviewSlots.length > 0,
    },
    additionalElements: parsed.additionalElements,
    keywords,
    blueprint: parsed.blueprint,
    domTreeOutline: parsed.domTreeOutline,
  };

  return report;
}

export function formatReferenceAnalysisOutput(report: AnalysisReport): string {
  const lines: string[] = [];
  lines.push('# A. ANALISIS REFERENSI\n');
  lines.push(`URL: ${report.url}\n`);

  lines.push('META:');
  lines.push(`- Meta title: [${report.metadata.title.status}] ${report.metadata.title.value || '-'}`);
  lines.push(`- Meta description: [${report.metadata.description.status}] ${report.metadata.description.value || '-'}`);
  lines.push(`- Robots: [${report.metadata.robots.status}] ${report.metadata.robots.value || '-'}`);
  lines.push(`- Canonical: [${report.metadata.canonical.status}] ${report.metadata.canonical.value || '-'}`);
  lines.push(`- OG Title: [${report.metadata.ogTitle.status}] ${report.metadata.ogTitle.value || '-'}`);
  lines.push(`- OG Description: [${report.metadata.ogDescription.status}] ${report.metadata.ogDescription.value || '-'}\n`);

  lines.push('STRUKTUR:');
  lines.push(`- H1: ${report.structure.h1}`);
  lines.push(`- H2: ${report.structure.h2}`);
  lines.push(`- H3: ${report.structure.h3}`);
  lines.push(`- Paragraf: ${report.structure.paragraphs}`);
  lines.push(`- Estimasi jumlah kata: ~${report.structure.totalWords} kata`);
  lines.push(`- Gaya penulisan: ${report.structure.writingStyle}\n`);

  lines.push('FAQ:');
  lines.push(`- Status: ${report.faq.hasFaq ? 'Ada' : 'Tidak ada'}`);
  lines.push(`- Jumlah: ${report.faq.count}`);
  lines.push(`- Pola: ${report.faq.pattern}\n`);

  lines.push('REVIEW:');
  lines.push(`- Status: ${report.review.hasReview ? 'Ada' : 'Tidak ada'}`);
  lines.push(`- Jumlah: ${report.review.count}`);
  lines.push(`- Pola: ${report.review.pattern}\n`);

  lines.push('ELEMEN TAMBAHAN:');
  if (report.additionalElements.length > 0) {
    report.additionalElements.forEach((el) => lines.push(`- ${el}`));
  } else {
    lines.push('- Tidak ada elemen tambahan khusus');
  }
  lines.push('');

  lines.push('KEYWORD:');
  lines.push(`- Primary keyword: ${report.keywords.primary}`);
  lines.push(`- Secondary keywords: ${report.keywords.secondary.join(', ')}`);
  lines.push(`- Related terms: ${report.keywords.related.join(', ')}\n`);

  lines.push('BLUEPRINT:');
  report.blueprint.forEach((b) => {
    lines.push(`${b.order}. ${b.section} [${b.elements.join(', ')}]`);
  });

  return lines.join('\n');
}

function extractKeywordsFromTitle(newTitle: string, newBrand: string) {
  const parts = newTitle.split(/[|\-—–:]/).map((s) => s.trim());
  let primary = '';
  const secondary: string[] = [];
  const related: string[] = [];

  const mainPhrase = parts.find((p) => !p.toLowerCase().includes(newBrand.toLowerCase())) || parts[0];
  primary = mainPhrase;

  const words = mainPhrase
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 3 && !['menuju', 'untuk', 'dengan', 'yang', 'dari'].includes(w.toLowerCase()));

  for (let i = 0; i < words.length - 1; i += 2) {
    secondary.push(`${words[i]} ${words[i + 1]}`);
  }
  if (secondary.length === 0) {
    secondary.push(`${newBrand} Online`, `Daftar ${newBrand}`, `Link ${newBrand}`);
  }

  related.push(`Situs ${newBrand}`, `Login Resmi`, `Akses Alternatif`, `Terpercaya 2026`);

  return {
    primary,
    secondary: secondary.slice(0, 3),
    related: related.slice(0, 4),
  };
}
