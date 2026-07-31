import { useEffect } from 'react';
import { useOptimizerStore } from '../store/useOptimizerStore';

interface ShortcutOptions {
  onToggleHelp: () => void;
  onOpenShare: () => void;
  isModalOpen: boolean;
}

export function useKeyboardShortcuts(options: ShortcutOptions) {
  const { onToggleHelp, onOpenShare, isModalOpen } = options;

  const setMode = useOptimizerStore((state) => state.setMode);
  const removeStructure = useOptimizerStore((state) => state.removeStructure);
  const selectedItemId = useOptimizerStore((state) => state.selectedItemId);
  const setSelectedItemId = useOptimizerStore((state) => state.setSelectedItemId);
  const undo = useOptimizerStore((state) => state.undo);
  const redo = useOptimizerStore((state) => state.redo);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore key shortcuts if typing in input/textarea or if modal is open
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      const isCmdOrCtrl = e.metaKey || e.ctrlKey;

      if (isCmdOrCtrl && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
        return;
      }

      if (isCmdOrCtrl && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redo();
        return;
      }

      if (isCmdOrCtrl && e.key.toLowerCase() === 's') {
        e.preventDefault();
        onOpenShare();
        return;
      }

      if (isModalOpen) return;

      switch (e.key) {
        case '1':
          setMode('place');
          break;
        case '2':
          setMode('select');
          break;
        case '3':
          setMode('erase');
          break;
        case '4':
          setMode('grid-edit');
          break;
        case 'Delete':
        case 'Backspace':
          if (selectedItemId) {
            e.preventDefault();
            removeStructure(selectedItemId);
          }
          break;
        case 'Escape':
          setSelectedItemId(null);
          break;
        case '?':
          e.preventDefault();
          onToggleHelp();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setMode, removeStructure, selectedItemId, setSelectedItemId, undo, redo, onToggleHelp, onOpenShare, isModalOpen]);
}
