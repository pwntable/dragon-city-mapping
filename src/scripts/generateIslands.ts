import * as fs from 'fs';
import * as path from 'path';
import { IslandDataset } from '../types/islandSchema';
import { validateIslandDataset } from '../utils/islandValidator';

interface IslandMeta {
  id: number;
  slug: string;
  name: string;
  order: number;
  unlocked: boolean;
  premium: boolean;
  theme: string;
  gridWidth?: number;
  gridHeight?: number;
}

const ISLAND_METAS: IslandMeta[] = [
  { id: 1, slug: 'main-island', name: 'Main Island', order: 1, unlocked: true, premium: false, theme: 'nature', gridWidth: 63, gridHeight: 58 },
  { id: 2, slug: 'lush-island', name: 'Lush Island', order: 2, unlocked: false, premium: false, theme: 'jungle', gridWidth: 63, gridHeight: 58 },
  { id: 3, slug: 'lava-island', name: 'Lava Island', order: 3, unlocked: false, premium: false, theme: 'volcano', gridWidth: 63, gridHeight: 58 },
  { id: 4, slug: 'ivory-island', name: 'Ivory Island', order: 4, unlocked: false, premium: false, theme: 'crystal', gridWidth: 63, gridHeight: 58 },
  { id: 5, slug: 'desert-island', name: 'Desert Island', order: 5, unlocked: false, premium: false, theme: 'sand', gridWidth: 63, gridHeight: 58 },
  { id: 6, slug: 'skull-island', name: 'Skull Island', order: 6, unlocked: false, premium: false, theme: 'dark', gridWidth: 63, gridHeight: 58 },
  { id: 7, slug: 'rainbow-island', name: 'Rainbow Island', order: 7, unlocked: false, premium: false, theme: 'magic', gridWidth: 63, gridHeight: 58 },
  { id: 8, slug: 'ice-island', name: 'Ice Island', order: 8, unlocked: false, premium: false, theme: 'frost', gridWidth: 63, gridHeight: 58 },
  { id: 9, slug: 'gothic-island', name: 'Gothic Island', order: 9, unlocked: false, premium: false, theme: 'shadow', gridWidth: 63, gridHeight: 58 },
  { id: 10, slug: 'rune-island', name: 'Rune Island', order: 10, unlocked: false, premium: false, theme: 'ancient', gridWidth: 63, gridHeight: 58 },
  { id: 11, slug: 'futuristic-island', name: 'Futuristic Island', order: 11, unlocked: false, premium: true, theme: 'cyber', gridWidth: 63, gridHeight: 58 },
  { id: 12, slug: 'moon-island', name: 'Moon Island', order: 12, unlocked: false, premium: true, theme: 'lunar', gridWidth: 63, gridHeight: 58 },
  { id: 13, slug: 'tempest-island', name: 'Tempest Island', order: 13, unlocked: false, premium: true, theme: 'storm', gridWidth: 63, gridHeight: 58 },
  { id: 14, slug: 'jurassic-island', name: 'Jurassic Island', order: 14, unlocked: false, premium: true, theme: 'dino', gridWidth: 63, gridHeight: 58 },
  { id: 15, slug: 'chronos-island', name: 'Chronos Island', order: 15, unlocked: false, premium: true, theme: 'time', gridWidth: 63, gridHeight: 58 },
];

function generateIsland(meta: IslandMeta): IslandDataset {
  const gridWidth = meta.gridWidth || 63;
  const gridHeight = meta.gridHeight || 58;
  const totalTiles = gridWidth * gridHeight;

  const mask: number[][] = [];
  const expansionMask: number[][] = [];
  const waterMask: number[][] = [];
  const cliffMask: number[][] = [];
  const collisionMask: number[][] = [];

  let buildableTiles = 0;
  let blockedTiles = 0;

  const borderMargin = 4;

  for (let r = 0; r < gridHeight; r++) {
    const maskRow: number[] = [];
    const expRow: number[] = [];
    const waterRow: number[] = [];
    const cliffRow: number[] = [];
    const collisionRow: number[] = [];

    for (let c = 0; c < gridWidth; c++) {
      // Determine border vs land shape with rounded/faceted island layout
      const distFromCenterX = Math.abs(c - Math.floor(gridWidth / 2)) / (gridWidth / 2);
      const distFromCenterY = Math.abs(r - Math.floor(gridHeight / 2)) / (gridHeight / 2);
      const combinedDist = Math.sqrt(distFromCenterX * distFromCenterX + distFromCenterY * distFromCenterY);

      const isWater = r < borderMargin || r >= gridHeight - borderMargin || c < borderMargin || c >= gridWidth - borderMargin || combinedDist > 0.88;
      const isCliff = !isWater && (r === borderMargin || r === gridHeight - borderMargin - 1 || c === borderMargin || c === gridWidth - borderMargin - 1);

      if (isWater) {
        maskRow.push(0);
        expRow.push(0);
        waterRow.push(1);
        cliffRow.push(0);
        collisionRow.push(2);
        blockedTiles++;
      } else if (isCliff) {
        maskRow.push(0);
        expRow.push(0);
        waterRow.push(0);
        cliffRow.push(1);
        collisionRow.push(2);
        blockedTiles++;
      } else {
        // Inner land
        const isExpansion = combinedDist > 0.70;
        maskRow.push(1);
        expRow.push(isExpansion ? 2 : 1);
        waterRow.push(0);
        cliffRow.push(0);
        collisionRow.push(0);
        buildableTiles++;
      }
    }

    mask.push(maskRow);
    expansionMask.push(expRow);
    waterMask.push(waterRow);
    cliffMask.push(cliffRow);
    collisionMask.push(collisionRow);
  }

  const spawnWidth = 6;
  const spawnHeight = 6;
  const spawnX = Math.floor((gridWidth - spawnWidth) / 2);
  const spawnY = Math.floor((gridHeight - spawnHeight) / 2);

  // Clear collision and ensure buildable inside spawn area
  for (let r = spawnY; r < spawnY + spawnHeight; r++) {
    for (let c = spawnX; c < spawnX + spawnWidth; c++) {
      if (mask[r][c] === 0) {
        mask[r][c] = 1;
        waterMask[r][c] = 0;
        cliffMask[r][c] = 0;
        collisionMask[r][c] = 0;
        buildableTiles++;
        blockedTiles--;
      }
    }
  }

  const dataset: IslandDataset = {
    id: meta.id,
    name: meta.name,
    order: meta.order,
    unlocked: meta.unlocked,
    premium: meta.premium,
    gridWidth,
    gridHeight,
    tileSize: 1,
    totalTiles,
    buildableTiles,
    blockedTiles,
    spawnArea: {
      x: spawnX,
      y: spawnY,
      width: spawnWidth,
      height: spawnHeight,
    },
    camera: {
      defaultZoom: 1,
      center: {
        x: Math.floor(gridWidth / 2),
        y: Math.floor(gridHeight / 2),
      },
    },
    mask,
    expansionMask,
    waterMask,
    cliffMask,
    collisionMask,
    theme: meta.theme,
    background: `${meta.theme}_sky`,
    ambientMusic: `${meta.theme}_theme`,
  };

  return dataset;
}

export function runGenerator() {
  const rootDir = process.cwd();
  const dataDir = path.join(rootDir, 'data', 'islands');
  const publicDataDir = path.join(rootDir, 'public', 'data', 'islands');

  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  if (!fs.existsSync(publicDataDir)) {
    fs.mkdirSync(publicDataDir, { recursive: true });
  }

  console.log('Generating island datasets...');

  ISLAND_METAS.forEach((meta) => {
    const dataset = generateIsland(meta);
    const validation = validateIslandDataset(dataset);

    if (!validation.valid) {
      console.error(`Validation failed for ${meta.name}:`, validation.errors);
      throw new Error(`Invalid dataset for ${meta.name}`);
    }

    // Format strictly with 2 spaces and LF endings
    const jsonString = JSON.stringify(dataset, null, 2).replace(/\r\n/g, '\n') + '\n';

    const filename = `${meta.slug}.json`;
    fs.writeFileSync(path.join(dataDir, filename), jsonString, 'utf-8');
    fs.writeFileSync(path.join(publicDataDir, filename), jsonString, 'utf-8');
    console.log(`✓ Saved ${filename} (ID: ${dataset.id}, ${dataset.gridWidth}x${dataset.gridHeight}, buildable: ${dataset.buildableTiles}, blocked: ${dataset.blockedTiles})`);
  });

  console.log('All 15 island datasets successfully created and validated!');
}

runGenerator();

