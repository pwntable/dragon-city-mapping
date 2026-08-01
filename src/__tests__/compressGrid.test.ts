import { describe, it, expect, beforeEach } from 'vitest';
import { useOptimizerStore } from '../store/useOptimizerStore';

describe('Compress Grid to Placed Buildings Feature', () => {
  beforeEach(() => {
    useOptimizerStore.setState({
      activeIsland: 'skull',
      islands: {
        skull: [],
      } as any,
    });
  });

  it('should return success: false if no structures are placed on the island', () => {
    const res = useOptimizerStore.getState().compressGridToPlacedBuildings('skull');
    expect(res.success).toBe(false);
    expect(res.count).toBe(0);
  });

  it('should compress grid strictly to tiles occupied by placed structures', () => {
    // Place a structure at (10, 10) of size 4x4
    const store = useOptimizerStore.getState();
    store.setActiveIsland('skull');
    
    // Manually push structure into store state for clean testing
    useOptimizerStore.setState((state) => {
      state.islands.skull = [
        {
          id: 'hab_1',
          type: 'terra',
          kind: 'habitat',
          name: 'Terra Habitat',
          color: '#000',
          borderColor: '#111',
          isAncient: false,
          level: 1,
          maxLevel: 7,
          capacities: [1000],
          row: 10,
          col: 10,
          size: 4,
        },
      ];
    });

    const res = useOptimizerStore.getState().compressGridToPlacedBuildings('skull');
    expect(res.success).toBe(true);
    expect(res.count).toBe(1);
    expect(res.tiles).toBe(16);

    const updatedGrid = useOptimizerStore.getState().grids.skull;
    expect(updatedGrid).toBeDefined();

    // Check that (10, 10) through (13, 13) are 1, and outside are 0
    expect(updatedGrid[10][10]).toBe(1);
    expect(updatedGrid[13][13]).toBe(1);
    expect(updatedGrid[9][9]).toBe(0);
    expect(updatedGrid[14][14]).toBe(0);

    // Count total buildable tiles in updatedGrid
    let buildableCount = 0;
    updatedGrid.forEach((row) => {
      row.forEach((cell) => {
        if (cell === 1) buildableCount++;
      });
    });

    expect(buildableCount).toBe(16); // 4x4 structure = 16 tiles
  });
});
