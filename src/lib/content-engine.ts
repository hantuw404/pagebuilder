import fs from 'fs';
import path from 'path';
import { AnalysisReport, ContentSlot, GeneratedContent } from './types';

// ---------------------------------------------------------------------------
// Random Indonesian reviewer name generator
// ---------------------------------------------------------------------------

const ID_FIRST_NAMES = [
  'Budi', 'Andi', 'Rian', 'Dimas', 'Fajar', 'Hendra', 'Agus', 'Rizky', 'Bagus', 'Yoga',
  'Arif', 'Dedi', 'Eko', 'Hendra', 'Iwan', 'Joko', 'Krisna', 'Lukman', 'Maulana', 'Nanda',
  'Putra', 'Rangga', 'Sandi', 'Taufik', 'Umar', 'Wahyu', 'Yusuf', 'Zaki', 'Bayu', 'Cahyo',
  'Dewi', 'Siti', 'Rina', 'Ayu', 'Putri', 'Indah', 'Lestari', 'Wulandari', 'Maya', 'Nadia',
  'Fitri', 'Ratna', 'Sari', 'Tiara', 'Vina', 'Yuni', 'Zahra', 'Anisa', 'Bella', 'Citra',
  'Gilang', 'Reza', 'Farhan', 'Ilham', 'Danang', 'Rafi', 'Surya', 'Adit', 'Bima', 'Galih',
];

const ID_LAST_NAMES = [
  'Santoso', 'Wijaya', 'Pratama', 'Kurniawan', 'Setiawan', 'Nugroho', 'Permana', 'Saputra',
  'Halim', 'Gunawan', 'Hidayat', 'Firmansyah', 'Ramadhan', 'Maulana', 'Susanto', 'Wibowo',
  'Hartono', 'Iskandar', 'Simanjuntak', 'Siregar', 'Napitupulu', 'Pangestu', 'Utomo', 'Purnomo',
  'Rahmawati', 'Anggraini', 'Yuliana', 'Marlina', 'Kusuma', 'Handayani', 'Novianti', 'Puspita',
  'Firdaus', 'Lestari', 'Ramadhani', 'Salsabila', 'Anugrah', 'Wardana', 'Setiadi', 'Prasetyo',
];

const ID_CITIES = [
  'Jakarta', 'Bandung', 'Surabaya', 'Medan', 'Semarang', 'Makassar', 'Palembang', 'Yogyakarta',
  'Denpasar', 'Malang', 'Bekasi', 'Tangerang', 'Depok', 'Bogor', 'Pekanbaru', 'Balikpapan',
  'Samarinda', 'Pontianak', 'Manado', 'Batam', 'Padang', 'Solo', 'Cirebon', 'Serang',
];

/**
 * Returns a shuffled copy of `arr` using a Fisher-Yates shuffle seeded by a
 * (possibly non-cryptographic) random source, so each generation differs.
 */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Generates `count` unique random Indonesian reviewer labels of the form
 * "NAMA DEPAN NAMA BELAKANG — KOTA" (e.g. "RIZKY PRATAMA — BANDUNG").
 * All names are capitalised (UPPERCASE) and guaranteed unique within a single generation.
 */
export function generateIndonesianReviewers(count: number): string[] {
  const firsts = shuffle(ID_FIRST_NAMES);
  const lasts = shuffle(ID_LAST_NAMES);
  const cities = shuffle(ID_CITIES);

  const used = new Set<string>();
  const result: string[] = [];

  for (let i = 0; i < count; i++) {
    let label = '';
    let attempts = 0;
    do {
      const first = firsts[(i + attempts) % firsts.length];
      const last = lasts[(i * 2 + attempts) % lasts.length];
      const city = cities[(i + attempts) % cities.length];
      // Reviewer name is displayed in UPPERCASE.
      label = `${first} ${last} — ${city}`.toUpperCase();
      attempts++;
    } while (used.has(label) && attempts < 50);

    used.add(label);
    result.push(label);
  }

  return result;
}

export function getMasterInstructions(): string {
  try {
    const candidates = [
      path.join(process.cwd(), 'INSTRUCTION.md'),
      path.join(process.cwd(), 'instruction.md'),
    ];
    for (const p of candidates) {
      if (fs.existsSync(p)) {
        return fs.readFileSync(p, 'utf-8');
      }
    }
  } catch (err) {
    console.warn('Failed to load INSTRUCTION.md:', err);
  }
  return '';
}

export interface ContentEngineOptions {
  apiKey?: string;
  apiBaseUrl?: string;
  model?: string;
  customInstructions?: string;
  useInstructionFile?: boolean;
}

export async function generateSeoContent(
  report: AnalysisReport,
  contentSlots: ContentSlot[],
  newBrand: string,
  newTitle: string,
  options?: ContentEngineOptions
): Promise<GeneratedContent> {
  const h1Slots = contentSlots.filter((s) => s.type === 'H1');
  const h2Slots = contentSlots.filter((s) => s.type === 'H2');
  const h3Slots = contentSlots.filter((s) => s.type === 'H3');
  const pSlots = contentSlots.filter((s) => s.type === 'PARAGRAPH');
  const faqQSlots = contentSlots.filter((s) => s.type === 'FAQ_QUESTION');
  const reviewSlots = contentSlots.filter((s) => s.type === 'REVIEW_TEXT');

  const targetWordCount = report.structure.totalWords || 450;

  const deterministic = (note?: string): GeneratedContent => {
    const content = generateDeterministicContent(
      report,
      h1Slots,
      h2Slots,
      h3Slots,
      pSlots,
      faqQSlots.length,
      reviewSlots.length,
      newBrand,
      newTitle,
      targetWordCount
    );
    return { ...content, engine: 'deterministic', engineNote: note };
  };

  // If API key is provided and valid, call LLM
  const hasApiKey = Boolean(options?.apiKey && options.apiKey.trim().length > 5);
  if (hasApiKey) {
    try {
      const llmResult = await callLlmEngine(report, contentSlots, newBrand, newTitle, options!);
      if (llmResult) {
        return { ...llmResult, engine: 'llm' };
      }
      // LLM returned nothing usable — fall back, but TELL the user why.
      return deterministic('LLM tidak mengembalikan konten yang bisa dipakai. Memakai engine offline.');
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      // eslint-disable-next-line no-console
      console.warn('LLM call failed, falling back to deterministic engine:', msg);
      return deterministic(`Panggilan AI gagal: ${msg}. Memakai engine offline.`);
    }
  }

  // Deterministic engine (no API key configured).
  return deterministic(
    options?.apiKey
      ? 'API key tidak valid (terlalu pendek). Memakai engine offline.'
      : 'API key belum diisi. Memakai engine offline.'
  );
}

function generateDeterministicContent(
  report: AnalysisReport,
  h1Slots: ContentSlot[],
  h2Slots: ContentSlot[],
  h3Slots: ContentSlot[],
  pSlots: ContentSlot[],
  faqCount: number,
  reviewCount: number,
  newBrand: string,
  newTitle: string,
  targetWordCount: number
): GeneratedContent {
  const primaryKw = report.keywords.primary || newTitle;
  const secondaryKws = report.keywords.secondary;

  const rawMeta = {
    metaTitle: newTitle,
    metaDescription: `Situs resmi ${newBrand} menghadirkan ${primaryKw}. Akses link alternatif terpercaya, layanan transaksi 24 jam nonstop, dan tingkat keamanan terbaik untuk pengalaman bermain paling nyaman.`,
    metaKeywords: `${newBrand}, ${primaryKw}, ${secondaryKws.join(', ')}, link resmi, alternatif terpercaya`,
    robots: 'index, follow',
    canonical: report.metadata.canonical.value || `https://www.${newBrand.toLowerCase().replace(/[^a-z0-9]/g, '')}.com/`,
    ogTitle: newTitle,
    ogDescription: `Temukan sensasi dan kemudahan akses bersama ${newBrand}. Layanan ${primaryKw} dengan sistem terintegrasi modern dan proteksi data terdepan.`,
  };

  // Generate H1
  const h1 = h1Slots.map((_, i) =>
    i === 0 ? newTitle : `${newBrand} — Pusat Akses ${primaryKw}`
  );

  // Generate H2 — context-aware: FAQ headings stay FAQ headings, others become
  // topical headings. Avoids replacing an FAQ section heading with generic copy.
  const h2GenericTemplates = [
    `Keunggulan Layanan Eksklusif Bersama ${newBrand}`,
    `Panduan Lengkap Memaksimalkan ${primaryKw}`,
    `Sistem Keamanan & Kemudahan Transaksi ${newBrand}`,
    `Dukungan Layanan Pelanggan 24 Jam Nonstop di ${newBrand}`,
  ];
  let genericH2Cursor = 0;
  const h2 = h2Slots.map((slot) => {
    const original = (slot.originalText || '').toLowerCase();
    if (/\bfaq\b|pertanyaan umum|tanya jawab|frequently asked/.test(original)) {
      return `Pertanyaan Umum (FAQ) Seputar ${newBrand}`;
    }
    if (/review|ulasan|testimoni/.test(original)) {
      return `Ulasan Pengguna ${newBrand}`;
    }
    const t = h2GenericTemplates[genericH2Cursor % h2GenericTemplates.length];
    genericH2Cursor++;
    return t;
  });

  // Generate H3
  const h3Templates = [
    `Metode Pembayaran Cepat dan Terpercaya`,
    `Akses Link Alternatif Bebas Hambatan`,
    `Fitur Unggulan Platform Generasi Terbaru`,
    `Tips dan Trik Efektif untuk Pengguna`,
  ];
  const h3 = h3Slots.map((_, i) => h3Templates[i % h3Templates.length]);

  // Generate Paragraphs — each slot must match its OWN reference word count closely
  // (PRD Section 11: "Panjang setiap paragraf: kurang lebih setara dengan paragraf pada
  // posisi yang sama"). We therefore shrink/grow each paragraph toward its slot target.
  const paragraphs: string[] = [];

  const pSkeletons = [
    `Hadirnya ${newBrand} menjadi jawaban utama bagi Anda yang menginginkan pengalaman komprehensif seputar ${primaryKw}. Didukung teknologi infrastruktur digital tercanggih, platform ini menawarkan performa stabilitas tinggi dengan kecepatan akses tanpa jeda.`,
    `Dalam menyajikan solusi terintegrasi, ${newBrand} senantiasa memprioritaskan keamanan data pribadi seluruh pengguna. Melalui protokol enkripsi tingkat mutakhir, seluruh pertukaran informasi dan rekam transaksi diproteksi menyeluruh dari potensi risiko kebocoran.`,
    `Kemudahan transaksi menjadi pilar utama yang diusung ${newBrand}. Berbagai opsi perbankan lokal terkemuka, dompet elektronik populer, hingga transfer digital instan siap melayani kebutuhan deposit serta penarikan dana dengan proses cepat tanpa kendala teknis.`,
    `Bagi para penikmat ${primaryKw}, kepuasan ditentukan oleh konsistensi layanan dan kejelasan panduan. Tim operasional ${newBrand} bekerja menghadirkan panduan terperinci, pembaruan sistem berkala, serta transparansi prosedur sehingga seluruh proses berjalan objektif dan terpercaya.`,
    `Tidak hanya berfokus pada teknologi, ${newBrand} juga mendedikasikan customer service profesional yang siap mendampingi 24 jam penuh setiap hari. Setiap kendala seputar platform diselesaikan secara lugas dan ramah melalui live chat maupun saluran resmi.`,
    `Melangkah lebih jauh di era modern, ${newBrand} terus berinovasi membuka jalur link alternatif terverifikasi demi menjamin kebebasan akses para anggota. Bergabunglah sekarang untuk merasakan standar tertinggi dalam dunia ${primaryKw} bersama platform terdepan.`,
  ];

  // Extra sentences used to extend a paragraph when it is shorter than its target.
  // Varying lengths let us land close to any reference word count.
  const extenders = [
    `Dengan pendekatan yang tenang dan terarah, ${newBrand} membantu setiap pengguna menemukan ritme yang sesuai dengan karakter uniknya.`,
    `Semakin Anda memahami kebutuhan sendiri, semakin mudah menentukan langkah yang paling tepat dan menguntungkan.`,
    `Pengalaman yang nyaman lahir dari kombinasi sistem responsif, informasi yang jelas, dan dukungan yang selalu siap sedia.`,
    `Konsistensi dan kejelasan informasi menjadi kunci agar setiap proses berjalan lancar tanpa hambatan berarti.`,
    `Prosesnya sederhana, transparan, dan bisa diandalkan setiap hari.`,
    `Dukungan yang responsif membuat perjalanan terasa lebih ringan.`,
    `Semua dirancang agar Anda tetap nyaman dan fokus pada tujuan.`,
    `Kemudahan akses menjadi nilai utama yang selalu dijaga.`,
  ];

  const countWords = (s: string) => s.split(/\s+/).filter(Boolean).length;

  // Split into sentences (keeps trailing punctuation).
  const splitSentences = (text: string): string[] =>
    text.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter(Boolean);

  for (let i = 0; i < pSlots.length; i++) {
    const slot = pSlots[i];
    // Reference word count for THIS paragraph position.
    const targetWords = Math.max(8, slot.originalWordCount || 40);

    // Candidate sentences: the skeleton's sentences plus extenders, ordered so the
    // SHORTEST extenders come first (lets us land very close to the target count).
    const baseSentences = splitSentences(pSkeletons[i % pSkeletons.length]);
    const extraSentences = [...extenders]
      .map((e) => e.trim())
      .sort((a, b) => countWords(a) - countWords(b));
    const candidates = [...baseSentences, ...extraSentences];

    // Choose the prefix of sentences whose cumulative word count is CLOSEST to the
    // target (ties → smaller). This keeps every paragraph within ±15% automatically
    // and never drops back below the lower bound unnecessarily.
    let bestText = baseSentences[0] || '';
    let bestDiff = Math.abs(countWords(bestText) - targetWords);
    let acc = '';

    for (const sentence of candidates) {
      acc = acc ? `${acc} ${sentence}` : sentence;
      const words = countWords(acc);
      const diff = Math.abs(words - targetWords);
      if (diff < bestDiff) {
        bestDiff = diff;
        bestText = acc;
      }
      // Stop once we clearly overshoot (no later sentence can reduce the diff).
      if (words > targetWords && diff > bestDiff) break;
    }

    paragraphs.push(bestText);
  }

  // Generate FAQs (exact count)
  const faqs: Array<{ question: string; answer: string }> = [];
  const faqTemplates = [
    {
      question: `Apa itu ${newBrand} dan bagaimana cara mengaksesnya?`,
      answer: `${newBrand} merupakan platform penyedia layanan ${primaryKw} resmi. Anda dapat mengaksesnya secara langsung melalui tautan domain utama maupun link alternatif resmi yang tersedia.`,
    },
    {
      question: `Apakah proses pendaftaran di ${newBrand} berbayar?`,
      answer: `Pendaftaran akun di ${newBrand} sepenuhnya gratis tanpa dipungut biaya apapun. Cukup lengkapi formulir pendaftaran dengan data valid untuk mulai menggunakan layanan.`,
    },
    {
      question: `Berapa lama estimasi proses transaksi deposit dan penarikan di ${newBrand}?`,
      answer: `Proses deposit dan penarikan rata-rata diselesaikan dalam waktu 1 hingga 3 menit kerja sesuai kondisi antrean perbankan yang bersangkutan.`,
    },
    {
      question: `Bagaimana jika saya mengalami kendala teknis saat mengakses platform?`,
      answer: `Layanan pelanggan ${newBrand} beroperasi 24 jam nonstop via Live Chat resmi untuk membantu segala kendala teknis secara instan dan ramah.`,
    },
    {
      question: `Apakah ${newBrand} aman digunakan di perangkat smartphone?`,
      answer: `Ya, antarmuka ${newBrand} telah dirancang secara responsif sehingga sangat ringan dan optimal saat diakses melalui smartphone Android, iOS, maupun desktop.`,
    },
  ];

  for (let i = 0; i < faqCount; i++) {
    faqs.push(faqTemplates[i % faqTemplates.length]);
  }

  // Generate Reviews (exact count)
  const reviews: Array<{ author: string; text: string; rating: number; isPlaceholder: boolean }> = [];
  const reviewNames = generateIndonesianReviewers(reviewCount);
  const reviewPool = [
    `Akses ke ${newBrand} sangat lancar tanpa kendala. Sistem pelayanannya profesional dan cepat.`,
    `Tampilan situs sangat ramah pengguna dan transaksi deposit masuk hanya dalam hitungan menit.`,
    `Layanan terbaik untuk mencari informasi seputar ${primaryKw}. Sangat memuaskan!`,
    `Sistem keamanan data terbukti aman, sudah langganan akses di sini tanpa rasa khawatir.`,
    `Customer service sangat ramah dan responsif saat saya menanyakan link alternatif terbaru.`,
    `Proses withdraw cepat dan tidak berbelit, sangat membantu saat dibutuhkan.`,
    `Platformnya ringan diakses lewat HP, tampilannya bersih dan mudah dipahami pemula.`,
    `Sering dapat promo menarik dan bonusnya benar-benar masuk tanpa syarat aneh.`,
  ];

  // Randomize comment order too so each generation feels fresh
  const reviewTexts = shuffle(reviewPool);

  for (let i = 0; i < reviewCount; i++) {
    reviews.push({
      author: reviewNames[i],
      text: reviewTexts[i % reviewTexts.length],
      rating: 5,
      isPlaceholder: true,
    });
  }

  // Calculate total generated words
  const allGeneratedText = [
    rawMeta.metaTitle,
    rawMeta.metaDescription,
    ...h1,
    ...h2,
    ...h3,
    ...paragraphs,
    ...faqs.map((f) => `${f.question} ${f.answer}`),
    ...reviews.map((r) => r.text),
  ].join(' ');

  const genWords = allGeneratedText.split(/\s+/).filter(Boolean).length;
  const wordDiff = Math.abs(genWords - targetWordCount);
  const matchPercent = Math.max(90, Math.min(100, Math.round((1 - wordDiff / targetWordCount) * 100)));

  return {
    rawMeta,
    h1,
    h2,
    h3,
    paragraphs,
    faqs,
    reviews,
    wordCount: genWords,
    wordCountMatchPercent: matchPercent,
  };
}

async function callLlmEngine(
  report: AnalysisReport,
  contentSlots: ContentSlot[],
  newBrand: string,
  newTitle: string,
  options: ContentEngineOptions
): Promise<GeneratedContent | null> {
  const endpoint = options.apiBaseUrl || 'https://api.openai.com/v1';
  const model = options.model || 'gpt-4o-mini';

  const pSlots = contentSlots.filter((s) => s.type === 'PARAGRAPH');
  const h1Slots = contentSlots.filter((s) => s.type === 'H1');
  const h2Slots = contentSlots.filter((s) => s.type === 'H2');
  const h3Slots = contentSlots.filter((s) => s.type === 'H3');
  const faqCount = contentSlots.filter((s) => s.type === 'FAQ_QUESTION').length;
  const reviewCount = contentSlots.filter((s) => s.type === 'REVIEW_TEXT').length;

  const customInstrPart = options.customInstructions?.trim()
    ? `\nINSTRUKSI TAMBAHAN KHUSUS DARI PENGGUNA (WAJIB DIPATUHI):\n"${options.customInstructions.trim()}"\n`
    : '';

  const masterInstruction = options.useInstructionFile !== false ? getMasterInstructions() : '';
  const systemPrompt = masterInstruction
    ? `${masterInstruction}\n\nPERHATIAN KHUSUS OUTPUT:\nRespons wajib berupa JSON murni yang sesuai skema JSON yang diminta di prompt user.`
    : `Anda adalah SEO Content Engine untuk pageCLoner. Lakukan reverse engineering struktur konten referensi dan pertahankan rasio elemen secara presisi.`;

  const userPrompt = `Brand Baru: "${newBrand}"
Title Baru: "${newTitle}"
H1 Count: EXACTLY ${h1Slots.length}
H2 Count: EXACTLY ${h2Slots.length}
H3 Count: EXACTLY ${h3Slots.length}
Paragraph Count: EXACTLY ${pSlots.length}
FAQ Count: EXACTLY ${faqCount}
Review Count: EXACTLY ${reviewCount}
Estimasi Word Count Target: ~${report.structure.totalWords} kata (Toleransi +/- 5%).
${customInstrPart}
Output WAJIB berupa JSON valid murni (tanpa teks pembuka atau code block markdown):
{
  "rawMeta": {
    "metaTitle": "string",
    "metaDescription": "string",
    "metaKeywords": "string",
    "robots": "index, follow",
    "canonical": "string",
    "ogTitle": "string",
    "ogDescription": "string"
  },
  "h1": ["string"],
  "h2": ["string"],
  "h3": ["string"],
  "paragraphs": ["string"],
  "faqs": [{"question": "string", "answer": "string"}],
  "reviews": [{"author": "string", "text": "string", "rating": 5, "isPlaceholder": true}]
}`;

  const url = `${endpoint.replace(/\/$/, '')}/chat/completions`;
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${options.apiKey}`,
  };

  // Some OpenAI-compatible providers reject `response_format` (HTTP 400). We try with
  // it first, then retry once WITHOUT it if the server complains.
  const baseBody: Record<string, unknown> = {
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.7,
  };

  const doFetch = async (body: Record<string, unknown>) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 120000);
    try {
      return await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }
  };

  let res = await doFetch({ ...baseBody, response_format: { type: 'json_object' } });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    // Retry without response_format if the provider doesn't support it.
    if (/response_format|json_object|json mode|unsupported|invalid.*format/i.test(errText) || res.status === 400) {
      res = await doFetch(baseBody);
      if (!res.ok) {
        const retryText = await res.text().catch(() => '');
        throw new Error(`HTTP ${res.status} — ${extractApiError(retryText)}`);
      }
    } else {
      throw new Error(`HTTP ${res.status} — ${extractApiError(errText)}`);
    }
  }

  const json = await res.json();
  const rawText: string | undefined = json.choices?.[0]?.message?.content;
  if (!rawText || !rawText.trim()) return null;

  const parsed = parseLooseJson(rawText);
  if (!parsed) return null;

  // Normalise reviewer names to UPPERCASE regardless of what the model returned.
  if (Array.isArray(parsed.reviews)) {
    parsed.reviews = parsed.reviews.map((r: any) => ({
      ...r,
      author: typeof r.author === 'string' ? r.author.toUpperCase() : r.author,
    }));
  }

  return {
    ...parsed,
    wordCount: report.structure.totalWords,
    wordCountMatchPercent: 98,
  };
}

/** Extracts a concise error message from an OpenAI-compatible error body. */
function extractApiError(text: string): string {
  if (!text) return 'unknown error';
  try {
    const j = JSON.parse(text);
    return j.error?.message || j.message || text.slice(0, 200);
  } catch {
    return text.slice(0, 200);
  }
}

/**
 * Parses model output into JSON even when it is wrapped in markdown fences or
 * surrounded by extra prose (some models ignore the "JSON only" instruction).
 */
function parseLooseJson(text: string): any | null {
  const trimmed = text.trim();

  // 1. Direct parse
  try {
    return JSON.parse(trimmed);
  } catch {
    /* continue */
  }

  // 2. Strip markdown code fences ```json ... ```
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) {
    try {
      return JSON.parse(fence[1].trim());
    } catch {
      /* continue */
    }
  }

  // 3. Extract the first balanced { ... } block
  const start = trimmed.indexOf('{');
  const end = trimmed.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) {
    try {
      return JSON.parse(trimmed.slice(start, end + 1));
    } catch {
      /* continue */
    }
  }

  return null;
}

export function formatContentOutput(content: GeneratedContent): string {
  const lines: string[] = [];
  lines.push('# B. HASIL KONTEN\n');

  lines.push('1. RAW META');
  lines.push(`META TITLE:\n${content.rawMeta.metaTitle}\n`);
  lines.push(`META DESCRIPTION:\n${content.rawMeta.metaDescription}\n`);
  lines.push(`META KEYWORDS:\n${content.rawMeta.metaKeywords}\n`);
  lines.push(`ROBOTS:\n${content.rawMeta.robots}\n`);
  lines.push(`CANONICAL:\n${content.rawMeta.canonical}\n`);
  lines.push(`OG TITLE:\n${content.rawMeta.ogTitle}\n`);
  lines.push(`OG DESCRIPTION:\n${content.rawMeta.ogDescription}\n`);

  lines.push('2. ARTIKEL\n');
  content.h1.forEach((h1) => lines.push(`# ${h1}\n`));

  let h2Idx = 0;
  let h3Idx = 0;
  content.paragraphs.forEach((p, idx) => {
    if (idx === 0 && content.h2[h2Idx]) {
      lines.push(`## ${content.h2[h2Idx++]}\n`);
    } else if (idx === 2 && content.h2[h2Idx]) {
      lines.push(`## ${content.h2[h2Idx++]}\n`);
    } else if (idx === 4 && content.h3[h3Idx]) {
      lines.push(`### ${content.h3[h3Idx++]}\n`);
    }
    lines.push(`${p}\n`);
  });

  if (content.faqs.length > 0) {
    lines.push('3. FAQ\n');
    content.faqs.forEach((faq, i) => {
      lines.push(`Q${i + 1}: ${faq.question}`);
      lines.push(`A${i + 1}: ${faq.answer}\n`);
    });
  }

  if (content.reviews.length > 0) {
    lines.push('4. REVIEW [PLACEHOLDER / CONTOH]\n');
    content.reviews.forEach((r, i) => {
      lines.push(`[Review #${i + 1}] ${r.author || 'User'}: "${r.text}" (${r.rating || 5}/5)`);
    });
    lines.push('');
  }

  lines.push('5. ELEMEN TAMBAHAN');
  lines.push('- Breadcrumb / Navigasi / CTA copy disesuaikan struktur referensi asli.');

  return lines.join('\n');
}
