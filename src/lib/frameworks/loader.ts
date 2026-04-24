import { parseFramework } from '../domain/frameworkSchema.js';
import type { Framework } from '../domain/types.js';
import type { FrameworkManifestEntry } from './manifest.js';
import { getFramework, registerFramework } from './registry.js';

export async function loadFramework(
  entry: FrameworkManifestEntry,
  fetchImpl: typeof fetch = fetch
): Promise<Framework> {
  const cached = getFramework(entry.id);
  if (cached) return cached;

  const res = await fetchImpl(entry.path);
  if (!res.ok) {
    throw new Error(`Failed to fetch framework "${entry.id}" from ${entry.path}: ${res.status}`);
  }
  const json = await res.json();
  const framework = parseFramework(json);

  if (framework.id !== entry.id) {
    throw new Error(
      `Framework id mismatch: manifest says "${entry.id}" but JSON says "${framework.id}"`
    );
  }

  registerFramework(framework);
  return framework;
}
