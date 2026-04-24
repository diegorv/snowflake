import { writable } from 'svelte/store';
import type { Framework } from '../domain/types.js';
import type { FrameworkManifestEntry } from '../frameworks/manifest.js';

export const currentFramework = writable<Framework | null>(null);
export const frameworkManifest = writable<FrameworkManifestEntry[]>([]);
