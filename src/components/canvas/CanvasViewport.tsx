import React, { useEffect, useRef } from 'react';
import { Plus, Minus, Maximize2 } from 'lucide-react';
import { ISLAND_CONFIGS } from '../../constants/islands';
import { useCanvasInteraction } from '../../hooks/useCanvasInteraction';
import { useOptimizerStore } from '../../store/useOptimizerStore';
import { renderCanvas } from '../../utils/canvasRenderer';

export const CanvasViewport: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const activeIsland = useOptimizerStore((state) => state.activeIsland);
  const mode = useOptimizerStore((state) => state.mode);
  const placementCategory = useOptimizerStore((state) => state.placementCategory);
  const selectedItemId = useOptimizerStore((state) => state.selectedItemId);
  const islands = useOptimizerStore((state) => state.islands);
  const grids = useOptimizerStore((state) => state.grids);
  const theme = useOptimizerStore((state) => state.theme);

  const islandConfig = ISLAND_CONFIGS[activeIsland];
  const structures = islands[activeIsland] || [];
  const grid = grids[activeIsland] || islandConfig.gridTemplate;

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
    resetViewport,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleWheel,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  } = useCanvasInteraction();

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
  ]);

  return (
    <main
      ref={viewportRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="flex-1 relative flex items-center justify-center overflow-hidden bg-base cursor-grab active:cursor-grabbing touch-none"
    >
      <canvas ref={canvasRef} className="shadow-2xl rounded-lg" />

      {/* Floating Zoom Controls */}
      <div className="absolute bottom-4 right-4 bg-surface/90 border border-subtle backdrop-blur-md rounded-2xl p-1.5 flex items-center gap-1 shadow-2xl z-10">
        <button
          onClick={() => setZoom((prev) => Math.min(prev * 1.2, 3.0))}
          className="w-8 h-8 rounded-xl hover:bg-elevated text-text-muted hover:text-text-primary flex items-center justify-center transition active:scale-95"
          title="Zoom In"
        >
          <Plus className="w-4 h-4" />
        </button>
        <button
          onClick={() => setZoom((prev) => Math.max(prev / 1.2, 0.3))}
          className="w-8 h-8 rounded-xl hover:bg-elevated text-text-muted hover:text-text-primary flex items-center justify-center transition active:scale-95"
          title="Zoom Out"
        >
          <Minus className="w-4 h-4" />
        </button>
        <button
          onClick={resetViewport}
          className="w-8 h-8 rounded-xl hover:bg-elevated text-text-muted hover:text-text-primary flex items-center justify-center transition active:scale-95"
          title="Reset Viewport"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>
    </main>
  );
};
