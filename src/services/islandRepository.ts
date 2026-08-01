import { IslandDataset } from '../types/islandSchema';
import { validateIslandDataset } from '../utils/islandValidator';

class IslandRepositoryService {
  private islands: Map<number, IslandDataset> = new Map();
  private initialized = false;

  constructor() {
    this.init();
  }

  public init(): void {
    if (this.initialized) return;
    this.islands.clear();

    // In Vite browser build: eager load all island JSONs from ../data/islands/
    if (typeof import.meta !== 'undefined' && typeof (import.meta as any).glob === 'function') {
      const islandModules = (import.meta as any).glob('../data/islands/*.json', { eager: true });
      for (const pathKey in islandModules) {
        const dataset = (islandModules[pathKey] as { default: IslandDataset }).default || (islandModules[pathKey] as IslandDataset);
        if (dataset && dataset.id) {
          const validation = validateIslandDataset(dataset);
          if (validation.valid) {
            this.islands.set(dataset.id, dataset);
          }
        }
      }
    }

    this.initialized = true;
  }

  public async loadFromRemote(baseUrl = '/data/islands'): Promise<void> {
    const list = [
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

    for (const file of list) {
      try {
        const res = await fetch(`${baseUrl}/${file}`);
        if (res.ok) {
          const dataset: IslandDataset = await res.json();
          const validation = validateIslandDataset(dataset);
          if (validation.valid) {
            this.islands.set(dataset.id, dataset);
          }
        }
      } catch (err) {
        console.error(`[IslandRepository] Failed to fetch remote island file ${file}:`, err);
      }
    }
  }

  public getAllIslands(): IslandDataset[] {
    return Array.from(this.islands.values()).sort((a, b) => a.order - b.order);
  }

  public getIslandById(id: number): IslandDataset | undefined {
    return this.islands.get(id);
  }

  public getIslandByName(name: string): IslandDataset | undefined {
    return this.getAllIslands().find((i) => i.name.toLowerCase() === name.toLowerCase());
  }

  public getUnlockedIslands(): IslandDataset[] {
    return this.getAllIslands().filter((i) => i.unlocked);
  }

  public getFreeIslands(): IslandDataset[] {
    return this.getAllIslands().filter((i) => !i.premium);
  }

  public getPremiumIslands(): IslandDataset[] {
    return this.getAllIslands().filter((i) => i.premium);
  }
}

export const IslandRepository = new IslandRepositoryService();
