import { IslandDataset, ValidationResult, ValidationError } from '../types/islandSchema';

export function validateIslandDataset(data: Partial<IslandDataset>): ValidationResult {
  const errors: ValidationError[] = [];

  if (typeof data.id !== 'number' || data.id <= 0) {
    errors.push({ field: 'id', message: 'Island ID must be a positive integer.' });
  }

  if (!data.name || typeof data.name !== 'string') {
    errors.push({ field: 'name', message: 'Island name must be a non-empty string.' });
  }

  if (typeof data.order !== 'number') {
    errors.push({ field: 'order', message: 'Island order must be a number.' });
  }

  if (typeof data.gridWidth !== 'number' || data.gridWidth <= 0) {
    errors.push({ field: 'gridWidth', message: 'gridWidth must be a positive integer.' });
  }

  if (typeof data.gridHeight !== 'number' || data.gridHeight <= 0) {
    errors.push({ field: 'gridHeight', message: 'gridHeight must be a positive integer.' });
  }

  const { gridWidth = 0, gridHeight = 0 } = data;
  const expectedTotalTiles = gridWidth * gridHeight;

  if (data.tileSize !== 1) {
    errors.push({ field: 'tileSize', message: 'tileSize must always equal 1.' });
  }

  if (data.totalTiles !== expectedTotalTiles) {
    errors.push({
      field: 'totalTiles',
      message: `totalTiles (${data.totalTiles}) must equal gridWidth * gridHeight (${expectedTotalTiles}).`,
    });
  }

  // Validate masks dimensions
  const maskKeys: (keyof IslandDataset)[] = ['mask', 'expansionMask', 'waterMask', 'cliffMask', 'collisionMask'];
  for (const maskKey of maskKeys) {
    const mask = data[maskKey] as number[][] | undefined;
    if (!Array.isArray(mask)) {
      errors.push({ field: maskKey, message: `${maskKey} must be a 2D array.` });
      continue;
    }

    if (mask.length !== gridHeight) {
      errors.push({
        field: maskKey,
        message: `${maskKey} must have gridHeight (${gridHeight}) rows, but found ${mask.length}.`,
      });
    }

    for (let r = 0; r < mask.length; r++) {
      const row = mask[r];
      if (!Array.isArray(row) || row.length !== gridWidth) {
        errors.push({
          field: maskKey,
          message: `${maskKey}[${r}] must have gridWidth (${gridWidth}) columns, but found ${row ? row.length : 0}.`,
        });
        break; // Report once per mask
      }
    }
  }

  // Count buildable vs blocked tiles from mask
  if (Array.isArray(data.mask) && data.mask.length === gridHeight) {
    let actualBuildable = 0;
    let actualBlocked = 0;

    for (let r = 0; r < gridHeight; r++) {
      const row = data.mask[r];
      if (Array.isArray(row)) {
        for (let c = 0; c < gridWidth; c++) {
          if (row[c] === 1) actualBuildable++;
          else actualBlocked++;
        }
      }
    }

    if (data.buildableTiles !== actualBuildable) {
      errors.push({
        field: 'buildableTiles',
        message: `buildableTiles (${data.buildableTiles}) does not match buildable tiles in mask (${actualBuildable}).`,
      });
    }

    if (data.blockedTiles !== actualBlocked) {
      errors.push({
        field: 'blockedTiles',
        message: `blockedTiles (${data.blockedTiles}) does not match blocked tiles in mask (${actualBlocked}).`,
      });
    }

    if (actualBuildable + actualBlocked !== expectedTotalTiles) {
      errors.push({
        field: 'tileCounts',
        message: `buildableTiles + blockedTiles (${actualBuildable + actualBlocked}) must equal totalTiles (${expectedTotalTiles}).`,
      });
    }
  }

  // Validate spawn area
  if (!data.spawnArea) {
    errors.push({ field: 'spawnArea', message: 'spawnArea configuration is missing.' });
  } else {
    const { x, y, width, height } = data.spawnArea;
    if (x < 0 || y < 0 || x + width > gridWidth || y + height > gridHeight) {
      errors.push({ field: 'spawnArea', message: 'spawnArea extends outside island grid bounds.' });
    } else if (Array.isArray(data.mask) && Array.isArray(data.waterMask) && Array.isArray(data.cliffMask)) {
      let overlapsBlocked = false;
      let overlapsWater = false;
      let overlapsCliff = false;

      for (let r = y; r < y + height; r++) {
        for (let c = x; c < x + width; c++) {
          if (data.mask[r] && data.mask[r][c] === 0) overlapsBlocked = true;
          if (data.waterMask[r] && data.waterMask[r][c] === 1) overlapsWater = true;
          if (data.cliffMask[r] && data.cliffMask[r][c] === 1) overlapsCliff = true;
        }
      }

      if (overlapsBlocked) {
        errors.push({ field: 'spawnArea', message: 'spawnArea overlaps blocked tiles in mask.' });
      }
      if (overlapsWater) {
        errors.push({ field: 'spawnArea', message: 'spawnArea overlaps water in waterMask.' });
      }
      if (overlapsCliff) {
        errors.push({ field: 'spawnArea', message: 'spawnArea overlaps cliffs in cliffMask.' });
      }
    }
  }

  // Validate camera center
  if (!data.camera || !data.camera.center) {
    errors.push({ field: 'camera', message: 'camera configuration is missing.' });
  } else {
    const { x, y } = data.camera.center;
    if (x < 0 || x >= gridWidth || y < 0 || y >= gridHeight) {
      errors.push({ field: 'camera.center', message: 'camera center is outside map boundaries.' });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
