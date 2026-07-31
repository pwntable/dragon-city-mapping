import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Keyboard } from 'lucide-react';

interface KeyboardHintProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardHint: React.FC<KeyboardHintProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: '1', action: 'Place Mode' },
    { key: '2', action: 'Select / Level Up Mode' },
    { key: '3', action: 'Erase Mode' },
    { key: '4', action: 'Edit Grid Mode' },
    { key: 'Delete / Backspace', action: 'Delete Selected Structure' },
    { key: 'Escape', action: 'Deselect / Close Modal' },
    { key: 'Ctrl + Z / Cmd + Z', action: 'Undo Action' },
    { key: 'Ctrl + Y / Cmd + Y', action: 'Redo Action' },
    { key: 'Ctrl + S / Cmd + S', action: 'Open Share & Export' },
    { key: '?', action: 'Toggle Shortcuts Help' },
  ];

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
              <Keyboard className="w-5 h-5 text-gold" />
              <h3 className="text-sm font-bold text-text-primary">Keyboard Shortcuts</h3>
            </div>
            <button
              onClick={onClose}
              className="p-1 text-text-muted hover:text-text-primary rounded-lg hover:bg-surface transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto pr-1">
            {shortcuts.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-surface border border-subtle text-xs">
                <span className="text-text-muted font-medium">{item.action}</span>
                <kbd className="px-2 py-1 bg-base text-gold font-mono rounded-md border border-subtle text-[11px] font-bold">
                  {item.key}
                </kbd>
              </div>
            ))}
          </div>

          <div className="text-center pt-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gold hover:bg-gold-hover text-slate-950 font-bold rounded-xl text-xs w-full transition shadow-md"
            >
              Got it!
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
