import { CrystalDef, HabitatDef } from '../types';

export const CRYSTAL_CONFIG = {
  radius: 5,                  // Coverage Radius = 5 tiles (approx 11x11 area around 1x1 crystal center)
  goldBoostPercent: 20,        // +20% Gold Production Rate per matching element crystal
  maxCrystalsPerHabitat: 4,    // Cap at +80% boost (4 crystals max per matching element)
  supportsAncientHabitat: false, // Ancient Habitats ignore crystal boosts
};

export const REGULAR_HABITAT_SIZE: Record<number, number> = {
  1: 4,
  2: 6,
  3: 6,
  4: 6,
  5: 6,
  6: 6,
  7: 6,
};

export const ANCIENT_HABITAT_SIZE: Record<number, number> = {
  1: 6,
  2: 6,
};

export function getHabitatFootprintSize(isAncient: boolean, level: number): number {
  if (isAncient) return ANCIENT_HABITAT_SIZE[level] || 6;
  return REGULAR_HABITAT_SIZE[level] || (level >= 2 ? 6 : 4);
}

export const REGULAR_HABITATS: HabitatDef[] = [
  { id: 'terra', name: 'Terra', color: '#84cc16', borderColor: '#4d7c0f', icon: 'Mountain', isAncient: false, maxLevel: 7, capacities: [500, 10000, 50000, 70000, 80000, 88000, 92000] },
  { id: 'flame', name: 'Flame', color: '#ef4444', borderColor: '#b91c1c', icon: 'Flame', isAncient: false, maxLevel: 7, capacities: [5000, 20000, 60000, 80000, 90000, 98000, 102000] },
  { id: 'sea', name: 'Sea', color: '#06b6d4', borderColor: '#0e7490', icon: 'Waves', isAncient: false, maxLevel: 7, capacities: [7500, 30000, 70000, 90000, 100000, 108000, 112000] },
  { id: 'nature', name: 'Nature', color: '#10b981', borderColor: '#047857', icon: 'Leaf', isAncient: false, maxLevel: 7, capacities: [10000, 40000, 80000, 100000, 110000, 118000, 122000] },
  { id: 'electric', name: 'Electric', color: '#f59e0b', borderColor: '#b45309', icon: 'Zap', isAncient: false, maxLevel: 7, capacities: [12500, 50000, 90000, 110000, 120000, 128000, 132000] },
  { id: 'ice', name: 'Ice', color: '#38bdf8', borderColor: '#0369a1', icon: 'Snowflake', isAncient: false, maxLevel: 7, capacities: [15000, 60000, 100000, 120000, 130000, 138000, 142000] },
  { id: 'metal', name: 'Metal', color: '#94a3b8', borderColor: '#475569', icon: 'Shield', isAncient: false, maxLevel: 7, capacities: [17500, 70000, 110000, 130000, 140000, 148000, 152000] },
  { id: 'dark', name: 'Dark', color: '#8b5cf6', borderColor: '#6d28d9', icon: 'Moon', isAncient: false, maxLevel: 7, capacities: [20000, 80000, 120000, 140000, 150000, 158000, 162000] },
  { id: 'light', name: 'Light', color: '#facc15', borderColor: '#a16207', icon: 'Sun', isAncient: false, maxLevel: 7, capacities: [40000, 120000, 160000, 180000, 190000, 198000, 202000] },
  { id: 'war', name: 'War', color: '#f97316', borderColor: '#c2410c', icon: 'Swords', isAncient: false, maxLevel: 7, capacities: [60000, 180000, 220000, 240000, 250000, 258000, 262000] },
  { id: 'wind', name: 'Wind', color: '#14b8a6', borderColor: '#0f766e', icon: 'Wind', isAncient: false, maxLevel: 7, capacities: [60000, 180000, 220000, 240000, 250000, 258000, 262000] },
  { id: 'pure', name: 'Pure', color: '#ec4899', borderColor: '#be185d', icon: 'Gem', isAncient: false, maxLevel: 7, capacities: [80000, 240000, 280000, 300000, 310000, 318000, 322000] },
  { id: 'primal', name: 'Primal', color: '#d97706', borderColor: '#92400e', icon: 'FlameKindling', isAncient: false, maxLevel: 7, capacities: [80000, 240000, 280000, 300000, 310000, 318000, 332000] },
  { id: 'legend', name: 'Legend', color: '#a855f7', borderColor: '#7e22ce', icon: 'Crown', isAncient: false, maxLevel: 7, capacities: [350000, 700000, 740000, 760000, 770000, 778000, 782000] },
];

export const ANCIENT_HABITATS: HabitatDef[] = [
  { id: 'beauty', name: 'Beauty', color: '#f43f5e', borderColor: '#be123c', icon: 'Heart', isAncient: true, maxLevel: 2, capacities: [65000, 130000] },
  { id: 'magic', name: 'Magic', color: '#3b82f6', borderColor: '#1d4ed8', icon: 'Wand2', isAncient: true, maxLevel: 2, capacities: [55000, 110000] },
  { id: 'chaos', name: 'Chaos', color: '#e11d48', borderColor: '#9f1239', icon: 'Skull', isAncient: true, maxLevel: 2, capacities: [60000, 120000] },
  { id: 'happy', name: 'Happy', color: '#10b981', borderColor: '#047857', icon: 'Smile', isAncient: true, maxLevel: 2, capacities: [65000, 130000] },
  { id: 'dream', name: 'Dream', color: '#8b5cf6', borderColor: '#6d28d9', icon: 'CloudMoon', isAncient: true, maxLevel: 2, capacities: [70000, 140000] },
  { id: 'soul', name: 'Soul', color: '#06b6d4', borderColor: '#0e7490', icon: 'Ghost', isAncient: true, maxLevel: 2, capacities: [90000, 180000] },
];

export const ANCIENT_WORLD_CRYSTALS: CrystalDef[] = [
  { id: 'ruby', name: 'Ruby Crystal', color: '#ef4444', desc: 'Used for unlocking & evolving Ancient Dragons' },
  { id: 'sapphire', name: 'Sapphire Crystal', color: '#3b82f6', desc: 'Used for Ancient World dragon progression' },
  { id: 'emerald', name: 'Emerald Crystal', color: '#10b981', desc: 'Used for Ancient World dragon summoning' },
  { id: 'topaz', name: 'Topaz Crystal', color: '#f59e0b', desc: 'Used for Ancient World evolution' },
  { id: 'onyx', name: 'Onyx Crystal', color: '#475569', desc: 'Used for high-tier Ancient Dragon awakening' },
  { id: 'diamond', name: 'Diamond Crystal', color: '#38bdf8', desc: 'Rare resource for Ancient World progression' },
];
