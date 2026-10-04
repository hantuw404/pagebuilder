import * as cheerio from 'cheerio';
import { DetectedColor } from './types';

// ---------------------------------------------------------------------------
// Page color analysis
//
// Scans the reference document for color declarations (inline styles, <style>
// blocks, and presentational attributes) and groups them by hex value so the
// user can remap a dominant color to a new one.
// ---------------------------------------------------------------------------

const NAMED_COLORS: Record<string, string> = {
  black: '#000000',
  white: '#ffffff',
  red: '#ff0000',
  lime: '#00ff00',
  blue: '#0000ff',
  yellow: '#ffff00',
  cyan: '#00ffff',
  aqua: '#00ffff',
  magenta: '#ff00ff',
  fuchsia: '#ff00ff',
  silver: '#c0c0c0',
  gray: '#808080',
  grey: '#808080',
  maroon: '#800000',
  olive: '#808000',
  green: '#008000',
  purple: '#800080',
  teal: '#008080',
  navy: '#000080',
  orange: '#ffa500',
  gold: '#ffd700',
  pink: '#ffc0cb',
};

const COLOR_LABELS: Array<{ label: string; hue: number; sat: number; light: number }> = [
  { label: 'Merah', hue: 0, sat: 0.5, light: 0.35 },
  { label: 'Oranye', hue: 30, sat: 0.6, light: 0.4 },
  { label: 'Kuning', hue: 50, sat: 0.5, light: 0.4 },
  { label: 'Hijau', hue: 120, sat: 0.4, light: 0.35 },
  { label: 'Cyan', hue: 180, sat: 0.5, light: 0.4 },
  { label: 'Biru', hue: 220, sat: 0.5, light: 0.4 },
  { label: 'Ungu', hue: 280, sat: 0.5, light: 0.4 },
  { label: 'Magenta', hue: 320, sat: 0.5, light: 0.45 },
];

/** Expand a 3/4/6/8-digit hex to a canonical 6-digit lowercase hex (drops alpha). */
function normalizeHex(raw: string): string | null {
  let h = raw.trim().toLowerCase();
  if (!h.startsWith('#')) h = '#' + h;
  const body = h.slice(1);
  if (!/^[0-9a-f]+$/.test(body)) return null;
  if (body.length === 3) {
    return '#' + body.split('').map((c) => c + c).join('');
  }
  if (body.length === 4) {
    // #rgba -> drop alpha
    return '#' + body.slice(0, 3).split('').map((c) => c + c).join('');
  }
  if (body.length === 6) return '#' + body;
  if (body.length === 8) return '#' + body.slice(0, 6); // #rrggbbaa -> drop alpha
  return null;
}

function rgbToHex(r: number, g: number, b: number): string {
  const to = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
  return `#${to(r)}${to(g)}${to(b)}`;
}

/** Convert any CSS color literal (hex, rgb(), rgba(), named) to normalised hex. */
export function toHex(value: string): string | null {
  const v = value.trim().toLowerCase();
  if (!v) return null;

  if (NAMED_COLORS[v]) return NAMED_COLORS[v];

  const rgbMatch = v.match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/);
  if (rgbMatch) {
    const a = v.startsWith('rgba') ? Number((v.match(/,\s*([\d.]+)\s*\)/) || [])[1]) : 1;
    if (a === 0) return null; // fully transparent — ignore
    return rgbToHex(Number(rgbMatch[1]), Number(rgbMatch[2]), Number(rgbMatch[3]));
  }

  return normalizeHex(v);
}

/** Human-friendly label (color family) for a hex value. */
export function colorLabel(hex: string): string {
  const h = hex.replace('#', '');
  if (h.length !== 6) return 'Warna';
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const light = (max + min) / 2;
  const sat = max === min ? 0 : (light > 0.5 ? (max - min) / (2 - max - min) : (max - min) / (max + min));

  if (sat < 0.12) {
    if (light < 0.15) return 'Hitam';
    if (light > 0.9) return 'Putih';
    return 'Abu-abu';
  }

  let hue = 0;
  const d = max - min;
  if (max === r) hue = ((g - b) / d) % 6;
  else if (max === g) hue = (b - r) / d + 2;
  else hue = (r - g) / d + 4;
  hue = hue * 60;
  if (hue < 0) hue += 360;

  let best = COLOR_LABELS[0];
  let bestDist = Infinity;
  for (const c of COLOR_LABELS) {
    let dh = Math.abs(c.hue - hue);
    if (dh > 180) dh = 360 - dh;
    const dist = dh / 180 + Math.abs(c.sat - sat) * 0.3 + Math.abs(c.light - light) * 0.3;
    if (dist < bestDist) {
      bestDist = dist;
      best = c;
    }
  }
  return best.label;
}

/** Extract all color-like values from a chunk of CSS/text. */
function extractColorsFromText(text: string, tally: Map<string, number>): void {
  // hex colors
  const hexRe = /#[0-9a-fA-F]{3,8}\b/g;
  let m: RegExpExecArray | null;
  while ((m = hexRe.exec(text))) {
    const hex = normalizeHex(m[0]);
    if (hex && hex !== '#000000' && hex !== '#ffffff') {
      // Keep black/white too but they will usually dominate; filter later if needed.
    }
    if (hex) tally.set(hex, (tally.get(hex) || 0) + 1);
  }

  // rgb()/rgba()
  const rgbRe = /rgba?\([^)]*\)/gi;
  while ((m = rgbRe.exec(text))) {
    const hex = toHex(m[0]);
    if (hex) tally.set(hex, (tally.get(hex) || 0) + 1);
  }
}

/**
 * Analyse the reference HTML and return the most-used colors, sorted by
 * occurrence (descending). Black/white are kept but pushed down so accent
 * colors surface first.
 */
export function analyzePageColors(html: string, limit = 12): DetectedColor[] {
  const $ = cheerio.load(html);
  const tally = new Map<string, number>();

  // 1. <style> blocks
  $('style').each((_, el) => {
    extractColorsFromText($(el).html() || '', tally);
  });

  // 2. Inline styles
  $('[style]').each((_, el) => {
    extractColorsFromText($(el).attr('style') || '', tally);
  });

  // 3. Presentational attributes
  $('[bgcolor], [color]').each((_, el) => {
    const bg = $(el).attr('bgcolor');
    const c = $(el).attr('color');
    if (bg) {
      const hex = toHex(bg);
      if (hex) tally.set(hex, (tally.get(hex) || 0) + 1);
    }
    if (c) {
      const hex = toHex(c);
      if (hex) tally.set(hex, (tally.get(hex) || 0) + 1);
    }
  });

  // 4. Inline <svg> fill/stroke attributes
  $('svg [fill], svg [stroke]').each((_, el) => {
    const fill = $(el).attr('fill');
    const stroke = $(el).attr('stroke');
    if (fill) {
      const hex = toHex(fill);
      if (hex) tally.set(hex, (tally.get(hex) || 0) + 1);
    }
    if (stroke) {
      const hex = toHex(stroke);
      if (hex) tally.set(hex, (tally.get(hex) || 0) + 1);
    }
  });

  const NEUTRALS = new Set(['#000000', '#ffffff']);

  const colors: DetectedColor[] = Array.from(tally.entries())
    .map(([hex, occurrences]) => ({ hex, occurrences, label: colorLabel(hex) }));

  // Sort: accent colors first (by frequency), neutrals last.
  colors.sort((a, b) => {
    const aNeutral = NEUTRALS.has(a.hex) ? 1 : 0;
    const bNeutral = NEUTRALS.has(b.hex) ? 1 : 0;
    if (aNeutral !== bNeutral) return aNeutral - bNeutral;
    return b.occurrences - a.occurrences;
  });

  return colors.slice(0, limit);
}
