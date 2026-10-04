import test from 'node:test';
import assert from 'node:assert';
import * as cheerio from 'cheerio';
import fs from 'node:fs';
import path from 'node:path';
import { parseReferenceHtml } from '../src/lib/parser';
import { analyzeReference, formatReferenceAnalysisOutput } from '../src/lib/analyzer';
import { generateSeoContent, formatContentOutput, generateIndonesianReviewers } from '../src/lib/content-engine';
import { executeReplacement } from '../src/lib/slot-replacer';
import { validateClonedHtml, formatStructureDiffOutput } from '../src/lib/validator';
import { ReplacementMap } from '../src/lib/types';

const sampleHtml = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>ALEXISTOGEL | Situs Slot & Togel Online Resmi</title>
  <meta name="description" content="ALEXISTOGEL menyediakan pasaran togel terbaik dan koleksi game slot gacor.">
  <link rel="canonical" href="https://alexistogel.com/">
  <link rel="icon" href="https://alexistogel.com/favicon.ico">
  <style>.custom-css { color: red; }</style>
  <script>console.log("ALEXISTOGEL_SYS_INIT");</script>
</head>
<body>
  <div class="header-container" id="main-header">
    <img src="https://alexistogel.com/assets/logo.webp" alt="ALEXISTOGEL Logo">
    <a href="/register" class="btn-reg">Daftar</a>
    <a href="/register" class="btn-reg-2">Daftar Lagi</a>
  </div>
  <main class="main-body">
    <h1>ALEXISTOGEL | Situs Slot & Togel Online Resmi</h1>
    <p>Selamat datang di ALEXISTOGEL tempat bermain paling seru dengan peluang kemenangan fantastis setiap saat.</p>
    <h2>Keunggulan Fitur ALEXISTOGEL</h2>
    <p>Platform ALEXISTOGEL menghadirkan kecepatan transaksi deposit dan withdraw instan tanpa antre panjang.</p>
    <p>Dukungan enkripsi tingkat tinggi di ALEXISTOGEL menjamin keamanan akun seluruh pengunjung secara menyeluruh.</p>
    <div class="faq">
      <div class="faq-item">
        <h3 class="faq-question">Bagaimana cara mendaftar di ALEXISTOGEL?</h3>
        <p class="faq-answer">Buka halaman registrasi dan lengkapi data profil secara akurat.</p>
      </div>
      <div class="faq-item">
        <h3 class="faq-question">Apakah ada layanan pelanggan di ALEXISTOGEL?</h3>
        <p class="faq-answer">Layanan live chat tersedia 24 jam nonstop untuk membantu kendala Anda.</p>
      </div>
    </div>
    <div class="review">
      <div class="review-card">
        <p>Main di ALEXISTOGEL sangat puas dan withdraw cepat masuk.</p>
      </div>
    </div>
  </main>
  <footer>
    <img src="https://alexistogel.com/assets/logo.webp" alt="ALEXISTOGEL Footer Logo">
    <p>&copy; 2026 ALEXISTOGEL. All rights reserved.</p>
  </footer>
</body>
</html>`;

test('1. Parser & Grouping Test', () => {
  const parsed = parseReferenceHtml(sampleHtml, 'https://alexistogel.com/');

  // Check detected old brand
  assert.strictEqual(parsed.detectedOldBrand, 'ALEXISTOGEL');

  // Check metadata
  assert.strictEqual(parsed.metadata.title.status, 'FOUND');
  assert.strictEqual(parsed.metadata.description.status, 'FOUND');
  assert.strictEqual(parsed.metadata.robots.status, 'NOT FOUND');

  // Check asset grouping (logo appears in header and footer -> 1 entry with occurrences 2)
  const logoAsset = parsed.assets.find((a) => a.originalUrl.includes('logo.webp'));
  assert.ok(logoAsset, 'Logo asset should be detected');
  assert.strictEqual(logoAsset.occurrences, 2, 'Logo should have 2 occurrences grouped');
  assert.strictEqual(logoAsset.role, 'LOGO');

  // Check link grouping (/register appears 2 times -> 1 entry with occurrences 2)
  const regLink = parsed.links.find((l) => l.originalUrl === '/register');
  assert.ok(regLink, 'Register link should be detected');
  assert.strictEqual(regLink.occurrences, 2, 'Link occurrences should be grouped to 2');
  assert.strictEqual(regLink.isRelative, true, 'Link format relative should be preserved');

  // Check content slots
  assert.ok(parsed.contentSlots.length >= 6, 'Should extract content slots');
  assert.ok(parsed.contentSlots.some((s) => s.type === 'H1'));
  assert.ok(parsed.contentSlots.some((s) => s.type === 'H2'));
  assert.ok(parsed.contentSlots.some((s) => s.type === 'FAQ_QUESTION'));
});

test('2. Analyzer & SEO Blueprint Test', () => {
  const parsed = parseReferenceHtml(sampleHtml, 'https://alexistogel.com/');
  const report = analyzeReference(
    parsed,
    'https://alexistogel.com/',
    'SAKAUTOTO | Perjalanan Mencari Kitab Suci Menuju Situs Toto Slot Gacor',
    'SAKAUTOTO'
  );

  assert.strictEqual(report.structure.h1, 1);
  assert.strictEqual(report.structure.h2, 1);
  assert.strictEqual(report.faq.count, 2);
  assert.strictEqual(report.faq.hasFaq, true);
  assert.strictEqual(report.keywords.primary, 'Perjalanan Mencari Kitab Suci Menuju Situs Toto Slot Gacor');

  const formatted = formatReferenceAnalysisOutput(report);
  assert.ok(formatted.includes('# A. ANALISIS REFERENSI'));
  assert.ok(formatted.includes('H1: 1'));
  assert.ok(formatted.includes('FAQ:'));
});

test('3. Content Engine Golden Rules (Element & Word Count Preservation)', async () => {
  const parsed = parseReferenceHtml(sampleHtml, 'https://alexistogel.com/');
  const report = analyzeReference(
    parsed,
    'https://alexistogel.com/',
    'SAKAUTOTO | Perjalanan Mencari Kitab Suci Menuju Situs Toto Slot Gacor',
    'SAKAUTOTO'
  );

  const newContent = await generateSeoContent(
    report,
    parsed.contentSlots,
    'SAKAUTOTO',
    'SAKAUTOTO | Perjalanan Mencari Kitab Suci Menuju Situs Toto Slot Gacor'
  );

  // Exact paragraph and FAQ counts preserved
  const pSlotsCount = parsed.contentSlots.filter((s) => s.type === 'PARAGRAPH').length;
  assert.strictEqual(newContent.paragraphs.length, pSlotsCount);
  assert.strictEqual(newContent.faqs.length, 2);
  assert.ok(newContent.h1[0].includes('SAKAUTOTO'));

  const formatted = formatContentOutput(newContent);
  assert.ok(formatted.includes('# B. HASIL KONTEN'));
  assert.ok(formatted.includes('META TITLE:'));
  assert.ok(formatted.includes('SAKAUTOTO'));
});

test('4. Replacement Engine & DOM Preservation Test', async () => {
  const parsed = parseReferenceHtml(sampleHtml, 'https://alexistogel.com/');
  const report = analyzeReference(
    parsed,
    'https://alexistogel.com/',
    'SAKAUTOTO | Perjalanan Mencari Kitab Suci Menuju Situs Toto Slot Gacor',
    'SAKAUTOTO'
  );
  const newContent = await generateSeoContent(
    report,
    parsed.contentSlots,
    'SAKAUTOTO',
    'SAKAUTOTO | Perjalanan Mencari Kitab Suci Menuju Situs Toto Slot Gacor'
  );

  const replacementMap: ReplacementMap = {
    brand: {
      old: 'ALEXISTOGEL',
      new: 'SAKAUTOTO',
    },
    title: {
      new: 'SAKAUTOTO | Perjalanan Mencari Kitab Suci Menuju Situs Toto Slot Gacor',
    },
    assets: {
      'https://alexistogel.com/assets/logo.webp': 'https://sakautoto.com/assets/new-logo.webp',
    },
    links: {
      '/register': '/daftar-sakautoto',
    },
    contentSlots: {},
  };

  const finalHtml = executeReplacement({
    originalHtml: sampleHtml,
    replacementMap,
    generatedContent: newContent,
    contentSlots: parsed.contentSlots,
  });

  // Verify structure is preserved (classes and ids stay locked)
  assert.ok(finalHtml.includes('class="header-container"'));
  assert.ok(finalHtml.includes('id="main-header"'));
  assert.ok(finalHtml.includes('.custom-css { color: red; }'), 'CSS style block preserved');
  assert.ok(finalHtml.includes('console.log("ALEXISTOGEL_SYS_INIT");'), 'Scripts must remain untouched');

  // Verify assets replaced
  assert.ok(finalHtml.includes('https://sakautoto.com/assets/new-logo.webp'));
  assert.ok(!finalHtml.includes('https://alexistogel.com/assets/logo.webp'));

  // Verify links replaced
  assert.ok(finalHtml.includes('href="/daftar-sakautoto"'));
  assert.ok(!finalHtml.includes('href="/register"'));

  // Verify title and brand replaced
  assert.ok(finalHtml.includes('<title>SAKAUTOTO | Perjalanan Mencari Kitab Suci Menuju Situs Toto Slot Gacor</title>'));

  // Verify validation diff check
  const val = validateClonedHtml(sampleHtml, finalHtml);
  assert.strictEqual(val.allPassed, true);
  assert.strictEqual(val.css.status, 'UNCHANGED');
  assert.strictEqual(val.js.status, 'UNCHANGED');
  assert.strictEqual(val.structuralSimilarityPercent, 100);

  const diffStr = formatStructureDiffOutput(val);
  assert.ok(diffStr.includes('STRUCTURE CHECK'));
  assert.ok(diffStr.includes('PASS'));
});

test('5. H1/Title Mirror Synchronization Test (tuttobene.cl case)', async () => {
  const mirrorHtml = `<!DOCTYPE html>
<html lang="id">
<head>
  <title>GEMBIRATOTO - Binggung Cari Link Gacor ? Buruan Login</title>
</head>
<body>
  <div class="page-wrapper">
    <div class="sticky-name">
      <div class="sticky-product-name">GEMBIRATOTO - Binggung Cari Link Gacor ? Buruan Login</div>
    </div>
    <li class="item product">
      <strong>GEMBIRATOTO - Binggung Cari Link Gacor ? Buruan Login</strong>
    </li>
    <div class="product attribute mobile-name">
      <div class="value">GEMBIRATOTO - Binggung Cari Link Gacor ? Buruan Login</div>
    </div>
    <div class="page-title-wrapper product">
      <h1 class="page-title">
        <span class="base">GEMBIRATOTO - Binggung Cari Link Gacor ? Buruan Login</span>
      </h1>
    </div>
  </div>
</body>
</html>`;

  const parsed = parseReferenceHtml(mirrorHtml, 'https://tuttobene.cl/');
  const report = analyzeReference(
    parsed,
    'https://tuttobene.cl/',
    'SAKAUTOTO | Perjalanan Mencari Kitab Suci Menuju Situs Toto Slot Gacor',
    'SAKAUTOTO'
  );

  const newContent = await generateSeoContent(
    report,
    parsed.contentSlots,
    'SAKAUTOTO',
    'SAKAUTOTO | Perjalanan Mencari Kitab Suci Menuju Situs Toto Slot Gacor'
  );

  const finalHtml = executeReplacement({
    originalHtml: mirrorHtml,
    replacementMap: {
      brand: { old: 'GEMBIRATOTO', new: 'SAKAUTOTO' },
      title: { new: 'SAKAUTOTO | Perjalanan Mencari Kitab Suci Menuju Situs Toto Slot Gacor' },
      assets: {},
      links: {},
      contentSlots: {},
    },
    generatedContent: newContent,
    contentSlots: parsed.contentSlots,
  });

  const $final = cheerio.load(finalHtml);

  // All mirrors must be synchronized to the new H1/title text, not just the leading brand
  const newTitle = 'SAKAUTOTO | Perjalanan Mencari Kitab Suci Menuju Situs Toto Slot Gacor';
  assert.strictEqual($final('h1').text().trim(), newTitle);
  assert.strictEqual($final('.sticky-product-name').text().trim(), newTitle);
  assert.strictEqual($final('.mobile-name .value').text().trim(), newTitle);
  assert.strictEqual($final('.item.product strong').text().trim(), newTitle);

  // No leftover old brand phrase fragments in the mirrors
  assert.ok(!$final('.sticky-product-name').text().includes('Binggung Cari Link Gacor'));
  assert.ok(!$final('.mobile-name .value').text().includes('Binggung Cari Link Gacor'));

  // Only one <title> tag remains in head
  assert.strictEqual($final('head title').length, 1);
  assert.strictEqual($final('head title').text().trim(), newTitle);
});

test('6. FAQ Structure Preservation (block inside heading + strong/p) Test', async () => {
  // Reproduces tuttobene.cl: FAQ section nested INSIDE an <h2> (invalid HTML) and
  // FAQ items built with <strong> question + <p> answer inside .faq-box.
  const faqHtml = `<!DOCTYPE html>
<html lang="id">
<head>
  <title>GEMBIRATOTO - Binggung Cari Link Gacor ?</title>
</head>
<body>
  <div class="content FAQ">
    <h2>FAQ TENTANG GEMBIRATOTO</h2>
    <section>
      <h2>
        <div class="faq-box">
          <strong>Apa itu GEMBIRATOTO?</strong>
          <p>GEMBIRATOTO adalah situs toto slot terpercaya.</p>
        </div>
        <div class="faq-box">
          <strong>Bagaimana cara login GEMBIRATOTO?</strong>
          <p>Buka link resmi lalu masukkan username dan password.</p>
        </div>
        <div class="faq-box">
          <strong>Apakah GEMBIRATOTO gampang maxwin?</strong>
          <p>GEMBIRATOTO menyediakan banyak permainan RTP kompetitif.</p>
        </div>
      </h2>
    </section>
  </div>
  <section class="normal">
    <p>Paragraf biasa dengan <a href="/promo">link promo</a> dan <strong>tebal</strong> di dalamnya.</p>
  </section>
</body>
</html>`;

  const $before = cheerio.load(faqHtml);
  const beforeCounts = {
    faqBox: $before('.faq-box').length,
    strong: $before('strong').length,
    p: $before('p').length,
    section: $before('section').length,
    a: $before('a').length,
  };

  const parsed = parseReferenceHtml(faqHtml, 'https://tuttobene.cl/');
  const report = analyzeReference(
    parsed,
    'https://tuttobene.cl/',
    'SAKAUTOTO | Perjalanan Mencari Kitab Suci Menuju Situs Toto Slot Gacor',
    'SAKAUTOTO'
  );

  // FAQ must be captured from .faq-box (strong question + p answer)
  assert.strictEqual(report.faq.count, 3, 'FAQ questions must be detected from .faq-box');

  const newContent = await generateSeoContent(
    report,
    parsed.contentSlots,
    'SAKAUTOTO',
    'SAKAUTOTO | Perjalanan Mencari Kitab Suci Menuju Situs Toto Slot Gacor'
  );

  const finalHtml = executeReplacement({
    originalHtml: faqHtml,
    replacementMap: {
      brand: { old: 'GEMBIRATOTO', new: 'SAKAUTOTO' },
      title: { new: 'SAKAUTOTO | Perjalanan Mencari Kitab Suci Menuju Situs Toto Slot Gacor' },
      assets: {},
      links: {},
      contentSlots: {},
    },
    generatedContent: newContent,
    contentSlots: parsed.contentSlots,
  });

  const $final = cheerio.load(finalHtml);

  // 1. Structure must be 100% preserved (no .faq-box destroyed)
  assert.strictEqual($final('.faq-box').length, beforeCounts.faqBox, '.faq-box count must be preserved');
  assert.strictEqual($final('strong').length, beforeCounts.strong, 'strong tags must be preserved');
  assert.strictEqual($final('p').length, beforeCounts.p, 'p tags must be preserved');
  assert.strictEqual($final('section').length, beforeCounts.section, 'section tags must be preserved');
  assert.strictEqual($final('a').length, beforeCounts.a, 'links must be preserved (inline children)');

  // 2. Each faq-box must keep its strong (question) + p (answer) children intact
  $final('.faq-box').each((_, el) => {
    const $item = $final(el);
    assert.strictEqual($item.children('strong').length, 1, 'each faq-box keeps exactly one <strong> question');
    assert.strictEqual($item.children('p').length, 1, 'each faq-box keeps exactly one <p> answer');
  });

  // 3. FAQ content replaced in-order: question stays in <strong>, answer in <p>
  assert.strictEqual($final('.faq-box strong').first().text().trim(), newContent.faqs[0].question);
  assert.strictEqual($final('.faq-box p').first().text().trim(), newContent.faqs[0].answer);
  assert.strictEqual($final('.faq-box strong').length, newContent.faqs.length);

  // 4. Inline structure inside normal paragraph preserved (a + strong survive)
  const $para = $final('.normal p').first();
  assert.strictEqual($para.find('a').length, 1, 'inline <a> inside paragraph must survive');
  assert.strictEqual($para.find('strong').length, 1, 'inline <strong> inside paragraph must survive');

  // 5. No old brand leftovers inside FAQ blocks
  assert.ok(!$final('.faq-box').text().includes('GEMBIRATOTO'), 'old brand must be fully replaced in FAQ');
});

test('7. Wrapper Heading Locked + Slot-Stamp Integrity Test (tuttobene.cl)', async () => {
  // Reproduces the "content miss" bug: an <h2> wrapper that owns NO direct text but
  // embeds a whole <section> with the FAQ. It must be treated as a LOCKED structural
  // container (not a content slot), and the parser must NOT report its descendant text
  // as the heading's original text. The replacement must target exact DOM via slot stamps.
  const html = `<!DOCTYPE html>
<html lang="id">
<head><title>GEMBIRATOTO - Binggung Cari Link Gacor</title></head>
<body>
  <div class="content FAQ">
    <h2>FAQ TENTANG GEMBIRATOTO</h2>
    <section>
      <h2>
        <div class="faq-box"><strong>Apa itu GEMBIRATOTO?</strong><p>GEMBIRATOTO adalah situs toto slot.</p></div>
        <div class="faq-box"><strong>Bagaimana cara login GEMBIRATOTO?</strong><p>Buka link resmi lalu login.</p></div>
      </h2>
    </section>
  </div>
  <p>Paragraf biasa tentang GEMBIRATOTO.</p>
</body>
</html>`;

  const parsed = parseReferenceHtml(html, 'https://tuttobene.cl/');

  // The wrapper <h2> (no direct text) must NOT be captured as an H2 content slot.
  const h2Slots = parsed.contentSlots.filter((s) => s.type === 'H2');
  assert.strictEqual(
    h2Slots.length,
    1,
    'only the real content H2 (FAQ TENTANG ...) is a slot; the wrapper H2 is locked'
  );
  assert.strictEqual(h2Slots[0].originalText, 'FAQ TENTANG GEMBIRATOTO');

  // No H2 slot may carry the FAQ body text as its original text.
  h2Slots.forEach((s) => {
    assert.ok(!s.originalText.includes('Apa itu GEMBIRATOTO'), 'wrapper heading text must not leak into a slot');
  });

  // The parser must stamp content slots and return stamped HTML.
  assert.ok(parsed.rawHtml.includes('data-src-slot='), 'parser must stamp content slots');

  const report = analyzeReference(parsed, 'https://tuttobene.cl/', 'SAKAUTOTO | Perjalanan', 'SAKAUTOTO');
  const newContent = await generateSeoContent(report, parsed.contentSlots, 'SAKAUTOTO', 'SAKAUTOTO | Perjalanan');

  const finalHtml = executeReplacement({
    originalHtml: parsed.rawHtml,
    replacementMap: {
      brand: { old: 'GEMBIRATOTO', new: 'SAKAUTOTO' },
      title: { new: 'SAKAUTOTO | Perjalanan' },
      assets: {},
      links: {},
      contentSlots: {},
    },
    generatedContent: newContent,
    contentSlots: parsed.contentSlots,
  });

  const $final = cheerio.load(finalHtml);

  // 1. Internal markers must never leak into the final export.
  assert.ok(!finalHtml.includes('data-src-slot'), 'data-src-slot markers must be stripped from output');

  // 2. The malformed wrapper <h2> must still exist (locked) and still embed the FAQ section.
  const wrapperH2 = $final('div.content.FAQ > section > h2');
  assert.strictEqual(wrapperH2.length, 1, 'wrapper h2 must be preserved');
  assert.strictEqual(wrapperH2.find('.faq-box').length, 2, 'FAQ boxes inside wrapper must be preserved');

  // 3. FAQ boxes still hold their question/answer and are replaced correctly.
  assert.strictEqual($final('.faq-box').length, 2);
  assert.strictEqual($final('.faq-box strong').first().text().trim(), newContent.faqs[0].question);
  assert.strictEqual($final('.faq-box p').first().text().trim(), newContent.faqs[0].answer);

  // 4. All content below the heading must remain intact (no content miss).
  assert.strictEqual($final('strong').length, 2);
  assert.strictEqual($final('p').length, 3); // 2 FAQ answers + 1 normal paragraph

  // 5. Normal paragraph still replaced and keeps its content.
  assert.ok($final('body > p').text().includes('SAKAUTOTO'));
});

test('8. Random Indonesian Reviewer Names Test', () => {
  const names = generateIndonesianReviewers(8);

  // Exactly the requested count
  assert.strictEqual(names.length, 8);

  // Unique within a single generation
  assert.strictEqual(new Set(names).size, names.length, 'reviewer names must be unique');

  // Format: "NAMA DEPAN NAMA BELAKANG — KOTA" (all UPPERCASE)
  names.forEach((n) => {
    assert.ok(/^[A-Z]+ [A-Z]+ — [A-Z]+$/.test(n), `unexpected name format: "${n}"`);
    assert.strictEqual(n, n.toUpperCase(), `reviewer name must be uppercase: "${n}"`);
  });

  // Different across generations (probability of collision is negligible)
  const a = generateIndonesianReviewers(6).join('|');
  const b = generateIndonesianReviewers(6).join('|');
  const c = generateIndonesianReviewers(6).join('|');
  const allSame = a === b && b === c;
  assert.ok(!allSame, 'reviewer names should differ across generations');
});

test('9. INSTRUCTION.md ↔ PRD.md Consistency Test', () => {
  const instruction = fs.readFileSync(path.join(process.cwd(), 'INSTRUCTION.md'), 'utf-8');
  const prd = fs.readFileSync(path.join(process.cwd(), 'PRD.md'), 'utf-8');

  // Core PRD rules that MUST also be present in the master INSTRUCTION.md prompt.
  const requiredRules: Array<{ label: string; pattern: RegExp }> = [
    { label: 'word count ±5%', pattern: /±\s?5%/ },
    { label: 'paragraph count preserved', pattern: /jumlah paragraf.*(sama|referensi)/i },
    { label: 'heading count preserved', pattern: /jumlah heading/i },
    { label: 'FAQ count preserved', pattern: /jumlah FAQ/i },
    { label: 'review count preserved', pattern: /jumlah review/i },
    { label: 'no keyword stuffing', pattern: /keyword stuffing/i },
    { label: 'keyword mapping chain', pattern: /META\s*↓\s*H1\s*↓\s*H2/i },
    { label: 'raw meta (no HTML meta tags)', pattern: /JANGAN menggunakan HTML meta tags/i },
    { label: 'random Indonesian reviewer names', pattern: /nama reviewer indonesia yang acak/i },
    { label: 'reviewer names uppercase', pattern: /KAPITAL|UPPERCASE/i },
    { label: 'review placeholder label', pattern: /(EXAMPLE|PLACEHOLDER)/ },
    { label: 'locked elements', pattern: /class, ID, CSS, JS/i },
    { label: 'responsible gambling language', pattern: /perjudian|bertanggung jawab/i },
  ];

  requiredRules.forEach(({ label, pattern }) => {
    assert.ok(pattern.test(instruction), `INSTRUCTION.md is missing required rule: ${label}`);
  });

  // The PRD must still contain the canonical versions of the same rules.
  assert.ok(/WORD COUNT PRESERVATION/i.test(prd), 'PRD must retain word count section');
  assert.ok(/REVIEW HANDLING/i.test(prd), 'PRD must retain review handling section');
  assert.ok(/FAQ HANDLING/i.test(prd), 'PRD must retain FAQ handling section');
});

test('10. UI/utility text excluded from paragraph slots + per-slot word count', async () => {
  // Reproduces tuttobene.cl: product page where the DOM is polluted with UI text
  // (gallery button, product name, add-to-cart / return / shipping copy). Only the
  // real article paragraphs must become slots, and each must be replaced with a
  // paragraph of a comparable word count (±15%).
  const html = `<!DOCTYPE html>
<html lang="id"><head><title>GEMBIRATOTO - Binggung Cari Link Gacor</title></head>
<body>
  <div class="sticky-gallery"><div class="closer-look"><p>Klik untuk Lihat Detail</p></div></div>
  <div class="product-info-main">
    <div class="product attribute overview"><div class="value"><p>Topi Tanpa Bingkai Futura Wash</p></div></div>
    <form id="product_addtocart_form">
      <div class="product-options-bottom">
        <div class="return-policy-pdp"><div class="return-content"><p>Gratis dan Mudah untuk item tertentu dalam waktu 7 hari setelah pembelian. Klik untuk info lebih lanjut.</p></div></div>
        <div class="free-shipping"><div class="fr-ship-content"><p>Buat pesanan sekarang!</p></div></div>
      </div>
    </form>
  </div>
  <div class="pdp-description-section">
    <div class="pdp-desc">
      <p>Banyak pemain masih bingung mencari link Gacor karena sering berganti alamat. Padahal akses ke link resmi sangat penting agar proses login deposit dan withdraw berjalan aman tanpa gangguan dari pihak yang tidak bertanggung jawab.</p>
      <p>Salah satu keunggulan GEMBIRATOTO adalah kemudahan transaksi. Proses pengisian saldo menjadi sangat terjangkau instan dan bebas ribet tanpa perlu mengantre di ATM atau membuka aplikasi perbankan yang rumit.</p>
    </div>
  </div>
</body></html>`;

  const parsed = parseReferenceHtml(html, 'https://tuttobene.cl/');
  const pSlots = parsed.contentSlots.filter((s) => s.type === 'PARAGRAPH');

  // Only the 2 real article paragraphs must be captured — UI text must be excluded.
  assert.strictEqual(pSlots.length, 2, 'only real article paragraphs become slots');

  const joined = pSlots.map((s) => s.originalText).join(' | ');
  assert.ok(!joined.includes('Klik untuk Lihat Detail'), 'gallery button text must be excluded');
  assert.ok(!joined.includes('Topi Tanpa Bingkai'), 'product name must be excluded');
  assert.ok(!joined.includes('Buat pesanan sekarang'), 'CTA button text must be excluded');
  assert.ok(!joined.includes('Gratis dan Mudah untuk item tertentu'), 'return-policy copy must be excluded');

  const report = analyzeReference(parsed, 'https://tuttobene.cl/', 'SAKAUTOTO | Perjalanan', 'SAKAUTOTO');
  const newContent = await generateSeoContent(report, parsed.contentSlots, 'SAKAUTOTO', 'SAKAUTOTO | Perjalanan');

  // Paragraph count preserved
  assert.strictEqual(newContent.paragraphs.length, pSlots.length);

  // Every generated paragraph must be within ±15% of its reference slot word count
  pSlots.forEach((slot, i) => {
    const genWords = newContent.paragraphs[i].split(/\s+/).filter(Boolean).length;
    const ratio = genWords / Math.max(1, slot.originalWordCount);
    assert.ok(
      ratio >= 0.85 && ratio <= 1.15,
      `paragraph #${i + 1} word count off: ref=${slot.originalWordCount} gen=${genWords} (${Math.round(ratio * 100)}%)`
    );
  });
});

test('11. Repeated Old-Title Replacement in Loose Text Nodes (megasicbo case)', async () => {
  // Reproduces megasicbo.com where the EXACT old title text is repeated inside a
  // wrapper div as a LOOSE text node (next to a hidden button), plus <strong> and <h2>.
  // All visible occurrences must be replaced with the new title; scripts/JSON-LD must stay.
  const title = 'OLXTOTO | Akses Situs Live Casino Online Dengan Permainan Super Interaktif';
  const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <title>${title}</title>
  <script type="application/ld+json">{"@type":"Product","name":"${title}"}</script>
</head>
<body>
  <div class="cqd-banner m-design__cqd-banner">
    <div class="cqd-banner__container">
      <div class="tp-text-note"><div class="tp-text-note__body">
      <button type="button" style="display:none;"><div class="button__content">Read more</div></button>${title}
      </div></div>
    </div>
  </div>
  <h1 class="h__h1--sm">${title}</h1>
  <h2>${title}</h2>
  <strong>${title}</strong>
  <script>var t = "${title}";</script>
</body></html>`;

  const newTitle = 'SAKAUTOTO | Perjalanan Mencari Kitab Suci Menuju Situs Toto Slot Gacor';

  const parsed = parseReferenceHtml(html, 'https://megasicbo.com/');
  const report = analyzeReference(parsed, 'https://megasicbo.com/', newTitle, 'SAKAUTOTO');
  const newContent = await generateSeoContent(report, parsed.contentSlots, 'SAKAUTOTO', newTitle);

  const finalHtml = executeReplacement({
    originalHtml: parsed.rawHtml,
    replacementMap: {
      brand: { old: 'OLXTOTO', new: 'SAKAUTOTO' },
      title: { new: newTitle },
      assets: {},
      links: {},
      contentSlots: {},
    },
    generatedContent: newContent,
    contentSlots: parsed.contentSlots,
  });

  const $final = cheerio.load(finalHtml);

  // 1. The banner loose text node must be replaced with the new title.
  assert.ok(
    $final('.tp-text-note__body').text().includes(newTitle),
    'loose banner text node must be replaced with the new title'
  );
  assert.ok(
    !$final('.tp-text-note__body').text().includes('Akses Situs Live Casino Online Dengan Permainan Super Interaktif'),
    'old title must be gone from the banner'
  );

  // 2. The <strong> mirror must be replaced with the full new title.
  assert.strictEqual($final('strong').text().trim(), newTitle, '<strong> mirror must hold the new title');

  // 3. The <title> tag must be the new title (single, no duplicates).
  assert.strictEqual($final('head title').length, 1);
  assert.strictEqual($final('head title').text().trim(), newTitle);

  // 4. The hidden button label must remain untouched.
  assert.ok($final('.button__content').text().includes('Read more'), 'hidden button label must stay intact');

  // 5. Structure preserved: wrapper classes/ids intact.
  assert.strictEqual($final('.cqd-banner__container').length, 1);
  assert.strictEqual($final('.tp-text-note__body').length, 1);
  assert.strictEqual($final('button').length, 1);

  // 6. Scripts must remain untouched (JSON-LD is locked and not rewritten).
  const $ = cheerio.load(html);
  assert.strictEqual($final('body script').length, $('body script').length, 'body scripts must be preserved');
});

test('12. Engine reporting: deterministic by default, visible fallback on AI failure', async () => {
  const html = `<!DOCTYPE html><html lang="id"><head><title>OLDTOTO | Situs Resmi</title></head>
<body><h1>OLDTOTO | Situs Resmi</h1><h2>Tentang OLDTOTO</h2>
<p>Paragraf pertama tentang OLDTOTO dan layanan yang disediakan untuk semua pengguna setia setiap harinya.</p>
<p>Paragraf kedua menjelaskan keunggulan sistem OLDTOTO yang cepat aman dan terpercaya bagi seluruh member.</p>
</body></html>`;

  const parsed = parseReferenceHtml(html, 'https://example.com/');
  const report = analyzeReference(parsed, 'https://example.com/', 'SAKAUTOTO | Situs Terbaik', 'SAKAUTOTO');

  // 1. No API key → deterministic engine, with a note.
  const noKey = await generateSeoContent(report, parsed.contentSlots, 'SAKAUTOTO', 'SAKAUTOTO | Situs Terbaik');
  assert.strictEqual(noKey.engine, 'deterministic', 'no API key must use deterministic engine');
  assert.ok(noKey.engineNote && /api key belum diisi/i.test(noKey.engineNote), 'must explain missing API key');

  // 2. Bogus API key + unreachable endpoint → falls back to deterministic, but reports REASON.
  const badKey = await generateSeoContent(report, parsed.contentSlots, 'SAKAUTOTO', 'SAKAUTOTO | Situs Terbaik', {
    apiKey: 'sk-bogus-key-1234567890',
    apiBaseUrl: 'http://127.0.0.1:9/v1', // closed port → guaranteed connection failure
    model: 'gpt-4o-mini',
  });
  assert.strictEqual(badKey.engine, 'deterministic', 'must fall back to deterministic engine');
  assert.ok(badKey.engineNote, 'fallback MUST include a reason note (no silent fallback)');
  assert.ok(/gagal/i.test(badKey.engineNote), `fallback note should mention failure, got: ${badKey.engineNote}`);

  // 3. The content is still valid & structure-compliant even in fallback.
  assert.strictEqual(badKey.paragraphs.length, parsed.contentSlots.filter((s) => s.type === 'PARAGRAPH').length);
});
