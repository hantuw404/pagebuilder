import * as cheerio from 'cheerio';

// ---------------------------------------------------------------------------
// AI-assisted Structure Analysis (STRICT / CLASSIFICATION-ONLY)
//
// IMPORTANT SAFETY DESIGN:
// The AI NEVER rewrites HTML. It only receives a compact outline of candidate
// elements and returns a list of indices it believes are REAL article content
// (headings / paragraphs / FAQ / reviews). The code then applies that decision.
//
// If the AI is unavailable or returns anything invalid, we fall back to the
// rule-based classification (so the tool always works, online or offline).
// ---------------------------------------------------------------------------

export interface OutlineNode {
  idx: number;
  tag: string;
  cls: string;
  text: string;
  words: number;
}

export interface StructureVerdict {
  contentIdx: number[];
  lockedIdx: number[];
  source: 'ai' | 'fallback';
  note?: string;
}

export interface StructureAnalysisOptions {
  apiKey?: string;
  apiBaseUrl?: string;
  model?: string;
}

/**
 * Candidate selector shared by the outline builder AND the parser stramper.
 * MUST stay identical in both places so indices line up.
 */
export const STRUCTURE_CANDIDATE_SELECTOR =
  'h1, h2, h3, h4, h5, h6, p, li, button, strong, b, summary, dt, dd';

/** Build a compact outline of ALL candidate block elements (with stable idx). */
export function buildStructureOutline(html: string): { outline: OutlineNode[]; $: cheerio.CheerioAPI } {
  const $ = cheerio.load(html);
  const outline: OutlineNode[] = [];
  let idx = 0;

  $(STRUCTURE_CANDIDATE_SELECTOR).each((_, el) => {
    const $el = $(el);
    // Skip elements inside script/style/noscript/template
    if ($el.closest('script, style, noscript, template').length > 0) return;

    const text = $el.text().replace(/\s+/g, ' ').trim();
    if (!text || text.length < 2) return;

    const words = text.split(/\s+/).filter(Boolean).length;
    const cls = ($el.attr('class') || '').split(/\s+/).filter(Boolean).slice(0, 3).join(' ');

    $el.attr('data-src-idx', String(idx));
    outline.push({
      idx,
      tag: el.tagName.toLowerCase(),
      cls,
      text: text.slice(0, 160),
      words,
    });
    idx++;
  });

  return { outline, $ };
}

/** Rule-based fallback verdict (used when AI is off or fails). */
export function ruleBasedVerdict(outline: OutlineNode[]): number[] {
  const contentIdx: number[] = [];
  for (const node of outline) {
    const t = node.text;
    // Placeholders / mustache
    if (/\{\{[\s\S]*?\}\}/.test(t)) continue;
    // Too-short labels without sentence structure
    if (node.words <= 3 && !/[.!?]/.test(t) && t.length < 40) continue;
    contentIdx.push(node.idx);
  }
  return contentIdx;
}

/** Strict prompt: AI classifies only; it must return JSON indices. */
function buildStrictPrompt(outline: OutlineNode[], newBrand: string, newTitle: string): string {
  const lines = outline
    .map((n) => `${n.idx}\t<${n.tag}${n.cls ? '.' + n.cls.replace(/\s+/g, '.') : ''}>\t${n.words}w\t${n.text}`)
    .join('\n');

  return `You are a STRICT HTML STRUCTURE CLASSIFIER. You do NOT rewrite HTML.

A web page's candidate text elements are listed below (index, tag, word count, text preview).
Classify EACH index into one of two buckets:
- CONTENT: real editorial/SEO article content that belongs to the page topic — main headings, body paragraphs, FAQ questions/answers, review/testimonial text.
- LOCKED: everything else — UI labels, buttons, navigation, product/template placeholders, form microcopy, cookie/consent text, cart/checkout text, price/stock labels, framework placeholders like {{item.name}}, footer/nav links.

Rules:
1. Be conservative. If unsure, mark LOCKED.
2. Only mark CONTENT for text that clearly belongs to an SEO article about the page topic (title: "${newTitle}", brand: "${newBrand}").
3. FAQ questions often end with "?" or start with question words (apa/bagaimana/mengapa/berapa/apakah/how/what/why).
4. Reviews are short testimonial comments, often attributed to a person.
5. NEVER include navigation, buttons, product options, cart text, or template tokens.

Return ONLY strict JSON (no markdown, no prose):
{"content":[<indices>],"locked":[<indices>]}

ELEMENTS:
${lines}`;
}

function parseVerdict(raw: string): { content: number[]; locked: number[] } | null {
  const tryParse = (s: string) => {
    try {
      return JSON.parse(s);
    } catch {
      return null;
    }
  };
  let obj = tryParse(raw.trim());
  if (!obj) {
    const fence = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fence) obj = tryParse(fence[1].trim());
  }
  if (!obj) {
    const s = raw.indexOf('{');
    const e = raw.lastIndexOf('}');
    if (s !== -1 && e > s) obj = tryParse(raw.slice(s, e + 1));
  }
  if (!obj || !Array.isArray(obj.content)) return null;

  const toNums = (arr: any[]) => arr.map((n) => Number(n)).filter((n) => Number.isInteger(n));
  return { content: toNums(obj.content || []), locked: toNums(obj.locked || []) };
}

/**
 * Runs the strict AI structure classifier. Returns the set of content indices
 * (or null if AI is unavailable/failed → caller falls back to rules).
 */
export async function classifyStructureWithAi(
  outline: OutlineNode[],
  newBrand: string,
  newTitle: string,
  options: StructureAnalysisOptions
): Promise<StructureVerdict> {
  const hasKey = Boolean(options.apiKey && options.apiKey.trim().length > 5);
  if (!hasKey || outline.length === 0) {
    return { contentIdx: ruleBasedVerdict(outline), lockedIdx: [], source: 'fallback' };
  }

  const endpoint = (options.apiBaseUrl || 'https://api.openai.com/v1').replace(/\/$/, '');
  const model = options.model || 'gpt-4o-mini';
  const prompt = buildStrictPrompt(outline, newBrand, newTitle);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 120000);
    const res = await fetch(`${endpoint}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${options.apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            content:
              'You are a strict HTML structure classifier. You never edit HTML. You only output JSON indices.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0,
      }),
      signal: controller.signal,
    }).finally(() => clearTimeout(timeout));

    if (!res.ok) {
      return {
        contentIdx: ruleBasedVerdict(outline),
        lockedIdx: [],
        source: 'fallback',
        note: `Analisis struktur AI gagal (HTTP ${res.status}); memakai klasifikasi rule-based.`,
      };
    }

    const json = await res.json();
    const raw = json.choices?.[0]?.message?.content;
    const verdict = raw ? parseVerdict(raw) : null;

    if (!verdict || verdict.content.length === 0) {
      return {
        contentIdx: ruleBasedVerdict(outline),
        lockedIdx: [],
        source: 'fallback',
        note: 'Analisis struktur AI tidak mengembalikan hasil valid; memakai klasifikasi rule-based.',
      };
    }

    const valid = new Set(outline.map((n) => n.idx));
    const contentIdx = verdict.content.filter((i) => valid.has(i));
    const lockedIdx = verdict.locked.filter((i) => valid.has(i));

    return { contentIdx, lockedIdx, source: 'ai' };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return {
      contentIdx: ruleBasedVerdict(outline),
      lockedIdx: [],
      source: 'fallback',
      note: `Analisis struktur AI gagal (${msg}); memakai klasifikasi rule-based.`,
    };
  }
}
