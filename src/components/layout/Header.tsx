import React from 'react';
import { Flame, Wand2, Trash2, Download, Share2, RotateCcw, RotateCw, HelpCircle } from 'lucide-react';
import { ISLAND_CONFIGS } from '../../constants/islands';
import { useOptimizerStore } from '../../store/useOptimizerStore';
import { IslandId } from '../../types';
import { IslandTab } from '../ui/IslandTab';
import { ThemeToggle } from '../ui/ThemeToggle';

interface HeaderProps {
  onOpenOptimizeModal: () => void;
  onOpenShareModal: () => void;
  onToggleHelp: () => void;
  onExportPNG: () => void;
  onToast: (msg: string, type: 'info' | 'success' | 'warning' | 'error') => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenOptimizeModal,
  onOpenShareModal,
  onToggleHelp,
  onExportPNG,
  onToast,
}) => {
  const activeIsland = useOptimizerStore((state) => state.activeIsland);
  const setActiveIsland = useOptimizerStore((state) => state.setActiveIsland);
  const clearActiveIsland = useOptimizerStore((state) => state.clearActiveIsland);
  const undo = useOptimizerStore((state) => state.undo);
  const redo = useOptimizerStore((state) => state.redo);
  const history = useOptimizerStore((state) => state.history);
  const future = useOptimizerStore((state) => state.future);

  const handleClear = () => {
    clearActiveIsland();
    onToast(`Cleared ${ISLAND_CONFIGS[activeIsland].name}.`, 'info');
  };

  return (
    <header className="bg-surface border-b border-subtle px-3 sm:px-4 py-2 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 shrink-0 shadow-lg z-20 overflow-hidden">
      <div className="flex items-center justify-between gap-2">
        {/* Brand Logo & Title */}
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-amber-500 to-red-600 flex items-center justify-center shadow-md shrink-0">
            <Flame className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <div>
            <h1 className="font-display font-extrabold text-sm sm:text-base leading-tight bg-gradient-to-r from-gold via-amber-300 to-emerald-400 bg-clip-text text-transparent">
              Dragon City Simulator
            </h1>
            <p className="text-[10px] sm:text-[11px] text-text-muted font-medium hidden sm:block">
              Multi-Island Habitat & Crystal Simulator
            </p>
          </div>
        </div>

        {/* Theme Switcher & Shortcuts Help for Mobile */}
        <div className="flex md:hidden items-center gap-1">
          <button
            onClick={onToggleHelp}
            className="p-1.5 bg-base hover:bg-elevated text-text-muted hover:text-text-primary rounded-xl border border-subtle transition"
            title="Shortcuts (?)"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
          <ThemeToggle />
        </div>
      </div>

      {/* Island Switcher Tabs (Scrollable on small screens) */}
      <div className="flex items-center bg-base p-1 rounded-2xl border border-subtle gap-1 overflow-x-auto no-scrollbar scrollbar-none max-w-full">
        {(Object.keys(ISLAND_CONFIGS) as IslandId[]).map((id) => (
          <IslandTab
            key={id}
            config={ISLAND_CONFIGS[id]}
            isActive={activeIsland === id}
            onSelect={() => setActiveIsland(id)}
          />
        ))}
      </div>

      {/* Actions Toolbar */}
      <div className="flex items-center justify-between md:justify-end gap-1.5 overflow-x-auto">
        {/* Undo / Redo */}
        <div className="flex items-center bg-base p-1 rounded-xl border border-subtle shrink-0">
          <button
            onClick={undo}
            disabled={history.length === 0}
            className="p-1.5 text-text-muted hover:text-text-primary disabled:opacity-30 transition rounded-lg"
            title="Undo (Ctrl+Z)"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={redo}
            disabled={future.length === 0}
            className="p-1.5 text-text-muted hover:text-text-primary disabled:opacity-30 transition rounded-lg"
            title="Redo (Ctrl+Y)"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Auto Optimize */}
        <button
          onClick={onOpenOptimizeModal}
          className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold px-2.5 sm:px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 shadow-lg transition-all hover:scale-105 active:scale-95 shrink-0"
        >
          <Wand2 className="w-3.5 h-3.5" />
          <span>Auto-Jana</span>
        </button>

        {/* Clear Island */}
        <button
          onClick={handleClear}
          className="bg-base hover:bg-elevated text-text-muted hover:text-text-primary font-medium px-2.5 sm:px-3 py-1.5 rounded-xl text-xs transition flex items-center gap-1.5 border border-subtle shrink-0"
          title="Clear Island"
        >
          <Trash2 className="w-3.5 h-3.5 text-red-400" />
          <span className="hidden sm:inline">Padam</span>
        </button>

        {/* Export PNG */}
        <button
          onClick={onExportPNG}
          className="bg-base hover:bg-elevated text-text-muted hover:text-text-primary font-medium px-2.5 sm:px-3 py-1.5 rounded-xl text-xs transition flex items-center gap-1.5 border border-subtle shrink-0"
          title="Export PNG Image"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">PNG</span>
        </button>

        {/* Share & Import */}
        <button
          onClick={onOpenShareModal}
          className="bg-base hover:bg-elevated text-gold font-semibold px-2.5 sm:px-3 py-1.5 rounded-xl text-xs transition flex items-center gap-1.5 border border-subtle shrink-0"
          title="Share URL / Export JSON"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>Kongsi</span>
        </button>

        {/* Desktop Theme Switcher & Help */}
        <div className="hidden md:flex items-center gap-1.5">
          <button
            onClick={onToggleHelp}
            className="p-1.5 bg-base hover:bg-elevated text-text-muted hover:text-text-primary rounded-xl border border-subtle transition"
            title="Shortcuts (?)"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
};
