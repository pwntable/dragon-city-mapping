import { useCallback, useEffect, useRef, useState } from 'react';
import { ISLAND_CONFIGS } from '../constants/islands';
import { useOptimizerStore } from '../store/useOptimizerStore';
import { Action } from '../types';
import { canPlaceStructure } from '../utils/coverageCalculator';

export function useCanvasInteraction() {
  const activeIsland = useOptimizerStore((state) => state.activeIsland);
  const mode = useOptimizerStore((state) => state.mode);
  const placementCategory = useOptimizerStore((state) => state.placementCategory);
  const islands = useOptimizerStore((state) => state.islands);
  const grids = useOptimizerStore((state) => state.grids);
  const selectedItemId = useOptimizerStore((state) => state.selectedItemId);

  const setMode = useOptimizerStore((state) => state.setMode);
  const placeStructure = useOptimizerStore((state) => state.placeStructure);
  const removeStructure = useOptimizerStore((state) => state.removeStructure);
  const moveStructure = useOptimizerStore((state) => state.moveStructure);
  const setSelectedItemId = useOptimizerStore((state) => state.setSelectedItemId);
  const setGridTileValue = useOptimizerStore((state) => state.setGridTileValue);
  const commitBatch = useOptimizerStore((state) => state.commitBatch);

  const tileSize = 24;
  const [panX, setPanX] = useState(20);
  const [panY, setPanY] = useState(20);
  const [zoom, setZoom] = useState(1.0);
  const [hoverRow, setHoverRow] = useState(-1);
  const [hoverCol, setHoverCol] = useState(-1);
  const [dragPreview, setDragPreview] = useState<{ row: number; col: number; size: number; isValid: boolean } | null>(null);

  const isDraggingPanRef = useRef(false);
  const isGridPaintingRef = useRef(false);
  const gridPaintValueRef = useRef<number>(1);
  const lastPaintedTileRef = useRef<string>('');
  const gridStrokeActionsRef = useRef<Action[]>([]);

  const startPanRef = useRef({ x: 0, y: 0 });
  const touchStartDistRef = useRef<number | null>(null);
  const touchStartZoomRef = useRef<number>(1.0);
  const viewportRef = useRef<HTMLDivElement | null>(null);

  const dragStructureRef = useRef<{
    id: string;
    startRow: number;
    startCol: number;
    grabOffsetRow: number;
    grabOffsetCol: number;
    size: number;
    isDragging: boolean;
    startClientX: number;
    startClientY: number;
  } | null>(null);

  const config = ISLAND_CONFIGS[activeIsland];
  const currentStructures = islands[activeIsland] || [];
  const currentGrid = grids[activeIsland] || config.gridTemplate;

  let placementSize = 4;
  if (placementCategory === 'crystal') placementSize = 2;
  else if (placementCategory === 'ancient') placementSize = 6;

  const isPlacementValid =
    hoverRow >= 0 && hoverCol >= 0
      ? canPlaceStructure(hoverRow, hoverCol, placementSize, currentGrid, currentStructures)
      : false;

  const isHoveringStructure =
    hoverRow >= 0 &&
    hoverCol >= 0 &&
    currentStructures.some(
      (s) => hoverCol >= s.col && hoverCol < s.col + s.size && hoverRow >= s.row && hoverRow < s.row + s.size
    );

  const resetViewport = useCallback(() => {
    if (!viewportRef.current || !config) return;
    const width = viewportRef.current.clientWidth;
    const height = viewportRef.current.clientHeight;

    const totalW = config.cols * tileSize;
    const totalH = config.rows * tileSize;

    // Adjust zoom dynamically for mobile screens
    let initialZoom = 1.0;
    if (width < 640) {
      initialZoom = Math.min(width / (totalW + 40), 1.0);
    }

    setZoom(initialZoom);
    setPanX(Math.max(10, (width - totalW * initialZoom) / 2));
    setPanY(Math.max(10, (height - totalH * initialZoom) / 2));
  }, [config, tileSize]);

  useEffect(() => {
    resetViewport();
  }, [activeIsland, resetViewport]);

  useEffect(() => {
    const elem = viewportRef.current;
    if (!elem) return;

    /**
     * Checks if the event target or any of its ancestors (up to the viewport)
     * is a scrollable container that can absorb the wheel event.
     * This prevents the canvas zoom from hijacking two-finger trackpad scroll
     * on dropdown menus or any overflow-y:auto/scroll element overlaid on the canvas.
     */
    const isInsideScrollableOverlay = (target: EventTarget | null): boolean => {
      let node = target as HTMLElement | null;
      while (node && node !== elem) {
        const style = window.getComputedStyle(node);
        const overflowY = style.overflowY;
        const isScrollable = overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay';
        if (isScrollable && node.scrollHeight > node.clientHeight) {
          return true;
        }
        // Also detect if the target is inside an absolutely positioned overlay (e.g. dropdown popover)
        const position = style.position;
        if ((position === 'absolute' || position === 'fixed') && node !== elem) {
          // Check if this overlay itself or a child is scrollable
          const innerScrollable = node.querySelector('[style*="overflow"]') ||
            node.querySelector('.overflow-y-auto') ||
            node.querySelector('.overflow-y-scroll');
          if (innerScrollable) return true;
        }
        node = node.parentElement;
      }
      return false;
    };

    const handleWheelNative = (e: WheelEvent) => {
      // If the scroll originates from an overlay scrollable container (e.g. island dropdown),
      // do NOT zoom the canvas. Let the browser handle the scroll naturally.
      if (isInsideScrollableOverlay(e.target)) {
        return;
      }
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
      setZoom((prev) => Math.min(Math.max(prev * zoomFactor, 0.5), 1.8));
    };

    elem.addEventListener('wheel', handleWheelNative, { passive: false });
    return () => {
      elem.removeEventListener('wheel', handleWheelNative);
    };
  }, []);

  const finishGridStroke = useCallback(() => {
    if (isGridPaintingRef.current) {
      isGridPaintingRef.current = false;
      lastPaintedTileRef.current = '';
      if (gridStrokeActionsRef.current.length > 0) {
        commitBatch(gridStrokeActionsRef.current);
        gridStrokeActionsRef.current = [];
      }
    }
  }, [commitBatch]);

  // Global mouseup / touchend listener to guarantee drag cleanup & placement drop
  useEffect(() => {
    const handleGlobalUp = () => {
      finishGridStroke();
      if (dragStructureRef.current) {
        if (dragStructureRef.current.isDragging && hoverRow >= 0 && hoverCol >= 0) {
          const targetRow = hoverRow - dragStructureRef.current.grabOffsetRow;
          const targetCol = hoverCol - dragStructureRef.current.grabOffsetCol;
          if (canPlaceStructure(targetRow, targetCol, dragStructureRef.current.size, currentGrid, currentStructures, dragStructureRef.current.id)) {
            moveStructure(dragStructureRef.current.id, targetRow, targetCol);
          }
        }
        dragStructureRef.current = null;
        setDragPreview(null);
      }
      isDraggingPanRef.current = false;
    };

    window.addEventListener('mouseup', handleGlobalUp);
    window.addEventListener('touchend', handleGlobalUp);

    return () => {
      window.removeEventListener('mouseup', handleGlobalUp);
      window.removeEventListener('touchend', handleGlobalUp);
    };
  }, [hoverRow, hoverCol, currentGrid, currentStructures, moveStructure, finishGridStroke]);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!viewportRef.current) return;
    if ((e.target as HTMLElement).closest('.selection-panel')) return;
    const rect = viewportRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const gridX = (mouseX - panX) / zoom;
    const gridY = (mouseY - panY) / zoom;
    const col = Math.floor(gridX / tileSize);
    const row = Math.floor(gridY / tileSize);

    if (col >= 0 && col < config.cols && row >= 0 && row < config.rows) {
      const clickedHab = currentStructures.find(
        (s) => col >= s.col && col < s.col + s.size && row >= s.row && row < s.row + s.size
      );

      // If user clicks on an existing structure (in ANY mode except erase), auto-select and start drag!
      if (clickedHab && mode !== 'erase' && mode !== 'grid-edit') {
        setSelectedItemId(clickedHab.id);
        setMode('select');
        dragStructureRef.current = {
          id: clickedHab.id,
          startRow: clickedHab.row,
          startCol: clickedHab.col,
          grabOffsetRow: row - clickedHab.row,
          grabOffsetCol: col - clickedHab.col,
          size: clickedHab.size,
          isDragging: false,
          startClientX: e.clientX,
          startClientY: e.clientY,
        };
        return;
      }

      if (mode === 'place') {
        placeStructure(row, col);
      } else if (mode === 'select') {
        // Clicked empty space with a structure selected: relocate structure
        if (selectedItemId) {
          const selectedStruct = currentStructures.find((s) => s.id === selectedItemId);
          if (selectedStruct) {
            const targetRow = row - Math.floor(selectedStruct.size / 2);
            const targetCol = col - Math.floor(selectedStruct.size / 2);
            if (canPlaceStructure(targetRow, targetCol, selectedStruct.size, currentGrid, currentStructures, selectedStruct.id)) {
              moveStructure(selectedStruct.id, targetRow, targetCol);
              return;
            }
          }
        }
        setSelectedItemId(null);
        isDraggingPanRef.current = true;
        startPanRef.current = { x: e.clientX - panX, y: e.clientY - panY };
      } else if (mode === 'erase') {
        if (clickedHab) removeStructure(clickedHab.id);
      } else if (mode === 'grid-edit') {
        const currentVal = currentGrid[row] && currentGrid[row][col] !== undefined ? currentGrid[row][col] : 0;
        const targetVal = currentVal === 1 ? 0 : 1;
        gridStrokeActionsRef.current = [];
        const act = setGridTileValue(row, col, targetVal, false);
        if (act) gridStrokeActionsRef.current.push(act);
        isGridPaintingRef.current = true;
        gridPaintValueRef.current = targetVal;
        lastPaintedTileRef.current = `${row},${col}`;
      }
    } else {
      isDraggingPanRef.current = true;
      startPanRef.current = { x: e.clientX - panX, y: e.clientY - panY };
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!viewportRef.current) return;
    const rect = viewportRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const gridX = (mouseX - panX) / zoom;
    const gridY = (mouseY - panY) / zoom;
    const col = Math.floor(gridX / tileSize);
    const row = Math.floor(gridY / tileSize);

    if (row >= 0 && row < config.rows && col >= 0 && col < config.cols) {
      setHoverRow(row);
      setHoverCol(col);
    } else {
      setHoverRow(-1);
      setHoverCol(-1);
    }

    if (isGridPaintingRef.current && mode === 'grid-edit' && row >= 0 && row < config.rows && col >= 0 && col < config.cols) {
      const key = `${row},${col}`;
      if (key !== lastPaintedTileRef.current) {
        const act = setGridTileValue(row, col, gridPaintValueRef.current, false);
        if (act) gridStrokeActionsRef.current.push(act);
        lastPaintedTileRef.current = key;
      }
    }

    if (dragStructureRef.current) {
      const dist = Math.hypot(e.clientX - dragStructureRef.current.startClientX, e.clientY - dragStructureRef.current.startClientY);
      if (dist > 4) {
        dragStructureRef.current.isDragging = true;
      }

      if (dragStructureRef.current.isDragging && row >= 0 && col >= 0) {
        const propRow = row - dragStructureRef.current.grabOffsetRow;
        const propCol = col - dragStructureRef.current.grabOffsetCol;
        const isValid = canPlaceStructure(propRow, propCol, dragStructureRef.current.size, currentGrid, currentStructures, dragStructureRef.current.id);

        setDragPreview({
          row: propRow,
          col: propCol,
          size: dragStructureRef.current.size,
          isValid,
        });
        return;
      }
    }

    if (isDraggingPanRef.current) {
      setPanX(e.clientX - startPanRef.current.x);
      setPanY(e.clientY - startPanRef.current.y);
    }
  };

  const handleMouseUp = () => {
    finishGridStroke();
    if (dragStructureRef.current) {
      if (dragStructureRef.current.isDragging && hoverRow >= 0 && hoverCol >= 0) {
        const targetRow = hoverRow - dragStructureRef.current.grabOffsetRow;
        const targetCol = hoverCol - dragStructureRef.current.grabOffsetCol;
        if (canPlaceStructure(targetRow, targetCol, dragStructureRef.current.size, currentGrid, currentStructures, dragStructureRef.current.id)) {
          moveStructure(dragStructureRef.current.id, targetRow, targetCol);
        }
      }
      dragStructureRef.current = null;
      setDragPreview(null);
    }
    isDraggingPanRef.current = false;
  };

  // Touch Screen Event Handlers for Mobile & Tablet
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!viewportRef.current) return;
    if ((e.target as HTMLElement).closest('.selection-panel')) return;

    if (e.touches.length === 1) {
      const touch = e.touches[0];
      const rect = viewportRef.current.getBoundingClientRect();
      const mouseX = touch.clientX - rect.left;
      const mouseY = touch.clientY - rect.top;

      const gridX = (mouseX - panX) / zoom;
      const gridY = (mouseY - panY) / zoom;
      const col = Math.floor(gridX / tileSize);
      const row = Math.floor(gridY / tileSize);

      if (col >= 0 && col < config.cols && row >= 0 && row < config.rows) {
        const clickedHab = currentStructures.find(
          (s) => col >= s.col && col < s.col + s.size && row >= s.row && row < s.row + s.size
        );

        if (clickedHab && mode !== 'erase' && mode !== 'grid-edit') {
          setSelectedItemId(clickedHab.id);
          setMode('select');
          dragStructureRef.current = {
            id: clickedHab.id,
            startRow: clickedHab.row,
            startCol: clickedHab.col,
            grabOffsetRow: row - clickedHab.row,
            grabOffsetCol: col - clickedHab.col,
            size: clickedHab.size,
            isDragging: false,
            startClientX: touch.clientX,
            startClientY: touch.clientY,
          };
          return;
        }

        if (mode === 'place') {
          placeStructure(row, col);
        } else if (mode === 'select') {
          if (selectedItemId) {
            const selectedStruct = currentStructures.find((s) => s.id === selectedItemId);
            if (selectedStruct) {
              const targetRow = row - Math.floor(selectedStruct.size / 2);
              const targetCol = col - Math.floor(selectedStruct.size / 2);
              if (canPlaceStructure(targetRow, targetCol, selectedStruct.size, currentGrid, currentStructures, selectedStruct.id)) {
                moveStructure(selectedStruct.id, targetRow, targetCol);
                return;
              }
            }
          }
          setSelectedItemId(null);
          isDraggingPanRef.current = true;
          startPanRef.current = { x: touch.clientX - panX, y: touch.clientY - panY };
        } else if (mode === 'erase') {
          if (clickedHab) removeStructure(clickedHab.id);
        } else if (mode === 'grid-edit') {
          const currentVal = currentGrid[row] && currentGrid[row][col] !== undefined ? currentGrid[row][col] : 0;
          const targetVal = currentVal === 1 ? 0 : 1;
          gridStrokeActionsRef.current = [];
          const act = setGridTileValue(row, col, targetVal, false);
          if (act) gridStrokeActionsRef.current.push(act);
          isGridPaintingRef.current = true;
          gridPaintValueRef.current = targetVal;
          lastPaintedTileRef.current = `${row},${col}`;
        }
      } else {
        isDraggingPanRef.current = true;
        startPanRef.current = { x: touch.clientX - panX, y: touch.clientY - panY };
      }
    } else if (e.touches.length === 2) {
      // Pinch to zoom
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const dist = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY);
      touchStartDistRef.current = dist;
      touchStartZoomRef.current = zoom;
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];

      if (isGridPaintingRef.current && mode === 'grid-edit' && viewportRef.current) {
        const rect = viewportRef.current.getBoundingClientRect();
        const mouseX = touch.clientX - rect.left;
        const mouseY = touch.clientY - rect.top;

        const gridX = (mouseX - panX) / zoom;
        const gridY = (mouseY - panY) / zoom;
        const col = Math.floor(gridX / tileSize);
        const row = Math.floor(gridY / tileSize);

        if (row >= 0 && row < config.rows && col >= 0 && col < config.cols) {
          const key = `${row},${col}`;
          if (key !== lastPaintedTileRef.current) {
            const act = setGridTileValue(row, col, gridPaintValueRef.current, false);
            if (act) gridStrokeActionsRef.current.push(act);
            lastPaintedTileRef.current = key;
          }
        }
        return;
      }

      if (dragStructureRef.current) {
        const dist = Math.hypot(touch.clientX - dragStructureRef.current.startClientX, touch.clientY - dragStructureRef.current.startClientY);
        if (dist > 4) {
          dragStructureRef.current.isDragging = true;
        }

        if (dragStructureRef.current.isDragging && viewportRef.current) {
          const rect = viewportRef.current.getBoundingClientRect();
          const mouseX = touch.clientX - rect.left;
          const mouseY = touch.clientY - rect.top;

          const gridX = (mouseX - panX) / zoom;
          const gridY = (mouseY - panY) / zoom;
          const col = Math.floor(gridX / tileSize);
          const row = Math.floor(gridY / tileSize);

          if (row >= 0 && col >= 0) {
            setHoverRow(row);
            setHoverCol(col);
            const propRow = row - dragStructureRef.current.grabOffsetRow;
            const propCol = col - dragStructureRef.current.grabOffsetCol;
            const isValid = canPlaceStructure(propRow, propCol, dragStructureRef.current.size, currentGrid, currentStructures, dragStructureRef.current.id);

            setDragPreview({
              row: propRow,
              col: propCol,
              size: dragStructureRef.current.size,
              isValid,
            });
            return;
          }
        }
      }

      if (isDraggingPanRef.current) {
        setPanX(touch.clientX - startPanRef.current.x);
        setPanY(touch.clientY - startPanRef.current.y);
      }
    } else if (e.touches.length === 2 && touchStartDistRef.current !== null) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const dist = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY);
      const scale = dist / touchStartDistRef.current;
      setZoom(Math.min(Math.max(touchStartZoomRef.current * scale, 0.5), 1.8));
    }
  };

  const handleTouchEnd = () => {
    finishGridStroke();
    if (dragStructureRef.current) {
      if (dragStructureRef.current.isDragging && hoverRow >= 0 && hoverCol >= 0) {
        const targetRow = hoverRow - dragStructureRef.current.grabOffsetRow;
        const targetCol = hoverCol - dragStructureRef.current.grabOffsetCol;
        if (canPlaceStructure(targetRow, targetCol, dragStructureRef.current.size, currentGrid, currentStructures, dragStructureRef.current.id)) {
          moveStructure(dragStructureRef.current.id, targetRow, targetCol);
        }
      }
      dragStructureRef.current = null;
      setDragPreview(null);
    }
    isDraggingPanRef.current = false;
    touchStartDistRef.current = null;
  };

  return {
    viewportRef,
    tileSize,
    panX,
    panY,
    zoom,
    setZoom,
    hoverRow,
    hoverCol,
    placementSize,
    isPlacementValid,
    isHoveringStructure,
    dragPreview,
    resetViewport,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  };
}
