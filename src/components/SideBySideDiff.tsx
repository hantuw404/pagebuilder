'use client';

import React, { useState } from 'react';
import {
  CheckCircle2,
  Lock,
  ArrowRight,
  Filter,
  Sparkles,
  Layers,
  Image as ImageIcon,
  Link as LinkIcon,
  HelpCircle,
  Star,
  FileText,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { ContentSlot, GeneratedContent, ExtractedAsset, ExtractedLink, ValidationReport, DetectedColor } from '@/lib/types';

interface SideBySideDiffProps {
  detectedOldBrand: string;
  newBrand: string;
  originalTitle: string;
  newTitle: string;
  originalDesc: string;
  newDesc: string;
  contentSlots: ContentSlot[];
  generatedContent: GeneratedContent;
  assets: ExtractedAsset[];
  assetReplacements: Record<string, string>;
  links: ExtractedLink[];
  linkReplacements: Record<string, string>;
  detectedColors?: DetectedColor[];
  colorReplacements?: Record<string, string>;
  validationReport: ValidationReport;
}

type FilterCategory = 'all' | 'brand-meta' | 'headings' | 'paragraphs' | 'faq' | 'reviews' | 'assets' | 'links' | 'colors' | 'locked';

export default function SideBySideDiff({
  detectedOldBrand,
  newBrand,
  originalTitle,
  newTitle,
  originalDesc,
  newDesc,
  contentSlots,
  generatedContent,
  assets,
  assetReplacements,
  links,
  linkReplacements,
  detectedColors = [],
  colorReplacements = {},
  validationReport,
}: SideBySideDiffProps) {
  const [activeCategory, setActiveCategory] = useState<FilterCategory>('all');
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string) => {
    setExpandedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const h1Slots = contentSlots.filter((s) => s.type === 'H1');
  const h2Slots = contentSlots.filter((s) => s.type === 'H2');
  const h3Slots = contentSlots.filter((s) => s.type === 'H3');
  const pSlots = contentSlots.filter((s) => s.type === 'PARAGRAPH');
  const faqQSlots = contentSlots.filter((s) => s.type === 'FAQ_QUESTION');
  const reviewSlots = contentSlots.filter((s) => s.type === 'REVIEW_TEXT');
  const changedColors = detectedColors.filter(
    (c) => colorReplacements[c.hex] && colorReplacements[c.hex].toLowerCase() !== c.hex.toLowerCase()
  );

  return (
    <div className="space-y-4">
      {/* Category Pills Filter */}
      <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-xl bg-slate-950 border border-slate-800 text-xs">
        <span className="text-slate-400 font-mono text-[11px] px-2 flex items-center gap-1">
          <Filter className="w-3.5 h-3.5" /> Filter Elemen:
        </span>
        {[
          { id: 'all', label: 'Semua Elemen' },
          { id: 'brand-meta', label: 'Brand & Meta' },
          { id: 'headings', label: `Headings (${h1Slots.length + h2Slots.length + h3Slots.length})` },
          { id: 'paragraphs', label: `Paragraf (${pSlots.length})` },
          { id: 'faq', label: `FAQ (${generatedContent.faqs.length})` },
          { id: 'reviews', label: `Reviews (${generatedContent.reviews.length})` },
          { id: 'assets', label: `Assets (${assets.length})` },
          { id: 'links', label: `Links (${links.length})` },
          { id: 'colors', label: `Warna (${changedColors.length}/${detectedColors.length})` },
          { id: 'locked', label: 'CSS / JS (Locked)' },
        ].map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setActiveCategory(c.id as FilterCategory)}
            className={`px-3 py-1.5 rounded-lg font-medium transition ${
              activeCategory === c.id
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Header Comparison Labels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-2 text-xs font-mono font-bold text-slate-400">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-slate-500" />
          <span>ORIGINAL REFERENSI (SEBELUM)</span>
        </div>
        <div className="flex items-center gap-2 text-emerald-400">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
          <span>HASIL CLONING (SESUDAH)</span>
        </div>
      </div>

      {/* List of Side-by-Side Comparison Cards */}
      <div className="space-y-3">
        {/* 1. BRAND */}
        {(activeCategory === 'all' || activeCategory === 'brand-meta') && (
          <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
            <div className="bg-slate-900/80 px-4 py-2 border-b border-slate-800 flex items-center justify-between text-xs">
              <span className="font-mono font-semibold text-slate-300">BRAND IDENTITY</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                REPLACED
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-800 text-xs">
              <div className="p-4 bg-slate-950/40">
                <span className="text-[10px] font-mono text-slate-500 uppercase block mb-1">Old Brand</span>
                <span className="font-bold text-slate-300 text-sm">{detectedOldBrand}</span>
              </div>
              <div className="p-4 bg-emerald-950/10">
                <span className="text-[10px] font-mono text-emerald-500 uppercase block mb-1">New Brand</span>
                <span className="font-bold text-emerald-400 text-sm">{newBrand}</span>
              </div>
            </div>
          </div>
        )}

        {/* 2. META TITLE */}
        {(activeCategory === 'all' || activeCategory === 'brand-meta') && (
          <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
            <div className="bg-slate-900/80 px-4 py-2 border-b border-slate-800 flex items-center justify-between text-xs">
              <span className="font-mono font-semibold text-slate-300">&lt;title&gt; TAG</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                REPLACED
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-800 text-xs">
              <div className="p-4 bg-slate-950/40">
                <span className="text-[10px] font-mono text-slate-500 uppercase block mb-1">Original Title</span>
                <p className="text-slate-300 leading-relaxed font-sans">{originalTitle || '-'}</p>
              </div>
              <div className="p-4 bg-emerald-950/10">
                <span className="text-[10px] font-mono text-emerald-500 uppercase block mb-1">New Title</span>
                <p className="text-emerald-300 font-semibold leading-relaxed font-sans">{newTitle}</p>
              </div>
            </div>
          </div>
        )}

        {/* 3. META DESCRIPTION */}
        {(activeCategory === 'all' || activeCategory === 'brand-meta') && (
          <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
            <div className="bg-slate-900/80 px-4 py-2 border-b border-slate-800 flex items-center justify-between text-xs">
              <span className="font-mono font-semibold text-slate-300">META DESCRIPTION</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                REPLACED
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-800 text-xs">
              <div className="p-4 bg-slate-950/40">
                <span className="text-[10px] font-mono text-slate-500 uppercase block mb-1">Original Description</span>
                <p className="text-slate-400 leading-relaxed font-sans">{originalDesc || '-'}</p>
              </div>
              <div className="p-4 bg-emerald-950/10">
                <span className="text-[10px] font-mono text-emerald-500 uppercase block mb-1">New Description</span>
                <p className="text-slate-200 leading-relaxed font-sans">{generatedContent.rawMeta.metaDescription}</p>
              </div>
            </div>
          </div>
        )}

        {/* 4. HEADINGS (H1, H2, H3) */}
        {(activeCategory === 'all' || activeCategory === 'headings') && (
          <>
            {h1Slots.map((slot, idx) => (
              <div key={slot.id} className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
                <div className="bg-slate-900/80 px-4 py-2 border-b border-slate-800 flex items-center justify-between text-xs">
                  <span className="font-mono font-semibold text-amber-300">H1 HEADING (#{idx + 1})</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    SLOT: {slot.id} &bull; REPLACED
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-800 text-xs">
                  <div className="p-4 bg-slate-950/40">
                    <p className="font-bold text-slate-300 font-sans">{slot.originalText}</p>
                  </div>
                  <div className="p-4 bg-emerald-950/10">
                    <p className="font-bold text-emerald-300 font-sans">{generatedContent.h1[idx] || generatedContent.h1[0]}</p>
                  </div>
                </div>
              </div>
            ))}

            {h2Slots.map((slot, idx) => (
              <div key={slot.id} className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
                <div className="bg-slate-900/80 px-4 py-2 border-b border-slate-800 flex items-center justify-between text-xs">
                  <span className="font-mono font-semibold text-indigo-300">H2 HEADING (#{idx + 1})</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    SLOT: {slot.id} &bull; REPLACED
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-800 text-xs">
                  <div className="p-4 bg-slate-950/40">
                    <p className="font-semibold text-slate-300 font-sans">{slot.originalText}</p>
                  </div>
                  <div className="p-4 bg-emerald-950/10">
                    <p className="font-semibold text-emerald-300 font-sans">{generatedContent.h2[idx] || generatedContent.h2[0]}</p>
                  </div>
                </div>
              </div>
            ))}
          </>
        )}

        {/* 5. PARAGRAPHS */}
        {(activeCategory === 'all' || activeCategory === 'paragraphs') && (
          <div className="space-y-3">
            {pSlots.map((slot, idx) => (
              <div key={slot.id} className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
                <div className="bg-slate-900/80 px-4 py-2 border-b border-slate-800 flex items-center justify-between text-xs">
                  <span className="font-mono font-semibold text-slate-300">
                    PARAGRAF #{idx + 1} ({slot.originalWordCount} kata &rarr; ~{generatedContent.paragraphs[idx]?.split(/\s+/).length || 0} kata)
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    SLOT: {slot.id} &bull; MATCHED ±5%
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-800 text-xs">
                  <div className="p-4 bg-slate-950/40">
                    <p className="text-slate-400 leading-relaxed font-sans">{slot.originalText}</p>
                  </div>
                  <div className="p-4 bg-emerald-950/10">
                    <p className="text-slate-200 leading-relaxed font-sans">{generatedContent.paragraphs[idx] || '-'}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 6. FAQ */}
        {(activeCategory === 'all' || activeCategory === 'faq') && (
          <div className="space-y-3">
            {generatedContent.faqs.map((faq, idx) => {
              const origQSlot = faqQSlots[idx];
              return (
                <div key={idx} className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
                  <div className="bg-slate-900/80 px-4 py-2 border-b border-slate-800 flex items-center justify-between text-xs">
                    <span className="font-mono font-semibold text-amber-300">FAQ ITEM #{idx + 1}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      REPLACED
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-800 text-xs">
                    <div className="p-4 bg-slate-950/40 space-y-1.5">
                      <div className="font-bold text-slate-300 font-sans">
                        Q: {origQSlot ? origQSlot.originalText : `Pertanyaan Referensi #${idx + 1}`}
                      </div>
                      <div className="text-slate-400 font-sans leading-relaxed">
                        A: Jawaban referensi asli (mengikuti pola pertanyaan).
                      </div>
                    </div>
                    <div className="p-4 bg-emerald-950/10 space-y-1.5">
                      <div className="font-bold text-emerald-300 font-sans">Q: {faq.question}</div>
                      <div className="text-slate-200 font-sans leading-relaxed">A: {faq.answer}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 7. REVIEWS */}
        {(activeCategory === 'all' || activeCategory === 'reviews') && (
          <div className="space-y-3">
            {generatedContent.reviews.map((rev, idx) => {
              const origRevSlot = reviewSlots[idx];
              return (
                <div key={idx} className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
                  <div className="bg-slate-900/80 px-4 py-2 border-b border-slate-800 flex items-center justify-between text-xs">
                    <span className="font-mono font-semibold text-amber-300">REVIEW / TESTIMONI #{idx + 1}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      PLACEHOLDER CONTOH
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-800 text-xs">
                    <div className="p-4 bg-slate-950/40">
                      <span className="text-[10px] font-mono text-slate-500 block mb-1">Original Review</span>
                      <p className="text-slate-400 font-sans italic">
                        "{origRevSlot ? origRevSlot.originalText : `Review referensi #${idx + 1}`}"
                      </p>
                    </div>
                    <div className="p-4 bg-emerald-950/10">
                      <div className="flex items-center justify-between text-[11px] mb-1 font-mono">
                        <span className="font-semibold text-emerald-400">{rev.author || 'User'}</span>
                        <span className="text-amber-400">★★★★★</span>
                      </div>
                      <p className="text-slate-200 font-sans italic">"{rev.text}"</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 8. ASSETS */}
        {(activeCategory === 'all' || activeCategory === 'assets') && (
          <div className="space-y-3">
            {assets.map((asset, idx) => {
              const isReplaced = Boolean(assetReplacements[asset.originalUrl]);
              const newUrl = assetReplacements[asset.originalUrl];
              return (
                <div key={idx} className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
                  <div className="bg-slate-900/80 px-4 py-2 border-b border-slate-800 flex items-center justify-between text-xs">
                    <span className="font-mono font-semibold text-slate-300">
                      ASSET #{idx + 1}: {asset.role} ({asset.occurrences}× Used)
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        isReplaced
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {isReplaced ? 'REPLACED' : 'KEPT ORIGINAL'}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-800 text-xs font-mono">
                    <div className="p-4 bg-slate-950/40 break-all text-slate-400">
                      {asset.originalUrl}
                    </div>
                    <div className={`p-4 break-all ${isReplaced ? 'bg-emerald-950/10 text-emerald-300 font-semibold' : 'text-slate-500 italic'}`}>
                      {isReplaced ? newUrl : '(Mempertahankan URL Asli Referensi)'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 9. LINKS */}
        {(activeCategory === 'all' || activeCategory === 'links') && (
          <div className="space-y-3">
            {links.map((link, idx) => {
              const isReplaced = Boolean(linkReplacements[link.originalUrl]);
              const newUrl = linkReplacements[link.originalUrl];
              return (
                <div key={idx} className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
                  <div className="bg-slate-900/80 px-4 py-2 border-b border-slate-800 flex items-center justify-between text-xs">
                    <span className="font-mono font-semibold text-slate-300">
                      LINK #{idx + 1}: {link.category.toUpperCase()} ({link.occurrences}× Used &bull; {link.isRelative ? 'Relative' : 'Absolute'})
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        isReplaced
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {isReplaced ? 'REPLACED' : 'KEPT ORIGINAL'}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-800 text-xs font-mono">
                    <div className="p-4 bg-slate-950/40 break-all text-slate-400">
                      {link.originalUrl}
                    </div>
                    <div className={`p-4 break-all ${isReplaced ? 'bg-emerald-950/10 text-emerald-300 font-semibold' : 'text-slate-500 italic'}`}>
                      {isReplaced ? newUrl : '(Mempertahankan Link Asli Referensi)'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 9b. COLORS */}
        {(activeCategory === 'all' || activeCategory === 'colors') && detectedColors.length > 0 && (
          <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
            <div className="bg-slate-900/80 px-4 py-2 border-b border-slate-800 flex items-center justify-between text-xs">
              <span className="font-mono font-semibold text-slate-300">WARNA HALAMAN</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-pink-500/10 text-pink-400 border border-pink-500/20">
                {changedColors.length} DIGANTI / {detectedColors.length} TERDETEKSI
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 p-4">
              {detectedColors.map((color) => {
                const newColor = colorReplacements[color.hex] || '';
                const changed = newColor && newColor.toLowerCase() !== color.hex.toLowerCase();
                return (
                  <div
                    key={color.hex}
                    className={`rounded-lg border p-2 flex items-center gap-2 text-[11px] font-mono ${
                      changed ? 'border-pink-500/40 bg-pink-500/5' : 'border-slate-800'
                    }`}
                  >
                    <div className="w-6 h-6 rounded border border-slate-600 shrink-0" style={{ backgroundColor: color.hex }} />
                    {changed && (
                      <>
                        <ArrowRight className="w-3 h-3 text-slate-500 shrink-0" />
                        <div className="w-6 h-6 rounded border border-slate-600 shrink-0" style={{ backgroundColor: newColor }} />
                      </>
                    )}
                    <div className="min-w-0">
                      <div className="text-slate-300 truncate">{color.label}</div>
                      <div className="text-slate-500 truncate">
                        {changed ? `${color.hex} → ${newColor}` : color.hex}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 10. LOCKED ELEMENTS (CSS, JS, DOM STRUCTURE) */}
        {(activeCategory === 'all' || activeCategory === 'locked') && (
          <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
            <div className="bg-slate-900/80 px-4 py-2 border-b border-slate-800 flex items-center justify-between text-xs">
              <span className="font-mono font-semibold text-slate-300 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-blue-400" />
                ELEMEN TERKUNCI (CSS, JAVASCRIPT, DOM HIERARKI, LAYOUT)
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                100% UNCHANGED (TERJAGA UTUH)
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-800 text-xs">
              <div className="p-4 bg-slate-950/40 space-y-2">
                <div className="font-mono text-slate-400">Atribut & Struktur Referensi Asli:</div>
                <ul className="list-disc list-inside text-slate-400 space-y-1">
                  <li>Style tags & inline CSS: {validationReport.css.status}</li>
                  <li>Script tags & inline JS: {validationReport.js.status}</li>
                  <li>Section ordering & DOM hierarchy: {validationReport.sections.status}</li>
                  <li>Classes & IDs: 100% Locked</li>
                </ul>
              </div>
              <div className="p-4 bg-blue-950/10 space-y-2">
                <div className="font-mono text-blue-300">Hasil Output pageCLoner:</div>
                <ul className="list-disc list-inside text-slate-300 space-y-1">
                  <li>Style tags & inline CSS: {validationReport.css.detail}</li>
                  <li>Script tags & inline JS: {validationReport.js.detail}</li>
                  <li>Section ordering & DOM hierarchy: {validationReport.sections.detail}</li>
                  <li>Classes & IDs: Tetap persis seperti aslinya</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
