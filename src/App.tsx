import React, { useEffect, useState } from 'react';
import { CanvasViewport } from './components/canvas/CanvasViewport';
import { SelectionPanel } from './components/canvas/SelectionPanel';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { KeyboardHint } from './components/ui/KeyboardHint';
import { ToastContainer, ToastMessage } from './components/ui/ToastContainer';
import { OptimizeModal } from './components/modals/OptimizeModal';
import { ShareModal } from './components/modals/ShareModal';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useOptimizerStore } from './store/useOptimizerStore';
import { decodeLayout } from './utils/shareEncoder';

export const App: React.FC = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isOptimizeOpen, setIsOptimizeOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  const importLayout = useOptimizerStore((state) => state.importLayout);

  const showToast = (text: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 5);
    setToasts((prev) => [...prev, { id, text, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Keyboard Shortcuts Hook
  useKeyboardShortcuts({
    onToggleHelp: () => setIsHelpOpen((prev) => !prev),
    onOpenShare: () => setIsShareOpen(true),
    isModalOpen: isShareOpen || isOptimizeOpen || isHelpOpen,
  });

  // URL Hash Auto-Load Listener
  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.includes('layout=')) {
      const layoutHash = hash.split('layout=')[1];
      if (layoutHash) {
        const decoded = decodeLayout(layoutHash);
        if (decoded) {
          importLayout(decoded);
          showToast('Layout loaded from share URL link!', 'success');
        }
      }
    }
  }, [importLayout]);

  const exportAsPNG = () => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `dragon-city-layout-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    showToast('Island canvas exported to PNG!', 'success');
  };

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-base text-text-primary">
      {/* Toast Notification Container */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Header */}
      <Header
        onOpenOptimizeModal={() => setIsOptimizeOpen(true)}
        onOpenShareModal={() => setIsShareOpen(true)}
        onToggleHelp={() => setIsHelpOpen((prev) => !prev)}
        onExportPNG={exportAsPNG}
        onToast={showToast}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Sidebar */}
        <Sidebar onToast={showToast} />

        {/* Canvas Viewport */}
        <div className="flex-1 relative flex overflow-hidden">
          <CanvasViewport />
          <SelectionPanel onToast={showToast} />
        </div>
      </div>

      {/* Modals */}
      <ShareModal isOpen={isShareOpen} onClose={() => setIsShareOpen(false)} onToast={showToast} />
      <OptimizeModal isOpen={isOptimizeOpen} onClose={() => setIsOptimizeOpen(false)} onToast={showToast} />
      <KeyboardHint isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </div>
  );
};

export default App;
