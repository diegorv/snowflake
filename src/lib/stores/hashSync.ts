import { derived } from 'svelte/store';
import { decodeHash, encodeHash } from '../domain/hash.js';
import { getRegistry } from '../frameworks/registry.js';
import { currentFramework } from './framework.js';
import { name, title } from './identity.js';
import { milestones } from './milestones.js';

export function readHashOnce(hash: string) {
  return decodeHash(hash, getRegistry());
}

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

  let first = true;
  return combined.subscribe((hashString) => {
    if (typeof window === 'undefined') return;
    if (first) {
      first = false;
      const existing = window.location.hash.slice(1);
      if (existing === hashString) return;
    }
    if (!hashString) return;
    const target = `#${hashString}`;
    if (window.location.hash === target) return;
    history.replaceState(null, '', target);
  });
}

export function readInitialHash(): string {
  if (typeof window === 'undefined') return '';
  return window.location.hash;
}
