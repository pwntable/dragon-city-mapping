import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Copy, Check, Share2, Download, Upload } from 'lucide-react';
import { useOptimizerStore } from '../../store/useOptimizerStore';
import { decodeLayout, encodeLayout } from '../../utils/shareEncoder';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  onToast: (msg: string, type: 'info' | 'success' | 'warning' | 'error') => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, onToast }) => {
  const [activeTab, setActiveTab] = useState<'url' | 'json'>('url');
  const [copied, setCopied] = useState(false);
  const [jsonInput, setJsonInput] = useState('');

  const getLayoutSnapshot = useOptimizerStore((state) => state.getLayoutSnapshot);
  const importLayout = useOptimizerStore((state) => state.importLayout);

  if (!isOpen) return null;

  const currentSnapshot = getLayoutSnapshot();
  const encodedHash = encodeLayout(currentSnapshot);
  const shareableUrl = `${window.location.origin}${window.location.pathname}#layout=${encodedHash}`;

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(shareableUrl);
    setCopied(true);
    onToast('Shareable link copied to clipboard!', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadJSON = () => {
    const jsonStr = JSON.stringify(currentSnapshot, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dragon-city-layout-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    onToast('JSON layout exported successfully!', 'success');
  };

  const handleImportJSON = () => {
    if (!jsonInput.trim()) return;
    try {
      let parsed = JSON.parse(jsonInput);
      if (!parsed.islands && typeof jsonInput === 'string') {
        // Try decoding as compressed hash string
        const decoded = decodeLayout(jsonInput.trim());
        if (decoded) parsed = decoded;
      }
      if (parsed && parsed.islands) {
        importLayout(parsed);
        onToast('Layout imported successfully!', 'success');
        onClose();
      } else {
        onToast('Invalid layout JSON format!', 'error');
      }
    } catch {
      onToast('Failed to parse layout JSON or hash!', 'error');
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-elevated border border-subtle rounded-2xl p-5 max-w-lg w-full shadow-2xl space-y-4"
        >
          <div className="flex items-center justify-between border-b border-subtle pb-3">
            <div className="flex items-center gap-2">
              <Share2 className="w-5 h-5 text-gold" />
              <h3 className="text-sm font-bold text-text-primary">Kongsi & Eksport Layout</h3>
            </div>
            <button
              onClick={onClose}
              className="p-1 text-text-muted hover:text-text-primary rounded-lg hover:bg-surface transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex border-b border-subtle text-xs font-bold gap-4">
            <button
              onClick={() => setActiveTab('url')}
              className={`pb-2 transition border-b-2 ${
                activeTab === 'url' ? 'border-gold text-gold' : 'border-transparent text-text-muted hover:text-text-primary'
              }`}
            >
              Shareable URL Link
            </button>
            <button
              onClick={() => setActiveTab('json')}
              className={`pb-2 transition border-b-2 ${
                activeTab === 'json' ? 'border-gold text-gold' : 'border-transparent text-text-muted hover:text-text-primary'
              }`}
            >
              JSON Import / Export
            </button>
          </div>

          {activeTab === 'url' ? (
            <div className="space-y-3">
              <p className="text-xs text-text-muted">
                Pautan URL di bawah mengandungi semua konfigurasi layout 5 island yang telah di-compress (fflate):
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={shareableUrl}
                  className="w-full bg-base border border-subtle rounded-xl px-3 py-2 text-xs font-mono text-text-primary focus:outline-none"
                />
                <button
                  onClick={handleCopyUrl}
                  className="px-3 py-2 bg-gold hover:bg-gold-hover text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shrink-0 transition"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-text-muted">Raw Layout Data</span>
                <button
                  onClick={handleDownloadJSON}
                  className="px-2.5 py-1 bg-surface hover:bg-elevated text-gold border border-subtle rounded-lg text-xs flex items-center gap-1 font-bold transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download JSON</span>
                </button>
              </div>
              <textarea
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                placeholder="Tampal format JSON atau encoded hash di sini untuk import..."
                rows={5}
                className="w-full bg-base border border-subtle rounded-xl p-3 text-xs font-mono text-text-primary focus:outline-none resize-none"
              />
              <button
                onClick={handleImportJSON}
                className="w-full py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition"
              >
                <Upload className="w-4 h-4" />
                <span>Import Layout Data</span>
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
