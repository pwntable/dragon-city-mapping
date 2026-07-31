import { deflateSync, inflateSync, strFromU8, strToU8 } from 'fflate';
import { LayoutState } from '../types';

/**
 * Encodes and compresses layout state into a URI-safe base64 string.
 */
export function encodeLayout(state: LayoutState): string {
  try {
    const json = JSON.stringify(state);
    const compressed = deflateSync(strToU8(json));
    const base64 = btoa(String.fromCharCode(...compressed));
    return base64
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  } catch (err) {
    console.error('Failed to encode layout state:', err);
    return '';
  }
}

/**
 * Decodes and decompresses a URL hash string back into LayoutState.
 */
export function decodeLayout(hash: string): LayoutState | null {
  try {
    const normalized = hash.replace(/-/g, '+').replace(/_/g, '/');
    // Pad base64 string if necessary
    const padLength = (4 - (normalized.length % 4)) % 4;
    const padded = normalized + '='.repeat(padLength);

    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, c => c.charCodeAt(0));
    const json = strFromU8(inflateSync(bytes));
    return JSON.parse(json) as LayoutState;
  } catch (err) {
    console.error('Failed to decode layout hash:', err);
    return null;
  }
}
