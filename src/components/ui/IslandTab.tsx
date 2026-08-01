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
    const props = { className: 'w-3.5 h-3.5 shrink-0' };
    switch (config.icon) {
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
      default:
        return <Flame {...props} />;
    }
  };

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-label={`Select ${config.name} (${config.cols} by ${config.rows})`}
      aria-current={isActive ? 'page' : undefined}
      style={{
        backgroundColor: isActive ? `${config.biomeAccentColor}22` : undefined,
        borderColor: isActive ? `${config.biomeAccentColor}60` : undefined,
        color: isActive ? config.biomeAccentColor : undefined,
      }}
      className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 shrink-0 whitespace-nowrap border min-h-[34px] ${
        isActive
          ? 'shadow-md border-solid ring-1 ring-inset'
          : 'border-transparent text-text-muted hover:text-text-primary hover:bg-surface'
      }`}
    >
      <span style={{ color: config.biomeAccentColor }}>
        {getIcon()}
      </span>
      <span>{config.name.replace(' Island', '')}</span>
      <span
        className={`text-[10px] font-mono font-medium px-1.5 py-0.5 rounded-md ${
          isActive
            ? 'bg-surface/80 border border-subtle'
            : 'bg-base/60 text-text-muted border border-subtle/50'
        }`}
      >
        {config.cols}x{config.rows}
      </span>
    </button>
  );
};
