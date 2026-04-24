import { get, writable } from 'svelte/store';
import { currentFramework } from './framework.js';

export const focusedTrackId = writable<string>('');

export function shiftFocus(delta: number): void {
  const framework = get(currentFramework);
  if (!framework) return;
  const ids = framework.tracks.map((t) => t.id);
  const current = get(focusedTrackId);
  const idx = ids.indexOf(current);
  const base = idx < 0 ? 0 : idx;
  const next = (base + delta + ids.length) % ids.length;
  focusedTrackId.set(ids[next]);
}
