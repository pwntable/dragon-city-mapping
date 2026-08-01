import React, { useState, useRef, useEffect } from 'react';
import {
  Flame,
  Trees,
  Sprout,
  Gem,
  Sun,
  Skull,
  Sparkles,
  Snowflake,
  Castle,
  Compass,
  Zap,
  Moon,
  Wind,
  Footprints,
  Clock,
  ChevronDown,
  Check,
  MapPin,
} from 'lucide-react';
import { ISLAND_CONFIGS } from '../../constants/islands';
import { useOptimizerStore } from '../../store/useOptimizerStore';
import { IslandId } from '../../types';

interface IslandSelectDropdownProps {
  className?: string;
  variant?: 'header' | 'sidebar' | 'floating';
}

export const IslandSelectDropdown: React.FC<IslandSelectDropdownProps> = ({
  className = '',
  variant = 'header',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeIsland = useOptimizerStore((state) => state.activeIsland);
  const setActiveIsland = useOptimizerStore((state) => state.setActiveIsland);
  const islands = useOptimizerStore((state) => state.islands);

  const currentConfig = ISLAND_CONFIGS[activeIsland];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const getIcon = (iconName: string, color: string) => {
    const props = { className: 'w-4 h-4 shrink-0', style: { color } };
    switch (iconName) {
      case 'volcano':
        return <Flame {...props} />;
      case 'tree':
        return <Trees {...props} />;
      case 'seedling':
        return <Sprout {...props} />;
      case 'gem':
        return <Gem {...props} />;
      case 'sun':
        return <Sun {...props} />;
      case 'skull':
        return <Skull {...props} />;
      case 'sparkles':
        return <Sparkles {...props} />;
      case 'snowflake':
        return <Snowflake {...props} />;
      case 'castle':
        return <Castle {...props} />;
      case 'compass':
        return <Compass {...props} />;
      case 'zap':
        return <Zap {...props} />;
      case 'moon':
        return <Moon {...props} />;
      case 'wind':
        return <Wind {...props} />;
      case 'footprints':
        return <Footprints {...props} />;
      case 'clock':
        return <Clock {...props} />;
      default:
        return <Flame {...props} />;
    }
  };

  return (
    <div
      className={`relative inline-block text-left ${className}`}
      ref={dropdownRef}
      onMouseDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
      onWheel={(e) => e.stopPropagation()}
    >
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label="Pilih Pulau (Island)"
        className={`flex items-center gap-1.5 rounded-2xl text-xs font-bold transition-all shadow-md border backdrop-blur-md min-h-[38px] ${
          variant === 'header'
            ? 'px-2.5 sm:px-3 py-1.5 bg-base hover:bg-elevated text-text-primary border-subtle'
            : variant === 'sidebar'
            ? 'px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-gold border-amber-500/30'
            : 'px-3 py-2 bg-surface/90 hover:bg-surface text-text-primary border-subtle hover:scale-[1.02] active:scale-[0.98]'
        }`}
      >
        <span className="flex items-center gap-1.5">
          {getIcon(currentConfig?.icon || 'volcano', currentConfig?.biomeAccentColor || '#FF5733')}
          <span className="font-extrabold text-text-primary">{(currentConfig?.name || 'Lava Island').replace(' Island', '')}</span>
          <span className="text-[10px] text-text-muted font-medium bg-base/60 px-1.5 py-0.5 rounded-lg border border-subtle/50 font-mono">
            {currentConfig?.cols || 26}x{currentConfig?.rows || 28}
          </span>
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-text-muted transition-transform duration-200 ${isOpen ? 'rotate-180 text-gold' : ''}`} />
      </button>

      {/* Popover / Popup Dropdown Menu */}
      {isOpen && (
        <div
          onWheel={(e) => e.stopPropagation()}
          className="absolute left-0 mt-2 w-64 rounded-2xl bg-surface/95 backdrop-blur-xl border border-subtle shadow-2xl z-50 p-2 space-y-1 animate-in fade-in slide-in-from-top-2 duration-150"
        >
          <div className="px-2 py-1.5 border-b border-subtle flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-text-muted flex items-center gap-1">
              <MapPin className="w-3 h-3 text-gold" />
              <span>Pilih Pulau (Island)</span>
            </span>
            <span className="text-[9px] bg-base px-1.5 py-0.5 rounded-md text-text-muted font-mono">
              15 Islands
            </span>
          </div>

          <div className="space-y-1 pt-1 max-h-72 sm:max-h-80 overflow-y-auto overscroll-contain pr-1">
            {(Object.keys(ISLAND_CONFIGS) as IslandId[]).map((id) => {
              const config = ISLAND_CONFIGS[id];
              const isActive = activeIsland === id;
              const habCount = (islands[id] || []).filter((s) => s.kind === 'habitat').length;

              return (
                <button
                  key={id}
                  ref={(el) => {
                    if (isActive && el && isOpen) {
                      setTimeout(() => el.scrollIntoView({ block: 'nearest', behavior: 'smooth' }), 50);
                    }
                  }}
                  onClick={() => {
                    setActiveIsland(id);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-2.5 py-2 rounded-xl transition flex items-center justify-between gap-2 text-xs ${
                    isActive
                      ? 'bg-gradient-to-r from-amber-500/20 to-red-500/20 border border-amber-500/40 text-text-primary font-bold'
                      : 'hover:bg-elevated text-text-muted hover:text-text-primary border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border"
                      style={{
                        backgroundColor: `${config.biomeAccentColor}15`,
                        borderColor: `${config.biomeAccentColor}40`,
                      }}
                    >
                      {getIcon(config.icon, config.biomeAccentColor)}
                    </div>
                    <div className="truncate">
                      <div className="font-bold text-text-primary flex items-center gap-1">
                        <span>{config.name}</span>
                      </div>
                      <div className="text-[10px] text-text-muted flex items-center gap-2">
                        <span>{config.cols}x{config.rows} Grid</span>
                        <span>•</span>
                        <span>{habCount}/{config.maxHabitats || 24} Hab</span>
                      </div>
                    </div>
                  </div>

                  {isActive && (
                    <span className="w-5 h-5 rounded-full bg-gold text-slate-950 flex items-center justify-center shrink-0 shadow">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
