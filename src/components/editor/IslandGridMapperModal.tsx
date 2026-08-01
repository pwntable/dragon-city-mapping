import React, { useState, useEffect } from 'react';

import { IslandDataset } from '../../types/islandSchema';
import { validateIslandDataset } from '../../utils/islandValidator';
import { IslandRepository } from '../../services/islandRepository';
import { useOptimizerStore } from '../../store/useOptimizerStore';
import { IslandId } from '../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onApplyDataset?: (dataset: IslandDataset) => void;
}

type BrushMode = 'buildable' | 'blocked' | 'water' | 'cliff' | 'spawn' | 'camera' | 'marker';

export const IslandGridMapperModal: React.FC<Props> = ({ isOpen, onClose, onApplyDataset }) => {
  const islands = IslandRepository.getAllIslands();
  const [selectedIslandId, setSelectedIslandId] = useState<number>(islands[0]?.id || 1);
  const [dataset, setDataset] = useState<IslandDataset | null>(null);

  const storeIslands = useOptimizerStore((state) => state.islands);

  const [brushMode, setBrushMode] = useState<BrushMode>('buildable');
  const [brushSize, setBrushSize] = useState<number>(1);
  const [isMouseDown, setIsMouseDown] = useState<boolean>(false);
  const [showCoordinates, setShowCoordinates] = useState<boolean>(false);
  const [markers, setMarkers] = useState<Record<string, boolean>>({});
  const [copiedNotification, setCopiedNotification] = useState<boolean>(false);

  const getIslandKey = (nameOrSlug: string, id: number): IslandId => {
    const map: Record<number, IslandId> = {
      1: 'lava', 2: 'main', 3: 'lush', 4: 'ivory', 5: 'desert',
      6: 'skull', 7: 'rainbow', 8: 'ice', 9: 'gothic', 10: 'rune',
      11: 'futuristic', 12: 'moon', 13: 'tempest', 14: 'jurassic', 15: 'chronos'
    };
    if (map[id]) return map[id];
    const cleaned = nameOrSlug.toLowerCase().replace('-island', '').replace(' island', '').trim();
    return cleaned as IslandId;
  };

  useEffect(() => {
    const current = IslandRepository.getIslandById(selectedIslandId);
    if (current) {
      // Clone deeply
      setDataset(JSON.parse(JSON.stringify(current)));
      setMarkers({});
    }
  }, [selectedIslandId]);

  if (!isOpen || !dataset) return null;

  const validation = validateIslandDataset(dataset);

  const handleTileAction = (r: number, c: number) => {
    if (!dataset) return;
    const newDataset = { ...dataset };
    const gridWidth = newDataset.gridWidth;
    const gridHeight = newDataset.gridHeight;

    const applyToCell = (row: number, col: number) => {
      if (row < 0 || row >= gridHeight || col < 0 || col >= gridWidth) return;

      if (brushMode === 'buildable') {
        newDataset.mask[row][col] = 1;
        newDataset.waterMask[row][col] = 0;
        newDataset.cliffMask[row][col] = 0;
        newDataset.collisionMask[row][col] = 0;
      } else if (brushMode === 'blocked') {
        newDataset.mask[row][col] = 0;
        newDataset.collisionMask[row][col] = 2;
      } else if (brushMode === 'water') {
        newDataset.mask[row][col] = 0;
        newDataset.waterMask[row][col] = 1;
        newDataset.collisionMask[row][col] = 2;
      } else if (brushMode === 'cliff') {
        newDataset.mask[row][col] = 0;
        newDataset.cliffMask[row][col] = 1;
        newDataset.collisionMask[row][col] = 2;
      } else if (brushMode === 'spawn') {
        const w = 6;
        const h = 6;
        const spawnX = Math.min(col, gridWidth - w);
        const spawnY = Math.min(row, gridHeight - h);
        newDataset.spawnArea = { x: spawnX, y: spawnY, width: w, height: h };
        // Ensure spawn area is buildable
        for (let sr = spawnY; sr < spawnY + h; sr++) {
          for (let sc = spawnX; sc < spawnX + w; sc++) {
            newDataset.mask[sr][sc] = 1;
            newDataset.waterMask[sr][sc] = 0;
            newDataset.cliffMask[sr][sc] = 0;
            newDataset.collisionMask[sr][sc] = 0;
          }
        }
      } else if (brushMode === 'camera') {
        newDataset.camera.center = { x: col, y: row };
      } else if (brushMode === 'marker') {
        const key = `${row},${col}`;
        setMarkers((prev) => ({ ...prev, [key]: !prev[key] }));
      }
    };

    // Apply brush size
    for (let dr = 0; dr < brushSize; dr++) {
      for (let dc = 0; dc < brushSize; dc++) {
        applyToCell(r + dr, c + dc);
      }
    }

    // Recalculate buildable and blocked tile counts
    let buildable = 0;
    let blocked = 0;
    for (let row = 0; row < gridHeight; row++) {
      for (let col = 0; col < gridWidth; col++) {        if (newDataset.mask[row][col] === 1) buildable++;
        else blocked++;
      }
    }
    newDataset.buildableTiles = buildable;
    newDataset.blockedTiles = blocked;

    setDataset({ ...newDataset });
  };

  const handleFillAll = (val: number) => {
    if (!dataset) return;
    const newDataset = { ...dataset };
    const gridWidth = newDataset.gridWidth;
    const gridHeight = newDataset.gridHeight;

    for (let r = 0; r < gridHeight; r++) {
      for (let c = 0; c < gridWidth; c++) {        newDataset.mask[r][c] = val;
        if (val === 1) {
          newDataset.waterMask[r][c] = 0;
          newDataset.cliffMask[r][c] = 0;
          newDataset.collisionMask[r][c] = 0;
        } else {
          newDataset.collisionMask[r][c] = 2;
        }
      }
    }
    newDataset.buildableTiles = val === 1 ? gridWidth * gridHeight : 0;
    newDataset.blockedTiles = val === 0 ? gridWidth * gridHeight : 0;
    setDataset({ ...newDataset });
  };

  const handleCompressToPlacedBuildings = () => {
    if (!dataset) return;
    const islandKey = getIslandKey(dataset.name, dataset.id);
    const placedStructures = storeIslands[islandKey] || [];

    if (placedStructures.length === 0) return;

    // 1. Find the tight bounding box that covers ALL structure footprints tile-by-tile
    let minRow = Infinity, maxRow = -Infinity;
    let minCol = Infinity, maxCol = -Infinity;

    for (const s of placedStructures) {
      // s.row/col is the top-left corner, s.size is the footprint side length
      minRow = Math.min(minRow, s.row);
      maxRow = Math.max(maxRow, s.row + s.size - 1); // inclusive last row
      minCol = Math.min(minCol, s.col);
      maxCol = Math.max(maxCol, s.col + s.size - 1); // inclusive last col
    }

    // 2. Compressed grid dimensions = exact bounding box
    const newGridHeight = maxRow - minRow + 1;
    const newGridWidth  = maxCol - minCol + 1;

    // 3. Build the new mask: 1 on every tile directly under a building footprint,
    //    0 everywhere else within the bounding box.
    const newMask: number[][] = Array.from({ length: newGridHeight }, () =>
      Array(newGridWidth).fill(0)
    );

    for (const s of placedStructures) {
      for (let r = s.row; r < s.row + s.size; r++) {
        for (let c = s.col; c < s.col + s.size; c++) {
          const localR = r - minRow;
          const localC = c - minCol;
          if (localR >= 0 && localR < newGridHeight && localC >= 0 && localC < newGridWidth) {
            newMask[localR][localC] = 1;
          }
        }
      }
    }

    const buildableCount = newMask.flat().filter((v) => v === 1).length;
    const totalCount = newGridHeight * newGridWidth;

    // 4. Translate spawnArea & camera to new local coordinate space
    const newSpawnX = Math.max(0, Math.min(dataset.spawnArea.x - minCol, newGridWidth - dataset.spawnArea.width));
    const newSpawnY = Math.max(0, Math.min(dataset.spawnArea.y - minRow, newGridHeight - dataset.spawnArea.height));
    const newCamX   = Math.max(0, Math.min(dataset.camera.center.x - minCol, newGridWidth - 1));
    const newCamY   = Math.max(0, Math.min(dataset.camera.center.y - minRow, newGridHeight - 1));

    // 5. Produce new dataset with cropped dimensions & regenerated masks
    const newDataset: IslandDataset = {
      ...dataset,
      gridWidth:     newGridWidth,
      gridHeight:    newGridHeight,
      totalTiles:    totalCount,
      buildableTiles: buildableCount,
      blockedTiles:  totalCount - buildableCount,
      mask:          newMask,
      expansionMask: Array.from({ length: newGridHeight }, () => Array(newGridWidth).fill(0)),
      waterMask:     Array.from({ length: newGridHeight }, () => Array(newGridWidth).fill(0)),
      cliffMask:     Array.from({ length: newGridHeight }, () => Array(newGridWidth).fill(0)),
      collisionMask: newMask.map((row) => row.map((cell) => (cell === 1 ? 0 : 2))),
      spawnArea: {
        x:      newSpawnX,
        y:      newSpawnY,
        width:  Math.min(dataset.spawnArea.width,  newGridWidth),
        height: Math.min(dataset.spawnArea.height, newGridHeight),
      },
      camera: {
        ...dataset.camera,
        center: { x: newCamX, y: newCamY },
      },
    };

    setDataset(newDataset);
  };

  const handleCopyJSON = () => {
    if (!dataset) return;
    const jsonString = JSON.stringify(dataset, null, 2).replace(/\r\n/g, '\n') + '\n';
    navigator.clipboard.writeText(jsonString);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2500);
  };

  const handleDownloadJSON = () => {
    if (!dataset) return;
    const jsonString = JSON.stringify(dataset, null, 2).replace(/\r\n/g, '\n') + '\n';
    const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });
    const slug = dataset.name.toLowerCase().replace(/\s+/g, '-') + '.json';
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = slug;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-6xl flex flex-col max-h-[92vh] overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold">
              🗺️
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Visual Island Grid Mapper</h2>
              <p className="text-xs text-slate-400">Map & design exact pixel-perfect buildable grids for Dragon City islands</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition"
            >
              ✕ Close
            </button>
          </div>
        </div>

        {/* Toolbar & Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-3 border-b border-slate-800 bg-slate-950/60 text-xs">
          {/* Select Island */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-medium">Island:</span>
            <select
              value={selectedIslandId}
              onChange={(e) => setSelectedIslandId(Number(e.target.value))}
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {islands.map((isl) => (
                <option key={isl.id} value={isl.id}>
                  #{isl.order} - {isl.name} {isl.premium ? '★ (Premium)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Brush Selector */}
          <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setBrushMode('buildable')}
              className={`px-3 py-1.5 rounded-md font-medium transition flex items-center gap-1.5 ${
                brushMode === 'buildable' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
              Buildable (1)
            </button>
            <button
              onClick={() => setBrushMode('blocked')}
              className={`px-3 py-1.5 rounded-md font-medium transition flex items-center gap-1.5 ${
                brushMode === 'blocked' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-slate-500"></span>
              Blocked (0)
            </button>
            <button
              onClick={() => setBrushMode('water')}
              className={`px-3 py-1.5 rounded-md font-medium transition flex items-center gap-1.5 ${
                brushMode === 'water' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-blue-400"></span>
              Water
            </button>
            <button
              onClick={() => setBrushMode('cliff')}
              className={`px-3 py-1.5 rounded-md font-medium transition flex items-center gap-1.5 ${
                brushMode === 'cliff' ? 'bg-amber-700 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              Cliff
            </button>
            <button
              onClick={() => setBrushMode('spawn')}
              className={`px-3 py-1.5 rounded-md font-medium transition flex items-center gap-1.5 ${
                brushMode === 'spawn' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              🚩 Spawn 6x6
            </button>
            <button
              onClick={() => setBrushMode('marker')}
              className={`px-3 py-1.5 rounded-md font-medium transition flex items-center gap-1.5 ${
                brushMode === 'marker' ? 'bg-amber-500 text-slate-950 font-bold shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              📍 1x1 Marker
            </button>
          </div>

          {/* Brush Size */}
          <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-lg border border-slate-800">
            <span className="text-slate-400 px-1 font-medium">Size:</span>
            {[1, 2, 3, 4].map((size) => (
              <button
                key={size}
                onClick={() => setBrushSize(size)}
                className={`w-7 h-7 rounded font-bold transition ${
                  brushSize === size ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:bg-slate-800'
                }`}
              >
                {size}x
              </button>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleCompressToPlacedBuildings}
              className="px-2.5 py-1 rounded bg-indigo-950 hover:bg-indigo-900 border border-indigo-700/60 text-indigo-300 hover:text-white text-xs font-semibold transition flex items-center gap-1"
              title="Compress buildable grid mask strictly to placed habitats & crystals on this island"
            >
              🧩 Fit to Placed ({storeIslands[getIslandKey(dataset.name, dataset.id)]?.length || 0})
            </button>
            <button
              onClick={() => handleFillAll(1)}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-emerald-950/60 border border-slate-700 text-slate-300 hover:text-emerald-400 text-xs transition"
            >
              Fill All
            </button>
            <button
              onClick={() => handleFillAll(0)}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-rose-950/60 border border-slate-700 text-slate-300 hover:text-rose-400 text-xs transition"
            >
              Clear All
            </button>
            <button
              onClick={() => setShowCoordinates(!showCoordinates)}
              className={`px-2.5 py-1 rounded border text-xs transition ${
                showCoordinates ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300' : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}
            >
              # Labels
            </button>
          </div>
        </div>

        {/* Live Grid Canvas Container */}
        <div className="flex-1 overflow-auto p-4 bg-slate-950 flex justify-center items-center relative">
          <div
            className="inline-grid select-none border border-slate-800 bg-slate-900 rounded shadow-inner"
            style={{
              gridTemplateColumns: `repeat(${dataset.gridWidth}, minmax(10px, 14px))`,
            }}
            onMouseDown={() => setIsMouseDown(true)}
            onMouseUp={() => setIsMouseDown(false)}
            onMouseLeave={() => setIsMouseDown(false)}
          >
            {dataset.mask.map((row, r) =>
              row.map((cell, c) => {
                const isWater = dataset.waterMask[r][c] === 1;
                const isCliff = dataset.cliffMask[r][c] === 1;
                const isSpawn =
                  r >= dataset.spawnArea.y &&
                  r < dataset.spawnArea.y + dataset.spawnArea.height &&
                  c >= dataset.spawnArea.x &&
                  c < dataset.spawnArea.x + dataset.spawnArea.width;
                const isCamera = dataset.camera.center.x === c && dataset.camera.center.y === r;
                const isMarker = markers[`${r},${c}`];

                let bgClass = 'bg-slate-900 border-slate-850 hover:bg-slate-750';
                if (isSpawn) bgClass = 'bg-purple-600/80 border-purple-400';
                else if (isCamera) bgClass = 'bg-rose-500 border-rose-300';
                else if (isMarker) bgClass = 'bg-amber-400 border-amber-300 shadow';
                else if (isWater) bgClass = 'bg-blue-900/80 border-blue-800';
                else if (isCliff) bgClass = 'bg-amber-950 border-amber-900';
                else if (cell === 1) bgClass = 'bg-emerald-600/90 border-emerald-500/40 hover:bg-emerald-500';

                return (
                  <div
                    key={`${r}-${c}`}
                    title={`Row ${r}, Col ${c}`}
                    onMouseDown={() => handleTileAction(r, c)}
                    onMouseEnter={() => {
                      if (isMouseDown) handleTileAction(r, c);
                    }}
                    className={`w-3.5 h-3.5 border-[0.5px] border-slate-800/40 cursor-pointer transition-colors duration-75 flex items-center justify-center ${bgClass}`}
                  >
                    {showCoordinates && (r % 5 === 0 || c % 5 === 0) && (
                      <span className="text-[6px] text-white/40 pointer-events-none">{c}</span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer Statistics & Action Buttons */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900 flex flex-wrap items-center justify-between gap-4">
          {/* Tile Math & Status */}
          <div className="flex items-center gap-4 text-xs">
            <div className="bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-1.5 flex items-center gap-2">
              <span className="text-slate-400">Buildable:</span>
              <span className="font-bold text-emerald-400">{dataset.buildableTiles}</span>
            </div>
            <div className="bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-1.5 flex items-center gap-2">
              <span className="text-slate-400">Blocked:</span>
              <span className="font-bold text-slate-400">{dataset.blockedTiles}</span>
            </div>
            <div className="bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-1.5 flex items-center gap-2">
              <span className="text-slate-400">Total:</span>
              <span className="font-bold text-white">{dataset.totalTiles}</span>
            </div>
            <div
              className={`px-3 py-1.5 rounded-lg border font-semibold flex items-center gap-1.5 ${
                validation.valid
                  ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-400'
                  : 'bg-rose-950/80 border-rose-500/50 text-rose-400'
              }`}
            >
              {validation.valid ? '✓ Schema Validated' : '⚠️ Validation Errors'}
            </div>
          </div>

          {/* Export Actions */}
          <div className="flex items-center gap-3">
            {copiedNotification && (
              <span className="text-xs font-semibold text-emerald-400 animate-fade-in flex items-center gap-1">
                ✓ JSON copied to clipboard!
              </span>
            )}
            <button
              onClick={handleCopyJSON}
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-lg transition flex items-center gap-1.5"
            >
              📋 Copy JSON
            </button>
            <button
              onClick={handleDownloadJSON}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-lg transition flex items-center gap-1.5"
            >
              💾 Download {dataset.name.toLowerCase().replace(/\s+/g, '-')}.json
            </button>
            {onApplyDataset && (
              <button
                onClick={() => onApplyDataset(dataset)}
                className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs shadow-lg transition flex items-center gap-1.5"
              >
                ⚡ Apply Live
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
