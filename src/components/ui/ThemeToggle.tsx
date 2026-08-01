import React, { useEffect } from 'react';
import { Moon, Sun, Monitor } from 'lucide-react';
import { useOptimizerStore } from '../../store/useOptimizerStore';
import { Theme } from '../../types';

export const ThemeToggle: React.FC = () => {
  const theme = useOptimizerStore((state) => state.theme);
  const setTheme = useOptimizerStore((state) => state.setTheme);

  useEffect(() => {
    const root = document.documentElement;

    const applyResolvedTheme = (resolved: 'dark' | 'light') => {
      if (resolved === 'dark') {
        root.classList.add('dark');
        root.classList.remove('light');
      } else {
        root.classList.add('light');
        root.classList.remove('dark');
      }
    };

    if (theme === 'system') {
      const media = window.matchMedia('(prefers-color-scheme: dark)');
      applyResolvedTheme(media.matches ? 'dark' : 'light');

      const listener = (e: MediaQueryListEvent) => {
        applyResolvedTheme(e.matches ? 'dark' : 'light');
      };
      media.addEventListener('change', listener);
      return () => media.removeEventListener('change', listener);
    } else {
      applyResolvedTheme(theme);
    }
  }, [theme]);

  const themes: { id: Theme; label: string; icon: React.ReactNode }[] = [
    { id: 'dark', label: 'Dark', icon: <Moon className="w-3.5 h-3.5" /> },
    { id: 'light', label: 'Light', icon: <Sun className="w-3.5 h-3.5" /> },
    { id: 'system', label: 'System', icon: <Monitor className="w-3.5 h-3.5" /> },
  ];

  const cycleTheme = () => {
    const nextTheme: Record<Theme, Theme> = {
      dark: 'light',
      light: 'system',
      system: 'dark',
    };
    setTheme(nextTheme[theme]);
  };

  const currentThemeIcon = themes.find((t) => t.id === theme)?.icon;

  return (
    <>
      {/* Compact single-button cycler for mobile (< md) */}
      <button
        type="button"
        onClick={cycleTheme}
        aria-label={`Current Theme: ${theme}. Click to switch theme.`}
        title={`Tema: ${theme} (Klik untuk tukar)`}
        className="flex md:hidden items-center justify-center p-2 min-w-[38px] min-h-[38px] rounded-xl bg-base hover:bg-elevated text-text-primary border border-subtle transition shrink-0"
      >
        {currentThemeIcon}
      </button>

      {/* Full 3-mode selector for medium screens and above (≥ md) */}
      <div className="hidden md:flex items-center bg-base p-1 rounded-xl border border-subtle gap-1 shrink-0">
        {themes.map((item) => {
          const isActive = theme === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setTheme(item.id)}
              title={`Tukar ke mod ${item.label}`}
              aria-label={`Switch to ${item.label} mode`}
              aria-pressed={isActive}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all min-h-[28px] ${
                isActive
                  ? 'bg-gold text-slate-950 font-bold shadow-md'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </>
  );
};
