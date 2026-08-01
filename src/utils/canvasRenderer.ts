import { CRYSTAL_CONFIG } from '../constants/habitats';
import { IslandConfig, PlacedStructure } from '../types';
import { getHabitatsInCrystalRange } from './coverageCalculator';

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
  dragPreview?: { row: number; col: number; size: number; isValid: boolean } | null;
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
    dragPreview,
  } = options;

  ctx.clearRect(0, 0, canvasWidth, canvasHeight);

  ctx.save();
  ctx.translate(panX, panY);
  ctx.scale(zoom, zoom);

  const rows = islandConfig.rows;
  const cols = islandConfig.cols;

  // 1. Draw Island Grid
  const landFill = isDarkMode ? '#1E293B' : '#F8FAFC';
  const landStroke = isDarkMode ? '#334155' : '#CBD5E1';
  const waterStroke = isDarkMode ? 'rgba(30, 41, 59, 0.2)' : 'rgba(226, 232, 240, 0.2)';

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const isLand = grid[r] && grid[r][c] === 1;
      const x = c * tileSize;
      const y = r * tileSize;

      if (isLand) {
        ctx.fillStyle = landFill;
        ctx.fillRect(x, y, tileSize, tileSize);
        ctx.strokeStyle = landStroke;
        ctx.lineWidth = 0.5;
        ctx.strokeRect(x, y, tileSize, tileSize);
      } else {
        ctx.strokeStyle = waterStroke;
        ctx.lineWidth = 0.2;
        ctx.strokeRect(x, y, tileSize, tileSize);
      }
    }
  }

  // 2. Draw Crystal Coverage Visual Overlays & Link Lines
  if (selectedItemId) {
    const selectedCrys = structures.find(s => s.id === selectedItemId && s.kind === 'crystal');
    if (selectedCrys) {
      const crysSize = selectedCrys.size || 2;
      // Draw Coverage Overlay Box around crystal (5-tile radius around 2x2 crystal = 12x12 area)
      const minR = Math.max(0, selectedCrys.row - CRYSTAL_CONFIG.radius);
      const maxR = Math.min(rows - 1, selectedCrys.row + crysSize - 1 + CRYSTAL_CONFIG.radius);
      const minC = Math.max(0, selectedCrys.col - CRYSTAL_CONFIG.radius);
      const maxC = Math.min(cols - 1, selectedCrys.col + crysSize - 1 + CRYSTAL_CONFIG.radius);

      const boxX = minC * tileSize;
      const boxY = minR * tileSize;
      const boxW = (maxC - minC + 1) * tileSize;
      const boxH = (maxR - minR + 1) * tileSize;

      ctx.fillStyle = selectedCrys.color + '1F';
      ctx.strokeStyle = selectedCrys.color;
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.fillRect(boxX, boxY, boxW, boxH);
      ctx.strokeRect(boxX, boxY, boxW, boxH);
      ctx.setLineDash([]);

      const { matching, nonMatching } = getHabitatsInCrystalRange(selectedCrys, structures);
      const crysCenterX = (selectedCrys.col + crysSize / 2) * tileSize;
      const crysCenterY = (selectedCrys.row + crysSize / 2) * tileSize;

      // Draw non-matching habitats connection lines (orange/amber dashed warning line)
      nonMatching.forEach(hab => {
        const habX = (hab.col + hab.size / 2) * tileSize;
        const habY = (hab.row + hab.size / 2) * tileSize;

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(crysCenterX, crysCenterY);
        ctx.lineTo(habX, habY);
        ctx.strokeStyle = '#F97316';
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = 0.5;
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.restore();
      });

      // Draw matching habitats connection lines (bright emerald green solid line with glow)
      matching.forEach(hab => {
        const habX = (hab.col + hab.size / 2) * tileSize;
        const habY = (hab.row + hab.size / 2) * tileSize;

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(crysCenterX, crysCenterY);
        ctx.lineTo(habX, habY);
        ctx.strokeStyle = '#4ADE80';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Highlight box around matching boosted habitat
        const hX = hab.col * tileSize;
        const hY = hab.row * tileSize;
        const hSize = hab.size * tileSize;
        ctx.strokeStyle = '#4ADE80';
        ctx.lineWidth = 2;
        ctx.setLineDash([3, 3]);
        ctx.strokeRect(hX - 2, hY - 2, hSize + 4, hSize + 4);
        ctx.restore();
      });
    }

    const selectedHab = structures.find(s => s.id === selectedItemId && s.kind === 'habitat');
    if (selectedHab) {
      // Draw connection lines to boosting crystals
      (selectedHab.boostingCrystalIds || []).forEach(crysId => {
        const crys = structures.find(s => s.id === crysId);
        if (crys) {
          const crysSize = crys.size || 2;
          const crysCenterX = (crys.col + crysSize / 2) * tileSize;
          const crysCenterY = (crys.row + crysSize / 2) * tileSize;
          const cSizePx = crysSize * tileSize;

          ctx.save();
          ctx.beginPath();
          ctx.moveTo((selectedHab.col + selectedHab.size / 2) * tileSize, (selectedHab.row + selectedHab.size / 2) * tileSize);
          ctx.lineTo(crysCenterX, crysCenterY);
          ctx.strokeStyle = '#4ADE80';
          ctx.lineWidth = 2.5;
          ctx.stroke();

          // Highlight crystal node
          const cX = crys.col * tileSize;
          const cY = crys.row * tileSize;
          ctx.strokeStyle = '#4ADE80';
          ctx.lineWidth = 2;
          ctx.strokeRect(cX - 3, cY - 3, cSizePx + 6, cSizePx + 6);
          ctx.restore();
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

  // 4. Draw Crystals (2x2)
  structures.filter(s => s.kind === 'crystal').forEach(crys => {
    const crysSize = crys.size || 2;
    const x = crys.col * tileSize;
    const y = crys.row * tileSize;
    const sizePx = crysSize * tileSize;

    ctx.save();
    ctx.fillStyle = crys.color + '33';
    ctx.strokeStyle = crys.color;
    ctx.lineWidth = 2;

    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(x + 1, y + 1, sizePx - 2, sizePx - 2, 4);
    } else {
      ctx.rect(x + 1, y + 1, sizePx - 2, sizePx - 2);
    }
    ctx.fill();
    ctx.stroke();

    // Draw Inner Gem Circle
    ctx.fillStyle = crys.color;
    ctx.beginPath();
    ctx.arc(x + sizePx / 2, y + sizePx / 2, sizePx / 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Text Label "Crystal"
    ctx.fillStyle = isDarkMode ? '#FFFFFF' : '#0F172A';
    ctx.font = 'bold 9px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Crystal', x + sizePx / 2, y + sizePx / 2 + 3);

    if (selectedItemId === crys.id) {
      ctx.strokeStyle = '#6EE7F7';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(x - 2, y - 2, sizePx + 4, sizePx + 4);
    }
    ctx.restore();
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

  // 6. Draw Move/Drag Ghost Preview
  if (dragPreview && dragPreview.row >= 0 && dragPreview.col >= 0) {
    const x = dragPreview.col * tileSize;
    const y = dragPreview.row * tileSize;
    const sizePx = dragPreview.size * tileSize;

    ctx.fillStyle = dragPreview.isValid ? '#34D39955' : '#F8717155';
    ctx.strokeStyle = dragPreview.isValid ? '#10B981' : '#EF4444';
    ctx.lineWidth = 3;
    ctx.setLineDash([6, 6]);

    ctx.fillRect(x, y, sizePx, sizePx);
    ctx.strokeRect(x, y, sizePx, sizePx);
    ctx.setLineDash([]);
  }

  ctx.restore();
}
