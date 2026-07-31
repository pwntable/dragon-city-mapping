import { IslandConfig, IslandId } from '../types';

// Helper to generate full 2D grid filled with 1s
export function createGridTemplate(rows: number, cols: number, defaultValue = 1): number[][] {
  const grid: number[][] = [];
  for (let r = 0; r < rows; r++) {
    grid.push(new Array(cols).fill(defaultValue));
  }
  return grid;
}

// Lava Island Template (31x33) with corner cuts
const lavaGrid = createGridTemplate(33, 31);
for (let c = 0; c < 7; c++) lavaGrid[0][c] = 0;
for (let c = 24; c < 31; c++) lavaGrid[0][c] = 0;
for (let c = 0; c < 5; c++) lavaGrid[1][c] = 0;
for (let c = 26; c < 31; c++) lavaGrid[1][c] = 0;

export const ISLAND_CONFIGS: Record<IslandId, IslandConfig> = {
  lava: {
    id: 'lava',
    name: 'Lava Island',
    cols: 31,
    rows: 33,
    biomeAccentColor: '#FF5733',
    icon: 'volcano',
    gridTemplate: lavaGrid,
  },
  main: {
    id: 'main',
    name: 'Main Island',
    cols: 38,
    rows: 38,
    biomeAccentColor: '#4ADE80',
    icon: 'tree',
    gridTemplate: createGridTemplate(38, 38),
  },
  lush: {
    id: 'lush',
    name: 'Lush Island',
    cols: 38,
    rows: 38,
    biomeAccentColor: '#10B981',
    icon: 'seedling',
    gridTemplate: createGridTemplate(38, 38),
  },
  ivory: {
    id: 'ivory',
    name: 'Ivory Island',
    cols: 21,
    rows: 17,
    biomeAccentColor: '#FAF0C8',
    icon: 'gem',
    gridTemplate: createGridTemplate(17, 21),
  },
  desert: {
    id: 'desert',
    name: 'Desert Island',
    cols: 25,
    rows: 26,
    biomeAccentColor: '#FB923C',
    icon: 'sun',
    gridTemplate: createGridTemplate(26, 25),
  },
};
