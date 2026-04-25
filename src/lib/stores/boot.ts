import { get } from 'svelte/store';
import { loadManifest, type FrameworkManifestEntry } from '../frameworks/manifest.js';
import { loadFramework } from '../frameworks/loader.js';
import { frameworkManifest } from './framework.js';
import { name, title } from './identity.js';
import { selectFramework } from './actions.js';
import { eligibleTitlesStore } from './derived.js';
import { readHashOnce, readInitialHash, startHashSync } from './hashSync.js';

export interface BootOptions {
  fetch?: typeof fetch;
  /** Base path prefix (matches `$app/paths.base`). Default ''. */
  base?: string;
  /** Preloaded initial hash (falls back to window.location.hash). */
  initialHash?: string;
  /**
   * Cache-busting token appended to framework JSON fetches as `?v=<version>`.
   * Defaults to `import.meta.env.VITE_BUILD_VERSION` (set at build time, e.g.
   * to `${{ github.sha }}` in CI). When unset, no query string is added.
   */
  version?: string;
}

export interface BootResult {
  /** Frameworks from the manifest that failed to preload. */
  failedIds: string[];
  /** Tear down every subscription started during boot. */
  teardown: () => void;
}

function prefixManifestPaths(
  entries: FrameworkManifestEntry[],
  base: string
): FrameworkManifestEntry[] {
  return entries.map((entry) => ({
    ...entry,
    path: entry.path.startsWith('http')
      ? entry.path
      : `${base}${entry.path.startsWith('/') ? '' : '/'}${entry.path}`
  }));
}

/**
 * Orchestrate the app's boot sequence:
 *   1. Fetch the manifest.
 *   2. Preload every entry (so hash decoding can find any framework synchronously).
 *   3. Restore state from the URL hash if present, otherwise default to the
 *      first framework.
 *   4. Start hash sync and the title-auto-snap subscription.
 *
 * Returns a teardown that unsubscribes everything. Designed so the route file
 * stays a thin shell and the flow can be unit-tested in isolation.
 */
export async function bootApp(options: BootOptions = {}): Promise<BootResult> {
  const fetchImpl = options.fetch ?? fetch;
  const base = options.base ?? '';
  const version = options.version ?? import.meta.env.VITE_BUILD_VERSION;

  const rawManifest = await loadManifest(
    fetchImpl,
    `${base}/frameworks/index.json`,
    version
  );
  if (rawManifest.length === 0) {
    throw new Error(
      'No frameworks configured. Add at least one entry to static/frameworks/index.json.'
    );
  }
  const manifest = prefixManifestPaths(rawManifest, base);
  frameworkManifest.set(manifest);

  const results = await Promise.all(
    manifest.map((entry) =>
      loadFramework(entry, fetchImpl, version)
        .then(() => ({ id: entry.id, ok: true as const }))
        .catch((err) => {
          console.warn(`Failed to preload framework "${entry.id}":`, err);
          return { id: entry.id, ok: false as const };
        })
    )
  );
  const failed = new Set(results.filter((r) => !r.ok).map((r) => r.id));
  if (failed.size > 0) {
    frameworkManifest.set(manifest.filter((m) => !failed.has(m.id)));
  }
  const usable = get(frameworkManifest);
  if (usable.length === 0) {
    throw new Error(
      'No frameworks could be loaded. Check your network and static/frameworks/*.json files.'
    );
  }

  const decoded = readHashOnce(options.initialHash ?? readInitialHash());
  if (decoded) {
    name.set(decoded.name);
    title.set(decoded.title);
    await selectFramework(decoded.frameworkId, decoded.milestones);
    // selectFramework may overwrite title if the hash title is no longer
    // eligible; restore the user's choice when it *is* still in range.
    if (decoded.title) title.set(decoded.title);
  } else {
    await selectFramework(usable[0].id);
  }

  const unsubscribeHash = startHashSync();
  const unsubscribeTitleSnap = eligibleTitlesStore.subscribe((eligible) => {
    if (eligible.length === 0) return;
    const current = get(title);
    if (!eligible.includes(current)) {
      title.set(eligible[0]);
    }
  });

  return {
    failedIds: [...failed],
    teardown: () => {
      unsubscribeHash();
      unsubscribeTitleSnap();
    }
  };
}
