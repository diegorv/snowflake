import { derived } from 'svelte/store';
import { decodeHash, encodeHash } from '../domain/hash.js';
import { getRegistry } from '../frameworks/registry.js';
import { currentFramework } from './framework.js';
import { name, title } from './identity.js';
import { milestones } from './milestones.js';

export function readHashOnce(hash: string) {
  return decodeHash(hash, getRegistry());
}

export function readInitialHash(): string {
  if (typeof window === 'undefined') return '';
  return window.location.hash;
}

/**
 * Keep `window.location.hash` in sync with the reactive state.
 *
 * The single idempotency rule is: never call `history.replaceState` if the
 * hash already matches what we would write. That covers both
 *   (a) the initial subscribe emission where the URL is already correct
 *       (user opened a shared link), and
 *   (b) any later no-op writes, so the browser history doesn't fill up.
 */
export function startHashSync(): () => void {
  const combined = derived(
    [currentFramework, milestones, name, title],
    ([$framework, $milestones, $name, $title]) => {
      if (!$framework) return '';
      return encodeHash(
        {
          frameworkId: $framework.id,
          milestones: $milestones,
          name: $name,
          title: $title
        },
        $framework
      );
    }
  );

  return combined.subscribe((hashString) => {
    if (typeof window === 'undefined') return;
    if (!hashString) return;
    const target = `#${hashString}`;
    if (window.location.hash === target) return;
    history.replaceState(null, '', target);
  });
}
