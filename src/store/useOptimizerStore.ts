import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { ISLAND_CONFIGS } from '../constants/islands';
import { ANCIENT_HABITATS, getHabitatFootprintSize, REGULAR_HABITATS } from '../constants/habitats';
import { Action, ElementType, IslandId, LayoutState, PlacementCategory, PlacedStructure, Theme, ToolMode } from '../types';
import { runAutoOptimizer } from '../utils/autoOptimizer';
import { canPlaceStructure, recalculateCrystalCoverage } from '../utils/coverageCalculator';

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
  toggleGridTile: (row: number, col: number) => void;
  clearActiveIsland: () => void;
  optimizeActiveIsland: () => void;
  optimizeAllIslands: () => void;
  importLayout: (state: LayoutState) => void;
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
};

const initialGrids: Record<IslandId, number[][]> = {
  lava: JSON.parse(JSON.stringify(ISLAND_CONFIGS.lava.gridTemplate)),
  main: JSON.parse(JSON.stringify(ISLAND_CONFIGS.main.gridTemplate)),
  lush: JSON.parse(JSON.stringify(ISLAND_CONFIGS.lush.gridTemplate)),
  ivory: JSON.parse(JSON.stringify(ISLAND_CONFIGS.ivory.gridTemplate)),
  desert: JSON.parse(JSON.stringify(ISLAND_CONFIGS.desert.gridTemplate)),
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
        const currentGrid = grids[activeIsland] || ISLAND_CONFIGS[activeIsland].gridTemplate;

        let size = 4;
        let kind: 'habitat' | 'crystal' = 'habitat';
        let isAncient = false;

        if (placementCategory === 'crystal') {
          size = 1;
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
          Object.values(islands).forEach(isl => {
            if (isl.some(s => s.type === selectedElementType && s.isAncient)) {
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
          state.islands[activeIsland].push(newStructure);
          recalculateCrystalCoverage(state.islands[activeIsland]);
          state.selectedItemId = newStructure.id;
          state.history.push([action]);
          state.future = [];
        });

        return true;
      },

      removeStructure: (id) => {
        const { activeIsland, islands } = get();
        const target = islands[activeIsland].find(s => s.id === id);
        if (!target) return;

        const action: Action = { type: 'REMOVE', island: activeIsland, structure: target };

        set((state) => {
          state.islands[activeIsland] = state.islands[activeIsland].filter(s => s.id !== id);
          recalculateCrystalCoverage(state.islands[activeIsland]);
          if (state.selectedItemId === id) state.selectedItemId = null;
          state.history.push([action]);
          state.future = [];
        });
      },

      upgradeStructure: (id) => {
        const { activeIsland, islands, grids } = get();
        const target = islands[activeIsland].find(s => s.id === id);
        if (!target || target.kind !== 'habitat' || target.level >= target.maxLevel) return false;

        const nextLevel = target.level + 1;
        const nextSize = getHabitatFootprintSize(target.isAncient, nextLevel);
        const currentGrid = grids[activeIsland] || ISLAND_CONFIGS[activeIsland].gridTemplate;

        if (nextSize > target.size) {
          if (!canPlaceStructure(target.row, target.col, nextSize, currentGrid, islands[activeIsland], id)) {
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
          const item = state.islands[activeIsland].find(s => s.id === id);
          if (item) {
            item.level = nextLevel;
            item.size = nextSize;
            recalculateCrystalCoverage(state.islands[activeIsland]);
            state.history.push([action]);
            state.future = [];
          }
        });

        return true;
      },

      downgradeStructure: (id) => {
        const { activeIsland, islands } = get();
        const target = islands[activeIsland].find(s => s.id === id);
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
          const item = state.islands[activeIsland].find(s => s.id === id);
          if (item) {
            item.level = prevLevel;
            item.size = prevSize;
            recalculateCrystalCoverage(state.islands[activeIsland]);
            state.history.push([action]);
            state.future = [];
          }
        });

        return true;
      },

      toggleGridTile: (row, col) => {
        const { activeIsland, grids } = get();
        const grid = grids[activeIsland];
        if (!grid || !grid[row]) return;

        set((state) => {
          const currentVal = state.grids[activeIsland][row][col];
          state.grids[activeIsland][row][col] = currentVal === 1 ? 0 : 1;
          const updatedGrid = state.grids[activeIsland];

          // Filter out structures that are no longer buildable
          state.islands[activeIsland] = state.islands[activeIsland].filter(s =>
            canPlaceStructure(s.row, s.col, s.size, updatedGrid, state.islands[activeIsland], s.id)
          );

          recalculateCrystalCoverage(state.islands[activeIsland]);
        });
      },

      clearActiveIsland: () => {
        const { activeIsland, islands } = get();
        const currentStructures = [...islands[activeIsland]];
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
        const prevStructures = [...islands[activeIsland]];
        const newStructures = runAutoOptimizer(activeIsland, grids[activeIsland]);

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
        const batchActions: Action[] = [];

        (Object.keys(islands) as IslandId[]).forEach(islandId => {
          const prev = [...islands[islandId]];
          const next = runAutoOptimizer(islandId, grids[islandId]);

          batchActions.push({ type: 'CLEAR', island: islandId, structures: prev });
          next.forEach(s => {
            batchActions.push({ type: 'PLACE', island: islandId, structure: s });
          });
        });

        set((state) => {
          (Object.keys(islands) as IslandId[]).forEach(islandId => {
            state.islands[islandId] = runAutoOptimizer(islandId, state.grids[islandId]);
          });
          state.selectedItemId = null;
          state.history.push([{ type: 'BATCH', actions: batchActions }]);
          state.future = [];
        });
      },

      importLayout: (layoutState) => {
        set((state) => {
          if (layoutState.islands) {
            state.islands = layoutState.islands;
            Object.keys(state.islands).forEach(islKey => {
              recalculateCrystalCoverage(state.islands[islKey as IslandId]);
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
            if (act.type === 'PLACE') {
              state.islands[act.island] = state.islands[act.island].filter(s => s.id !== act.structure.id);
            } else if (act.type === 'REMOVE') {
              state.islands[act.island].push(act.structure);
            } else if (act.type === 'UPGRADE' || act.type === 'DOWNGRADE') {
              const item = state.islands[act.island].find(s => s.id === act.id);
              if (item) {
                item.level = act.fromLevel;
                item.size = act.fromSize;
              }
            } else if (act.type === 'CLEAR') {
              state.islands[act.island] = [...act.structures];
            } else if (act.type === 'BATCH') {
              // Apply batch in reverse order
              [...act.actions].reverse().forEach(applyUndoAction);
            }
          };

          lastBatch.forEach(applyUndoAction);

          // Recalculate coverage across islands
          (Object.keys(state.islands) as IslandId[]).forEach(islKey => {
            recalculateCrystalCoverage(state.islands[islKey]);
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
            if (act.type === 'PLACE') {
              state.islands[act.island].push(act.structure);
            } else if (act.type === 'REMOVE') {
              state.islands[act.island] = state.islands[act.island].filter(s => s.id !== act.structure.id);
            } else if (act.type === 'UPGRADE' || act.type === 'DOWNGRADE') {
              const item = state.islands[act.island].find(s => s.id === act.id);
              if (item) {
                item.level = act.toLevel;
                item.size = act.toSize;
              }
            } else if (act.type === 'CLEAR') {
              state.islands[act.island] = [];
            } else if (act.type === 'BATCH') {
              act.actions.forEach(applyRedoAction);
            }
          };

          nextBatch.forEach(applyRedoAction);

          // Recalculate coverage across islands
          (Object.keys(state.islands) as IslandId[]).forEach(islKey => {
            recalculateCrystalCoverage(state.islands[islKey]);
          });

          state.history.push(nextBatch);
        });
      },
    })),
    {
      name: 'dragon-city-optimizer-store-v2',
      partialize: (state) => ({
        islands: state.islands,
        grids: state.grids,
        theme: state.theme,
      }),
    }
  )
);
