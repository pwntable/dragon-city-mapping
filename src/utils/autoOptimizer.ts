import { ISLAND_CONFIGS } from '../constants/islands';
import { ANCIENT_HABITATS, REGULAR_HABITATS } from '../constants/habitats';
import { ElementType, IslandId, PlacedStructure } from '../types';
import { canPlaceStructure, isCrystalBoostingHabitat, recalculateCrystalCoverage } from './coverageCalculator';

const ISLAND_ELEMENT_MAP: Record<IslandId, { regular: ElementType[]; ancient: ElementType[] }> = {
  lava: { regular: ['flame', 'war', 'dark'], ancient: ['chaos'] },
  main: { regular: ['terra', 'nature', 'sea', 'wind'], ancient: ['beauty'] },
  lush: { regular: ['light', 'pure', 'legend', 'primal'], ancient: ['happy'] },
  desert: { regular: ['electric', 'ice'], ancient: ['magic', 'dream'] },
  ivory: { regular: ['metal'], ancient: ['soul'] },
  skull: { regular: ['dark', 'war'], ancient: ['chaos'] },
  rainbow: { regular: ['pure', 'legend'], ancient: ['happy'] },
  ice: { regular: ['ice', 'sea'], ancient: ['dream'] },
  gothic: { regular: ['dark', 'flame'], ancient: ['magic'] },
  rune: { regular: ['terra', 'metal'], ancient: ['soul'] },
  futuristic: { regular: ['electric', 'metal'], ancient: ['beauty'] },
  moon: { regular: ['light', 'dark'], ancient: ['dream'] },
  tempest: { regular: ['wind', 'sea'], ancient: ['chaos'] },
  jurassic: { regular: ['primal', 'nature'], ancient: ['happy'] },
  chronos: { regular: ['legend', 'pure'], ancient: ['magic'] },
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

  // 4. Place 2x2 Crystals using Smart Scored Grid Search for maximum matching habitat coverage
  regularElements.forEach(elem => {
    const matchingHabitats = structures.filter(s => s.kind === 'habitat' && !s.isAncient && s.type === elem.id);
    if (matchingHabitats.length === 0) return;

    for (let crystalIndex = 0; crystalIndex < 4; crystalIndex++) {
      recalculateCrystalCoverage(structures);

      let bestScore = -1;
      let bestPos: { r: number; c: number } | null = null;

      for (let r = 0; r <= rows - 2; r++) {
        for (let c = 0; c <= cols - 2; c++) {
          if (!canPlaceStructure(r, c, 2, grid, structures)) continue;

          const dummyCrystal: PlacedStructure = {
            id: `temp_crys`,
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
            size: 2,
          };

          let score = 0;
          matchingHabitats.forEach(hab => {
            if (isCrystalBoostingHabitat(dummyCrystal, hab)) {
              const currentBoosts = (hab.boostingCrystalIds || []).length;
              if (currentBoosts < 4) {
                // Score = weighted by habitat level (higher level habitats prioritized) & remaining boost headroom
                score += hab.level * (4 - currentBoosts);
              }
            }
          });

          if (score > bestScore) {
            bestScore = score;
            bestPos = { r, c };
          }
        }
      }

      // If we found a valid position (even if bestScore is 0, place near matching habitat if possible)
      if (bestPos && bestScore >= 0) {
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
          row: bestPos.r,
          col: bestPos.c,
          size: 2,
        });
      }
    }
  });

  recalculateCrystalCoverage(structures);
  return structures;
}
