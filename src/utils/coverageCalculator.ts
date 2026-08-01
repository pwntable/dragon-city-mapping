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

  const crystalSize = crystal.size || 2;
  // Spatial coverage intersection (5-tile radius around 2x2 crystal = 12x12 bounding box)
  const minCRow = crystal.row - CRYSTAL_CONFIG.radius;
  const maxCRow = crystal.row + crystalSize - 1 + CRYSTAL_CONFIG.radius;
  const minCCol = crystal.col - CRYSTAL_CONFIG.radius;
  const maxCCol = crystal.col + crystalSize - 1 + CRYSTAL_CONFIG.radius;

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
  // Create shallow clones of structures with reset boost parameters to avoid mutating frozen state objects
  const updatedStructures: PlacedStructure[] = structures.map((s) => {
    if (s.kind === 'habitat') {
      return {
        ...s,
        boostPercent: 0,
        boostingCrystalIds: [],
      };
    }
    if (s.kind === 'crystal') {
      return {
        ...s,
        size: 2,
        affectedHabitatIds: [],
      };
    }
    return { ...s };
  });

  const habitats = updatedStructures.filter((s) => s.kind === 'habitat');
  const crystals = updatedStructures.filter((s) => s.kind === 'crystal');

  // Calculate intersections
  habitats.forEach((hab) => {
    if (hab.isAncient) return;

    crystals.forEach((crys) => {
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

  return updatedStructures;
}

/**
 * Returns matching and non-matching habitats within the 5-tile radius of a crystal.
 */
export function getHabitatsInCrystalRange(
  crystal: PlacedStructure,
  structures: PlacedStructure[]
): { matching: PlacedStructure[]; nonMatching: PlacedStructure[] } {
  const matching: PlacedStructure[] = [];
  const nonMatching: PlacedStructure[] = [];

  if (crystal.kind !== 'crystal') return { matching, nonMatching };

  const crystalSize = crystal.size || 2;
  const minCRow = crystal.row - CRYSTAL_CONFIG.radius;
  const maxCRow = crystal.row + crystalSize - 1 + CRYSTAL_CONFIG.radius;
  const minCCol = crystal.col - CRYSTAL_CONFIG.radius;
  const maxCCol = crystal.col + crystalSize - 1 + CRYSTAL_CONFIG.radius;

  structures.forEach((hab) => {
    if (hab.kind !== 'habitat' || hab.isAncient) return;

    const habMaxRow = hab.row + hab.size - 1;
    const habMaxCol = hab.col + hab.size - 1;

    const rowIntersect = !(hab.row > maxCRow || habMaxRow < minCRow);
    const colIntersect = !(hab.col > maxCCol || habMaxCol < minCCol);

    if (rowIntersect && colIntersect) {
      if (hab.type === crystal.type) {
        matching.push(hab);
      } else {
        nonMatching.push(hab);
      }
    }
  });

  return { matching, nonMatching };
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
