import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { ISLAND_CONFIGS } from '../constants/islands';
import { ANCIENT_HABITATS, getHabitatFootprintSize, REGULAR_HABITATS } from '../constants/habitats';
import { Action, ElementType, IslandId, LayoutState, PlacementCategory, PlacedStructure, Theme, ToolMode } from '../types';
import { runAutoOptimizer } from '../utils/autoOptimizer';
import { canPlaceStructure, recalculateCrystalCoverage } from '../utils/coverageCalculator';
import { ISLAND_PRESETS } from '../data/presets';

interface OptimizerState {
  islands: Record<IslandId, PlacedStructure[]>;
  grids: Record<IslandId, number[][]>;
  activeIsland: IslandId;
  mode: ToolMode;
  placementCategory: PlacementCategory;
  selectedElementType: ElementType;
  selectedItemId: string | null;
  theme: Theme;
  history: Action[][];
  future: Action[][];

  // Actions
  setActiveIsland: (id: IslandId) => void;
  setMode: (mode: ToolMode) => void;
  setPlacementCategory: (cat: PlacementCategory) => void;
  setSelectedElementType: (type: ElementType) => void;
  setSelectedItemId: (id: string | null) => void;
  setTheme: (theme: Theme) => void;

  placeStructure: (row: number, col: number) => boolean;
  removeStructure: (id: string) => void;
  upgradeStructure: (id: string) => boolean;
  downgradeStructure: (id: string) => boolean;
  moveStructure: (id: string, targetRow: number, targetCol: number) => boolean;
  moveAllStructures: (deltaRow: number, deltaCol: number, islandId?: IslandId) => { success: boolean; reason?: string; count?: number };
  duplicateStructure: (id: string) => boolean;
  toggleGridTile: (row: number, col: number) => void;
  setGridTileValue: (row: number, col: number, value: number, recordHistory?: boolean) => Action | null;
  resizeIslandGrid: (islandId: IslandId | undefined, newCols: number, newRows: number) => void;
  commitBatch: (actions: Action[]) => void;
  compressGridToPlacedBuildings: (islandId?: IslandId) => { success: boolean; count: number; tiles: number };
  resetIslandGridToTemplate: (islandId?: IslandId) => void;
  clearActiveIsland: () => void;
  optimizeActiveIsland: () => void;
  optimizeAllIslands: () => void;
  importLayout: (state: LayoutState) => void;
  loadIslandPreset: (islandId?: IslandId) => { success: boolean; count: number };
  getLayoutSnapshot: () => LayoutState;

  undo: () => void;
  redo: () => void;
}

const initialIslands: Record<IslandId, PlacedStructure[]> = {
  lava: [],
  main: [],
  lush: [],
  ivory: [],
  desert: [],
  skull: [],
  rainbow: [],
  ice: [],
  gothic: [],
  rune: [],
  futuristic: [],
  moon: [],
  tempest: [],
  jurassic: [],
  chronos: [],
};

const initialGrids: Record<IslandId, number[][]> = {
  lava: JSON.parse(JSON.stringify(ISLAND_CONFIGS.lava.gridTemplate)),
  main: JSON.parse(JSON.stringify(ISLAND_CONFIGS.main.gridTemplate)),
  lush: JSON.parse(JSON.stringify(ISLAND_CONFIGS.lush.gridTemplate)),
  ivory: JSON.parse(JSON.stringify(ISLAND_CONFIGS.ivory.gridTemplate)),
  desert: JSON.parse(JSON.stringify(ISLAND_CONFIGS.desert.gridTemplate)),
  skull: JSON.parse(JSON.stringify(ISLAND_CONFIGS.skull.gridTemplate)),
  rainbow: JSON.parse(JSON.stringify(ISLAND_CONFIGS.rainbow.gridTemplate)),
  ice: JSON.parse(JSON.stringify(ISLAND_CONFIGS.ice.gridTemplate)),
  gothic: JSON.parse(JSON.stringify(ISLAND_CONFIGS.gothic.gridTemplate)),
  rune: JSON.parse(JSON.stringify(ISLAND_CONFIGS.rune.gridTemplate)),
  futuristic: JSON.parse(JSON.stringify(ISLAND_CONFIGS.futuristic.gridTemplate)),
  moon: JSON.parse(JSON.stringify(ISLAND_CONFIGS.moon.gridTemplate)),
  tempest: JSON.parse(JSON.stringify(ISLAND_CONFIGS.tempest.gridTemplate)),
  jurassic: JSON.parse(JSON.stringify(ISLAND_CONFIGS.jurassic.gridTemplate)),
  chronos: JSON.parse(JSON.stringify(ISLAND_CONFIGS.chronos.gridTemplate)),
};

export const useOptimizerStore = create<OptimizerState>()(
  persist(
    immer((set, get) => ({
      islands: initialIslands,
      grids: initialGrids,
      activeIsland: 'lava',
      mode: 'place',
      placementCategory: 'regular',
      selectedElementType: 'terra',
      selectedItemId: null,
      theme: 'dark',
      history: [],
      future: [],

      setActiveIsland: (id) =>
        set((state) => {
          state.activeIsland = id;
          if (!state.islands[id]) state.islands[id] = [];
          if (!state.grids[id] && ISLAND_CONFIGS[id]) {
            state.grids[id] = JSON.parse(JSON.stringify(ISLAND_CONFIGS[id].gridTemplate));
          }
          state.selectedItemId = null;
        }),

      setMode: (mode) =>
        set((state) => {
          state.mode = mode;
        }),

      setPlacementCategory: (cat) =>
        set((state) => {
          state.placementCategory = cat;
          if (cat === 'regular') state.selectedElementType = 'terra';
          if (cat === 'ancient') state.selectedElementType = 'beauty';
          if (cat === 'crystal') state.selectedElementType = 'terra';
        }),

      setSelectedElementType: (type) =>
        set((state) => {
          state.selectedElementType = type;
        }),

      setSelectedItemId: (id) =>
        set((state) => {
          state.selectedItemId = id;
        }),

      setTheme: (theme) =>
        set((state) => {
          state.theme = theme;
        }),

      placeStructure: (row, col) => {
        const { activeIsland, placementCategory, selectedElementType, islands, grids } = get();
        const currentData = islands[activeIsland] || [];
        const currentGrid = grids[activeIsland] || ISLAND_CONFIGS[activeIsland]?.gridTemplate || [];

        let size = 4;
        let kind: 'habitat' | 'crystal' = 'habitat';
        let isAncient = false;

        if (placementCategory === 'crystal') {
          size = 2;
          kind = 'crystal';
        } else if (placementCategory === 'ancient') {
          size = 6;
          isAncient = true;
        } else {
          size = 4;
        }

        // Rule Check: Ancient Habitats are strictly unique across all islands
        if (isAncient) {
          let exists = false;
          Object.values(islands || {}).forEach(isl => {
            if ((isl || []).some(s => s.type === selectedElementType && s.isAncient)) {
              exists = true;
            }
          });
          if (exists) return false;
        }

        // Rule Check: Max 4 crystals per element per island
        if (kind === 'crystal') {
          const crystalCount = currentData.filter(c => c.kind === 'crystal' && c.type === selectedElementType).length;
          if (crystalCount >= 4) return false;
        }

        // Rule Check: Max habitats limit per island
        if (kind === 'habitat') {
          const habitatCount = currentData.filter(s => s.kind === 'habitat').length;
          const maxLimit = ISLAND_CONFIGS[activeIsland]?.maxHabitats || 24;
          if (habitatCount >= maxLimit) return false;
        }

        if (!canPlaceStructure(row, col, size, currentGrid, currentData)) {
          return false;
        }

        let elementDef = REGULAR_HABITATS.find(e => e.id === selectedElementType);
        if (isAncient) {
          elementDef = ANCIENT_HABITATS.find(e => e.id === selectedElementType);
        }

        if (!elementDef && kind === 'habitat') return false;

        const newStructure: PlacedStructure = {
          id: `${kind}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          type: selectedElementType,
          kind: kind,
          name: kind === 'crystal' ? `${elementDef?.name || selectedElementType} Crystal` : elementDef!.name,
          color: elementDef?.color || '#38bdf8',
          borderColor: elementDef?.borderColor || '#0284c7',
          icon: elementDef?.icon,
          isAncient: isAncient,
          level: 1,
          maxLevel: isAncient ? 2 : (kind === 'crystal' ? 1 : 7),
          capacities: elementDef?.capacities || [0],
          row: row,
          col: col,
          size: size,
        };

        const action: Action = { type: 'PLACE', island: activeIsland, structure: newStructure };

        set((state) => {
          if (!state.islands[activeIsland]) state.islands[activeIsland] = [];
          if (!state.grids[activeIsland] && ISLAND_CONFIGS[activeIsland]) {
            state.grids[activeIsland] = JSON.parse(JSON.stringify(ISLAND_CONFIGS[activeIsland].gridTemplate));
          }
          state.islands[activeIsland].push(newStructure);
          state.islands[activeIsland] = recalculateCrystalCoverage(state.islands[activeIsland]);
          state.selectedItemId = newStructure.id;
          state.history.push([action]);
          state.future = [];
        });

        return true;
      },

      removeStructure: (id) => {
        const { activeIsland, islands } = get();
        const currentData = islands[activeIsland] || [];
        const target = currentData.find(s => s.id === id);
        if (!target) return;

        const action: Action = { type: 'REMOVE', island: activeIsland, structure: target };

        set((state) => {
          if (!state.islands[activeIsland]) state.islands[activeIsland] = [];
          state.islands[activeIsland] = state.islands[activeIsland].filter(s => s.id !== id);
          state.islands[activeIsland] = recalculateCrystalCoverage(state.islands[activeIsland]);
          if (state.selectedItemId === id) state.selectedItemId = null;
          state.history.push([action]);
          state.future = [];
        });
      },

      upgradeStructure: (id) => {
        const { activeIsland, islands, grids } = get();
        const currentData = islands[activeIsland] || [];
        const target = currentData.find(s => s.id === id);
        if (!target || target.kind !== 'habitat' || target.level >= target.maxLevel) return false;

        const nextLevel = target.level + 1;
        const nextSize = getHabitatFootprintSize(target.isAncient, nextLevel);
        const currentGrid = grids[activeIsland] || ISLAND_CONFIGS[activeIsland]?.gridTemplate || [];

        if (nextSize > target.size) {
          if (!canPlaceStructure(target.row, target.col, nextSize, currentGrid, currentData, id)) {
            return false;
          }
        }

        const action: Action = {
          type: 'UPGRADE',
          island: activeIsland,
          id: id,
          fromLevel: target.level,
          toLevel: nextLevel,
          fromSize: target.size,
          toSize: nextSize,
        };

        set((state) => {
          if (!state.islands[activeIsland]) state.islands[activeIsland] = [];
          const item = state.islands[activeIsland].find(s => s.id === id);
          if (item) {
            item.level = nextLevel;
            item.size = nextSize;
            state.islands[activeIsland] = recalculateCrystalCoverage(state.islands[activeIsland]);
            state.history.push([action]);
            state.future = [];
          }
        });

        return true;
      },

      downgradeStructure: (id) => {
        const { activeIsland, islands } = get();
        const currentData = islands[activeIsland] || [];
        const target = currentData.find(s => s.id === id);
        if (!target || target.kind !== 'habitat' || target.level <= 1) return false;

        const prevLevel = target.level - 1;
        const prevSize = getHabitatFootprintSize(target.isAncient, prevLevel);

        const action: Action = {
          type: 'DOWNGRADE',
          island: activeIsland,
          id: id,
          fromLevel: target.level,
          toLevel: prevLevel,
          fromSize: target.size,
          toSize: prevSize,
        };

        set((state) => {
          if (!state.islands[activeIsland]) state.islands[activeIsland] = [];
          const item = state.islands[activeIsland].find(s => s.id === id);
          if (item) {
            item.level = prevLevel;
            item.size = prevSize;
            state.islands[activeIsland] = recalculateCrystalCoverage(state.islands[activeIsland]);
            state.history.push([action]);
            state.future = [];
          }
        });

        return true;
      },

      moveStructure: (id, targetRow, targetCol) => {
        const { activeIsland, islands, grids } = get();
        const currentData = islands[activeIsland] || [];
        const target = currentData.find(s => s.id === id);
        if (!target) return false;

        if (target.row === targetRow && target.col === targetCol) return true;

        const currentGrid = grids[activeIsland] || ISLAND_CONFIGS[activeIsland]?.gridTemplate || [];

        if (!canPlaceStructure(targetRow, targetCol, target.size, currentGrid, currentData, id)) {
          return false;
        }

        const action: Action = {
          type: 'MOVE',
          island: activeIsland,
          id: id,
          fromRow: target.row,
          fromCol: target.col,
          toRow: targetRow,
          toCol: targetCol,
        };

        set((state) => {
          if (!state.islands[activeIsland]) state.islands[activeIsland] = [];
          const item = state.islands[activeIsland].find(s => s.id === id);
          if (item) {
            item.row = targetRow;
            item.col = targetCol;
            state.islands[activeIsland] = recalculateCrystalCoverage(state.islands[activeIsland]);
            state.history.push([action]);
            state.future = [];
          }
        });

        return true;
      },

      moveAllStructures: (deltaRow, deltaCol, islandId) => {
        const targetIsland = islandId || get().activeIsland;
        const { islands, grids } = get();
        const structures = islands[targetIsland] || [];
        if (!structures || structures.length === 0) {
          return { success: false, reason: 'Tiada bangunan diletakkan pada pulau ini' };
        }

        const currentGrid = grids[targetIsland] || ISLAND_CONFIGS[targetIsland]?.gridTemplate || [];
        const rows = currentGrid.length || ISLAND_CONFIGS[targetIsland]?.rows || 60;
        const cols = currentGrid[0]?.length || ISLAND_CONFIGS[targetIsland]?.cols || 60;

        // Check if ALL structures fit within buildable tiles after the shift
        for (const s of structures) {
          const newR = s.row + deltaRow;
          const newC = s.col + deltaCol;
          const size = s.size || (s.kind === 'crystal' ? 2 : (s.isAncient ? 6 : 4));

          for (let r = newR; r < newR + size; r++) {
            for (let c = newC; c < newC + size; c++) {
              if (r < 0 || r >= rows || c < 0 || c >= cols || !currentGrid[r] || currentGrid[r][c] !== 1) {
                return { success: false, reason: 'Terhalang oleh kawasan non-buildable / luar grid' };
              }
            }
          }
        }

        const actions: Action[] = structures.map((s) => ({
          type: 'MOVE',
          island: targetIsland,
          id: s.id,
          fromRow: s.row,
          fromCol: s.col,
          toRow: s.row + deltaRow,
          toCol: s.col + deltaCol,
        }));

        set((state) => {
          if (state.islands[targetIsland]) {
            state.islands[targetIsland].forEach((s) => {
              s.row += deltaRow;
              s.col += deltaCol;
            });
            state.islands[targetIsland] = recalculateCrystalCoverage(state.islands[targetIsland]);
            state.history.push(actions);
            state.future = [];
          }
        });

        return { success: true, count: structures.length };
      },

      duplicateStructure: (id) => {
        const { activeIsland, islands, grids } = get();
        const currentStructures = islands[activeIsland] || [];
        const currentGrid = grids[activeIsland] || ISLAND_CONFIGS[activeIsland]?.gridTemplate || [];

        const target = currentStructures.find(s => s.id === id);
        if (!target) return false;

        // Rule Check: Ancient Habitats are strictly unique across all islands
        if (target.isAncient) {
          let exists = false;
          Object.values(islands || {}).forEach(isl => {
            if ((isl || []).some(s => s.type === target.type && s.isAncient)) {
              exists = true;
            }
          });
          if (exists) return false;
        }

        // Rule Check: Max 4 crystals per element per island
        if (target.kind === 'crystal') {
          const crystalCount = currentStructures.filter(c => c.kind === 'crystal' && c.type === target.type).length;
          if (crystalCount >= 4) return false;
        }

        // Rule Check: Max habitats limit per island
        if (target.kind === 'habitat') {
          const habitatCount = currentStructures.filter(s => s.kind === 'habitat').length;
          const maxLimit = ISLAND_CONFIGS[activeIsland]?.maxHabitats || 24;
          if (habitatCount >= maxLimit) return false;
        }

        // Find nearest buildable location around target structure
        let targetRow = -1;
        let targetCol = -1;
        const rows = currentGrid.length;
        const cols = currentGrid[0]?.length || 0;

        const offsets = [
          { r: 0, c: target.size },
          { r: target.size, c: 0 },
          { r: 0, c: -target.size },
          { r: -target.size, c: 0 },
          { r: target.size, c: target.size },
          { r: -target.size, c: -target.size },
        ];

        for (const off of offsets) {
          const nr = target.row + off.r;
          const nc = target.col + off.c;
          if (canPlaceStructure(nr, nc, target.size, currentGrid, currentStructures)) {
            targetRow = nr;
            targetCol = nc;
            break;
          }
        }

        // Fallback grid scan if offsets fail
        if (targetRow === -1) {
          for (let r = 0; r <= rows - target.size; r++) {
            for (let c = 0; c <= cols - target.size; c++) {
              if (canPlaceStructure(r, c, target.size, currentGrid, currentStructures)) {
                targetRow = r;
                targetCol = c;
                break;
              }
            }
            if (targetRow !== -1) break;
          }
        }

        if (targetRow === -1 || targetCol === -1) return false;

        const newStructure: PlacedStructure = {
          ...target,
          id: `${target.kind}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          row: targetRow,
          col: targetCol,
          boostPercent: 0,
          boostingCrystalIds: [],
          affectedHabitatIds: [],
        };

        const action: Action = { type: 'PLACE', island: activeIsland, structure: newStructure };

        set((state) => {
          if (!state.islands[activeIsland]) state.islands[activeIsland] = [];
          state.islands[activeIsland].push(newStructure);
          state.islands[activeIsland] = recalculateCrystalCoverage(state.islands[activeIsland]);
          state.selectedItemId = newStructure.id;
          state.history.push([action]);
          state.future = [];
        });

        return true;
      },

      toggleGridTile: (row, col) => {
        const { activeIsland, grids } = get();
        const grid = grids[activeIsland] || ISLAND_CONFIGS[activeIsland]?.gridTemplate;
        if (!grid || !grid[row]) return;
        const currentVal = grid[row][col];
        get().setGridTileValue(row, col, currentVal === 1 ? 0 : 1);
      },

      setGridTileValue: (row, col, value, recordHistory = true) => {
        const { activeIsland, grids } = get();
        const grid = grids[activeIsland] || ISLAND_CONFIGS[activeIsland]?.gridTemplate;
        if (!grid || !grid[row]) return null;

        const fromVal = grid[row][col];
        if (fromVal === value) return null;

        let removedStructures: PlacedStructure[] = [];

        set((state) => {
          if (!state.grids[activeIsland]) state.grids[activeIsland] = JSON.parse(JSON.stringify(grid));
          if (!state.islands[activeIsland]) state.islands[activeIsland] = [];

          state.grids[activeIsland][row][col] = value;
          const updatedGrid = state.grids[activeIsland];

          // Filter out structures that are no longer buildable
          const valid = state.islands[activeIsland].filter(s =>
            canPlaceStructure(s.row, s.col, s.size, updatedGrid, state.islands[activeIsland], s.id)
          );

          const rawRemoved = state.islands[activeIsland].filter(s => !valid.some(v => v.id === s.id));
          // CRITICAL: Clone rawRemoved so they are plain JS objects and NOT revoked Immer draft proxies!
          removedStructures = JSON.parse(JSON.stringify(rawRemoved));
          state.islands[activeIsland] = recalculateCrystalCoverage(valid);
        });

        const action: Action = {
          type: 'GRID_TILE',
          island: activeIsland,
          row,
          col,
          fromVal,
          toVal: value,
          removedStructures: removedStructures.length > 0 ? removedStructures : undefined,
        };

        if (recordHistory) {
          const clonedAction = JSON.parse(JSON.stringify(action));
          set((state) => {
            state.history.push([clonedAction]);
            state.future = [];
          });
        }

        return action;
      },

      compressGridToPlacedBuildings: (islandId?: IslandId) => {
        const targetIsland = islandId || get().activeIsland;
        const { islands, grids } = get();
        const structures = islands[targetIsland] || [];
        const config = ISLAND_CONFIGS[targetIsland];
        const gridTemplate = grids[targetIsland] || config?.gridTemplate || [];

        if (!structures || structures.length === 0) {
          return { success: false, count: 0, tiles: 0 };
        }

        const rows = config?.rows || gridTemplate.length || 60;
        const cols = config?.cols || gridTemplate[0]?.length || 60;

        const newGrid: number[][] = Array.from({ length: rows }, () => Array(cols).fill(0));
        let buildableTiles = 0;

        for (const s of structures) {
          const startRow = Math.floor(s.row);
          const startCol = Math.floor(s.col);
          const structSize = Math.round(s.size || (s.kind === 'crystal' ? 2 : (s.isAncient ? 6 : 4)));

          for (let r = startRow; r < startRow + structSize; r++) {
            for (let c = startCol; c < startCol + structSize; c++) {
              if (r >= 0 && r < rows && c >= 0 && c < cols) {
                if (newGrid[r][c] === 0) {
                  newGrid[r][c] = 1;
                  buildableTiles++;
                }
              }
            }
          }
        }

        const prevGrid = JSON.parse(JSON.stringify(gridTemplate));
        const cleanNewGrid = JSON.parse(JSON.stringify(newGrid));

        const action: Action = {
          type: 'SET_GRID',
          island: targetIsland,
          prevGrid,
          newGrid: cleanNewGrid,
        };

        set((state) => {
          state.grids[targetIsland] = cleanNewGrid;
          state.history.push([action]);
          state.future = [];
        });

        return { success: true, count: structures.length, tiles: buildableTiles };
      },

      resetIslandGridToTemplate: (islandId?: IslandId) => {
        const targetIsland = islandId || get().activeIsland;
        const config = ISLAND_CONFIGS[targetIsland];
        if (!config) return;

        const currentGrid = get().grids[targetIsland] || config.gridTemplate;
        const prevGrid = JSON.parse(JSON.stringify(currentGrid));
        const defaultGrid = JSON.parse(JSON.stringify(config.gridTemplate));

        const action: Action = {
          type: 'SET_GRID',
          island: targetIsland,
          prevGrid,
          newGrid: defaultGrid,
        };

        set((state) => {
          state.grids[targetIsland] = defaultGrid;
          state.history.push([action]);
          state.future = [];
        });
      },

      resizeIslandGrid: (islandId: IslandId | undefined, newCols: number, newRows: number) => {
        const targetIsland = islandId || get().activeIsland;
        const config = ISLAND_CONFIGS[targetIsland];
        if (!config) return;

        const cols = Math.max(10, Math.min(120, Math.round(newCols)));
        const rows = Math.max(10, Math.min(120, Math.round(newRows)));

        const currentGrid = get().grids[targetIsland] || config.gridTemplate || [];
        const prevGrid = JSON.parse(JSON.stringify(currentGrid));

        const newGrid: number[][] = Array.from({ length: rows }, (_, r) =>
          Array.from({ length: cols }, (_, c) => {
            if (currentGrid[r] && currentGrid[r][c] !== undefined) {
              return currentGrid[r][c];
            }
            return 0;
          })
        );

        config.cols = cols;
        config.rows = rows;

        const cleanNewGrid = JSON.parse(JSON.stringify(newGrid));

        const action: Action = {
          type: 'SET_GRID',
          island: targetIsland,
          prevGrid,
          newGrid: cleanNewGrid,
        };

        set((state) => {
          state.grids[targetIsland] = cleanNewGrid;
          state.history.push([action]);
          state.future = [];
        });
      },

      commitBatch: (actions) => {
        if (!actions || actions.length === 0) return;
        // CRITICAL: Deep clone actions array before storing in Immer draft state.history to ensure no proxy leaks!
        const cleanActions = JSON.parse(JSON.stringify(actions));
        set((state) => {
          state.history.push(cleanActions);
          state.future = [];
        });
      },

      clearActiveIsland: () => {
        const { activeIsland, islands } = get();
        const currentStructures = JSON.parse(JSON.stringify(islands[activeIsland] || []));
        if (currentStructures.length === 0) return;

        const action: Action = { type: 'CLEAR', island: activeIsland, structures: currentStructures };

        set((state) => {
          state.islands[activeIsland] = [];
          state.selectedItemId = null;
          state.history.push([action]);
          state.future = [];
        });
      },

      optimizeActiveIsland: () => {
        const { activeIsland, islands, grids } = get();
        const prevStructures = JSON.parse(JSON.stringify(islands[activeIsland] || []));
        const currentGrid = grids[activeIsland] || ISLAND_CONFIGS[activeIsland]?.gridTemplate || [];
        const newStructures = runAutoOptimizer(activeIsland, currentGrid);

        const clearAction: Action = { type: 'CLEAR', island: activeIsland, structures: prevStructures };
        const placeActions: Action[] = newStructures.map(s => ({ type: 'PLACE', island: activeIsland, structure: s }));
        const batchAction: Action = { type: 'BATCH', actions: [clearAction, ...placeActions] };

        set((state) => {
          state.islands[activeIsland] = newStructures;
          state.selectedItemId = null;
          state.history.push([batchAction]);
          state.future = [];
        });
      },

      optimizeAllIslands: () => {
        const { islands, grids } = get();
        const allBatchActions: Action[] = [];

        (Object.keys(ISLAND_CONFIGS) as IslandId[]).forEach((islandId) => {
          const prev = JSON.parse(JSON.stringify(islands[islandId] || []));
          const currentGrid = grids[islandId] || ISLAND_CONFIGS[islandId]?.gridTemplate || [];
          const newStructures = runAutoOptimizer(islandId, currentGrid);

          const clearAction: Action = { type: 'CLEAR', island: islandId, structures: prev };
          const placeActions: Action[] = newStructures.map(s => ({ type: 'PLACE', island: islandId, structure: s }));
          allBatchActions.push(clearAction, ...placeActions);
        });

        set((state) => {
          (Object.keys(ISLAND_CONFIGS) as IslandId[]).forEach((islandId) => {
            const currentGrid = state.grids[islandId] || ISLAND_CONFIGS[islandId]?.gridTemplate || [];
            state.islands[islandId] = runAutoOptimizer(islandId, currentGrid);
          });

          state.selectedItemId = null;
          state.history.push([{ type: 'BATCH', actions: allBatchActions }]);
          state.future = [];
        });
      },

      importLayout: (layoutState) => {
        set((state) => {
          if (layoutState.islands) {
            state.islands = layoutState.islands;
            Object.keys(state.islands).forEach(islKey => {
              state.islands[islKey as IslandId] = recalculateCrystalCoverage(state.islands[islKey as IslandId]);
            });
          }
          if (layoutState.grids) {
            state.grids = layoutState.grids;
          }
          state.selectedItemId = null;
          state.history = [];
          state.future = [];
        });
      },

      loadIslandPreset: (islandId?: IslandId) => {
        const targetIsland = islandId || get().activeIsland;
        const preset = ISLAND_PRESETS[targetIsland];
        if (!preset || !preset.islands?.[targetIsland]) {
          return { success: false, count: 0 };
        }

        const presetStructures: PlacedStructure[] = JSON.parse(
          JSON.stringify(preset.islands[targetIsland])
        );

        // Stamp unique IDs so they don't collide with any existing ones
        presetStructures.forEach((s, i) => {
          s.id = `preset_${targetIsland}_${Date.now()}_${i}`;
        });

        const prevStructures: PlacedStructure[] = JSON.parse(
          JSON.stringify(get().islands[targetIsland] || [])
        );

        const clearAction: Action = { type: 'CLEAR', island: targetIsland, structures: prevStructures };
        const placeActions: Action[] = presetStructures.map(s => ({ type: 'PLACE', island: targetIsland, structure: s }));
        const batchAction: Action = { type: 'BATCH', actions: [clearAction, ...placeActions] };

        set((state) => {
          state.islands[targetIsland] = recalculateCrystalCoverage(presetStructures);
          // Reset grid to island template (presets use the default mask)
          state.grids[targetIsland] = JSON.parse(
            JSON.stringify(ISLAND_CONFIGS[targetIsland]?.gridTemplate || [])
          );
          state.selectedItemId = null;
          state.history.push([batchAction]);
          state.future = [];
        });

        return { success: true, count: presetStructures.length };
      },

      getLayoutSnapshot: () => {
        const { islands, grids } = get();
        return {
          version: 2,
          islands,
          grids,
        };
      },

      undo: () => {
        const { history } = get();
        if (history.length === 0) return;

        set((state) => {
          const lastBatch = state.history.pop();
          if (!lastBatch) return;

          const applyUndoAction = (act: Action) => {
            if (act.type === 'BATCH') {
              // Apply batch in reverse order
              [...act.actions].reverse().forEach(applyUndoAction);
              return;
            }
            if (!state.islands[act.island]) state.islands[act.island] = [];
            if (act.type === 'PLACE') {
              state.islands[act.island] = state.islands[act.island].filter(s => s.id !== act.structure.id);
            } else if (act.type === 'REMOVE') {
              state.islands[act.island].push(JSON.parse(JSON.stringify(act.structure)));
            } else if (act.type === 'UPGRADE' || act.type === 'DOWNGRADE') {
              const item = state.islands[act.island].find(s => s.id === act.id);
              if (item) {
                item.level = act.fromLevel;
                item.size = act.fromSize;
              }
            } else if (act.type === 'MOVE') {
              const item = state.islands[act.island].find(s => s.id === act.id);
              if (item) {
                item.row = act.fromRow;
                item.col = act.fromCol;
              }
            } else if (act.type === 'CLEAR') {
              state.islands[act.island] = JSON.parse(JSON.stringify(act.structures));
            } else if (act.type === 'GRID_TILE') {
              if (state.grids[act.island] && state.grids[act.island][act.row]) {
                state.grids[act.island][act.row][act.col] = act.fromVal;
              }
              if (act.removedStructures && act.removedStructures.length > 0) {
                const cleanStructures: PlacedStructure[] = JSON.parse(JSON.stringify(act.removedStructures));
                cleanStructures.forEach((struct) => {
                  if (!state.islands[act.island].some((s) => s.id === struct.id)) {
                    state.islands[act.island].push(struct);
                  }
                });
                state.islands[act.island] = recalculateCrystalCoverage(state.islands[act.island]);
              }
            } else if (act.type === 'SET_GRID') {
              state.grids[act.island] = JSON.parse(JSON.stringify(act.prevGrid));
            }
          };

          lastBatch.forEach(applyUndoAction);

          // Recalculate coverage across islands
          (Object.keys(state.islands) as IslandId[]).forEach(islKey => {
            state.islands[islKey] = recalculateCrystalCoverage(state.islands[islKey] || []);
          });

          state.future.push(lastBatch);
        });
      },

      redo: () => {
        const { future } = get();
        if (future.length === 0) return;

        set((state) => {
          const nextBatch = state.future.pop();
          if (!nextBatch) return;

          const applyRedoAction = (act: Action) => {
            if (act.type === 'BATCH') {
              act.actions.forEach(applyRedoAction);
              return;
            }
            if (!state.islands[act.island]) state.islands[act.island] = [];
            if (act.type === 'PLACE') {
              state.islands[act.island].push(JSON.parse(JSON.stringify(act.structure)));
            } else if (act.type === 'REMOVE') {
              state.islands[act.island] = state.islands[act.island].filter(s => s.id !== act.structure.id);
            } else if (act.type === 'UPGRADE' || act.type === 'DOWNGRADE') {
              const item = state.islands[act.island].find(s => s.id === act.id);
              if (item) {
                item.level = act.toLevel;
                item.size = act.toSize;
              }
            } else if (act.type === 'MOVE') {
              const item = state.islands[act.island].find(s => s.id === act.id);
              if (item) {
                item.row = act.toRow;
                item.col = act.toCol;
              }
            } else if (act.type === 'CLEAR') {
              state.islands[act.island] = [];
            } else if (act.type === 'GRID_TILE') {
              if (state.grids[act.island] && state.grids[act.island][act.row]) {
                state.grids[act.island][act.row][act.col] = act.toVal;
              }
              if (act.removedStructures && act.removedStructures.length > 0) {
                const removedIds = new Set(act.removedStructures.map((s) => s.id));
                state.islands[act.island] = state.islands[act.island].filter((s) => !removedIds.has(s.id));
                state.islands[act.island] = recalculateCrystalCoverage(state.islands[act.island]);
              }
            } else if (act.type === 'SET_GRID') {
              state.grids[act.island] = JSON.parse(JSON.stringify(act.newGrid));
            }
          };

          nextBatch.forEach(applyRedoAction);

          // Recalculate coverage across islands
          (Object.keys(state.islands) as IslandId[]).forEach(islKey => {
            state.islands[islKey] = recalculateCrystalCoverage(state.islands[islKey] || []);
          });

          state.history.push(nextBatch);
        });
      },
    })),
    {
      name: 'dragon-city-optimizer-store-v3',
      partialize: (state) => ({
        islands: state.islands,
        grids: state.grids,
        theme: state.theme,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          if (!state.islands) state.islands = {} as Record<IslandId, PlacedStructure[]>;
          if (!state.grids) state.grids = {} as Record<IslandId, number[][]>;

          (Object.keys(ISLAND_CONFIGS) as IslandId[]).forEach((islKey) => {
            const config = ISLAND_CONFIGS[islKey];
            if (!state.islands[islKey]) {
              state.islands[islKey] = [];
            }
            const currentGrid = state.grids[islKey];
            if (!currentGrid || currentGrid.length !== config.rows || (currentGrid[0] && currentGrid[0].length !== config.cols)) {
              state.grids[islKey] = JSON.parse(JSON.stringify(config.gridTemplate));
            }
          });
          (Object.keys(state.islands) as IslandId[]).forEach((islKey) => {
            state.islands[islKey] = recalculateCrystalCoverage(state.islands[islKey] || []);
          });
        }
      },
    }
  )
);
