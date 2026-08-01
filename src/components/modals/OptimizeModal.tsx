import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Wand2, X, AlertTriangle } from 'lucide-react';
import { useOptimizerStore } from '../../store/useOptimizerStore';

interface OptimizeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onToast: (msg: string, type: 'info' | 'success' | 'warning' | 'error') => void;
}

export const OptimizeModal: React.FC<OptimizeModalProps> = ({ isOpen, onClose, onToast }) => {
  const optimizeActiveIsland = useOptimizerStore((state) => state.optimizeActiveIsland);
  const optimizeAllIslands = useOptimizerStore((state) => state.optimizeAllIslands);

  if (!isOpen) return null;

  const handleOptimizeCurrent = () => {
    optimizeActiveIsland();
    onToast('Island semasa berjaya di-optimize!', 'success');
    onClose();
  };

  const handleOptimizeAll = () => {
    optimizeAllIslands();
    onToast('Semua 5 island berjaya di-optimize secara automatik!', 'success');
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-elevated border border-subtle rounded-2xl p-5 max-w-md w-full shadow-2xl space-y-4"
        >
          <div className="flex items-center justify-between border-b border-subtle pb-3">
            <div className="flex items-center gap-2">
              <Wand2 className="w-5 h-5 text-gold" />
              <h3 className="text-sm font-bold text-text-primary">Pengoptimuman Layout</h3>
            </div>
            <button
              onClick={onClose}
              className="p-1 text-text-muted hover:text-text-primary rounded-lg hover:bg-surface transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/30 p-3 rounded-xl text-xs text-amber-300">
            <AlertTriangle className="w-5 h-5 text-gold shrink-0 mt-0.5" />
            <p>
              Auto-Jana akan menyusun habitat Level 7 (6x6), Ancient (6x6), dan 2x2 Crystal coverage secara optimum. Layout sedia ada akan digantikan (tindakan ini boleh di-Undo dengan <strong>Ctrl+Z</strong>).
            </p>
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <button
              onClick={handleOptimizeCurrent}
              className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition"
            >
              <Wand2 className="w-4 h-4" />
              <span>Optimize Island Semasa Sahaja</span>
            </button>
            <button
              onClick={handleOptimizeAll}
              className="w-full py-2.5 bg-gold hover:bg-gold-hover text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition"
            >
              <Wand2 className="w-4 h-4" />
              <span>Optimize Semua 5 Island Sekaligus</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
