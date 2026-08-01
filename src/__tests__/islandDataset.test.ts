import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { IslandDataset } from '../types/islandSchema';
import { validateIslandDataset } from '../utils/islandValidator';

describe('Dragon City Island Dataset Specification', () => {
  const dataDir = path.join(process.cwd(), 'data', 'islands');
  const expectedFiles = [
    'main-island.json',
    'lush-island.json',
    'lava-island.json',
    'ivory-island.json',
    'desert-island.json',
    'skull-island.json',
    'rainbow-island.json',
    'ice-island.json',
    'gothic-island.json',
    'rune-island.json',
    'futuristic-island.json',
    'moon-island.json',
    'tempest-island.json',
    'jurassic-island.json',
    'chronos-island.json',
  ];

  it('should have all 15 island dataset files created in /data/islands', () => {
    expectedFiles.forEach((file) => {
      const filePath = path.join(dataDir, file);
      expect(fs.existsSync(filePath)).toBe(true);
    });
  });

  expectedFiles.forEach((file) => {
    it(`should validate ${file} against Island Dataset Schema rules`, () => {
      const filePath = path.join(dataDir, file);
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const dataset: IslandDataset = JSON.parse(fileContent);

      const result = validateIslandDataset(dataset);

      if (!result.valid) {
        console.error(`Validation errors for ${file}:`, result.errors);
      }

      expect(result.valid).toBe(true);
      expect(result.errors.length).toBe(0);

      // Verify grid dimensions
      expect(dataset.gridWidth).toBeGreaterThan(0);
      expect(dataset.gridHeight).toBeGreaterThan(0);
      expect(dataset.totalTiles).toBe(dataset.gridWidth * dataset.gridHeight);
      expect(dataset.buildableTiles + dataset.blockedTiles).toBe(dataset.totalTiles);
      expect(dataset.tileSize).toBe(1);

      // Verify masks count
      expect(dataset.mask.length).toBe(dataset.gridHeight);
      expect(dataset.expansionMask.length).toBe(dataset.gridHeight);
      expect(dataset.waterMask.length).toBe(dataset.gridHeight);
      expect(dataset.cliffMask.length).toBe(dataset.gridHeight);
      expect(dataset.collisionMask.length).toBe(dataset.gridHeight);

      dataset.mask.forEach((row) => expect(row.length).toBe(dataset.gridWidth));
      dataset.expansionMask.forEach((row) => expect(row.length).toBe(dataset.gridWidth));
      dataset.waterMask.forEach((row) => expect(row.length).toBe(dataset.gridWidth));
      dataset.cliffMask.forEach((row) => expect(row.length).toBe(dataset.gridWidth));
      dataset.collisionMask.forEach((row) => expect(row.length).toBe(dataset.gridWidth));

      // Spawn area check
      expect(dataset.spawnArea.x).toBeGreaterThanOrEqual(0);
      expect(dataset.spawnArea.y).toBeGreaterThanOrEqual(0);
      expect(dataset.spawnArea.x + dataset.spawnArea.width).toBeLessThanOrEqual(dataset.gridWidth);
      expect(dataset.spawnArea.y + dataset.spawnArea.height).toBeLessThanOrEqual(dataset.gridHeight);

      // Camera center check
      expect(dataset.camera.center.x).toBeGreaterThanOrEqual(0);
      expect(dataset.camera.center.x).toBeLessThan(dataset.gridWidth);
      expect(dataset.camera.center.y).toBeGreaterThanOrEqual(0);
      expect(dataset.camera.center.y).toBeLessThan(dataset.gridHeight);
    });
  });
});
