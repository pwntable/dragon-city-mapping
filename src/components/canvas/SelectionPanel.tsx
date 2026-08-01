import React, { useLayoutEffect, useRef, useState } from 'react';
import { Trash2, Plus, Minus, X, Move, Copy, AlertTriangle } from 'lucide-react';
import { CRYSTAL_CONFIG } from '../../constants/habitats';
import { useOptimizerStore } from '../../store/useOptimizerStore';
import { getHabitatsInCrystalRange, isCrystalBoostingHabitat } from '../../utils/coverageCalculator';

interface SelectionPanelProps {
  onToast: (msg: string, type: 'info' | 'success' | 'warning' | 'error') => void;
  panX?: number;
  panY?: number;
  zoom?: number;
  tileSize?: number;
  viewportRef?: React.RefObject<HTMLDivElement | null>;
}

export const SelectionPanel: React.FC<SelectionPanelProps> = ({
  onToast,
  panX = 20,
  panY = 20,
  zoom = 1.0,
  tileSize = 24,
  viewportRef,
}) => {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const activeIsland = useOptimizerStore((state) => state.activeIsland);
  const selectedItemId = useOptimizerStore((state) => state.selectedItemId);
  const islands = useOptimizerStore((state) => state.islands);

  const removeStructure = useOptimizerStore((state) => state.removeStructure);
  const upgradeStructure = useOptimizerStore((state) => state.upgradeStructure);
  const downgradeStructure = useOptimizerStore((state) => state.downgradeStructure);
  const moveStructure = useOptimizerStore((state) => state.moveStructure);
  const duplicateStructure = useOptimizerStore((state) => state.duplicateStructure);
  const setSelectedItemId = useOptimizerStore((state) => state.setSelectedItemId);

  const [positionStyle, setPositionStyle] = useState<React.CSSProperties>({
    position: 'absolute',
    top: '12px',
    left: '12px',
  });

  const currentStructures = islands[activeIsland] || [];
  const selectedItem = currentStructures.find((s) => s.id === selectedItemId);

  const crystalRangeData = selectedItem && selectedItem.kind === 'crystal'
    ? getHabitatsInCrystalRange(selectedItem, currentStructures)
    : { matching: [], nonMatching: [] };

  const boostingCrystals = selectedItem && selectedItem.kind === 'habitat' && !selectedItem.isAncient
    ? currentStructures.filter((c) => c.kind === 'crystal' && isCrystalBoostingHabitat(c, selectedItem))
    : [];
  const activeBoostPercent = Math.min(CRYSTAL_CONFIG.maxCrystalsPerHabitat, boostingCrystals.length) * CRYSTAL_CONFIG.goldBoostPercent;

  useLayoutEffect(() => {
    if (!selectedItem || !viewportRef?.current) return;

    const viewport = viewportRef.current;
    const panel = panelRef.current;

    const vWidth = viewport.clientWidth;
    const vHeight = viewport.clientHeight;

    const pWidth = panel?.offsetWidth || 280;
    const pHeight = panel?.offsetHeight || 250;

    // Calculate exact screen position of selected structure on canvas
    const itemX = panX + selectedItem.col * tileSize * zoom;
    const itemY = panY + selectedItem.row * tileSize * zoom;
    const itemW = selectedItem.size * tileSize * zoom;
    const itemH = selectedItem.size * tileSize * zoom;

    const itemCenterX = itemX + itemW / 2;
    const itemCenterY = itemY + itemH / 2;

    // Preferred position: Above the item, centered horizontally
    let left = itemCenterX - pWidth / 2;
    let top = itemY - pHeight - 14;

    // If above overflows top of viewport (< 14px padding)
    if (top < 14) {
      // Try placing below the habitat
      const belowTop = itemY + itemH + 14;
      if (belowTop + pHeight <= vHeight - 14) {
        top = belowTop;
      } else {
        // If neither top nor bottom fits, place to the right or left of item
        if (itemX + itemW + pWidth + 14 <= vWidth - 14) {
          left = itemX + itemW + 14;
          top = itemCenterY - pHeight / 2;
        } else if (itemX - pWidth - 14 >= 14) {
          left = itemX - pWidth - 14;
          top = itemCenterY - pHeight / 2;
        } else {
          top = Math.max(14, Math.min(vHeight - pHeight - 14, top));
        }
      }
    }

    // Always clamp left & top inside viewport margins (14px)
    left = Math.max(14, Math.min(vWidth - pWidth - 14, left));
    top = Math.max(14, Math.min(vHeight - pHeight - 14, top));

    setPositionStyle({
      position: 'absolute',
      left: `${left}px`,
      top: `${top}px`,
      transition: 'left 0.1s ease-out, top 0.1s ease-out',
    });
  }, [selectedItem, panX, panY, zoom, tileSize, viewportRef]);

  if (!selectedItemId || !selectedItem) return null;

  const handleUpgrade = () => {
    const ok = upgradeStructure(selectedItemId);
    if (ok) {
      onToast(`Upgraded ${selectedItem.name} to Level ${selectedItem.level + 1}!`, 'success');
    } else {
      onToast(`Upgrade failed! Max level reached or space blocked.`, 'error');
    }
  };

  const handleDowngrade = () => {
    const ok = downgradeStructure(selectedItemId);
    if (ok) {
      onToast(`Downgraded ${selectedItem.name} to Level ${selectedItem.level - 1}.`, 'info');
    } else {
      onToast(`Level 1 is the minimum habitat level!`, 'warning');
    }
  };

  const handleDelete = () => {
    removeStructure(selectedItemId);
    onToast(`Removed ${selectedItem.name}.`, 'info');
  };

  const handleDuplicate = () => {
    const ok = duplicateStructure(selectedItemId);
    if (ok) {
      onToast(`Duplicated ${selectedItem.name}!`, 'success');
    } else {
      onToast(`Cannot duplicate ${selectedItem.name}! No empty space or limit reached.`, 'error');
    }
  };

  const handleNudge = (dRow: number, dCol: number) => {
    const ok = moveStructure(selectedItem.id, selectedItem.row + dRow, selectedItem.col + dCol);
    if (!ok) {
      onToast(`Cannot move ${selectedItem.name} there (space blocked or out of bounds).`, 'error');
    }
  };

  return (
    <div
      ref={panelRef}
      style={positionStyle}
      onMouseDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      className="selection-panel bg-surface/95 border border-subtle backdrop-blur-md p-3 sm:p-4 rounded-2xl text-xs font-semibold text-text-primary flex flex-col gap-2 shadow-2xl z-20 max-w-full w-[290px]"
    >
      <div className="flex items-center justify-between border-b border-subtle pb-2">
        <span className="font-bold text-gold flex items-center gap-1.5 truncate">
          <span className="truncate">{selectedItem.name}</span>
        </span>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={handleDuplicate}
            className="p-1 text-gold hover:bg-gold/20 rounded-lg transition"
            title="Duplicate Structure"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleDelete}
            className="p-1 text-red-400 hover:bg-red-500/20 rounded-lg transition"
            title="Delete Selected"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setSelectedItemId(null)}
            className="p-1 text-text-muted hover:text-text-primary rounded-lg transition"
            title="Close Panel"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="text-[11px] text-text-muted space-y-1">
        <p>
          • Type:{' '}
          <strong className="text-text-primary">
            {selectedItem.isAncient ? 'Ancient (Platinum)' : selectedItem.kind === 'crystal' ? 'Crystal' : 'Regular (Gold)'}
          </strong>
        </p>
        <p>
          • Position:{' '}
          <strong className="text-text-primary">
            Row {selectedItem.row}, Col {selectedItem.col}
          </strong>
        </p>
        <p>
          • Footprint Size:{' '}
          <strong className="text-gold">
            {selectedItem.size}x{selectedItem.size} ({selectedItem.size * selectedItem.size} tiles)
          </strong>
        </p>

        {selectedItem.kind === 'habitat' && (
          <>
            <p>
              • Capacity Level {selectedItem.level}:{' '}
              <strong className={selectedItem.isAncient ? 'text-purple-400' : 'text-gold'}>
                {(selectedItem.capacities[selectedItem.level - 1] || 0).toLocaleString()}{' '}
                {selectedItem.isAncient ? 'Platinum' : 'Gold'}
              </strong>
            </p>
            <p>
              • Production Boost:{' '}
              <strong className={activeBoostPercent > 0 ? 'text-emerald-400 font-bold' : 'text-text-muted'}>
                +{activeBoostPercent}% Gold Rate
              </strong>
            </p>

            {boostingCrystals.length > 0 && (
              <div className="mt-1 flex flex-wrap gap-1 max-h-20 overflow-y-auto pr-1">
                {boostingCrystals.map((crys) => (
                  <span
                    key={crys.id}
                    className="inline-flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-1.5 py-0.5 rounded text-[10px]"
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: crys.color }} />
                    {crys.name} (+20%)
                  </span>
                ))}
              </div>
            )}
          </>
        )}

        {selectedItem.kind === 'crystal' && (
          <>
            <p>
              • Radius & Bonus:{' '}
              <strong className="text-crystal">{CRYSTAL_CONFIG.radius} Tiles (+{CRYSTAL_CONFIG.goldBoostPercent}% Gold)</strong>
            </p>
            <p>
              • Boosted Habitats:{' '}
              <strong className="text-emerald-400 font-bold">
                {crystalRangeData.matching.length} Matching Element
              </strong>
            </p>

            {/* List matching habitats */}
            {crystalRangeData.matching.length > 0 && (
              <div className="mt-1 flex flex-wrap gap-1 max-h-20 overflow-y-auto pr-1">
                {crystalRangeData.matching.map((hab) => (
                  <span
                    key={hab.id}
                    className="inline-flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-1.5 py-0.5 rounded text-[10px]"
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: hab.color }} />
                    {hab.name} Lv.{hab.level} (+20%)
                  </span>
                ))}
              </div>
            )}

            {/* Wasted coverage indicator */}
            {crystalRangeData.nonMatching.length > 0 && (
              <div className="mt-1.5 p-1.5 bg-amber-500/10 border border-amber-500/30 rounded flex items-center gap-1.5 text-[10px] text-amber-400">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>
                  <strong>{crystalRangeData.nonMatching.length}</strong> non-matching habitat(s) in range (no boost).
                </span>
              </div>
            )}
          </>
        )}
      </div>

      {selectedItem.kind === 'habitat' && (
        <div className="flex items-center justify-between bg-base p-1.5 rounded-xl border border-subtle mt-1">
          <span className="text-[10px] font-bold text-text-muted">Level Control:</span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleDowngrade}
              disabled={selectedItem.level <= 1}
              className="bg-surface hover:bg-elevated text-text-primary disabled:opacity-40 w-6 h-6 rounded-lg font-bold text-xs flex items-center justify-center transition"
            >
              <Minus className="w-3 h-3" />
            </button>
            <span className="px-2 font-black text-gold text-xs">Lv.{selectedItem.level}</span>
            <button
              onClick={handleUpgrade}
              disabled={selectedItem.level >= selectedItem.maxLevel}
              className="bg-gold hover:bg-gold-hover text-slate-950 disabled:opacity-40 w-6 h-6 rounded-lg font-bold text-xs flex items-center justify-center transition"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* Movement Controls & Nudge */}
      <div className="flex flex-col gap-1.5 bg-base p-2 rounded-xl border border-subtle mt-1">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-text-muted flex items-center gap-1">
            <Move className="w-3 h-3 text-gold" /> Move Structure:
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleNudge(0, -1)}
              title="Move Left (or Left Arrow)"
              className="bg-surface hover:bg-elevated text-text-primary px-1.5 py-0.5 rounded-md text-xs font-bold transition active:scale-95 border border-subtle"
            >
              ←
            </button>
            <button
              onClick={() => handleNudge(-1, 0)}
              title="Move Up (or Up Arrow)"
              className="bg-surface hover:bg-elevated text-text-primary px-1.5 py-0.5 rounded-md text-xs font-bold transition active:scale-95 border border-subtle"
            >
              ↑
            </button>
            <button
              onClick={() => handleNudge(1, 0)}
              title="Move Down (or Down Arrow)"
              className="bg-surface hover:bg-elevated text-text-primary px-1.5 py-0.5 rounded-md text-xs font-bold transition active:scale-95 border border-subtle"
            >
              ↓
            </button>
            <button
              onClick={() => handleNudge(0, 1)}
              title="Move Right (or Right Arrow)"
              className="bg-surface hover:bg-elevated text-text-primary px-1.5 py-0.5 rounded-md text-xs font-bold transition active:scale-95 border border-subtle"
            >
              →
            </button>
          </div>
        </div>
        <p className="text-[10px] text-text-muted leading-tight">
          💡 Drag on canvas, click an empty tile, or use Arrow Keys to relocate.
        </p>
      </div>
    </div>
  );
};
