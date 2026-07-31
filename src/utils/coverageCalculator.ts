import { CRYSTAL_CONFIG } from '../constants/habitats';
import { BoostStats, PlacedStructure } from '../types';

/**
 * Checks if a crystal provides a gold production boost to a given habitat.
 */
export function isCrystalBoostingHabitat(crystal: PlacedStructure, habitat: PlacedStructure): boolean {
  // Ancient Habitats ignore crystal boosts
  if (!CRYSTAL_CONFIG.supportsAncientHabitat && habitat.isAncient) return false;

  // Crystal element must match habitat element
  if (crystal.type !== habitat.type) return false;

  // Spatial coverage intersection (5-tile radius around 1x1 crystal = 11x11 bounding box)
  const minCRow = crystal.row - CRYSTAL_CONFIG.radius;
  const maxCRow = crystal.row + CRYSTAL_CONFIG.radius;
  const minCCol = crystal.col - CRYSTAL_CONFIG.radius;
  const maxCCol = crystal.col + CRYSTAL_CONFIG.radius;

  const habMaxRow = habitat.row + habitat.size - 1;
  const habMaxCol = habitat.col + habitat.size - 1;

  // Axis-Aligned Bounding Box (AABB) intersection check
  const rowIntersect = !(habitat.row > maxCRow || habMaxRow < minCRow);
  const colIntersect = !(habitat.col > maxCCol || habMaxCol < minCCol);

  return rowIntersect && colIntersect;
}

/**
 * Recalculates crystal coverage and updates boost percents and reference arrays in place or returns clone.
 */
export function recalculateCrystalCoverage(structures: PlacedStructure[]): PlacedStructure[] {
  const habitats = structures.filter(s => s.kind === 'habitat');
  const crystals = structures.filter(s => s.kind === 'crystal');

  // Reset counters
  habitats.forEach(h => {
    h.boostPercent = 0;
    h.boostingCrystalIds = [];
  });

  crystals.forEach(c => {
    c.affectedHabitatIds = [];
  });

  // Calculate intersections
  habitats.forEach(hab => {
    if (hab.isAncient) return;

    crystals.forEach(crys => {
      if (isCrystalBoostingHabitat(crys, hab)) {
        // Cap max boost percentage per habitat
        const currentBoost = hab.boostPercent || 0;
        if (currentBoost < CRYSTAL_CONFIG.maxCrystalsPerHabitat * CRYSTAL_CONFIG.goldBoostPercent) {
          hab.boostPercent = currentBoost + CRYSTAL_CONFIG.goldBoostPercent;
          hab.boostingCrystalIds = hab.boostingCrystalIds || [];
          hab.boostingCrystalIds.push(crys.id);

          crys.affectedHabitatIds = crys.affectedHabitatIds || [];
          crys.affectedHabitatIds.push(hab.id);
        }
      }
    });
  });

  return structures;
}

/**
 * Calculates global boost statistics for an island structure array.
 */
export function calculateBoostStats(structures: PlacedStructure[]): BoostStats {
  recalculateCrystalCoverage(structures);
  let totalBoostPercentage = 0;
  let boostedHabitatsCount = 0;

  structures.forEach(s => {
    if (s.kind === 'habitat' && !s.isAncient && s.boostPercent && s.boostPercent > 0) {
      totalBoostPercentage += s.boostPercent;
      boostedHabitatsCount++;
    }
  });

  return { totalBoostPercentage, boostedHabitatsCount };
}

/**
 * Checks whether a structure of given size can be placed at (row, col) without overlap or out-of-bounds.
 */
export function canPlaceStructure(
  row: number,
  col: number,
  size: number,
  grid: number[][],
  structures: PlacedStructure[],
  ignoreId: string | null = null
): boolean {
  const rows = grid.length;
  const cols = grid[0]?.length || 0;

  if (row < 0 || col < 0 || row + size > rows || col + size > cols) {
    return false;
  }

  // Check land buildability
  for (let r = row; r < row + size; r++) {
    for (let c = col; c < col + size; c++) {
      if (!grid[r] || grid[r][c] !== 1) return false;
    }
  }

  // Check structure overlap
  for (const s of structures) {
    if (ignoreId && s.id === ignoreId) continue;
    if (
      col < s.col + s.size &&
      col + size > s.col &&
      row < s.row + s.size &&
      row + size > s.row
    ) {
      return false;
    }
  }

  return true;
}
