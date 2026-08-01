export type IslandId =
  | 'lava'
  | 'main'
  | 'lush'
  | 'ivory'
  | 'desert'
  | 'skull'
  | 'rainbow'
  | 'ice'
  | 'gothic'
  | 'rune'
  | 'futuristic'
  | 'moon'
  | 'tempest'
  | 'jurassic'
  | 'chronos';

export type ElementType =
  | 'terra'
  | 'flame'
  | 'sea'
  | 'nature'
  | 'electric'
  | 'ice'
  | 'metal'
  | 'dark'
  | 'light'
  | 'war'
  | 'wind'
  | 'pure'
  | 'primal'
  | 'legend'
  | 'beauty'
  | 'magic'
  | 'chaos'
  | 'happy'
  | 'dream'
  | 'soul';

export type PlacementCategory = 'regular' | 'ancient' | 'crystal' | 'ancientWorld';

export type StructureKind = 'habitat' | 'crystal';

export interface HabitatDef {
  id: ElementType;
  name: string;
  color: string;
  borderColor: string;
  icon: string;
  isAncient: boolean;
  maxLevel: number;
  capacities: number[];
}

export interface CrystalDef {
  id: ElementType | string;
  name: string;
  color: string;
  desc: string;
}

export interface PlacedStructure {
  id: string;
  type: ElementType | string;
  kind: StructureKind;
  name: string;
  color: string;
  borderColor?: string;
  icon?: string;
  isAncient: boolean;
  level: number;
  maxLevel: number;
  capacities: number[];
  row: number;
  col: number;
  size: number; // footprint side length (1 for crystal, 4-6 for habitats)
  boostPercent?: number;
  boostingCrystalIds?: string[];
  affectedHabitatIds?: string[];
}

export interface IslandConfig {
  id: IslandId;
  name: string;
  cols: number;
  rows: number;
  maxHabitats: number;
  biomeAccentColor: string;
  icon: string;
  gridTemplate: number[][]; // 1 = buildable land, 0 = non-buildable water/obstacle
}

export type ToolMode = 'place' | 'select' | 'erase' | 'grid-edit';

export type Theme = 'light' | 'dark' | 'system';

export type Action =
  | { type: 'PLACE'; island: IslandId; structure: PlacedStructure }
  | { type: 'REMOVE'; island: IslandId; structure: PlacedStructure }
  | { type: 'UPGRADE'; island: IslandId; id: string; fromLevel: number; toLevel: number; fromSize: number; toSize: number }
  | { type: 'DOWNGRADE'; island: IslandId; id: string; fromLevel: number; toLevel: number; fromSize: number; toSize: number }
  | { type: 'MOVE'; island: IslandId; id: string; fromRow: number; fromCol: number; toRow: number; toCol: number }
  | { type: 'CLEAR'; island: IslandId; structures: PlacedStructure[] }
  | { type: 'GRID_TILE'; island: IslandId; row: number; col: number; fromVal: number; toVal: number; removedStructures?: PlacedStructure[] }
  | { type: 'SET_GRID'; island: IslandId; prevGrid: number[][]; newGrid: number[][] }
  | { type: 'BATCH'; actions: Action[] };

export interface LayoutState {
  version: number;
  islands: Record<IslandId, PlacedStructure[]>;
  grids?: Record<IslandId, number[][]>;
}

export interface BoostStats {
  totalBoostPercentage: number;
  boostedHabitatsCount: number;
}
