import { LayoutState } from '../../types';
import skullPresetData from './skull-island-preset.json';

/** Pre-configured island layouts extracted from screenshots */
export const ISLAND_PRESETS: Partial<Record<string, LayoutState>> = {
  skull: skullPresetData as unknown as LayoutState,
};

export type PresetId = keyof typeof ISLAND_PRESETS;
