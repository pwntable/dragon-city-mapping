import React from 'react';
import { Flame, Wand2, Trash2, Download, Share2, RotateCcw, RotateCw, HelpCircle, Map, Shrink } from 'lucide-react';
import { ISLAND_CONFIGS } from '../../constants/islands';
import { useOptimizerStore } from '../../store/useOptimizerStore';
import { ThemeToggle } from '../ui/ThemeToggle';
import { ActionOverflowMenu } from '../ui/ActionOverflowMenu';

interface HeaderProps {
  onOpenOptimizeModal: () => void;
  onOpenShareModal: () => void;
  onOpenMapperModal: () => void;
  onToggleHelp: () => void;
  onExportPNG: () => void;
  onToast: (msg: string, type: 'info' | 'success' | 'warning' | 'error') => void;
}


export const Header: React.FC<HeaderProps> = ({
  onOpenOptimizeModal,
  onOpenShareModal,
  onOpenMapperModal,
  onToggleHelp,
  onExportPNG,
  onToast,
}) => {

  const activeIsland = useOptimizerStore((state) => state.activeIsland);
  const clearActiveIsland = useOptimizerStore((state) => state.clearActiveIsland);
  const compressGridToPlacedBuildings = useOptimizerStore((state) => state.compressGridToPlacedBuildings);
  const undo = useOptimizerStore((state) => state.undo);
  const redo = useOptimizerStore((state) => state.redo);
  const history = useOptimizerStore((state) => state.history);
  const future = useOptimizerStore((state) => state.future);

  const handleClear = () => {
    clearActiveIsland();
    onToast(`Island ${ISLAND_CONFIGS[activeIsland].name} telah dipadam.`, 'info');
  };

  const handleCompressGrid = () => {
    const res = compressGridToPlacedBuildings(activeIsland);
    if (res.success) {
      onToast(`Grid ${ISLAND_CONFIGS[activeIsland].name} dikemaskan! (${res.count} bangunan, ${res.tiles} petak grid 1x1)`, 'success');
    } else {
      onToast(`Sila letakkan sekurang-kurangnya satu habitat/crystal pada ${ISLAND_CONFIGS[activeIsland].name} untuk mampatkan grid.`, 'warning');
    }
  };

  return (
    <header className="bg-surface border-b border-subtle px-2.5 sm:px-4 py-2 flex items-center justify-between gap-2 shrink-0 shadow-lg z-20 w-full overflow-hidden">
      {/* Kiri: Brand Logo & Title */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <div className="flex items-center space-x-2 shrink-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-amber-500 to-red-600 flex items-center justify-center shadow-md shrink-0">
            <Flame className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="font-display font-extrabold text-xs sm:text-sm md:text-base leading-tight bg-gradient-to-r from-gold via-amber-300 to-emerald-400 bg-clip-text text-transparent whitespace-nowrap">
              Dragon City Simulator
            </h1>
            <p className="text-[10px] sm:text-[11px] text-text-muted font-medium hidden sm:block whitespace-nowrap">
              Multi-Island Habitat &amp; Crystal Simulator
            </p>
          </div>
        </div>
      </div>

      {/* Kanan: Actions Toolbar */}
      <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
        {/* Undo / Redo */}
        <div className="flex items-center bg-base p-0.5 sm:p-1 rounded-xl border border-subtle shrink-0">
          <button
            type="button"
            onClick={undo}
            disabled={history.length === 0}
            className="p-1.5 sm:p-2 min-w-[32px] min-h-[32px] sm:min-w-[36px] sm:min-h-[36px] flex items-center justify-center text-text-muted hover:text-text-primary disabled:opacity-30 transition rounded-lg"
            title="Undo (Ctrl+Z)"
            aria-label="Undo"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={redo}
            disabled={future.length === 0}
            className="p-1.5 sm:p-2 min-w-[32px] min-h-[32px] sm:min-w-[36px] sm:min-h-[36px] flex items-center justify-center text-text-muted hover:text-text-primary disabled:opacity-30 transition rounded-lg"
            title="Redo (Ctrl+Y)"
            aria-label="Redo"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Island Grid Mapper Tool */}
        <button
          type="button"
          onClick={onOpenMapperModal}
          aria-label="Visual Island Grid Mapper"
          className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold px-2.5 sm:px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 shadow-lg transition-all hover:scale-105 active:scale-95 shrink-0 min-h-[36px]"
          title="Buka Visual Island Grid Mapper / Editor"
        >
          <Map className="w-3.5 h-3.5" />
          <span className="hidden xs:inline sm:inline">Map Editor</span>
        </button>

        {/* Compress Grid Tool */}
        <button
          type="button"
          onClick={handleCompressGrid}
          aria-label="Compress Grid to Placed Buildings"
          className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold px-2.5 sm:px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 shadow-lg transition-all hover:scale-105 active:scale-95 shrink-0 min-h-[36px]"
          title="Kemaskan grid buildable mengikut tapak habitat/crystal yang diletakkan"
        >
          <Shrink className="w-3.5 h-3.5" />
          <span className="hidden xs:inline sm:inline">Compress Grid</span>
        </button>

        {/* Auto-Jana (Auto Optimize) */}
        <button
          type="button"
          onClick={onOpenOptimizeModal}
          aria-label="Auto-Jana Island Layout"
          className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold px-2.5 sm:px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 shadow-lg transition-all hover:scale-105 active:scale-95 shrink-0 min-h-[36px]"
        >
          <Wand2 className="w-3.5 h-3.5" />
          <span className="hidden xs:inline sm:inline">Auto-Jana</span>
        </button>


        {/* Actions penuh untuk skrin besar (≥ lg) */}
        <div className="hidden lg:flex items-center gap-1 sm:gap-1.5">
          {/* Padam Island */}
          <button
            type="button"
            onClick={handleClear}
            className="bg-base hover:bg-elevated text-text-muted hover:text-text-primary font-medium px-2.5 sm:px-3 py-1.5 rounded-xl text-xs transition flex items-center gap-1.5 border border-subtle shrink-0 min-h-[36px]"
            title="Padam Semua Susunan Island"
            aria-label="Clear Island"
          >
            <Trash2 className="w-3.5 h-3.5 text-red-400" />
            <span>Padam</span>
          </button>

          {/* Export PNG */}
          <button
            type="button"
            onClick={onExportPNG}
            className="bg-base hover:bg-elevated text-text-muted hover:text-text-primary font-medium px-2.5 sm:px-3 py-1.5 rounded-xl text-xs transition flex items-center gap-1.5 border border-subtle shrink-0 min-h-[36px]"
            title="Muat Turun Format PNG"
            aria-label="Export PNG"
          >
            <Download className="w-3.5 h-3.5" />
            <span>PNG</span>
          </button>

          {/* Share & Import */}
          <button
            type="button"
            onClick={onOpenShareModal}
            className="bg-base hover:bg-elevated text-gold font-semibold px-2.5 sm:px-3 py-1.5 rounded-xl text-xs transition flex items-center gap-1.5 border border-subtle shrink-0 min-h-[36px]"
            title="Kongsi Pautan atau Export JSON"
            aria-label="Share or Export JSON"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Kongsi</span>
          </button>

          {/* Shortcuts Help */}
          <button
            type="button"
            onClick={onToggleHelp}
            className="p-2 bg-base hover:bg-elevated text-text-muted hover:text-text-primary rounded-xl border border-subtle transition shrink-0 min-w-[36px] min-h-[36px] flex items-center justify-center"
            title="Pintasan Papan Kekunci (?)"
            aria-label="Keyboard Shortcuts"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>

        {/* Theme Switcher */}
        <ThemeToggle />

        {/* Mobile / Tablet Overflow Kebab Menu (< lg) */}
        <div className="lg:hidden">
          <ActionOverflowMenu
            onClear={handleClear}
            onExportPNG={onExportPNG}
            onOpenShareModal={onOpenShareModal}
            onToggleHelp={onToggleHelp}
          />
        </div>
      </div>
    </header>
  );
};
