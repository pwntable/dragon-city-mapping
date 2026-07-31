import React from 'react';
import { Trash2, Plus, Minus, X } from 'lucide-react';
import { CRYSTAL_CONFIG } from '../../constants/habitats';
import { useOptimizerStore } from '../../store/useOptimizerStore';

interface SelectionPanelProps {
  onToast: (msg: string, type: 'info' | 'success' | 'warning' | 'error') => void;
}

export const SelectionPanel: React.FC<SelectionPanelProps> = ({ onToast }) => {
  const activeIsland = useOptimizerStore((state) => state.activeIsland);
  const selectedItemId = useOptimizerStore((state) => state.selectedItemId);
  const islands = useOptimizerStore((state) => state.islands);

  const removeStructure = useOptimizerStore((state) => state.removeStructure);
  const upgradeStructure = useOptimizerStore((state) => state.upgradeStructure);
  const downgradeStructure = useOptimizerStore((state) => state.downgradeStructure);
  const setSelectedItemId = useOptimizerStore((state) => state.setSelectedItemId);

  if (!selectedItemId) return null;

  const currentStructures = islands[activeIsland] || [];
  const selectedItem = currentStructures.find((s) => s.id === selectedItemId);

  if (!selectedItem) return null;

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

  return (
    <div className="absolute top-3 left-3 right-3 sm:right-auto bg-surface/95 border border-subtle backdrop-blur-md p-3 sm:p-4 rounded-2xl text-xs font-semibold text-text-primary flex flex-col gap-2 shadow-2xl z-20 max-w-full sm:min-w-[260px]">
      <div className="flex items-center justify-between border-b border-subtle pb-2">
        <span className="font-bold text-gold flex items-center gap-1.5 truncate">
          <span className="truncate">{selectedItem.name}</span>
        </span>
        <div className="flex items-center gap-1 shrink-0">
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
              <strong className={selectedItem.boostPercent && selectedItem.boostPercent > 0 ? 'text-emerald-400 font-bold' : 'text-text-muted'}>
                +{selectedItem.boostPercent || 0}% Gold Rate
              </strong>
            </p>
          </>
        )}

        {selectedItem.kind === 'crystal' && (
          <>
            <p>
              • Coverage Radius:{' '}
              <strong className="text-crystal">{CRYSTAL_CONFIG.radius} Tiles (~11x11 footprint)</strong>
            </p>
            <p>
              • Bonus Effect:{' '}
              <strong className="text-emerald-400">+{CRYSTAL_CONFIG.goldBoostPercent}% Gold Rate Per Crystal</strong>
            </p>
            <p>
              • Boosted Habitats:{' '}
              <strong className="text-gold">{(selectedItem.affectedHabitatIds || []).length} Habitats</strong>
            </p>
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
    </div>
  );
};
