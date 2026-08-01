import { IslandConfig, IslandId } from '../types';
import mainData from '../data/islands/main-island.json';
import lushData from '../data/islands/lush-island.json';
import lavaData from '../data/islands/lava-island.json';
import ivoryData from '../data/islands/ivory-island.json';
import desertData from '../data/islands/desert-island.json';
import skullData from '../data/islands/skull-island.json';
import rainbowData from '../data/islands/rainbow-island.json';
import iceData from '../data/islands/ice-island.json';
import gothicData from '../data/islands/gothic-island.json';
import runeData from '../data/islands/rune-island.json';
import futuristicData from '../data/islands/futuristic-island.json';
import moonData from '../data/islands/moon-island.json';
import tempestData from '../data/islands/tempest-island.json';
import jurassicData from '../data/islands/jurassic-island.json';
import chronosData from '../data/islands/chronos-island.json';

// Helper to generate fallback 2D island grid if needed
export function createIslandGrid(rows: number, cols: number, margin = 2): number[][] {
  const grid: number[][] = [];
  for (let r = 0; r < rows; r++) {
    const rowArr = [];
    for (let c = 0; c < cols; c++) {
      if (r < margin || r >= rows - margin || c < margin || c >= cols - margin) {
        rowArr.push(0);
      } else {
        rowArr.push(1);
      }
    }
    grid.push(rowArr);
  }
  return grid;
}

export const ISLAND_CONFIGS: Record<IslandId, IslandConfig> = {
  lava: {
    id: 'lava',
    name: 'Lava Island',
    cols: lavaData.gridWidth,
    rows: lavaData.gridHeight,
    maxHabitats: 18,
    biomeAccentColor: '#FF5733',
    icon: 'volcano',
    gridTemplate: lavaData.mask,
  },
  main: {
    id: 'main',
    name: 'Main Island',
    cols: mainData.gridWidth,
    rows: mainData.gridHeight,
    maxHabitats: 24,
    biomeAccentColor: '#4ADE80',
    icon: 'tree',
    gridTemplate: mainData.mask,
  },
  lush: {
    id: 'lush',
    name: 'Lush Island',
    cols: lushData.gridWidth,
    rows: lushData.gridHeight,
    maxHabitats: 24,
    biomeAccentColor: '#10B981',
    icon: 'seedling',
    gridTemplate: lushData.mask,
  },
  ivory: {
    id: 'ivory',
    name: 'Ivory Island',
    cols: ivoryData.gridWidth,
    rows: ivoryData.gridHeight,
    maxHabitats: 12,
    biomeAccentColor: '#FAF0C8',
    icon: 'gem',
    gridTemplate: ivoryData.mask,
  },
  desert: {
    id: 'desert',
    name: 'Desert Island',
    cols: desertData.gridWidth,
    rows: desertData.gridHeight,
    maxHabitats: 16,
    biomeAccentColor: '#FB923C',
    icon: 'sun',
    gridTemplate: desertData.mask,
  },
  skull: {
    id: 'skull',
    name: 'Skull Island',
    cols: skullData.gridWidth,
    rows: skullData.gridHeight,
    maxHabitats: 14,
    biomeAccentColor: '#E11D48',
    icon: 'skull',
    gridTemplate: skullData.mask,
  },
  rainbow: {
    id: 'rainbow',
    name: 'Rainbow Island',
    cols: rainbowData.gridWidth,
    rows: rainbowData.gridHeight,
    maxHabitats: 18,
    biomeAccentColor: '#A855F7',
    icon: 'sparkles',
    gridTemplate: rainbowData.mask,
  },
  ice: {
    id: 'ice',
    name: 'Ice Island',
    cols: iceData.gridWidth,
    rows: iceData.gridHeight,
    maxHabitats: 18,
    biomeAccentColor: '#38BDF8',
    icon: 'snowflake',
    gridTemplate: iceData.mask,
  },
  gothic: {
    id: 'gothic',
    name: 'Gothic Island',
    cols: gothicData.gridWidth,
    rows: gothicData.gridHeight,
    maxHabitats: 18,
    biomeAccentColor: '#8B5CF6',
    icon: 'castle',
    gridTemplate: gothicData.mask,
  },
  rune: {
    id: 'rune',
    name: 'Rune Island',
    cols: runeData.gridWidth,
    rows: runeData.gridHeight,
    maxHabitats: 18,
    biomeAccentColor: '#3B82F6',
    icon: 'compass',
    gridTemplate: runeData.mask,
  },
  futuristic: {
    id: 'futuristic',
    name: 'Futuristic Island',
    cols: futuristicData.gridWidth,
    rows: futuristicData.gridHeight,
    maxHabitats: 18,
    biomeAccentColor: '#06B6D4',
    icon: 'zap',
    gridTemplate: futuristicData.mask,
  },
  moon: {
    id: 'moon',
    name: 'Moon Island',
    cols: moonData.gridWidth,
    rows: moonData.gridHeight,
    maxHabitats: 18,
    biomeAccentColor: '#818CF8',
    icon: 'moon',
    gridTemplate: moonData.mask,
  },
  tempest: {
    id: 'tempest',
    name: 'Tempest Island',
    cols: tempestData.gridWidth,
    rows: tempestData.gridHeight,
    maxHabitats: 18,
    biomeAccentColor: '#0284C7',
    icon: 'wind',
    gridTemplate: tempestData.mask,
  },
  jurassic: {
    id: 'jurassic',
    name: 'Jurassic Island',
    cols: jurassicData.gridWidth,
    rows: jurassicData.gridHeight,
    maxHabitats: 18,
    biomeAccentColor: '#84CC16',
    icon: 'footprints',
    gridTemplate: jurassicData.mask,
  },
  chronos: {
    id: 'chronos',
    name: 'Chronos Island',
    cols: chronosData.gridWidth,
    rows: chronosData.gridHeight,
    maxHabitats: 18,
    biomeAccentColor: '#F59E0B',
    icon: 'clock',
    gridTemplate: chronosData.mask,
  },
};
