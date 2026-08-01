import React, { useState, useRef, useEffect } from 'react';
import { MoreVertical, Trash2, Download, Share2, HelpCircle, Moon, Sun, Monitor } from 'lucide-react';
import { useOptimizerStore } from '../../store/useOptimizerStore';
import { Theme } from '../../types';

interface ActionOverflowMenuProps {
  onClear: () => void;
  onExportPNG: () => void;
  onOpenShareModal: () => void;
  onToggleHelp: () => void;
}

export const ActionOverflowMenu: React.FC<ActionOverflowMenuProps> = ({
  onClear,
  onExportPNG,
  onOpenShareModal,
  onToggleHelp,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const theme = useOptimizerStore((state) => state.theme);
  const setTheme = useOptimizerStore((state) => state.setTheme);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const cycleTheme = () => {
    const nextTheme: Record<Theme, Theme> = {
      dark: 'light',
      light: 'system',
      system: 'dark',
    };
    setTheme(nextTheme[theme]);
  };

  const getThemeIcon = () => {
    switch (theme) {
      case 'dark':
        return <Moon className="w-4 h-4 text-gold" />;
      case 'light':
        return <Sun className="w-4 h-4 text-amber-500" />;
      case 'system':
        return <Monitor className="w-4 h-4 text-sky-400" />;
    }
  };

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="p-2 sm:p-2.5 min-w-[38px] min-h-[38px] flex items-center justify-center rounded-xl bg-base hover:bg-elevated text-text-muted hover:text-text-primary border border-subtle transition shrink-0"
        title="More Actions"
        aria-label="More Actions"
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-52 rounded-2xl bg-surface/95 backdrop-blur-xl border border-subtle shadow-2xl z-50 p-2 space-y-1 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="px-2.5 py-1.5 border-b border-subtle text-[11px] font-extrabold uppercase tracking-wider text-text-muted">
            Menu Tindakan
          </div>

          {/* Share */}
          <button
            onClick={() => {
              onOpenShareModal();
              setIsOpen(false);
            }}
            className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2.5 text-gold hover:bg-elevated transition"
          >
            <Share2 className="w-4 h-4" />
            <span>Kongsi / Export JSON</span>
          </button>

          {/* Export PNG */}
          <button
            onClick={() => {
              onExportPNG();
              setIsOpen(false);
            }}
            className="w-full text-left px-3 py-2 rounded-xl text-xs font-medium flex items-center gap-2.5 text-text-primary hover:bg-elevated transition"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Export Sebagai PNG</span>
          </button>

          {/* Clear Island */}
          <button
            onClick={() => {
              onClear();
              setIsOpen(false);
            }}
            className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-medium flex items-center gap-2.5 text-red-400 hover:bg-elevated transition"
          >
            <Trash2 className="w-4 h-4" />
            <span>Padam Island</span>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={cycleTheme}
            className="w-full text-left px-3 py-2 rounded-xl text-xs font-medium flex items-center justify-between text-text-primary hover:bg-elevated transition border-t border-subtle/40 pt-2"
          >
            <div className="flex items-center gap-2.5">
              {getThemeIcon()}
              <span className="capitalize">Tema: {theme}</span>
            </div>
            <span className="text-[10px] text-text-muted bg-base px-2 py-0.5 rounded-md uppercase font-bold">
              Tukar
            </span>
          </button>

          {/* Help */}
          <button
            onClick={() => {
              onToggleHelp();
              setIsOpen(false);
            }}
            className="w-full text-left px-3 py-2 rounded-xl text-xs font-medium flex items-center gap-2.5 text-text-muted hover:text-text-primary hover:bg-elevated transition"
          >
            <HelpCircle className="w-4 h-4" />
            <span>Pintasan Papan Kekunci</span>
          </button>
        </div>
      )}
    </div>
  );
};
