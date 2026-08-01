import React, { useEffect, useRef, useMemo, useState } from 'react';
import { Plus, Minus, Maximize2, Shrink, Grid, Pencil, Check, X, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Move } from 'lucide-react';
import { ISLAND_CONFIGS } from '../../constants/islands';
import { useCanvasInteraction } from '../../hooks/useCanvasInteraction';
import { useOptimizerStore } from '../../store/useOptimizerStore';
import { renderCanvas } from '../../utils/canvasRenderer';
import { SelectionPanel } from './SelectionPanel';
import { IslandSelectDropdown } from '../ui/IslandSelectDropdown';

interface CanvasViewportProps {
  onToast: (msg: string, type: 'info' | 'success' | 'warning' | 'error') => void;
}

export const CanvasViewport: React.FC<CanvasViewportProps> = ({ onToast }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const activeIsland = useOptimizerStore((state) => state.activeIsland);
  const mode = useOptimizerStore((state) => state.mode);
  const placementCategory = useOptimizerStore((state) => state.placementCategory);
  const selectedItemId = useOptimizerStore((state) => state.selectedItemId);
  const islands = useOptimizerStore((state) => state.islands);
  const grids = useOptimizerStore((state) => state.grids);
  const theme = useOptimizerStore((state) => state.theme);
  const compressGridToPlacedBuildings = useOptimizerStore((state) => state.compressGridToPlacedBuildings);
  const resizeIslandGrid = useOptimizerStore((state) => state.resizeIslandGrid);
  const moveAllStructures = useOptimizerStore((state) => state.moveAllStructures);

  const [isEditingDimensions, setIsEditingDimensions] = useState(false);
  const [editCols, setEditCols] = useState('');
  const [editRows, setEditRows] = useState('');

  const islandConfig = ISLAND_CONFIGS[activeIsland];
  const structures = islands[activeIsland] || [];
  const grid = grids[activeIsland] || islandConfig.gridTemplate;

  const buildableStats = useMemo(() => {
    const cols = islandConfig.cols;
    const rows = islandConfig.rows;
    const totalTiles = cols * rows;

    let buildable = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (grid[r] && grid[r][c] === 1) buildable++;
      }
    }

    const blocked = totalTiles - buildable;

    let usedTiles = 0;
    structures.forEach((s) => {
      const size = s.size || (s.kind === 'crystal' ? 2 : s.isAncient ? 6 : 4);
      usedTiles += size * size;
    });

    const freeTiles = Math.max(0, buildable - usedTiles);
    const fillPercentage = buildable > 0 ? ((usedTiles / buildable) * 100).toFixed(0) : '0';

    return {
      cols,
      rows,
      totalTiles,
      buildable,
      blocked,
      usedTiles,
      freeTiles,
      fillPercentage,
    };
  }, [grid, structures, islandConfig]);

  const {
    viewportRef,
    tileSize,
    panX,
    panY,
    zoom,
    setZoom,
    hoverRow,
    hoverCol,
    placementSize,
    isPlacementValid,
    isHoveringStructure,
    dragPreview,
    resetViewport,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  } = useCanvasInteraction();

  let cursorClass = "cursor-grab active:cursor-grabbing";
  if (dragPreview) {
    cursorClass = "cursor-grabbing";
  } else if (isHoveringStructure) {
    cursorClass = "cursor-grab";
  }

  // High-DPI canvas resizing & rendering loop
  useEffect(() => {
    const canvas = canvasRef.current;
    const viewport = viewportRef.current;
    if (!canvas || !viewport) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = viewport.clientWidth;
    const height = viewport.clientHeight;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    ctx.scale(dpr, dpr);

    const isDarkMode =
      theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    renderCanvas({
      ctx,
      canvasWidth: width,
      canvasHeight: height,
      islandConfig,
      grid,
      structures,
      selectedItemId,
      hoverRow,
      hoverCol,
      currentMode: mode,
      placementCategory,
      placementSize,
      isPlacementValid,
      tileSize,
      panX,
      panY,
      zoom,
      isDarkMode,
      dragPreview,
    });
  }, [
    islandConfig,
    grid,
    structures,
    selectedItemId,
    hoverRow,
    hoverCol,
    mode,
    placementCategory,
    placementSize,
    isPlacementValid,
    tileSize,
    panX,
    panY,
    zoom,
    theme,
    viewportRef,
    dragPreview,
  ]);

  const handleCompressGrid = () => {
    const res = compressGridToPlacedBuildings(activeIsland);
    if (res.success) {
      onToast(`Grid ${islandConfig.name} dikemaskan! (${res.count} bangunan, ${res.tiles} petak grid 1x1)`, 'success');
    } else {
      onToast(`Sila letakkan sekurang-kurangnya satu habitat/crystal pada ${islandConfig.name} untuk mampatkan grid.`, 'warning');
    }
  };

  const handleSaveDimensions = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const c = parseInt(editCols, 10);
    const r = parseInt(editRows, 10);
    if (isNaN(c) || isNaN(r) || c < 10 || r < 10 || c > 120 || r > 120) {
      onToast('Sila masukkan saiz grid yang sah (10 - 120).', 'warning');
      return;
    }
    resizeIslandGrid(activeIsland, c, r);
    setIsEditingDimensions(false);
    onToast(`Saiz grid ${islandConfig.name} ditukar ke ${c}×${r}!`, 'success');
  };

  const handleMoveAll = (dRow: number, dCol: number) => {
    const res = moveAllStructures(dRow, dCol, activeIsland);
    if (res.success) {
      const dirText = dRow < 0 ? 'Ke Atas ⬆️' : dRow > 0 ? 'Ke Bawah ⬇️' : dCol < 0 ? 'Ke Kiri ⬅️' : 'Ke Kanan ➡️';
      onToast(`Semua ${res.count} bangunan dialih ${dirText}!`, 'success');
    } else {
      onToast(res.reason || 'Tidak dapat mengalih semua bangunan.', 'warning');
    }
  };

  return (
    <main
      ref={viewportRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className={`flex-1 relative flex items-center justify-center overflow-hidden bg-base ${cursorClass} touch-none`}
    >
      <canvas ref={canvasRef} className="shadow-2xl rounded-lg" />

      {/* Floating Island Selector, Compress Grid & Move All Overlay */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-2 flex-wrap">
        <IslandSelectDropdown variant="floating" />
        <button
          type="button"
          onClick={handleCompressGrid}
          className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-surface/90 hover:bg-surface border border-subtle backdrop-blur-md text-emerald-400 hover:text-emerald-300 text-xs font-extrabold shadow-lg transition-all hover:scale-105 active:scale-95 min-h-[38px]"
          title="Mampatkan grid buildable mengikut tapak habitat & crystal yang telah diletakkan sahaja"
          aria-label="Compress Grid to Placed Buildings"
        >
          <Shrink className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Compress Grid</span>
        </button>

        {/* Move All Structures D-Pad Quick Controller */}
        {structures.length > 0 && (
          <div
            className="bg-surface/90 border border-subtle backdrop-blur-md rounded-2xl px-2 py-1 flex items-center gap-0.5 shadow-lg text-xs font-bold min-h-[38px] transition-all hover:border-emerald-500/40"
            title="Alih Semua Bangunan Serentak (Tekan Shift + Anak Panah pada papan kekunci)"
          >
            <div className="flex items-center gap-1 px-1.5 text-emerald-400 font-extrabold text-[11px]">
              <Move className="w-3.5 h-3.5" />
              <span className="hidden md:inline text-text-primary text-[10px] uppercase font-mono tracking-wider">Move All</span>
            </div>

            <div className="w-[1px] h-3.5 bg-subtle mx-0.5" />

            <button
              type="button"
              onClick={() => handleMoveAll(-1, 0)}
              className="p-1.5 rounded-xl hover:bg-elevated text-text-muted hover:text-emerald-400 active:scale-95 transition"
              title="Alih Semua Bangunan Ke Atas (Shift + ArrowUp)"
            >
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handleMoveAll(1, 0)}
              className="p-1.5 rounded-xl hover:bg-elevated text-text-muted hover:text-emerald-400 active:scale-95 transition"
              title="Alih Semua Bangunan Ke Bawah (Shift + ArrowDown)"
            >
              <ArrowDown className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handleMoveAll(0, -1)}
              className="p-1.5 rounded-xl hover:bg-elevated text-text-muted hover:text-emerald-400 active:scale-95 transition"
              title="Alih Semua Bangunan Ke Kiri (Shift + ArrowLeft)"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handleMoveAll(0, 1)}
              className="p-1.5 rounded-xl hover:bg-elevated text-text-muted hover:text-emerald-400 active:scale-95 transition"
              title="Alih Semua Bangunan Ke Kanan (Shift + ArrowRight)"
            >
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Floating Dynamic Selection Panel */}
      <SelectionPanel
        onToast={onToast}
        panX={panX}
        panY={panY}
        zoom={zoom}
        tileSize={tileSize}
        viewportRef={viewportRef}
      />

      {/* Floating Realtime Buildable Grid Counter & Zoom Controls */}
      <div className="absolute bottom-4 right-4 flex items-center gap-2 z-10">
        {/* Real-time Island Grid Info Pill */}
        <div
          className="bg-surface/90 border border-subtle backdrop-blur-md rounded-2xl px-3 py-1.5 sm:py-2 flex items-center gap-2 sm:gap-2.5 shadow-2xl transition-all hover:border-emerald-500/40 text-xs select-none"
          title={`Detail Grid Pulau:\n• Saiz Grid: ${buildableStats.cols} × ${buildableStats.rows}\n• Total Tiles: ${buildableStats.totalTiles.toLocaleString()}\n• Buildable: ${buildableStats.buildable.toLocaleString()} tiles\n• Blocked: ${buildableStats.blocked.toLocaleString()} tiles\n• Diguna: ${buildableStats.usedTiles} tiles (${buildableStats.freeTiles} free)`}
        >
          {/* Editable Saiz Grid W × H */}
          {isEditingDimensions ? (
            <form
              onSubmit={handleSaveDimensions}
              className="flex items-center gap-1 bg-elevated/90 border border-emerald-500/50 rounded-lg px-1.5 py-0.5 shadow-inner"
            >
              <input
                type="number"
                min="10"
                max="120"
                value={editCols}
                onChange={(e) => setEditCols(e.target.value)}
                className="w-9 text-center font-mono text-[11px] font-extrabold bg-base text-emerald-400 rounded border border-subtle focus:outline-none focus:border-emerald-400 py-0.5"
                placeholder="W"
                autoFocus
                title="Lebar Grid (Width / Columns)"
              />
              <span className="text-[10px] font-mono text-text-muted font-bold">×</span>
              <input
                type="number"
                min="10"
                max="120"
                value={editRows}
                onChange={(e) => setEditRows(e.target.value)}
                className="w-9 text-center font-mono text-[11px] font-extrabold bg-base text-emerald-400 rounded border border-subtle focus:outline-none focus:border-emerald-400 py-0.5"
                placeholder="H"
                title="Tinggi Grid (Height / Rows)"
              />
              <button
                type="submit"
                className="p-1 rounded hover:bg-emerald-500/20 text-emerald-400 transition"
                title="Simpan Saiz Grid"
              >
                <Check className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={() => setIsEditingDimensions(false)}
                className="p-1 rounded hover:bg-rose-500/20 text-rose-400 transition"
                title="Batal Edit"
              >
                <X className="w-3 h-3" />
              </button>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => {
                setEditCols(String(buildableStats.cols));
                setEditRows(String(buildableStats.rows));
                setIsEditingDimensions(true);
              }}
              className="flex items-center gap-1 px-1.5 py-0.5 rounded-lg hover:bg-elevated/80 border border-transparent hover:border-subtle/60 transition cursor-pointer group"
              title="Klik untuk ubah saiz Grid (Lebar × Tinggi)"
            >
              <Grid className="w-3.5 h-3.5 text-emerald-400 shrink-0 group-hover:scale-110 transition-transform" />
              <span className="font-extrabold font-mono text-text-primary text-[11px] sm:text-xs group-hover:text-emerald-400 underline decoration-dotted decoration-emerald-500/40 underline-offset-2">
                {buildableStats.cols}×{buildableStats.rows}
              </span>
              <Pencil className="w-2.5 h-2.5 text-text-muted opacity-60 group-hover:opacity-100 group-hover:text-emerald-400 transition" />
            </button>
          )}

          <div className="w-[1px] h-3.5 bg-subtle shrink-0" />

          {/* Total Tiles */}
          <div className="flex items-center gap-1" title="Total Bounding Box Tiles (W × H)">
            <span className="text-[10px] text-text-muted uppercase font-bold tracking-wider hidden sm:inline">Total:</span>
            <span className="font-extrabold font-mono text-text-secondary text-[11px] sm:text-xs">
              {buildableStats.totalTiles.toLocaleString()}
            </span>
          </div>

          <div className="w-[1px] h-3.5 bg-subtle shrink-0" />

          {/* Buildable Tiles */}
          <div className="flex items-center gap-1" title="Jumlah Petak Boleh Dibina">
            <span className="text-[10px] text-emerald-400 uppercase font-bold tracking-wider hidden sm:inline">Buildable:</span>
            <span className="font-extrabold font-mono text-emerald-400 text-[11px] sm:text-xs">
              {buildableStats.buildable.toLocaleString()}
            </span>
          </div>

          <div className="w-[1px] h-3.5 bg-subtle shrink-0" />

          {/* Blocked Tiles */}
          <div className="flex items-center gap-1" title="Jumlah Petak Terhalang / Laut / Obstacle">
            <span className="text-[10px] text-rose-400 uppercase font-bold tracking-wider hidden sm:inline">Blocked:</span>
            <span className="font-extrabold font-mono text-rose-400 text-[11px] sm:text-xs">
              {buildableStats.blocked.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Floating Zoom Controls */}
        <div className="bg-surface/90 border border-subtle backdrop-blur-md rounded-2xl p-1.5 sm:p-2 flex items-center gap-1.5 sm:gap-2 shadow-2xl">
          <button
            onClick={() => setZoom((prev) => Math.max(prev / 1.2, 0.5))}
            className="w-8 h-8 rounded-xl hover:bg-elevated text-text-muted hover:text-text-primary flex items-center justify-center transition active:scale-95"
            title="Zoom Out (Min 50%)"
          >
            <Minus className="w-4 h-4" />
          </button>

          {/* Zoom Slider */}
          <input
            type="range"
            min="50"
            max="180"
            step="5"
            value={Math.round(zoom * 100)}
            onChange={(e) => setZoom(Number(e.target.value) / 100)}
            className="w-16 sm:w-28 h-1.5 bg-elevated rounded-lg appearance-none cursor-pointer accent-emerald-500 hover:accent-emerald-400"
            title={`Zoom: ${Math.round(zoom * 100)}% (50% - 180%)`}
          />

          {/* Zoom Percentage Badge */}
          <span
            onClick={() => setZoom(1.0)}
            className="text-xs font-bold font-mono min-w-[3.25rem] text-center text-text-primary hover:text-emerald-400 transition cursor-pointer select-none px-1 py-0.5 rounded bg-elevated/50 border border-subtle/50"
            title="Klik untuk reset zoom ke 100%"
          >
            {Math.round(zoom * 100)}%
          </span>

          <button
            onClick={() => setZoom((prev) => Math.min(prev * 1.2, 1.8))}
            className="w-8 h-8 rounded-xl hover:bg-elevated text-text-muted hover:text-text-primary flex items-center justify-center transition active:scale-95"
            title="Zoom In (Max 180%)"
          >
            <Plus className="w-4 h-4" />
          </button>

          <div className="w-[1px] h-4 bg-subtle my-auto mx-0.5" />

          <button
            onClick={resetViewport}
            className="w-8 h-8 rounded-xl hover:bg-elevated text-text-muted hover:text-text-primary flex items-center justify-center transition active:scale-95"
            title="Reset Viewport"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </main>
  );
};
