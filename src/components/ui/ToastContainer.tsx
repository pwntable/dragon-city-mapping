import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, CheckCircle, Info, XCircle } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  text: string;
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center space-y-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((t) => {
          let bgClass = 'bg-amber-600 text-white border-amber-400';
          let icon = <AlertTriangle className="w-4 h-4 shrink-0" />;

          if (t.type === 'error') {
            bgClass = 'bg-red-600 text-white border-red-400';
            icon = <XCircle className="w-4 h-4 shrink-0" />;
          } else if (t.type === 'success') {
            bgClass = 'bg-emerald-600 text-white border-emerald-400';
            icon = <CheckCircle className="w-4 h-4 shrink-0" />;
          } else if (t.type === 'info') {
            bgClass = 'bg-cyan-600 text-white border-cyan-400';
            icon = <Info className="w-4 h-4 shrink-0" />;
          }

          return (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              onClick={() => onDismiss(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl border shadow-2xl text-xs font-bold ${bgClass} pointer-events-auto cursor-pointer`}
            >
              {icon}
              <span>{t.text}</span>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
