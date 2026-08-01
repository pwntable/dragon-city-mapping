export interface SpawnArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CameraConfig {
  defaultZoom: number;
  center: {
    x: number;
    y: number;
  };
}

export interface IslandDataset {
  id: number;
  name: string;
  order: number;
  unlocked: boolean;
  premium: boolean;
  gridWidth: number;
  gridHeight: number;
  tileSize: number;
  totalTiles: number;
  buildableTiles: number;
  blockedTiles: number;
  spawnArea: SpawnArea;
  camera: CameraConfig;
  mask: number[][]; // 1 = Buildable, 0 = Blocked
  expansionMask: number[][]; // 0 = Locked, 1 = Available, 2 = Expansion Area
  waterMask: number[][]; // 1 = Water, 0 = Not Water
  cliffMask: number[][]; // 1 = Cliff, 0 = Not Cliff
  collisionMask: number[][]; // 0 = Free, 1 = Occupied, 2 = Permanent Obstacle

  // Optional future fields
  npcSpawnPoints?: { x: number; y: number }[];
  dragonSpawnPoints?: { x: number; y: number }[];
  collectGoldRoute?: { x: number; y: number }[];
  decorationZones?: { x: number; y: number; width: number; height: number }[];
  habitatZones?: { x: number; y: number; width: number; height: number }[];
  buildingZones?: { x: number; y: number; width: number; height: number }[];
  theme?: string;
  background?: string;
  ambientMusic?: string;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}
