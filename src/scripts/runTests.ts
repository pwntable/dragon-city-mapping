import * as fs from 'fs';
import * as path from 'path';
import { IslandDataset } from '../types/islandSchema';
import { validateIslandDataset } from '../utils/islandValidator';
import { IslandRepository } from '../services/islandRepository';

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

console.log('--- Testing Island Dataset Specification ---');

let passedCount = 0;
let failedCount = 0;

expectedFiles.forEach((file) => {
  const filePath = path.join(dataDir, file);
  if (!fs.existsSync(filePath)) {
    console.error(`✗ Missing file: ${file}`);
    failedCount++;
    return;
  }

  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const dataset: IslandDataset = JSON.parse(fileContent);

  const result = validateIslandDataset(dataset);

  if (result.valid) {
    passedCount++;
    console.log(`✓ ${file}: Valid (ID: ${dataset.id}, ${dataset.gridWidth}x${dataset.gridHeight}, Total: ${dataset.totalTiles}, Buildable: ${dataset.buildableTiles}, Blocked: ${dataset.blockedTiles})`);
  } else {
    failedCount++;
    console.error(`✗ ${file}: Invalid`, result.errors);
  }
});

console.log('\n--- IslandRepository Service Check ---');
const allIslands = IslandRepository.getAllIslands();
console.log(`Loaded ${allIslands.length} islands dynamically into IslandRepository.`);

if (failedCount === 0 && passedCount === 15) {
  console.log('\nSUCCESS: All 15 island datasets passed 100% of validation rules!');
} else {
  console.error(`\nFAILED: ${failedCount} tests failed.`);
  process.exit(1);
}
