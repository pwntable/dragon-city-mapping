import { ISLAND_CONFIGS } from '../constants/islands';
import { ANCIENT_HABITATS, REGULAR_HABITATS } from '../constants/habitats';
import { ElementType, IslandId, PlacedStructure } from '../types';
import { canPlaceStructure, recalculateCrystalCoverage } from './coverageCalculator';

const ISLAND_ELEMENT_MAP: Record<IslandId, { regular: ElementType[]; ancient: ElementType[] }> = {
  lava: { regular: ['flame', 'war', 'dark'], ancient: ['chaos'] },
  main: { regular: ['terra', 'nature', 'sea', 'wind'], ancient: ['beauty'] },
  lush: { regular: ['light', 'pure', 'legend', 'primal'], ancient: ['happy'] },
  desert: { regular: ['electric', 'ice'], ancient: ['magic', 'dream'] },
  ivory: { regular: ['metal'], ancient: ['soul'] },
};

/**
 * Runs the greedy area-descending auto-placement algorithm for a given island.
 */
export function runAutoOptimizer(islandId: IslandId, customGrid?: number[][]): PlacedStructure[] {
  const config = ISLAND_CONFIGS[islandId];
  if (!config) return [];

  const rows = config.rows;
  const cols = config.cols;
  const grid = customGrid || config.gridTemplate;

  const structures: PlacedStructure[] = [];
  const mapConfig = ISLAND_ELEMENT_MAP[islandId] || { regular: ['terra'], ancient: [] };

  const regularElements = REGULAR_HABITATS.filter(e => mapConfig.regular.includes(e.id as ElementType));
  const ancientElements = ANCIENT_HABITATS.filter(e => mapConfig.ancient.includes(e.id as ElementType));

  const timestamp = Date.now();
  let counter = 0;

  // 1. Place Ancient Habitats (6x6 footprint)
  ancientElements.forEach(ancient => {
    let placed = false;
    for (let r = 0; r <= rows - 6; r++) {
      for (let c = 0; c <= cols - 6; c++) {
        if (canPlaceStructure(r, c, 6, grid, structures)) {
          counter++;
          structures.push({
            id: `hab_${islandId}_${timestamp}_${counter}`,
            type: ancient.id,
            kind: 'habitat',
            name: ancient.name,
            color: ancient.color,
            borderColor: ancient.borderColor,
            icon: ancient.icon,
            isAncient: true,
            level: 2,
            maxLevel: 2,
            capacities: ancient.capacities,
            row: r,
            col: c,
            size: 6,
          });
          placed = true;
          break;
        }
      }
      if (placed) break;
    }
  });

  // 2. Place Regular Habitats Level 7 (6x6 maxed footprint)
  let elemIdx = 0;
  for (let r = 0; r <= rows - 6; r++) {
    for (let c = 0; c <= cols - 6; c++) {
      if (canPlaceStructure(r, c, 6, grid, structures)) {
        const elem = regularElements[elemIdx % regularElements.length];
        counter++;
        structures.push({
          id: `hab_${islandId}_${timestamp}_${counter}`,
          type: elem.id,
          kind: 'habitat',
          name: elem.name,
          color: elem.color,
          borderColor: elem.borderColor,
          icon: elem.icon,
          isAncient: false,
          level: 7,
          maxLevel: 7,
          capacities: elem.capacities,
          row: r,
          col: c,
          size: 6,
        });
        elemIdx++;
      }
    }
  }

  // 3. Fill remaining gaps with Lv1 (4x4) habitats
  for (let r = 0; r <= rows - 4; r++) {
    for (let c = 0; c <= cols - 4; c++) {
      if (canPlaceStructure(r, c, 4, grid, structures)) {
        const elem = regularElements[elemIdx % regularElements.length];
        counter++;
        structures.push({
          id: `hab_${islandId}_${timestamp}_${counter}`,
          type: elem.id,
          kind: 'habitat',
          name: elem.name,
          color: elem.color,
          borderColor: elem.borderColor,
          icon: elem.icon,
          isAncient: false,
          level: 1,
          maxLevel: 7,
          capacities: elem.capacities,
          row: r,
          col: c,
          size: 4,
        });
        elemIdx++;
      }
    }
  }

  // 4. Place 1x1 Crystals inside 5-tile coverage radius of matching habitats
  const crystalCounts: Record<string, number> = {};
  regularElements.forEach(e => (crystalCounts[e.id] = 0));

  structures.forEach(s => {
    if (s.kind === 'habitat' && !s.isAncient && crystalCounts[s.type] < 4) {
      const habType = s.type;
      for (let r = Math.max(0, s.row - 2); r <= Math.min(rows - 1, s.row + s.size + 1); r++) {
        for (let c = Math.max(0, s.col - 2); c <= Math.min(cols - 1, s.col + s.size + 1); c++) {
          if (crystalCounts[habType] >= 4) break;
          if (canPlaceStructure(r, c, 1, grid, structures)) {
            const elem = REGULAR_HABITATS.find(e => e.id === habType);
            if (elem) {
              counter++;
              structures.push({
                id: `crys_${islandId}_${timestamp}_${counter}`,
                type: elem.id,
                kind: 'crystal',
                name: `${elem.name} Crystal`,
                color: elem.color,
                isAncient: false,
                level: 1,
                maxLevel: 1,
                capacities: [0],
                row: r,
                col: c,
                size: 1,
              });
              crystalCounts[habType]++;
            }
          }
        }
      }
    }
  });

  recalculateCrystalCoverage(structures);
  return structures;
}
