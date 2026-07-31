import { CRYSTAL_CONFIG } from '../constants/habitats';
import { IslandConfig, PlacedStructure } from '../types';

export interface RenderOptions {
  ctx: CanvasRenderingContext2D;
  canvasWidth: number;
  canvasHeight: number;
  islandConfig: IslandConfig;
  grid: number[][];
  structures: PlacedStructure[];
  selectedItemId: string | null;
  hoverRow: number;
  hoverCol: number;
  currentMode: string;
  placementCategory: string;
  placementSize: number;
  isPlacementValid: boolean;
  tileSize: number;
  panX: number;
  panY: number;
  zoom: number;
  isDarkMode: boolean;
}

export function renderCanvas(options: RenderOptions) {
  const {
    ctx,
    canvasWidth,
    canvasHeight,
    islandConfig,
    grid,
    structures,
    selectedItemId,
    hoverRow,
    hoverCol,
    currentMode,
    placementSize,
    isPlacementValid,
    tileSize,
    panX,
    panY,
    zoom,
    isDarkMode,
  } = options;

  ctx.clearRect(0, 0, canvasWidth, canvasHeight);

  ctx.save();
  ctx.translate(panX, panY);
  ctx.scale(zoom, zoom);

  const rows = islandConfig.rows;
  const cols = islandConfig.cols;

  // 1. Draw Island Grid
  const landFill = isDarkMode ? '#161A24' : '#FFFFFF';
  const landStroke = isDarkMode ? '#2A3042' : '#E2E8F0';
  const waterFill = isDarkMode ? '#0D0F14' : '#F1F5F9';
  const waterStroke = isDarkMode ? '#1E2330' : '#CBD5E1';

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const isLand = grid[r] && grid[r][c] === 1;
      const x = c * tileSize;
      const y = r * tileSize;

      ctx.fillStyle = isLand ? landFill : waterFill;
      ctx.fillRect(x, y, tileSize, tileSize);

      ctx.strokeStyle = isLand ? landStroke : waterStroke;
      ctx.lineWidth = 0.5;
      ctx.strokeRect(x, y, tileSize, tileSize);
    }
  }

  // 2. Draw Crystal Coverage Visual Overlays & Link Lines
  if (selectedItemId) {
    const selectedCrys = structures.find(s => s.id === selectedItemId && s.kind === 'crystal');
    if (selectedCrys) {
      // Draw 11x11 Coverage Overlay Box around crystal (5-tile radius)
      const minR = Math.max(0, selectedCrys.row - CRYSTAL_CONFIG.radius);
      const maxR = Math.min(rows - 1, selectedCrys.row + CRYSTAL_CONFIG.radius);
      const minC = Math.max(0, selectedCrys.col - CRYSTAL_CONFIG.radius);
      const maxC = Math.min(cols - 1, selectedCrys.col + CRYSTAL_CONFIG.radius);

      const boxX = minC * tileSize;
      const boxY = minR * tileSize;
      const boxW = (maxC - minC + 1) * tileSize;
      const boxH = (maxR - minR + 1) * tileSize;

      ctx.fillStyle = selectedCrys.color + '22';
      ctx.strokeStyle = selectedCrys.color;
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.fillRect(boxX, boxY, boxW, boxH);
      ctx.strokeRect(boxX, boxY, boxW, boxH);
      ctx.setLineDash([]);

      // Draw connection lines to affected habitats
      (selectedCrys.affectedHabitatIds || []).forEach(habId => {
        const hab = structures.find(s => s.id === habId);
        if (hab) {
          ctx.beginPath();
          ctx.moveTo((selectedCrys.col + 0.5) * tileSize, (selectedCrys.row + 0.5) * tileSize);
          ctx.lineTo((hab.col + hab.size / 2) * tileSize, (hab.row + hab.size / 2) * tileSize);
          ctx.strokeStyle = '#6EE7F7';
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      });
    }

    const selectedHab = structures.find(s => s.id === selectedItemId && s.kind === 'habitat');
    if (selectedHab) {
      // Draw connection lines to boosting crystals
      (selectedHab.boostingCrystalIds || []).forEach(crysId => {
        const crys = structures.find(s => s.id === crysId);
        if (crys) {
          ctx.beginPath();
          ctx.moveTo((selectedHab.col + selectedHab.size / 2) * tileSize, (selectedHab.row + selectedHab.size / 2) * tileSize);
          ctx.lineTo((crys.col + 0.5) * tileSize, (crys.row + 0.5) * tileSize);
          ctx.strokeStyle = '#4ADE80';
          ctx.lineWidth = 2.5;
          ctx.stroke();
        }
      });
    }
  }

  // 3. Draw Habitats
  structures.filter(s => s.kind === 'habitat').forEach(hab => {
    const x = hab.col * tileSize;
    const y = hab.row * tileSize;
    const sizePx = hab.size * tileSize;

    ctx.fillStyle = hab.color + '33';
    ctx.strokeStyle = hab.borderColor || hab.color;
    ctx.lineWidth = 2;

    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(x + 1, y + 1, sizePx - 2, sizePx - 2, 6);
    } else {
      ctx.rect(x + 1, y + 1, sizePx - 2, sizePx - 2);
    }
    ctx.fill();
    ctx.stroke();

    // Draw Name Label & Boost Badge
    ctx.fillStyle = isDarkMode ? '#FFFFFF' : '#0F172A';
    ctx.font = 'bold 11px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(hab.name, x + sizePx / 2, y + sizePx / 2 - 4);

    const boostText = hab.boostPercent && hab.boostPercent > 0 ? ` (+${hab.boostPercent}%)` : '';
    ctx.fillStyle = hab.isAncient ? '#C084FC' : '#F5C842';
    ctx.font = '9px Inter, sans-serif';
    ctx.fillText(`Lv.${hab.level}${boostText}`, x + sizePx / 2, y + sizePx / 2 + 10);

    if (selectedItemId === hab.id) {
      ctx.strokeStyle = '#F5C842';
      ctx.lineWidth = 3;
      ctx.strokeRect(x - 2, y - 2, sizePx + 4, sizePx + 4);
    }
  });

  // 4. Draw Crystals
  structures.filter(s => s.kind === 'crystal').forEach(crys => {
    const x = crys.col * tileSize;
    const y = crys.row * tileSize;

    ctx.fillStyle = crys.color;
    ctx.beginPath();
    ctx.arc(x + tileSize / 2, y + tileSize / 2, tileSize / 2 - 2, 0, Math.PI * 2);
    ctx.fill();

    if (selectedItemId === crys.id) {
      ctx.strokeStyle = '#6EE7F7';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(x - 1, y - 1, tileSize + 2, tileSize + 2);
    }
  });

  // 5. Draw Placement Hover Preview
  if (hoverRow >= 0 && hoverCol >= 0 && currentMode === 'place') {
    const x = hoverCol * tileSize;
    const y = hoverRow * tileSize;
    const sizePx = placementSize * tileSize;

    ctx.fillStyle = isPlacementValid ? '#4ADE8066' : '#EF444466';
    ctx.strokeStyle = isPlacementValid ? '#4ADE80' : '#EF4444';
    ctx.lineWidth = 2;

    ctx.fillRect(x, y, sizePx, sizePx);
    ctx.strokeRect(x, y, sizePx, sizePx);
  }

  ctx.restore();
}
