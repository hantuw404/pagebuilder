'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Key,
  Globe2,
  Cpu,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sparkles,
  Eye,
  EyeOff,
  Zap,
} from 'lucide-react';

export interface AiConfig {
  provider: string;
  apiKey: string;
  apiBaseUrl: string;
  model: string;
}

interface AiSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: AiConfig) => void;
  currentConfig: AiConfig;
}

const PROVIDER_PRESETS: Record<
  string,
  { name: string; baseUrl: string; defaultModel: string; note: string }
> = {
  openrouter: {
    name: 'OpenRouter',
    baseUrl: 'https://openrouter.ai/api/v1',
    defaultModel: 'openai/gpt-4o-mini',
    note: 'Bisa akses Claude, GPT-4o, Llama, DeepSeek via 1 key.',
  },
  openai: {
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o-mini',
    note: 'API resmi OpenAI (memerlukan balance credit).',
  },
  groq: {
    name: 'Groq Cloud',
    baseUrl: 'https://api.groq.com/openai/v1',
    defaultModel: 'llama-3.3-70b-versatile',
    note: 'Sangat cepat & hemat biaya.',
  },
  deepseek: {
    name: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com/v1',
    defaultModel: 'deepseek-chat',
    note: 'Model DeepSeek V3 resmi.',
  },
  ollama: {
    name: 'Ollama (Lokal)',
    baseUrl: 'http://localhost:11434/v1',
    defaultModel: 'llama3',
    note: 'Offline tanpa API key di komputer lokal.',
  },
  custom: {
    name: 'Custom Endpoint',
    baseUrl: '',
    defaultModel: '',
    note: 'Proxy OpenAI kompatibel kustom.',
  },
};

export default function AiSettingsModal({
  isOpen,
  onClose,
  onSave,
  currentConfig,
}: AiSettingsModalProps) {
  const [provider, setProvider] = useState<string>(currentConfig.provider || 'openrouter');
  const [apiKey, setApiKey] = useState<string>(currentConfig.apiKey || '');
  const [apiBaseUrl, setApiBaseUrl] = useState<string>(
    currentConfig.apiBaseUrl || 'https://openrouter.ai/api/v1'
  );
  const [model, setModel] = useState<string>(currentConfig.model || 'openai/gpt-4o-mini');
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const [testing, setTesting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  useEffect(() => {
    setProvider(currentConfig.provider || 'openrouter');
    setApiKey(currentConfig.apiKey || '');
    setApiBaseUrl(currentConfig.apiBaseUrl || 'https://openrouter.ai/api/v1');
    setModel(currentConfig.model || 'openai/gpt-4o-mini');
    setTestResult(null);
  }, [currentConfig, isOpen]);

  if (!isOpen) return null;

  const handleSelectProvider = (key: string) => {
    setProvider(key);
    const preset = PROVIDER_PRESETS[key];
    if (preset) {
      if (key !== 'custom') {
        setApiBaseUrl(preset.baseUrl);
        setModel(preset.defaultModel);
      }
    }
    setTestResult(null);
  };

  const handleTestConnection = async () => {
    if (!apiKey && provider !== 'ollama') {
      setTestResult({
        success: false,
        message: 'Masukkan API Key terlebih dahulu.',
      });
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const res = await fetch('/api/test-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: apiKey || 'ollama',
          apiBaseUrl,
          model,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setTestResult({
          success: true,
          message: `Koneksi berhasil! Respon: "${data.reply}" (${data.latencyMs}ms)`,
        });
      } else {
        setTestResult({
          success: false,
          message: data.error || 'Tes koneksi gagal.',
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setTestResult({ success: false, message: `Gagal: ${msg}` });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = () => {
    const config: AiConfig = {
      provider,
      apiKey: apiKey.trim(),
      apiBaseUrl: apiBaseUrl.trim(),
      model: model.trim(),
    };
    onSave(config);
    onClose();
  };

  const handleUseDeterministic = () => {
    const config: AiConfig = {
      provider: 'deterministic',
      apiKey: '',
      apiBaseUrl: '',
      model: '',
    };
    onSave(config);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Pengaturan Engine AI</h3>
              <p className="text-xs text-slate-400">
                Pilih provider dan model untuk Content Engine
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 overflow-y-auto">
          {/* Provider Preset Buttons */}
          <div>
            <label className="block text-xs font-mono uppercase text-slate-400 mb-2">
              PILIH PROVIDER
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {Object.entries(PROVIDER_PRESETS).map(([key, p]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleSelectProvider(key)}
                  className={`p-2.5 rounded-lg border text-left transition flex flex-col justify-between ${
                    provider === key
                      ? 'bg-indigo-600/10 border-indigo-500 text-indigo-300 shadow-sm shadow-indigo-500/20'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  <span className="font-semibold text-xs text-white">{p.name}</span>
                  <span className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                    {p.defaultModel || 'Custom'}
                  </span>
                </button>
              ))}
            </div>
            <p className="text-[11px] text-indigo-300/80 mt-1.5">
              ℹ️ {PROVIDER_PRESETS[provider]?.note || 'Konfigurasi kustom'}
            </p>
          </div>

          {/* API Key Input */}
          <div>
            <label className="block text-xs font-mono uppercase text-slate-400 mb-1 flex items-center justify-between">
              <span>API KEY</span>
              {apiKey && (
                <span className="text-[10px] text-emerald-400 font-mono">Tersedia</span>
              )}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <Key className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={
                  provider === 'ollama' ? 'Tidak wajib untuk Ollama lokal' : 'sk-...'
                }
                className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-10 py-2.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Base URL */}
          <div>
            <label className="block text-xs font-mono uppercase text-slate-400 mb-1">
              API BASE URL
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <Globe2 className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={apiBaseUrl}
                onChange={(e) => setApiBaseUrl(e.target.value)}
                placeholder="https://api.openai.com/v1"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-2.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Model Name */}
          <div>
            <label className="block text-xs font-mono uppercase text-slate-400 mb-1">
              MODEL NAME
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <Cpu className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="gpt-4o-mini"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-2.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Test Status feedback */}
          {testResult && (
            <div
              className={`p-3 rounded-lg border text-xs flex items-start gap-2.5 font-mono ${
                testResult.success
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              )}
              <div className="flex-1 break-words">{testResult.message}</div>
            </div>
          )}

          {/* Connection Test Button */}
          <div className="pt-1">
            <button
              type="button"
              disabled={testing || (!apiKey && provider !== 'ollama')}
              onClick={handleTestConnection}
              className="w-full py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 border border-slate-700 transition"
            >
              {testing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Menguji Koneksi ke {PROVIDER_PRESETS[provider]?.name || 'Server'}...
                </>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  Test Koneksi API Sekarang
                </>
              )}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950 flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={handleUseDeterministic}
            className="text-xs text-slate-400 hover:text-slate-200 underline font-medium"
          >
            Gunakan Engine Offline (Tanpa API)
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="py-2 px-3.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="py-2 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30"
            >
              Simpan Pengaturan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
