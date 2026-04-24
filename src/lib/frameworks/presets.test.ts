import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { FrameworkValidationError, parseFramework } from '../domain/frameworkSchema.js';

const FRAMEWORKS_DIR = join(process.cwd(), 'static', 'frameworks');

describe('static/frameworks presets', () => {
  const manifestRaw = readFileSync(join(FRAMEWORKS_DIR, 'index.json'), 'utf8');
  const manifest = JSON.parse(manifestRaw) as { id: string; label: string; path: string }[];

  it('manifest has at least one entry', () => {
    expect(manifest.length).toBeGreaterThan(0);
  });

  it('every preset referenced by the manifest exists on disk', () => {
    const files = new Set(readdirSync(FRAMEWORKS_DIR));
    for (const entry of manifest) {
      const filename = entry.path.split('/').pop() ?? entry.path;
      expect(files.has(filename), `missing file for ${entry.id}`).toBe(true);
    }
  });

  it.each(
    manifest.map((entry) => {
      const filename = entry.path.split('/').pop() ?? entry.path;
      return [entry.id, filename] as const;
    })
  )('"%s" (%s) passes parseFramework', (id, filename) => {
    const body = JSON.parse(readFileSync(join(FRAMEWORKS_DIR, filename), 'utf8'));
    try {
      const parsed = parseFramework(body);
      expect(parsed.id).toBe(id);
    } catch (err) {
      if (err instanceof FrameworkValidationError) {
        throw new Error(
          `Framework "${id}" failed validation:\n  - ${err.issues.join('\n  - ')}`
        );
      }
      throw err;
    }
  });
});
