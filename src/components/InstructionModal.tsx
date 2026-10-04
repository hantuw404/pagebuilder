'use client';

import React, { useState, useEffect } from 'react';
import { X, FileText, CheckCircle2, Save, RefreshCw, AlertCircle } from 'lucide-react';

interface InstructionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function InstructionModal({ isOpen, onClose }: InstructionModalProps) {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [lineCount, setLineCount] = useState<number>(0);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      loadInstruction();
    }
  }, [isOpen]);

  const loadInstruction = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/instructions');
      const data = await res.json();
      if (data.success) {
        setContent(data.content);
        setLineCount(data.lineCount);
      } else {
        setError(data.error || 'Gagal memuat INSTRUCTION.md');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSaveSuccess(false);
    try {
      const res = await fetch('/api/instructions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      const data = await res.json();
      if (data.success) {
        setSaveSuccess(true);
        setLineCount(data.lineCount);
        setTimeout(() => setSaveSuccess(false), 2500);
      } else {
        setError(data.error || 'Gagal menyimpan file.');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white">INSTRUCTION.md</h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {lineCount} baris dimuat
                </span>
                <span className="text-xs text-slate-400 font-mono">Master Prompt Aktif</span>
              </div>
              <p className="text-xs text-slate-400">
                File instruksi master ini otomatis diinjeksikan sebagai System Prompt ke model LLM.
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

        {/* Status / Error alerts */}
        {error && (
          <div className="p-3 mx-6 mt-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}
        {saveSuccess && (
          <div className="p-3 mx-6 mt-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            Perubahan INSTRUCTION.md berhasil disimpan ke disk!
          </div>
        )}

        {/* Textarea Editor */}
        <div className="flex-1 p-6 overflow-hidden flex flex-col">
          {loading ? (
            <div className="flex-1 flex items-center justify-center text-xs text-slate-400 gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
              Membaca isi INSTRUCTION.md dari disk...
            </div>
          ) : (
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full flex-1 bg-slate-950 border border-slate-700 rounded-xl p-4 text-xs text-slate-200 font-mono leading-relaxed focus:outline-none focus:border-indigo-500 resize-none"
              placeholder="# ROLE: SEO REFERENCE CLONER..."
            />
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <button
            type="button"
            onClick={loadInstruction}
            className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Muat Ulang File
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="py-2 px-4 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
            >
              Tutup
            </button>
            <button
              type="button"
              disabled={saving || loading}
              onClick={handleSave}
              className="py-2 px-5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-emerald-600/30 flex items-center gap-2 transition"
            >
              {saving ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  Simpan Perubahan ke INSTRUCTION.md
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
