import React from 'react';
import { IslandConfig } from '../../types';
import { Flame, Trees, Sprout, Gem, Sun } from 'lucide-react';

interface IslandTabProps {
  config: IslandConfig;
  isActive: boolean;
  onSelect: () => void;
}

export const IslandTab: React.FC<IslandTabProps> = ({ config, isActive, onSelect }) => {
  const getIcon = () => {
    switch (config.icon) {
      case 'volcano':
        return <Flame className="w-3.5 h-3.5" />;
      case 'tree':
        return <Trees className="w-3.5 h-3.5" />;
      case 'seedling':
        return <Sprout className="w-3.5 h-3.5" />;
      case 'gem':
        return <Gem className="w-3.5 h-3.5" />;
      case 'sun':
        return <Sun className="w-3.5 h-3.5" />;
      default:
        return <Flame className="w-3.5 h-3.5" />;
    }
  };

  return (
    <button
      onClick={onSelect}
      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
        isActive
          ? 'bg-gradient-to-r from-amber-500 to-red-600 text-white shadow-md'
          : 'text-text-muted hover:text-text-primary hover:bg-surface'
      }`}
    >
      <span style={{ color: isActive ? '#FFFFFF' : config.biomeAccentColor }}>
        {getIcon()}
      </span>
      <span>{config.name.replace(' Island', '')} ({config.cols}x{config.rows})</span>
    </button>
  );
};
