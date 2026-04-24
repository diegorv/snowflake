import type { Framework } from '../domain/types.js';

const cache = new Map<string, Framework>();

export function registerFramework(framework: Framework): void {
  cache.set(framework.id, framework);
}

export function getFramework(id: string): Framework | undefined {
  return cache.get(id);
}

export function getRegistry(): Map<string, Framework> {
  return cache;
}

export function clearRegistry(): void {
  cache.clear();
}
