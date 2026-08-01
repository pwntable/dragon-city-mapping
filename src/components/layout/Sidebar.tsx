import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  PieChart,
  Coins,
  Gem,
  Box,
  Pointer,
  Eraser,
  Grid,
  ShieldAlert,
  Menu,
  X,
  Shrink,
  RotateCcw,
  ImagePlay,
} from 'lucide-react';
import { ANCIENT_HABITATS, ANCIENT_WORLD_CRYSTALS, REGULAR_HABITATS } from '../../constants/habitats';
import { ISLAND_CONFIGS } from '../../constants/islands';
import { ISLAND_PRESETS } from '../../data/presets';
import { useOptimizerStore } from '../../store/useOptimizerStore';
import { ElementType, PlacementCategory, ToolMode } from '../../types';
import { calculateBoostStats } from '../../utils/coverageCalculator';

interface SidebarProps {
  onToast: (msg: string, type: 'info' | 'success' | 'warning' | 'error') => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onToast }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const activeIsland = useOptimizerStore((state) => state.activeIsland);
  const mode = useOptimizerStore((state) => state.mode);
  const placementCategory = useOptimizerStore((state) => state.placementCategory);
  const selectedElementType = useOptimizerStore((state) => state.selectedElementType);
  const islands = useOptimizerStore((state) => state.islands);
  const grids = useOptimizerStore((state) => state.grids);

  const setMode = useOptimizerStore((state) => state.setMode);
  const setPlacementCategory = useOptimizerStore((state) => state.setPlacementCategory);
  const setSelectedElementType = useOptimizerStore((state) => state.setSelectedElementType);
  const compressGridToPlacedBuildings = useOptimizerStore((state) => state.compressGridToPlacedBuildings);
  const resetIslandGridToTemplate = useOptimizerStore((state) => state.resetIslandGridToTemplate);
  const loadIslandPreset = useOptimizerStore((state) => state.loadIslandPreset);

  const hasPreset = !!ISLAND_PRESETS[activeIsland];

  const config = ISLAND_CONFIGS[activeIsland];
  const currentStructures = islands[activeIsland] || [];
  const currentGrid = grids[activeIsland] || config.gridTemplate;

  // Calculate Island Statistics
  let totalBuildableTiles = 0;
  for (let r = 0; r < config.rows; r++) {
    for (let c = 0; c < config.cols; c++) {
      if (currentGrid[r] && currentGrid[r][c] === 1) totalBuildableTiles++;
    }
  }

  let totalGoldCap = 0;
  let totalPlatCap = 0;
  let ancientHabCount = 0;
  let usedTiles = 0;

  const habitats = currentStructures.filter((s) => s.kind === 'habitat');
  const crystals = currentStructures.filter((s) => s.kind === 'crystal');

  habitats.forEach((hab) => {
    usedTiles += hab.size * hab.size;
    const levelIdx = hab.level - 1;
    const cap = hab.capacities[levelIdx] || hab.capacities[hab.capacities.length - 1] || 0;
    if (hab.isAncient) {
      ancientHabCount++;
      totalPlatCap += cap;
    } else {
      totalGoldCap += cap;
    }
  });

  usedTiles += crystals.length;
  const efficiency = totalBuildableTiles > 0 ? ((usedTiles / totalBuildableTiles) * 100).toFixed(1) : '0';
  const { totalBoostPercentage, boostedHabitatsCount } = calculateBoostStats(currentStructures);

  const toolBtns: { mode: ToolMode; label: string; icon: React.ReactNode }[] = [
    { mode: 'place', label: 'Tambah', icon: <Box className="w-3.5 h-3.5" /> },
    { mode: 'select', label: 'Pilih / Level', icon: <Pointer className="w-3.5 h-3.5" /> },
    { mode: 'erase', label: 'Padam', icon: <Eraser className="w-3.5 h-3.5" /> },
    { mode: 'grid-edit', label: 'Edit Grid', icon: <Grid className="w-3.5 h-3.5" /> },
  ];

  const categories: { id: PlacementCategory; label: string }[] = [
    { id: 'regular', label: 'Regular' },
    { id: 'ancient', label: 'Ancient' },
    { id: 'crystal', label: 'Crystal' },
    { id: 'ancientWorld', label: 'Ancient W.' },
  ];

  const content = (
    <div className="flex-1 flex flex-col overflow-y-auto">
      {/* Statistics Panel */}
      <div className="p-3.5 border-b border-subtle bg-base/40 space-y-2.5">
        <h2 className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center justify-between">
          <span>Statistik {config.name}</span>
          <PieChart className="w-4 h-4 text-gold" />
        </h2>

        {/* Gold & Platinum Storage Capacity Counters */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-amber-500/10 p-2 rounded-xl border border-amber-500/30">
            <span className="text-[10px] text-amber-300 font-semibold flex items-center justify-between">
              <span>Kapasiti Gold</span>
              <Coins className="w-3 h-3 text-gold" />
            </span>
            <span className="text-sm font-black text-gold block mt-0.5">{totalGoldCap.toLocaleString()}</span>
          </div>
          <div className="bg-cyan-500/10 p-2 rounded-xl border border-cyan-500/30">
            <span className="text-[10px] text-cyan-300 font-semibold flex items-center justify-between">
              <span>Kapasiti Platinum</span>
              <Gem className="w-3 h-3 text-crystal" />
            </span>
            <span className="text-sm font-black text-crystal block mt-0.5">{totalPlatCap.toLocaleString()}</span>
          </div>
        </div>

        {/* Habitat & Boost Counts */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-elevated p-2 rounded-xl border border-subtle">
            <span className="text-[10px] text-text-muted block font-semibold">Habitat (Limit)</span>
            <span className={`text-xs font-black ${habitats.length >= (config.maxHabitats || 24) ? 'text-red-400' : 'text-gold'}`}>
              {habitats.length} / {config.maxHabitats || 24}
            </span>
            <span className="text-[9px] text-purple-400 font-semibold block">({ancientHabCount} Ancient)</span>
          </div>
          <div className="bg-elevated p-2 rounded-xl border border-subtle">
            <span className="text-[10px] text-text-muted block font-semibold">Crystals (2x2)</span>
            <span className="text-xs font-black text-crystal">{crystals.length}</span>
            <span className="text-[9px] text-emerald-400 font-semibold block">
              +{totalBoostPercentage}% Boost ({boostedHabitatsCount} Hab)
            </span>
          </div>
        </div>

        {/* Usage Progress Bar */}
        <div>
          <div className="flex justify-between text-[11px] text-text-muted mb-1 font-medium">
            <span>Kecekapan Ruang</span>
            <span>
              {usedTiles} / {totalBuildableTiles} ({efficiency}%)
            </span>
          </div>
          <div className="w-full h-2 bg-base rounded-full overflow-hidden border border-subtle">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-amber-400 transition-all duration-300"
              style={{ width: `${Math.min(parseFloat(efficiency), 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Tool Selectors */}
      <div className="p-3 border-b border-subtle shrink-0">
        <h2 className="text-[11px] font-bold uppercase tracking-wider text-text-muted mb-1.5">Mod Alat</h2>
        <div className="grid grid-cols-2 gap-1.5">
          {toolBtns.map((item) => {
            const isActive = mode === item.mode;
            return (
              <button
                key={item.mode}
                onClick={() => {
                  setMode(item.mode);
                  setIsMobileOpen(false);
                }}
                className={`p-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                  isActive
                    ? 'bg-amber-500/20 text-gold border border-amber-500/50 shadow-md'
                    : 'bg-elevated text-text-muted hover:text-text-primary border border-transparent'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
        <div className="grid grid-cols-2 gap-1.5 mt-1.5">
          <button
            onClick={() => {
              const res = compressGridToPlacedBuildings(activeIsland);
              if (res.success) {
                onToast(`Grid ${config.name} dikemaskan! (${res.count} bangunan, ${res.tiles} petak)`, 'success');
              } else {
                onToast(`Letakkan sekurang-kurangnya 1 habitat/crystal dahulu.`, 'warning');
              }
            }}
            className="p-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold flex items-center justify-center gap-1 transition"
            title="Mampatkan grid mengikut tapak habitat & crystal sahaja"
          >
            <Shrink className="w-3 h-3" />
            <span>Compress Grid</span>
          </button>
          <button
            onClick={() => {
              resetIslandGridToTemplate(activeIsland);
              onToast(`Grid ${config.name} telah di-reset ke template asal.`, 'info');
            }}
            className="p-1.5 rounded-xl bg-base hover:bg-elevated text-text-muted hover:text-text-primary border border-subtle text-[11px] font-bold flex items-center justify-center gap-1 transition"
            title="Reset grid mask kepada rupa asal pulau"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Grid</span>
          </button>
        </div>
        {/* Screenshot Preset Loader — only visible for islands that have a preset */}
        {hasPreset && (
          <button
            onClick={() => {
              const res = loadIslandPreset(activeIsland);
              if (res.success) {
                onToast(`📸 Layout screenshot ${config.name} berjaya dimuatkan! (${res.count} struktur)`, 'success');
              } else {
                onToast(`Tiada preset tersedia untuk ${config.name}.`, 'warning');
              }
            }}
            className="mt-1.5 w-full p-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[11px] font-bold flex items-center justify-center gap-1.5 transition"
            title={`Muat layout yang diekstrak dari screenshot ${config.name}`}
          >
            <ImagePlay className="w-3.5 h-3.5" />
            <span>📸 Load Screenshot Layout</span>
          </button>
        )}
      </div>

      {/* Element Selection Palette */}
      <div className="p-3 border-b border-subtle flex-1 flex flex-col min-h-[220px] overflow-hidden shrink-0">
        <div className="flex flex-col gap-2 mb-2 shrink-0">
          <h2 className="text-[11px] font-bold uppercase tracking-wider text-text-muted">Pilih Elemen</h2>
          <div className="grid grid-cols-4 bg-base p-1 rounded-xl border border-subtle text-[10px] font-bold gap-1 text-center">
            {categories.map((cat) => {
              const isActive = placementCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setPlacementCategory(cat.id)}
                  className={`py-1 px-1 rounded-lg transition truncate ${
                    isActive
                      ? 'bg-gold text-slate-950 font-bold shadow'
                      : 'text-text-muted hover:text-text-primary'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Dynamic Palette Buttons */}
        <div className="grid grid-cols-2 gap-1.5 overflow-y-auto pr-1 flex-1 max-h-[220px]">
          {placementCategory === 'regular' &&
            REGULAR_HABITATS.map((elem) => {
              const isSelected = selectedElementType === elem.id;
              return (
                <button
                  key={elem.id}
                  onClick={() => {
                    setSelectedElementType(elem.id as ElementType);
                    setMode('place');
                    setIsMobileOpen(false);
                  }}
                  className={`p-2 rounded-xl text-xs font-bold border transition flex items-center justify-between ${
                    isSelected
                      ? 'bg-amber-500/20 text-gold border-amber-500/50 shadow-md'
                      : 'bg-elevated text-text-primary border-subtle hover:bg-surface'
                  }`}
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <span
                      className="w-4 h-4 rounded-md shrink-0 inline-block"
                      style={{ backgroundColor: elem.color }}
                    />
                    <span className="truncate">{elem.name}</span>
                  </div>
                  <span className="text-[9px] text-gold font-extrabold shrink-0">4x4</span>
                </button>
              );
            })}

          {placementCategory === 'ancient' &&
            ANCIENT_HABITATS.map((elem) => {
              const isSelected = selectedElementType === elem.id;
              let isAlreadyPlaced = false;
              Object.values(islands).forEach((isl) => {
                if (isl.some((h) => h.type === elem.id && h.isAncient)) isAlreadyPlaced = true;
              });

              return (
                <button
                  key={elem.id}
                  onClick={() => {
                    if (isAlreadyPlaced) {
                      onToast(`Hanya 1 Habitat ${elem.name} dibenarkan!`, 'error');
                      return;
                    }
                    setSelectedElementType(elem.id as ElementType);
                    setMode('place');
                    setIsMobileOpen(false);
                  }}
                  className={`p-2 rounded-xl text-xs font-bold border transition flex items-center justify-between ${
                    isAlreadyPlaced
                      ? 'bg-base text-text-muted border-subtle opacity-50 cursor-not-allowed'
                      : isSelected
                      ? 'bg-purple-500/20 text-purple-300 border-purple-500/50 shadow-md'
                      : 'bg-elevated text-text-primary border-subtle hover:bg-surface'
                  }`}
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <span
                      className="w-4 h-4 rounded-md shrink-0 inline-block"
                      style={{ backgroundColor: elem.color }}
                    />
                    <span className="truncate">{elem.name}</span>
                  </div>
                  <span
                    className={`text-[9px] font-extrabold shrink-0 ${
                      isAlreadyPlaced ? 'text-red-400' : 'text-purple-400'
                    }`}
                  >
                    {isAlreadyPlaced ? 'Placed' : '6x6'}
                  </span>
                </button>
              );
            })}

          {placementCategory === 'crystal' &&
            REGULAR_HABITATS.map((elem) => {
              const isSelected = selectedElementType === elem.id;
              const crystalCount = crystals.filter((c) => c.type === elem.id).length;

              return (
                <button
                  key={elem.id}
                  onClick={() => {
                    setSelectedElementType(elem.id as ElementType);
                    setMode('place');
                    setIsMobileOpen(false);
                  }}
                  className={`p-2 rounded-xl text-xs font-bold border transition flex items-center justify-between ${
                    isSelected
                      ? 'bg-cyan-500/20 text-crystal border-cyan-500/50 shadow-md'
                      : 'bg-elevated text-text-primary border-subtle hover:bg-surface'
                  }`}
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <span
                      className="w-4 h-4 rounded-md shrink-0 inline-block"
                      style={{ backgroundColor: elem.color }}
                    />
                    <span className="truncate">{elem.name}</span>
                  </div>
                  <span className="text-[9px] text-crystal font-bold shrink-0">{crystalCount}/4</span>
                </button>
              );
            })}

          {placementCategory === 'ancientWorld' &&
            ANCIENT_WORLD_CRYSTALS.map((elem) => (
              <div
                key={elem.id}
                className="col-span-2 p-2 rounded-xl bg-base border border-subtle flex items-start gap-2"
              >
                <span
                  className="w-5 h-5 rounded-md flex items-center justify-center text-white text-[10px] shrink-0 font-bold"
                  style={{ backgroundColor: elem.color }}
                >
                  ★
                </span>
                <div>
                  <h4 className="text-xs font-bold text-text-primary">{elem.name}</h4>
                  <p className="text-[10px] text-text-muted leading-tight mt-0.5">{elem.desc}</p>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Rules & Info Box */}
      <div className="p-3 text-[11px] text-text-muted space-y-1 bg-base border-t border-subtle shrink-0">
        <div className="flex items-center gap-1.5 font-bold text-text-primary mb-1">
          <ShieldAlert className="w-3.5 h-3.5 text-gold" />
          <span>Sistem Liputan Crystal</span>
        </div>
        <p>• <strong className="text-crystal">Radius Liputan:</strong> 5 petak (~12x12 sekeliling Crystal 2x2).</p>
        <p>• <strong className="text-gold">Production Boost:</strong> +20% Gold Rate per Crystal elemen sama.</p>
        <p>• <strong className="text-emerald-400">Stacking:</strong> Cumulative (+20%, +40%, +60%, +80% max).</p>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Floating Drawer Trigger Button */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="md:hidden fixed bottom-4 left-4 z-40 bg-gold text-slate-950 p-3 rounded-full shadow-2xl font-bold flex items-center justify-center active:scale-95 border border-gold-hover"
        title="Open Tools & Stats Drawer"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile Slide-Over Drawer Modal */}
      {isMobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            onClick={() => setIsMobileOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />
          <div className="relative w-80 bg-surface h-full z-50 flex flex-col shadow-2xl">
            <div className="flex items-center justify-between p-3 border-b border-subtle">
              <span className="font-bold text-gold text-xs">Alat & Statistik</span>
              <button
                onClick={() => setIsMobileOpen(false)}
                className="p-1 text-text-muted hover:text-text-primary rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {content}
          </div>
        </div>
      )}

      {/* Desktop / Laptop Sidebar */}
      <aside
        className={`hidden md:flex relative bg-surface/90 backdrop-blur-md border-r border-subtle flex-col shrink-0 z-10 transition-all duration-300 ${
          isCollapsed ? 'w-12' : 'w-80'
        }`}
      >
        {/* Collapse Toggle Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-4 w-6 h-6 bg-surface border border-subtle rounded-full flex items-center justify-center text-text-muted hover:text-text-primary z-30 shadow-md transition"
        >
          {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>

        {!isCollapsed ? (
          content
        ) : (
          <div className="py-4 flex flex-col items-center gap-4">
            <PieChart className="w-5 h-5 text-gold" />
            <Box className="w-5 h-5 text-text-muted" />
          </div>
        )}
      </aside>
    </>
  );
};
