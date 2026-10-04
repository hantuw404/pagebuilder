'use client';

import React, { useState, useEffect } from 'react';
import {
  Globe,
  Sparkles,
  Cpu,
  Layers,
  Image as ImageIcon,
  Link as LinkIcon,
  CheckCircle2,
  AlertCircle,
  FileCode2,
  Download,
  Copy,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  Eye,
  ShieldCheck,
  Settings2,
  ExternalLink,
  FileText,
  Search,
  Filter,
} from 'lucide-react';
import AiSettingsModal, { AiConfig } from '@/components/AiSettingsModal';
import InstructionModal from '@/components/InstructionModal';
import SideBySideDiff from '@/components/SideBySideDiff';
import {
  AnalysisReport,
  ExtractedAsset,
  ExtractedLink,
  ContentSlot,
  GeneratedContent,
  ReplacementMap,
  ValidationReport,
} from '@/lib/types';

export default function HomePage() {
  const [step, setStep] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Step 1: Inputs
  const [inputMode, setInputMode] = useState<'url' | 'manual'>('url');
  const [referenceUrl, setReferenceUrl] = useState<string>('https://example.com');
  const [manualHtml, setManualHtml] = useState<string>('');
  const [newBrand, setNewBrand] = useState<string>('SAKAUTOTO');
  const [newTitle, setNewTitle] = useState<string>(
    'SAKAUTOTO | Perjalanan Mencari Kitab Suci Menuju Situs Toto Slot Gacor'
  );

  // AI settings
  const [isAiModalOpen, setIsAiModalOpen] = useState<boolean>(false);
  const [isInstructionModalOpen, setIsInstructionModalOpen] = useState<boolean>(false);
  const [customInstructions, setCustomInstructions] = useState<string>('');
  const [aiConfig, setAiConfig] = useState<AiConfig>({
    provider: 'openrouter',
    apiKey: '',
    apiBaseUrl: 'https://openrouter.ai/api/v1',
    model: 'openai/gpt-4o-mini',
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem('SRC_AI_CONFIG');
      if (saved) {
        setAiConfig(JSON.parse(saved));
      }
    } catch (_) {}
  }, []);

  const handleSaveAiConfig = (newConfig: AiConfig) => {
    setAiConfig(newConfig);
    try {
      localStorage.setItem('SRC_AI_CONFIG', JSON.stringify(newConfig));
    } catch (_) {}
    setCopiedNotification('Pengaturan AI berhasil disimpan');
    setTimeout(() => setCopiedNotification(''), 2500);
  };

  // Step 2: Analysis Results
  const [rawHtml, setRawHtml] = useState<string>('');
  const [detectedOldBrand, setDetectedOldBrand] = useState<string>('');
  const [analysisReport, setAnalysisReport] = useState<AnalysisReport | null>(null);
  const [formattedAnalysis, setFormattedAnalysis] = useState<string>('');
  const [contentSlots, setContentSlots] = useState<ContentSlot[]>([]);
  const [assets, setAssets] = useState<ExtractedAsset[]>([]);
  const [links, setLinks] = useState<ExtractedLink[]>([]);
  const [activeAnalysisTab, setActiveAnalysisTab] = useState<'summary' | 'raw' | 'blueprint'>('summary');

  // Step 3: Generated Content
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [formattedContent, setFormattedContent] = useState<string>('');
  const [activeContentTab, setActiveContentTab] = useState<'preview' | 'rawMeta' | 'article' | 'faq' | 'review'>('preview');

  // Step 4: Asset Replacements & Filters
  const [assetReplacements, setAssetReplacements] = useState<Record<string, string>>({});
  const [assetFilter, setAssetFilter] = useState<string>('');
  const [assetRoleFilter, setAssetRoleFilter] = useState<string>('ALL');

  // Step 5: Link Replacements & Filters
  const [linkReplacements, setLinkReplacements] = useState<Record<string, string>>({});
  const [linkFilter, setLinkFilter] = useState<string>('');
  const [linkCategoryFilter, setLinkCategoryFilter] = useState<string>('ALL');

  // Step 6: Final Clone & Validation
  const [clonedHtml, setClonedHtml] = useState<string>('');
  const [validationReport, setValidationReport] = useState<ValidationReport | null>(null);
  const [formattedDiff, setFormattedDiff] = useState<string>('');
  const [activePreviewTab, setActivePreviewTab] = useState<'diff' | 'live' | 'html' | 'map'>('diff');
  const [copiedNotification, setCopiedNotification] = useState<string>('');

  // Computed Filtered Assets (Step 4)
  const filteredAssets = assets.filter((asset) => {
    const query = assetFilter.trim().toLowerCase();
    const matchSearch =
      !query ||
      asset.originalUrl.toLowerCase().includes(query) ||
      asset.role.toLowerCase().includes(query);
    const matchRole = assetRoleFilter === 'ALL' || asset.role === assetRoleFilter;
    return matchSearch && matchRole;
  });

  const assetDomains = Array.from(
    new Set(
      assets
        .map((a) => {
          try {
            if (a.originalUrl.startsWith('http')) {
              return new URL(a.originalUrl).hostname;
            }
          } catch (_) {}
          return '';
        })
        .filter(Boolean)
    )
  ).slice(0, 5);

  // Computed Filtered Links (Step 5)
  const filteredLinks = links.filter((link) => {
    const query = linkFilter.trim().toLowerCase();
    const matchSearch =
      !query ||
      link.originalUrl.toLowerCase().includes(query) ||
      link.category.toLowerCase().includes(query);
    const matchCategory = linkCategoryFilter === 'ALL' || link.category === linkCategoryFilter;
    return matchSearch && matchCategory;
  });

  const linkDomains = Array.from(
    new Set(
      links
        .map((l) => {
          try {
            if (l.originalUrl.startsWith('http')) {
              return new URL(l.originalUrl).hostname;
            }
          } catch (_) {}
          return '';
        })
        .filter(Boolean)
    )
  ).slice(0, 5);

  // Sample data loader for quick testing
  const loadDemoReference = () => {
    setInputMode('manual');
    setNewBrand('SAKAUTOTO');
    setNewTitle('SAKAUTOTO | Perjalanan Mencari Kitab Suci Menuju Situs Toto Slot Gacor');
    setManualHtml(`<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>ALEXISTOGEL: Situs Togel & Slot Online Resmi Terpercaya</title>
  <meta name="description" content="ALEXISTOGEL menghadirkan pasaran toto terlengkap dan ragam permainan slot terpercaya dengan sistem keamanan terbaik.">
  <meta name="keywords" content="ALEXISTOGEL, slot online, togel terpercaya">
  <meta property="og:title" content="ALEXISTOGEL: Situs Togel & Slot Online Resmi Terpercaya">
  <meta property="og:description" content="Daftar akun ALEXISTOGEL dan rasakan layanan terbaik 24 jam.">
  <meta property="og:image" content="https://alexistogel-demo.com/images/og-banner.webp">
  <link rel="canonical" href="https://alexistogel-demo.com/">
  <link rel="icon" href="https://alexistogel-demo.com/favicon.ico">
  <style>
    body { font-family: sans-serif; background: #111827; color: #fff; margin: 0; padding: 20px; }
    .hero { text-align: center; padding: 40px 20px; background: #1f2937; border-radius: 8px; margin-bottom: 20px; }
    .cta-btn { display: inline-block; padding: 12px 24px; background: #eab308; color: #000; text-decoration: none; font-weight: bold; border-radius: 6px; }
    .content-box { max-width: 800px; margin: 0 auto; line-height: 1.6; }
    .faq-item { background: #1e293b; padding: 15px; margin-bottom: 10px; border-radius: 6px; }
    .review-card { background: #0f172a; padding: 15px; border-left: 4px solid #eab308; margin-bottom: 10px; }
  </style>
</head>
<body>
  <header style="display:flex; justify-content:space-between; align-items:center; padding: 15px 0;">
    <img src="https://alexistogel-demo.com/assets/logo.webp" alt="ALEXISTOGEL Logo" width="160" height="45">
    <nav>
      <a href="/login" style="color:#eab308; margin-right:15px;">Login</a>
      <a href="/register" class="cta-btn">Daftar Sekarang</a>
    </nav>
  </header>

  <main class="content-box">
    <section class="hero">
      <h1>ALEXISTOGEL: Portal Permainan Digital Terdepan</h1>
      <p>Selamat datang di ALEXISTOGEL, platform terpercaya dengan integrasi sistem modern dan enkripsi data berstandar global.</p>
      <a href="/register" class="cta-btn">Gabung ALEXISTOGEL</a>
    </section>

    <section>
      <h2>Keunggulan Bermain di Situs Resmi ALEXISTOGEL</h2>
      <p>Platform ALEXISTOGEL mengutamakan kecepatan akses dan reliabilitas server untuk memastikan pengalaman terbaik setiap hari.</p>
      <p>Seluruh proses deposit serta penarikan dana di ALEXISTOGEL diproses dalam hitungan menit berkat kerja sama dengan bank lokal terkemuka.</p>
      
      <h2>Sistem Proteksi dan Lisensi Keamanan</h2>
      <p>Data pribadi setiap anggota ALEXISTOGEL dienkripsi penuh menggunakan teknologi SSL mutakhir tanpa risiko kebocoran ke pihak ketiga.</p>
      <p>Layanan konsumen ALEXISTOGEL beroperasi 24 jam nonstop siap mendampingi kebutuhan member dengan sigap dan profesional.</p>
    </section>

    <section class="faq">
      <h2>Pertanyaan Umum Seputar ALEXISTOGEL</h2>
      <div class="faq-item">
        <h3 class="faq-question">Bagaimana cara melakukan registrasi akun di ALEXISTOGEL?</h3>
        <p class="faq-answer">Cukup klik tombol daftar di ALEXISTOGEL, isi formulir dengan data yang valid, dan akun langsung aktif.</p>
      </div>
      <div class="faq-item">
        <h3 class="faq-question">Berapa minimal deposit yang berlaku di ALEXISTOGEL?</h3>
        <p class="faq-answer">Minimal transaksi di ALEXISTOGEL sangat terjangkau sehingga dapat dinikmati oleh seluruh kalangan pemain.</p>
      </div>
    </section>

    <section class="review">
      <h2>Ulasan Pengguna ALEXISTOGEL</h2>
      <div class="review-card">
        <p>Layanan ALEXISTOGEL sangat memuaskan, proses transaksi super kilat!</p>
      </div>
      <div class="review-card">
        <p>Sudah lama bermain di ALEXISTOGEL, customer service selalu ramah dan membantu.</p>
      </div>
    </section>
  </main>

  <footer style="text-align:center; padding:30px; border-top:1px solid #334155; margin-top:40px;">
    <p>&copy; 2026 ALEXISTOGEL. All rights reserved. <a href="/terms" style="color:#94a3b8;">Ketentuan Layanan</a></p>
  </footer>
</body>
</html>`);
  };

  // STEP 1: Handle Analyze Reference
  const handleAnalyze = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          referenceUrl: inputMode === 'url' ? referenceUrl : '',
          rawHtml: inputMode === 'manual' ? manualHtml : '',
          newBrand,
          newTitle,
          mode: inputMode === 'manual' ? 'manual' : 'raw',
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal menganalisis referensi.');
      }

      setRawHtml(data.rawHtml);
      setAnalysisReport(data.report);
      setFormattedAnalysis(data.formattedAnalysis);
      setContentSlots(data.contentSlots);
      setAssets(data.assets);
      setLinks(data.links);
      setDetectedOldBrand(data.detectedOldBrand || data.report.detectedOldBrand);

      // Initialize replacements defaults
      const initialAssets: Record<string, string> = {};
      data.assets.forEach((a: ExtractedAsset) => {
        initialAssets[a.originalUrl] = '';
      });
      setAssetReplacements(initialAssets);

      const initialLinks: Record<string, string> = {};
      data.links.forEach((l: ExtractedLink) => {
        initialLinks[l.originalUrl] = '';
      });
      setLinkReplacements(initialLinks);

      setStep(2);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  // STEP 2: Handle Generate Content
  const handleGenerateContent = async () => {
    if (!analysisReport) return;
    setLoading(true);
    setErrorMessage('');
    try {
      const res = await fetch('/api/generate-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          report: analysisReport,
          contentSlots,
          newBrand,
          newTitle,
          options: aiConfig.apiKey
            ? {
                apiKey: aiConfig.apiKey,
                apiBaseUrl: aiConfig.apiBaseUrl,
                model: aiConfig.model,
                customInstructions: customInstructions.trim(),
              }
            : {
                customInstructions: customInstructions.trim(),
              },
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal menghasilkan konten SEO.');
      }

      setGeneratedContent(data.content);
      setFormattedContent(data.formattedContent);
      setStep(3);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  // STEP 5 -> STEP 6: Execute Clone & Validation
  const handleExecuteClone = async () => {
    if (!rawHtml || !generatedContent || !analysisReport) return;
    setLoading(true);
    setErrorMessage('');
    try {
      const replacementMap: ReplacementMap = {
        brand: {
          old: detectedOldBrand,
          new: newBrand,
        },
        title: {
          new: newTitle,
        },
        assets: assetReplacements,
        links: linkReplacements,
        contentSlots: {},
      };

      const res = await fetch('/api/clone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawHtml,
          replacementMap,
          generatedContent,
          contentSlots,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal mengeksekusi cloning.');
      }

      setClonedHtml(data.clonedHtml);
      setValidationReport(data.validation);
      setFormattedDiff(data.formattedDiff);
      setStep(6);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  // Download ZIP
  const handleDownloadZip = async () => {
    try {
      const replacementMap: ReplacementMap = {
        brand: { old: detectedOldBrand, new: newBrand },
        title: { new: newTitle },
        assets: assetReplacements,
        links: linkReplacements,
        contentSlots: {},
      };

      const res = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          finalHtml: clonedHtml,
          replacementMap,
          brandName: newBrand,
        }),
      });

      if (!res.ok) throw new Error('Download export gagal.');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${newBrand.toUpperCase()}-CLONE.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : String(err));
    }
  };

  // Download HTML Only
  const handleDownloadHtmlOnly = () => {
    try {
      const blob = new Blob([clonedHtml], { type: 'text/html;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${newBrand.toLowerCase().replace(/[^a-z0-9_-]/g, '_')}-index.html`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      setCopiedNotification('index.html berhasil diunduh');
      setTimeout(() => setCopiedNotification(''), 2500);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : String(err));
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedNotification(label);
    setTimeout(() => setCopiedNotification(''), 2500);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-50 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-lg bg-gradient-to-tr from-amber-500 to-indigo-600 flex items-center justify-center font-black text-xl text-slate-950 shadow-lg shadow-indigo-500/20 font-mono">
            pC
          </div>
          <div>
            <h1 className="font-bold text-lg text-white tracking-tight flex items-center gap-2">
              pageCLoner
              <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Structure-Preserving
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              PRD Engine v3 — Preserve DOM, CSS & JS. Replace semantic content only.
            </p>
          </div>
        </div>

        {/* Step Indicator & AI Settings */}
        <div className="flex items-center gap-2 sm:gap-3 text-xs font-medium">
          <button
            type="button"
            onClick={() => setIsInstructionModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition shadow-sm"
            title="Lihat master instruksi INSTRUCTION.md"
          >
            <FileText className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold hidden sm:inline">INSTRUCTION.md</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </button>

          <button
            type="button"
            onClick={() => setIsAiModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition shadow-sm"
          >
            <Settings2 className="w-4 h-4 text-indigo-400" />
            <span className="font-semibold hidden sm:inline">Pengaturan AI</span>
            {aiConfig.apiKey ? (
              <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono text-[10px] border border-emerald-500/30">
                {aiConfig.provider.toUpperCase()}
              </span>
            ) : (
              <span className="px-1.5 py-0.5 rounded bg-slate-700 text-slate-300 font-mono text-[10px]">
                Offline
              </span>
            )}
          </button>

          <div className="h-4 w-px bg-slate-800 hidden sm:block" />

          {[
            { n: 1, title: 'Input' },
            { n: 2, title: 'Analisis' },
            { n: 3, title: 'Konten' },
            { n: 4, title: 'Asset' },
            { n: 5, title: 'Link' },
            { n: 6, title: 'Final & Diff' },
          ].map((s) => (
            <button
              key={s.n}
              onClick={() => {
                if (s.n <= step || (step > 1 && s.n < step)) setStep(s.n);
              }}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-md transition-all ${
                step === s.n
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30'
                  : step > s.n
                  ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  : 'text-slate-500 cursor-not-allowed'
              }`}
            >
              <span
                className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  step === s.n ? 'bg-white text-indigo-700' : 'bg-slate-700 text-slate-300'
                }`}
              >
                {s.n}
              </span>
              <span className="hidden md:inline">{s.title}</span>
            </button>
          ))}
        </div>
      </header>

      {/* Global Error Alert */}
      {errorMessage && (
        <div className="mx-6 mt-4 p-4 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-start gap-3 animate-fade-in">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1 font-mono text-xs">{errorMessage}</div>
          <button
            onClick={() => setErrorMessage('')}
            className="text-rose-400 hover:text-rose-200 text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* Toast Notification */}
      {copiedNotification && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-4 py-2 rounded-md shadow-lg text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          {copiedNotification} berhasil disalin ke clipboard!
        </div>
      )}

      {/* Main Multi-Step Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6">
        {/* ================= STEP 1: REFERENCE SETUP ================= */}
        {step === 1 && (
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
                <h2 className="text-base font-semibold text-white flex items-center gap-2">
                  <Globe className="w-5 h-5 text-indigo-400" />
                  Step 1 — Reference Setup & Core Inputs
                </h2>
                <button
                  type="button"
                  onClick={loadDemoReference}
                  className="text-xs text-amber-400 hover:text-amber-300 bg-amber-400/10 px-2.5 py-1 rounded border border-amber-400/20 font-medium transition"
                >
                  ⚡ Muat Data Demo (ALEXISTOGEL → SAKAUTOTO)
                </button>
              </div>

              {/* Mode Selector */}
              <div className="flex gap-4 mb-4">
                <label className="flex items-center gap-2 cursor-pointer text-xs">
                  <input
                    type="radio"
                    checked={inputMode === 'url'}
                    onChange={() => setInputMode('url')}
                    className="accent-indigo-600"
                  />
                  <span>Mode A: Reference URL (Raw Fetch)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-xs">
                  <input
                    type="radio"
                    checked={inputMode === 'manual'}
                    onChange={() => setInputMode('manual')}
                    className="accent-indigo-600"
                  />
                  <span>Mode B: Paste Raw HTML (Direct DOM)</span>
                </label>
              </div>

              {inputMode === 'url' ? (
                <div className="mb-4">
                  <label className="block text-xs font-mono uppercase text-slate-400 mb-1">
                    REFERENCE URL
                  </label>
                  <input
                    type="url"
                    value={referenceUrl}
                    onChange={(e) => setReferenceUrl(e.target.value)}
                    placeholder="https://example.com/"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Mengambil source HTML asli referensi secara identik (View Source mode).
                  </p>
                </div>
              ) : (
                <div className="mb-4">
                  <label className="block text-xs font-mono uppercase text-slate-400 mb-1">
                    PASTE RAW HTML SOURCE
                  </label>
                  <textarea
                    rows={8}
                    value={manualHtml}
                    onChange={(e) => setManualHtml(e.target.value)}
                    placeholder="<!DOCTYPE html><html><head>...</head><body>...</body></html>"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-xs text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Ideal jika web target menggunakan Cloudflare / proteksi bot atau SPA exported HTML.
                  </p>
                </div>
              )}

              {/* Brand and Title Inputs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-mono uppercase text-slate-400 mb-1">
                    NEW BRAND
                  </label>
                  <input
                    type="text"
                    value={newBrand}
                    onChange={(e) => setNewBrand(e.target.value)}
                    placeholder="SAKAUTOTO"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-slate-100 font-bold focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase text-slate-400 mb-1">
                    NEW TITLE (PRIMARY INTENT)
                  </label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="SAKAUTOTO | Perjalanan Mencari Kitab Suci Menuju Situs Toto Slot Gacor"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* AI Engine Status Card */}
              <div className="pt-2 border-t border-slate-800">
                <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-indigo-600/10 text-indigo-400 border border-indigo-500/20">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-200 flex items-center gap-2">
                        Content Engine:
                        {aiConfig.apiKey ? (
                          <span className="text-emerald-400 font-mono text-xs">
                            {aiConfig.provider.toUpperCase()} ({aiConfig.model})
                          </span>
                        ) : (
                          <span className="text-indigo-300 text-xs">
                            Deterministic Native Engine (Offline & Presisi ±5%)
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {aiConfig.apiKey
                          ? 'Menggunakan LLM eksternal untuk variasi copywriting lebih kaya.'
                          : '100% presisi jumlah elemen & estimasi kata tanpa butuh API key.'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsAiModalOpen(true)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition border border-slate-700"
                  >
                    <Settings2 className="w-3.5 h-3.5 text-indigo-400" />
                    Atur API AI
                  </button>
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-6">
                <button
                  type="button"
                  disabled={loading || (!referenceUrl && !manualHtml) || !newBrand || !newTitle}
                  onClick={handleAnalyze}
                  className="w-full py-3 px-6 rounded-lg bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 disabled:opacity-50 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Mengekstraksi & Menganalisis Struktur Referensi...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      ANALYZE REFERENCE (STEP 1)
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================= STEP 2: REFERENCE ANALYSIS ================= */}
        {step === 2 && analysisReport && (
          <div className="space-y-6">
            {/* Top Analysis Header Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div>
                  <span className="text-xs uppercase tracking-wider text-emerald-400 font-mono font-semibold">
                    ✓ REFERENCE ANALYZED
                  </span>
                  <h2 className="text-xl font-bold text-white mt-1">
                    Struktur Halaman Referensi Terdeteksi
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Target: Pertahankan 100% hierarki DOM, section order, CSS & JS.
                  </p>
                </div>
                <div className="flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
                  <span className="text-xs text-slate-400">Old Brand Terdeteksi:</span>
                  <span className="text-xs font-mono font-bold text-amber-300">
                    {detectedOldBrand}
                  </span>
                </div>
              </div>

              {/* Grid Metrics (PRD Step 2 checklist) */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-4">
                <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800">
                  <div className="text-[11px] font-mono text-slate-400">STRUKTUR</div>
                  <div className="mt-1 text-sm font-semibold text-slate-200">
                    ✓ {analysisReport.structure.h1} H1 &bull; {analysisReport.structure.h2} H2 &bull; {analysisReport.structure.h3} H3
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    ✓ {analysisReport.structure.paragraphs} Paragraf (~{analysisReport.structure.totalWords} kata)
                  </div>
                </div>

                <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800">
                  <div className="text-[11px] font-mono text-slate-400">FAQ</div>
                  <div className="mt-1 text-sm font-semibold text-slate-200">
                    ✓ {analysisReport.faq.count} Pertanyaan
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {analysisReport.faq.hasFaq ? 'Terdeteksi struktur FAQ' : 'Tanpa FAQ'}
                  </div>
                </div>

                <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800">
                  <div className="text-[11px] font-mono text-slate-400">REVIEWS</div>
                  <div className="mt-1 text-sm font-semibold text-slate-200">
                    ✓ {analysisReport.review.count} Item
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {analysisReport.review.hasReview ? 'Review card terdeteksi' : 'Tanpa review'}
                  </div>
                </div>

                <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800">
                  <div className="text-[11px] font-mono text-slate-400">ASSETS</div>
                  <div className="mt-1 text-sm font-semibold text-slate-200">
                    ✓ {assets.length} Unique URLs
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Gambar, Logo, Icon, Favicon
                  </div>
                </div>

                <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800">
                  <div className="text-[11px] font-mono text-slate-400">LINKS</div>
                  <div className="mt-1 text-sm font-semibold text-slate-200">
                    ✓ {links.length} Unique URLs
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    CTA, Navigasi, Internal & Sosmed
                  </div>
                </div>
              </div>

              {/* Sub-Tabs for Analysis View */}
              <div className="mt-6 flex border-b border-slate-800 text-xs">
                <button
                  type="button"
                  onClick={() => setActiveAnalysisTab('summary')}
                  className={`pb-2 px-4 font-semibold border-b-2 transition ${
                    activeAnalysisTab === 'summary'
                      ? 'border-indigo-500 text-indigo-400'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Ringkasan Metadata & Keyword
                </button>
                <button
                  type="button"
                  onClick={() => setActiveAnalysisTab('raw')}
                  className={`pb-2 px-4 font-semibold border-b-2 transition ${
                    activeAnalysisTab === 'raw'
                      ? 'border-indigo-500 text-indigo-400'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Raw Analysis Output (Section 30 PRD)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveAnalysisTab('blueprint')}
                  className={`pb-2 px-4 font-semibold border-b-2 transition ${
                    activeAnalysisTab === 'blueprint'
                      ? 'border-indigo-500 text-indigo-400'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  DOM Blueprint ({analysisReport.blueprint.length} Sections)
                </button>
              </div>

              <div className="mt-4">
                {activeAnalysisTab === 'summary' && (
                  <div className="space-y-4">
                    <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
                      <h3 className="text-xs font-mono uppercase text-slate-400 mb-2">
                        Status Metadata Referensi
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                        {Object.entries(analysisReport.metadata).map(([key, meta]) => (
                          <div key={key} className="flex items-center justify-between p-2 rounded bg-slate-900/60">
                            <span className="font-mono text-slate-300">{key}</span>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                                meta.status === 'FOUND'
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : 'bg-slate-800 text-slate-500'
                              }`}
                            >
                              {meta.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
                      <h3 className="text-xs font-mono uppercase text-slate-400 mb-2">
                        Keyword Mapping (Title & Brand Correlation)
                      </h3>
                      <div className="text-xs space-y-1.5">
                        <div>
                          <span className="text-slate-400">Primary Keyword: </span>
                          <span className="font-semibold text-indigo-400">
                            {analysisReport.keywords.primary}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400">Secondary Keywords: </span>
                          <span className="text-slate-300">
                            {analysisReport.keywords.secondary.join(', ')}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400">Related Terms: </span>
                          <span className="text-slate-300">
                            {analysisReport.keywords.related.join(', ')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeAnalysisTab === 'raw' && (
                  <div className="relative">
                    <pre className="bg-slate-950 p-4 rounded-lg border border-slate-800 text-xs font-mono text-slate-200 overflow-x-auto whitespace-pre-wrap max-h-96">
                      {formattedAnalysis}
                    </pre>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(formattedAnalysis, 'Raw Analisis')}
                      className="absolute top-3 right-3 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded flex items-center gap-1"
                    >
                      <Copy className="w-3.5 h-3.5" /> Salin
                    </button>
                  </div>
                )}

                {activeAnalysisTab === 'blueprint' && (
                  <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-2 max-h-96 overflow-y-auto">
                    {analysisReport.blueprint.map((b) => (
                      <div
                        key={b.order}
                        className="flex items-start gap-3 p-2.5 rounded bg-slate-900/60 text-xs"
                      >
                        <span className="w-6 h-6 rounded bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-bold text-[11px] shrink-0">
                          {b.order}
                        </span>
                        <div>
                          <span className="font-mono font-semibold text-slate-200">
                            {b.section}
                          </span>
                          <div className="text-slate-400 text-[11px] mt-0.5">
                            Elemen: {b.elements.join(', ') || 'N/A'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Custom Instructions Input */}
              <div className="mt-5 p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="text-xs font-semibold text-slate-200 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                    Custom Instructions / Prompt Tambahan (Opsional)
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsInstructionModalOpen(true)}
                    className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-mono transition"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>INSTRUCTION.md Aktif (Master Prompt) &bull; Buka / Edit</span>
                  </button>
                </div>
                <textarea
                  rows={2}
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value)}
                  placeholder="Contoh: Gunakan gaya bahasa santai dan persuasif, tekankan bonus new member 100%, jangan gunakan kata garansi, fokus pada kecepatan withdraw..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 font-sans"
                />
                {/* Quick Chips */}
                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                  <span className="text-[10px] text-slate-400 font-mono mr-1">Template cepat:</span>
                  {[
                    'Gaya bahasa santai & persuasif',
                    'Fokus promosi bonus & event',
                    'Tekankan keamanan SSL & lisensi resmi',
                    'Formal, informatif & terpercaya',
                  ].map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() =>
                        setCustomInstructions((prev) =>
                          prev ? `${prev}, ${chip}` : chip
                        )
                      }
                      className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded-full border border-slate-700 transition"
                    >
                      + {chip}
                    </button>
                  ))}
                  {customInstructions && (
                    <button
                      type="button"
                      onClick={() => setCustomInstructions('')}
                      className="text-[10px] text-rose-400 hover:text-rose-300 ml-auto"
                    >
                      Hapus
                    </button>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="py-2.5 px-4 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" /> Kembali
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleGenerateContent}
                  className="py-2.5 px-6 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Membuat Konten Sesuai Blueprint...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      GENERATE CONTENT (STEP 3)
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================= STEP 3: GENERATED CONTENT ================= */}
        {step === 3 && generatedContent && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div>
                  <span className="text-xs uppercase tracking-wider text-indigo-400 font-mono font-semibold">
                    ✓ CONTENT GENERATED
                  </span>
                  <h2 className="text-xl font-bold text-white mt-1">
                    Konten SEO Baru (Structure-Matched)
                  </h2>
                </div>

                {/* Word count & Structure Check Badges */}
                <div className="flex flex-wrap items-center gap-2">
                  {generatedContent.engine === 'llm' ? (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      Engine: AI ({aiConfig.model || 'LLM'})
                    </div>
                  ) : (
                    <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold flex items-center gap-1.5">
                      <Cpu className="w-3.5 h-3.5" />
                      Engine: Offline (Deterministic)
                    </div>
                  )}
                  <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Word Count: ~{generatedContent.wordCount} kata ({generatedContent.wordCountMatchPercent}% match)
                  </div>
                  <div className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold">
                    Structure: PASS
                  </div>
                </div>
              </div>

              {/* Engine fallback notice — explains why AI wasn't used */}
              {generatedContent.engine === 'deterministic' && generatedContent.engineNote && (
                <div className="mt-4 p-3.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <span className="font-semibold">Konten dibuat memakai engine offline.</span>{' '}
                    <span className="text-amber-300/90 font-mono">{generatedContent.engineNote}</span>
                    <div className="mt-1 text-[11px] text-amber-300/70">
                      Buka &quot;Pengaturan AI&quot; di header, pastikan API key &amp; model benar, lalu klik
                      &quot;Test Koneksi&quot;. Generate ulang konten setelahnya.
                    </div>
                  </div>
                </div>
              )}

              {/* Sub tabs */}
              <div className="mt-4 flex border-b border-slate-800 text-xs overflow-x-auto">
                {[
                  { id: 'preview', label: 'Raw Content Output (Section 31 PRD)' },
                  { id: 'rawMeta', label: '1. Raw Meta' },
                  { id: 'article', label: '2. Artikel (Headings & Paragraf)' },
                  { id: 'faq', label: `3. FAQ (${generatedContent.faqs.length})` },
                  { id: 'review', label: `4. Review (${generatedContent.reviews.length})` },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setActiveContentTab(t.id as any)}
                    className={`pb-2 px-4 font-semibold whitespace-nowrap border-b-2 transition ${
                      activeContentTab === t.id
                        ? 'border-indigo-500 text-indigo-400'
                        : 'border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <div className="mt-4">
                {activeContentTab === 'preview' && (
                  <div className="relative">
                    <pre className="bg-slate-950 p-4 rounded-lg border border-slate-800 text-xs font-mono text-slate-200 overflow-x-auto whitespace-pre-wrap max-h-96">
                      {formattedContent}
                    </pre>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(formattedContent, 'Raw Hasil Konten')}
                      className="absolute top-3 right-3 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded flex items-center gap-1"
                    >
                      <Copy className="w-3.5 h-3.5" /> Salin
                    </button>
                  </div>
                )}

                {activeContentTab === 'rawMeta' && (
                  <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-3 font-mono text-xs">
                    <div>
                      <span className="text-indigo-400 block font-bold">META TITLE:</span>
                      <span className="text-slate-200">{generatedContent.rawMeta.metaTitle}</span>
                    </div>
                    <div>
                      <span className="text-indigo-400 block font-bold">META DESCRIPTION:</span>
                      <span className="text-slate-200">{generatedContent.rawMeta.metaDescription}</span>
                    </div>
                    <div>
                      <span className="text-indigo-400 block font-bold">META KEYWORDS:</span>
                      <span className="text-slate-200">{generatedContent.rawMeta.metaKeywords}</span>
                    </div>
                    <div>
                      <span className="text-indigo-400 block font-bold">ROBOTS:</span>
                      <span className="text-slate-200">{generatedContent.rawMeta.robots}</span>
                    </div>
                    <div>
                      <span className="text-indigo-400 block font-bold">CANONICAL:</span>
                      <span className="text-slate-200">{generatedContent.rawMeta.canonical}</span>
                    </div>
                  </div>
                )}

                {activeContentTab === 'article' && (
                  <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-4 text-xs">
                    <div>
                      <h4 className="font-mono text-slate-400 uppercase text-[11px] mb-1">H1 Tag</h4>
                      {generatedContent.h1.map((h, i) => (
                        <div key={i} className="font-bold text-sm text-amber-300 mb-1">
                          {h}
                        </div>
                      ))}
                    </div>

                    <div>
                      <h4 className="font-mono text-slate-400 uppercase text-[11px] mb-1">H2 & H3 Headings</h4>
                      <div className="space-y-1">
                        {generatedContent.h2.map((h, i) => (
                          <div key={i} className="text-indigo-300 font-semibold">
                            ## {h}
                          </div>
                        ))}
                        {generatedContent.h3.map((h, i) => (
                          <div key={i} className="text-slate-300 font-medium">
                            ### {h}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-mono text-slate-400 uppercase text-[11px] mb-2">
                        Paragraf ({generatedContent.paragraphs.length} buah)
                      </h4>
                      <div className="space-y-2">
                        {generatedContent.paragraphs.map((p, i) => (
                          <div key={i} className="p-2.5 rounded bg-slate-900/60 leading-relaxed text-slate-300">
                            <span className="font-mono text-[10px] text-slate-500 mr-2">P#{i + 1}</span>
                            {p}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {activeContentTab === 'faq' && (
                  <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-3 text-xs">
                    {generatedContent.faqs.map((f, i) => (
                      <div key={i} className="p-3 rounded bg-slate-900/60">
                        <div className="font-bold text-indigo-300 mb-1">
                          Q{i + 1}: {f.question}
                        </div>
                        <div className="text-slate-300 leading-relaxed">
                          A{i + 1}: {f.answer}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {activeContentTab === 'review' && (
                  <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-3 text-xs">
                    {generatedContent.reviews.map((r, i) => (
                      <div key={i} className="p-3 rounded bg-slate-900/60 border-l-2 border-amber-400">
                        <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                          <span className="font-semibold text-slate-200">{r.author || 'User'}</span>
                          <span className="bg-slate-800 px-1.5 py-0.5 rounded text-[10px] text-amber-400">
                            ★ {r.rating || 5}/5
                          </span>
                        </div>
                        <p className="text-slate-300 italic">"{r.text}"</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Navigation */}
              <div className="mt-6 flex items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="py-2.5 px-4 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" /> Kembali
                </button>
                <button
                  type="button"
                  onClick={() => setStep(4)}
                  className="py-2.5 px-6 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition"
                >
                  LANJUT: ASSET MAPPING (STEP 4) <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================= STEP 4: ASSET MAPPING ================= */}
        {step === 4 && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div>
                  <span className="text-xs uppercase tracking-wider text-indigo-400 font-mono font-semibold">
                    STEP 4 — ASSET REPLACEMENT
                  </span>
                  <h2 className="text-xl font-bold text-white mt-1">
                    Mapping Asset & Visual Element
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    URL yang sama otomatis dikelompokkan ke dalam satu mapping tunggal (PRD Section 15 & 16).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const reset: Record<string, string> = {};
                    assets.forEach((a) => (reset[a.originalUrl] = ''));
                    setAssetReplacements(reset);
                  }}
                  className="text-xs text-slate-400 hover:text-slate-200 bg-slate-800 px-3 py-1.5 rounded font-mono"
                >
                  Reset: Keep All Original
                </button>
              </div>

              {assets.length === 0 ? (
                <div className="py-8 text-center text-slate-500 text-sm">
                  Tidak ada asset gambar/media yang perlu diganti.
                </div>
              ) : (
                <div className="space-y-4 mt-4">
                  {/* Filter Bar for Assets */}
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="relative flex-1 min-w-[240px]">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={assetFilter}
                          onChange={(e) => setAssetFilter(e.target.value)}
                          placeholder="Filter asset gambar (misal: imgstore, logo, banner, cdn)..."
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-8 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
                        />
                        {assetFilter && (
                          <button
                            type="button"
                            onClick={() => setAssetFilter('')}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 text-xs"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-slate-400">
                          Menampilkan <b className="text-amber-400">{filteredAssets.length}</b> dari {assets.length} asset
                        </span>
                        {(assetFilter || assetRoleFilter !== 'ALL') && (
                          <button
                            type="button"
                            onClick={() => {
                              setAssetFilter('');
                              setAssetRoleFilter('ALL');
                            }}
                            className="text-[11px] text-rose-400 hover:text-rose-300 font-mono ml-2 underline"
                          >
                            Reset Filter
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Quick Filter Pills (Roles & Domains) */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
                      <span className="text-[10px] text-slate-400 font-mono mr-1">Filter Role:</span>
                      {['ALL', 'LOGO', 'HERO', 'FAVICON', 'IMAGE'].map((role) => (
                        <button
                          key={role}
                          type="button"
                          onClick={() => setAssetRoleFilter(role)}
                          className={`text-[10px] px-2.5 py-0.5 rounded-full border transition font-mono ${
                            assetRoleFilter === role
                              ? 'bg-indigo-600 border-indigo-500 text-white shadow-sm'
                              : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {role}
                        </button>
                      ))}

                      {assetDomains.length > 0 && (
                        <>
                          <span className="text-[10px] text-slate-400 font-mono ml-2 mr-1">Domain:</span>
                          {assetDomains.map((dom) => (
                            <button
                              key={dom}
                              type="button"
                              onClick={() => setAssetFilter(dom)}
                              className={`text-[10px] px-2.5 py-0.5 rounded-full border transition font-mono ${
                                assetFilter === dom
                                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                                  : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
                              }`}
                            >
                              {dom}
                            </button>
                          ))}
                        </>
                      )}
                    </div>
                  </div>

                  {filteredAssets.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 text-xs font-mono space-y-2 bg-slate-950 p-6 rounded-xl border border-slate-800">
                      <div>
                        Tidak ada asset gambar yang cocok dengan filter: <span className="text-amber-400 font-bold">"{assetFilter}"</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setAssetFilter('');
                          setAssetRoleFilter('ALL');
                        }}
                        className="text-indigo-400 hover:text-indigo-300 underline font-sans"
                      >
                        Reset filter untuk melihat semua ({assets.length}) asset
                      </button>
                    </div>
                  ) : (
                    filteredAssets.map((asset, idx) => (
                      <div
                        key={asset.originalUrl}
                        className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded bg-slate-800 text-slate-300 font-mono text-xs flex items-center justify-center font-bold">
                              {idx + 1}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                                asset.role === 'LOGO'
                                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                  : asset.role === 'FAVICON'
                                  ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                                  : 'bg-slate-800 text-slate-400'
                              }`}
                            >
                              ROLE: {asset.role}
                            </span>
                          </div>
                          <span className="text-xs font-mono text-slate-400">
                            Used: <b className="text-slate-200">{asset.occurrences}×</b>
                          </span>
                        </div>

                        <div className="text-xs font-mono text-slate-400 break-all">
                          Original: <span className="text-slate-300">{asset.originalUrl}</span>
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                          <input
                            type="text"
                            value={assetReplacements[asset.originalUrl] || ''}
                            onChange={(e) =>
                              setAssetReplacements({
                                ...assetReplacements,
                                [asset.originalUrl]: e.target.value,
                              })
                            }
                            placeholder="Masukkan New URL (atau biarkan kosong untuk KEEP ORIGINAL)"
                            className="flex-1 bg-slate-900 border border-slate-700 rounded px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setAssetReplacements({
                                ...assetReplacements,
                                [asset.originalUrl]: '',
                              })
                            }
                            className="text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-2 rounded whitespace-nowrap"
                          >
                            Keep Original
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Navigation */}
              <div className="mt-6 flex items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="py-2.5 px-4 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" /> Kembali
                </button>
                <button
                  type="button"
                  onClick={() => setStep(5)}
                  className="py-2.5 px-6 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition"
                >
                  LANJUT: LINK MAPPING (STEP 5) <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================= STEP 5: LINK MAPPING ================= */}
        {step === 5 && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div>
                  <span className="text-xs uppercase tracking-wider text-indigo-400 font-mono font-semibold">
                    STEP 5 — LINK REPLACEMENT
                  </span>
                  <h2 className="text-xl font-bold text-white mt-1">
                    Mapping Link & Action URL
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Format relative/absolute dipertahankan sesuai referensi (PRD Section 18 & 19).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const reset: Record<string, string> = {};
                    links.forEach((l) => (reset[l.originalUrl] = ''));
                    setLinkReplacements(reset);
                  }}
                  className="text-xs text-slate-400 hover:text-slate-200 bg-slate-800 px-3 py-1.5 rounded font-mono"
                >
                  Reset: Keep All Original
                </button>
              </div>

              {links.length === 0 ? (
                <div className="py-8 text-center text-slate-500 text-sm">
                  Tidak ada link yang terdeteksi.
                </div>
              ) : (
                <div className="space-y-4 mt-4">
                  {/* Filter Bar for Links */}
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="relative flex-1 min-w-[240px]">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={linkFilter}
                          onChange={(e) => setLinkFilter(e.target.value)}
                          placeholder="Filter target link (misal: register, login, domain.com, whatsapp)..."
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-8 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
                        />
                        {linkFilter && (
                          <button
                            type="button"
                            onClick={() => setLinkFilter('')}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 text-xs"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-slate-400">
                          Menampilkan <b className="text-amber-400">{filteredLinks.length}</b> dari {links.length} link
                        </span>
                        {(linkFilter || linkCategoryFilter !== 'ALL') && (
                          <button
                            type="button"
                            onClick={() => {
                              setLinkFilter('');
                              setLinkCategoryFilter('ALL');
                            }}
                            className="text-[11px] text-rose-400 hover:text-rose-300 font-mono ml-2 underline"
                          >
                            Reset Filter
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Quick Filter Pills (Categories & Domains) */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
                      <span className="text-[10px] text-slate-400 font-mono mr-1">Kategori:</span>
                      {['ALL', 'cta', 'internal', 'external', 'social', 'navigation'].map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setLinkCategoryFilter(cat)}
                          className={`text-[10px] px-2.5 py-0.5 rounded-full border transition font-mono uppercase ${
                            linkCategoryFilter === cat
                              ? 'bg-indigo-600 border-indigo-500 text-white shadow-sm'
                              : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}

                      {linkDomains.length > 0 && (
                        <>
                          <span className="text-[10px] text-slate-400 font-mono ml-2 mr-1">Domain:</span>
                          {linkDomains.map((dom) => (
                            <button
                              key={dom}
                              type="button"
                              onClick={() => setLinkFilter(dom)}
                              className={`text-[10px] px-2.5 py-0.5 rounded-full border transition font-mono ${
                                linkFilter === dom
                                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                                  : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
                              }`}
                            >
                              {dom}
                            </button>
                          ))}
                        </>
                      )}
                    </div>
                  </div>

                  {filteredLinks.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 text-xs font-mono space-y-2 bg-slate-950 p-6 rounded-xl border border-slate-800">
                      <div>
                        Tidak ada link yang cocok dengan filter: <span className="text-amber-400 font-bold">"{linkFilter}"</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setLinkFilter('');
                          setLinkCategoryFilter('ALL');
                        }}
                        className="text-indigo-400 hover:text-indigo-300 underline font-sans"
                      >
                        Reset filter untuk melihat semua ({links.length}) link
                      </button>
                    </div>
                  ) : (
                    filteredLinks.map((link, idx) => (
                      <div
                        key={link.originalUrl}
                        className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded bg-slate-800 text-slate-300 font-mono text-xs flex items-center justify-center font-bold">
                              {idx + 1}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                                link.category === 'cta'
                                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                  : 'bg-slate-800 text-slate-400'
                              }`}
                            >
                              CATEGORY: {link.category}
                            </span>
                            <span className="text-[10px] font-mono text-slate-500">
                              {link.isRelative ? '(Relative Link)' : '(Absolute Link)'}
                            </span>
                          </div>
                          <span className="text-xs font-mono text-slate-400">
                            Used: <b className="text-slate-200">{link.occurrences}×</b>
                          </span>
                        </div>

                        <div className="text-xs font-mono text-slate-400 break-all">
                          Original: <span className="text-slate-300">{link.originalUrl}</span>
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                          <input
                            type="text"
                            value={linkReplacements[link.originalUrl] || ''}
                            onChange={(e) =>
                              setLinkReplacements({
                                ...linkReplacements,
                                [link.originalUrl]: e.target.value,
                              })
                            }
                            placeholder={
                              link.isRelative
                                ? 'Contoh: /daftar-sakautoto (pertahankan relative URL)'
                                : 'Contoh: https://sakautoto.com/register'
                            }
                            className="flex-1 bg-slate-900 border border-slate-700 rounded px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setLinkReplacements({
                                ...linkReplacements,
                                [link.originalUrl]: '',
                              })
                            }
                            className="text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-2 rounded whitespace-nowrap"
                          >
                            Keep Original
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Navigation */}
              <div className="mt-6 flex items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={() => setStep(4)}
                  className="py-2.5 px-4 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" /> Kembali
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleExecuteClone}
                  className="py-2.5 px-6 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Mengeksekusi Replacement & Validasi DOM...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      GENERATE HTML CLONE & VALIDATE (STEP 6)
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================= STEP 6: PREVIEW, DIFF & EXPORT ================= */}
        {step === 6 && clonedHtml && validationReport && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
              {/* Header Info */}
              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div>
                  <span className="text-xs uppercase tracking-wider text-emerald-400 font-mono font-semibold">
                    ✓ CLONE GENERATED & VERIFIED
                  </span>
                  <h2 className="text-xl font-bold text-white mt-1">
                    HTML Clone Final & Structure Diff Check
                  </h2>
                </div>

                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <button
                    type="button"
                    onClick={handleDownloadHtmlOnly}
                    className="py-2 px-3.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold shadow-md flex items-center gap-2 transition"
                    title="Unduh file HTML saja (index.html)"
                  >
                    <FileCode2 className="w-4 h-4 text-amber-400" />
                    DOWNLOAD HTML SAJA
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadZip}
                    className="py-2 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition"
                  >
                    <Download className="w-4 h-4" />
                    DOWNLOAD ZIP LENGKAP
                  </button>
                </div>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 my-4">
                <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800">
                  <div className="text-[11px] font-mono text-slate-400">BRAND TRANSITION</div>
                  <div className="text-xs font-mono font-bold text-slate-300 mt-1">
                    {detectedOldBrand} &rarr; <span className="text-amber-400">{newBrand}</span>
                  </div>
                </div>

                <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800">
                  <div className="text-[11px] font-mono text-slate-400">STRUCTURE SIMILARITY</div>
                  <div className="text-xs font-mono font-bold text-emerald-400 mt-1">
                    {validationReport.structuralSimilarityPercent}% Preserved
                  </div>
                </div>

                <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800">
                  <div className="text-[11px] font-mono text-slate-400">ASSET MAPPING</div>
                  <div className="text-xs font-mono font-bold text-indigo-400 mt-1">
                    {Object.values(assetReplacements).filter(Boolean).length} / {assets.length} Replaced
                  </div>
                </div>

                <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800">
                  <div className="text-[11px] font-mono text-slate-400">LINK MAPPING</div>
                  <div className="text-xs font-mono font-bold text-indigo-400 mt-1">
                    {Object.values(linkReplacements).filter(Boolean).length} / {links.length} Replaced
                  </div>
                </div>
              </div>

              {/* Structure Check Table (Section 34 PRD) */}
              <div className="bg-slate-950 rounded-lg border border-slate-800 p-4 mb-4">
                <h3 className="text-xs font-mono uppercase text-slate-300 font-semibold mb-3 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Structure Check Diff Report
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 text-xs">
                  {[
                    validationReport.sections,
                    validationReport.h1,
                    validationReport.h2,
                    validationReport.paragraphs,
                    validationReport.faq,
                    validationReport.review,
                    validationReport.css,
                    validationReport.js,
                    validationReport.dom,
                  ].map((item, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded bg-slate-900/60 border border-slate-800/80 flex flex-col justify-between"
                    >
                      <span className="text-[11px] text-slate-400 font-mono">{item.name}</span>
                      <span
                        className={`text-xs font-mono font-bold mt-1 ${
                          item.status === 'PASS' || item.status === 'UNCHANGED'
                            ? 'text-emerald-400'
                            : 'text-amber-400'
                        }`}
                      >
                        {item.detail}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Preview View Tabs */}
              <div className="flex border-b border-slate-800 text-xs overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setActivePreviewTab('diff')}
                  className={`pb-2 px-4 font-semibold whitespace-nowrap border-b-2 transition ${
                    activePreviewTab === 'diff'
                      ? 'border-indigo-500 text-indigo-400'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 inline mr-1 text-amber-400" /> Bandingkan Side-by-Side (Diff Interaktif)
                </button>
                <button
                  type="button"
                  onClick={() => setActivePreviewTab('live')}
                  className={`pb-2 px-4 font-semibold whitespace-nowrap border-b-2 transition ${
                    activePreviewTab === 'live'
                      ? 'border-indigo-500 text-indigo-400'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5 inline mr-1" /> Dual Live Visual (Iframe Asli vs Kloning)
                </button>
                <button
                  type="button"
                  onClick={() => setActivePreviewTab('html')}
                  className={`pb-2 px-4 font-semibold whitespace-nowrap border-b-2 transition ${
                    activePreviewTab === 'html'
                      ? 'border-indigo-500 text-indigo-400'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <FileCode2 className="w-3.5 h-3.5 inline mr-1" /> Source HTML Final
                </button>
                <button
                  type="button"
                  onClick={() => setActivePreviewTab('map')}
                  className={`pb-2 px-4 font-semibold whitespace-nowrap border-b-2 transition ${
                    activePreviewTab === 'map'
                      ? 'border-indigo-500 text-indigo-400'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5 inline mr-1" /> replacement-map.json
                </button>
              </div>

              <div className="mt-4">
                {activePreviewTab === 'diff' && analysisReport && generatedContent && (
                  <SideBySideDiff
                    detectedOldBrand={detectedOldBrand}
                    newBrand={newBrand}
                    originalTitle={analysisReport.metadata.title.value || ''}
                    newTitle={generatedContent.rawMeta.metaTitle}
                    originalDesc={analysisReport.metadata.description.value || ''}
                    newDesc={generatedContent.rawMeta.metaDescription}
                    contentSlots={contentSlots}
                    generatedContent={generatedContent}
                    assets={assets}
                    assetReplacements={assetReplacements}
                    links={links}
                    linkReplacements={linkReplacements}
                    validationReport={validationReport}
                  />
                )}

                {activePreviewTab === 'live' && (
                  <div className="space-y-2">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {/* Left: Original Reference Frame */}
                      <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900 flex flex-col shadow-lg">
                        <div className="bg-slate-950 px-3.5 py-2.5 border-b border-slate-800 flex items-center justify-between text-xs">
                          <span className="font-mono font-bold text-slate-300 flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-slate-500" />
                            Original Referensi ({detectedOldBrand})
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
                            RAW SOURCE DOM
                          </span>
                        </div>
                        <iframe
                          srcDoc={rawHtml}
                          title="Original Reference Preview"
                          className="w-full h-[540px] bg-white border-0"
                          sandbox="allow-same-origin allow-scripts"
                        />
                      </div>

                      {/* Right: Cloned Result Frame */}
                      <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900 flex flex-col shadow-lg">
                        <div className="bg-slate-950 px-3.5 py-2.5 border-b border-slate-800 flex items-center justify-between text-xs">
                          <span className="font-mono font-bold text-emerald-400 flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                            Hasil Clone ({newBrand})
                          </span>
                          <span className="text-[10px] text-emerald-400 font-mono px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                            STRUCTURE 100% PRESERVED
                          </span>
                        </div>
                        <iframe
                          srcDoc={clonedHtml}
                          title="Cloned HTML Live Preview"
                          className="w-full h-[540px] bg-white border-0"
                          sandbox="allow-same-origin allow-scripts"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {activePreviewTab === 'html' && (
                  <div className="relative">
                    <pre className="bg-slate-950 p-4 rounded-lg border border-slate-800 text-xs font-mono text-slate-200 overflow-x-auto whitespace-pre max-h-[520px]">
                      {clonedHtml}
                    </pre>
                    <div className="absolute top-3 right-3 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleDownloadHtmlOnly}
                        className="text-xs bg-slate-800 hover:bg-slate-700 text-amber-300 px-3 py-1.5 rounded flex items-center gap-1.5 border border-slate-700"
                      >
                        <FileCode2 className="w-3.5 h-3.5" /> Unduh index.html
                      </button>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(clonedHtml, 'HTML Final')}
                        className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded flex items-center gap-1.5 border border-slate-700"
                      >
                        <Copy className="w-3.5 h-3.5" /> Salin HTML
                      </button>
                    </div>
                  </div>
                )}

                {activePreviewTab === 'map' && (
                  <div className="relative">
                    <pre className="bg-slate-950 p-4 rounded-lg border border-slate-800 text-xs font-mono text-slate-200 overflow-x-auto whitespace-pre max-h-[520px]">
                      {JSON.stringify(
                        {
                          brand: { old: detectedOldBrand, new: newBrand },
                          title: { new: newTitle },
                          assets: assetReplacements,
                          links: linkReplacements,
                        },
                        null,
                        2
                      )}
                    </pre>
                    <button
                      type="button"
                      onClick={() =>
                        copyToClipboard(
                          JSON.stringify(
                            {
                              brand: { old: detectedOldBrand, new: newBrand },
                              title: { new: newTitle },
                              assets: assetReplacements,
                              links: linkReplacements,
                            },
                            null,
                            2
                          ),
                          'Replacement Map JSON'
                        )
                      }
                      className="absolute top-3 right-3 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded flex items-center gap-1.5"
                    >
                      <Copy className="w-3.5 h-3.5" /> Salin JSON
                    </button>
                  </div>
                )}
              </div>

              {/* Navigation Back & Download Actions */}
              <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={() => setStep(5)}
                  className="py-2.5 px-4 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" /> Kembali ke Link Mapping
                </button>
                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={handleDownloadHtmlOnly}
                    className="py-2.5 px-4 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-2 transition"
                  >
                    <FileCode2 className="w-4 h-4 text-amber-400" />
                    Download HTML Saja (index.html)
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadZip}
                    className="py-2.5 px-6 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition"
                  >
                    <Download className="w-4 h-4" /> Download ZIP Final
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* AI Settings Modal */}
      <AiSettingsModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        onSave={handleSaveAiConfig}
        currentConfig={aiConfig}
      />

      {/* Instruction Modal */}
      <InstructionModal
        isOpen={isInstructionModalOpen}
        onClose={() => setIsInstructionModalOpen(false)}
      />
    </div>
  );
}
