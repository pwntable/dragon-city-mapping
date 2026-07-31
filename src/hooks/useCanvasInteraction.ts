import { useCallback, useEffect, useRef, useState } from 'react';
import { ISLAND_CONFIGS } from '../constants/islands';
import { useOptimizerStore } from '../store/useOptimizerStore';
import { canPlaceStructure } from '../utils/coverageCalculator';

export function useCanvasInteraction() {
  const activeIsland = useOptimizerStore((state) => state.activeIsland);
  const mode = useOptimizerStore((state) => state.mode);
  const placementCategory = useOptimizerStore((state) => state.placementCategory);
  const islands = useOptimizerStore((state) => state.islands);
  const grids = useOptimizerStore((state) => state.grids);

  const placeStructure = useOptimizerStore((state) => state.placeStructure);
  const removeStructure = useOptimizerStore((state) => state.removeStructure);
  const setSelectedItemId = useOptimizerStore((state) => state.setSelectedItemId);
  const toggleGridTile = useOptimizerStore((state) => state.toggleGridTile);

  const tileSize = 24;
  const [panX, setPanX] = useState(20);
  const [panY, setPanY] = useState(20);
  const [zoom, setZoom] = useState(1.0);
  const [hoverRow, setHoverRow] = useState(-1);
  const [hoverCol, setHoverCol] = useState(-1);

  const isDraggingPanRef = useRef(false);
  const startPanRef = useRef({ x: 0, y: 0 });
  const touchStartDistRef = useRef<number | null>(null);
  const touchStartZoomRef = useRef<number>(1.0);
  const viewportRef = useRef<HTMLDivElement | null>(null);

  const config = ISLAND_CONFIGS[activeIsland];
  const currentStructures = islands[activeIsland] || [];
  const currentGrid = grids[activeIsland] || config.gridTemplate;

  let placementSize = 4;
  if (placementCategory === 'crystal') placementSize = 1;
  else if (placementCategory === 'ancient') placementSize = 6;

  const isPlacementValid =
    hoverRow >= 0 && hoverCol >= 0
      ? canPlaceStructure(hoverRow, hoverCol, placementSize, currentGrid, currentStructures)
      : false;

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

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!viewportRef.current) return;
    const rect = viewportRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const gridX = (mouseX - panX) / zoom;
    const gridY = (mouseY - panY) / zoom;
    const col = Math.floor(gridX / tileSize);
    const row = Math.floor(gridY / tileSize);

    if (col >= 0 && col < config.cols && row >= 0 && row < config.rows) {
      if (mode === 'place') {
        placeStructure(row, col);
      } else if (mode === 'select') {
        const clickedHab = currentStructures.find(
          (s) => col >= s.col && col < s.col + s.size && row >= s.row && row < s.row + s.size
        );
        setSelectedItemId(clickedHab ? clickedHab.id : null);
      } else if (mode === 'erase') {
        const clickedHab = currentStructures.find(
          (s) => col >= s.col && col < s.col + s.size && row >= s.row && row < s.row + s.size
        );
        if (clickedHab) removeStructure(clickedHab.id);
      } else if (mode === 'grid-edit') {
        toggleGridTile(row, col);
      }
    } else {
      isDraggingPanRef.current = true;
      startPanRef.current = { x: e.clientX - panX, y: e.clientY - panY };
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDraggingPanRef.current) {
      setPanX(e.clientX - startPanRef.current.x);
      setPanY(e.clientY - startPanRef.current.y);
      return;
    }

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
  };

  const handleMouseUp = () => {
    isDraggingPanRef.current = false;
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    setZoom((prev) => Math.min(Math.max(prev * zoomFactor, 0.3), 3.0));
  };

  // Touch Screen Event Handlers for Mobile & Tablet
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!viewportRef.current) return;

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
        if (mode === 'place') {
          placeStructure(row, col);
        } else if (mode === 'select') {
          const clickedHab = currentStructures.find(
            (s) => col >= s.col && col < s.col + s.size && row >= s.row && row < s.row + s.size
          );
          setSelectedItemId(clickedHab ? clickedHab.id : null);
        } else if (mode === 'erase') {
          const clickedHab = currentStructures.find(
            (s) => col >= s.col && col < s.col + s.size && row >= s.row && row < s.row + s.size
          );
          if (clickedHab) removeStructure(clickedHab.id);
        } else if (mode === 'grid-edit') {
          toggleGridTile(row, col);
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
    if (e.touches.length === 1 && isDraggingPanRef.current) {
      const touch = e.touches[0];
      setPanX(touch.clientX - startPanRef.current.x);
      setPanY(touch.clientY - startPanRef.current.y);
    } else if (e.touches.length === 2 && touchStartDistRef.current !== null) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const dist = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY);
      const scale = dist / touchStartDistRef.current;
      setZoom(Math.min(Math.max(touchStartZoomRef.current * scale, 0.3), 3.0));
    }
  };

  const handleTouchEnd = () => {
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
    resetViewport,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleWheel,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  };
}
