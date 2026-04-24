import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { get } from 'svelte/store';
import { resetAll, selectFramework } from './actions.js';
import { currentFramework, frameworkManifest } from './framework.js';
import { focusedTrackId } from './focus.js';
import { name, title } from './identity.js';
import { milestones } from './milestones.js';
import { clearRegistry, registerFramework } from '../frameworks/registry.js';
import { buildFramework } from '../domain/__fixtures__/framework.js';

function resetStores() {
  currentFramework.set(null);
  frameworkManifest.set([]);
  milestones.set({});
  name.set('');
  title.set('');
  focusedTrackId.set('');
}

beforeEach(() => {
  clearRegistry();
  resetStores();
});

afterEach(() => {
  clearRegistry();
  resetStores();
});

describe('selectFramework', () => {
  it('throws for an id that is not in the manifest', async () => {
    frameworkManifest.set([
      { id: 'medium', label: 'Medium', path: '/x.json' }
    ]);
    await expect(selectFramework('ghost')).rejects.toThrow(/Unknown framework id/);
  });

  it('sets currentFramework and initial focus, seeds empty milestones', async () => {
    const framework = buildFramework();
    registerFramework(framework);
    frameworkManifest.set([{ id: framework.id, label: framework.displayName, path: '/x.json' }]);

    await selectFramework(framework.id);

    expect(get(currentFramework)?.id).toBe(framework.id);
    expect(get(focusedTrackId)).toBe(framework.tracks[0].id);
    expect(get(milestones)).toEqual({ T1: 0, T2: 0 });
  });

  it('applies initialMilestones and clamps unknown track ids out', async () => {
    const framework = buildFramework();
    registerFramework(framework);
    frameworkManifest.set([{ id: framework.id, label: framework.displayName, path: '/x.json' }]);

    await selectFramework(framework.id, { T1: 2, GHOST: 9 });

    expect(get(milestones)).toEqual({ T1: 2, T2: 0 });
  });

  it('keeps an eligible title and snaps an ineligible one', async () => {
    const framework = buildFramework();
    registerFramework(framework);
    frameworkManifest.set([{ id: framework.id, label: framework.displayName, path: '/x.json' }]);

    // Title eligible at 0 points (fixture: "Junior" covers 0-4)
    title.set('Junior');
    await selectFramework(framework.id);
    expect(get(title)).toBe('Junior');

    // An ineligible title should be replaced with the first eligible for the
    // resulting total points (all zero => "Junior")
    title.set('Senior');
    await selectFramework(framework.id);
    expect(get(title)).toBe('Junior');
  });

  it('preserves name across framework switches', async () => {
    const f1 = buildFramework({ id: 'one' });
    const f2 = buildFramework({ id: 'two' });
    registerFramework(f1);
    registerFramework(f2);
    frameworkManifest.set([
      { id: 'one', label: 'One', path: '/1.json' },
      { id: 'two', label: 'Two', path: '/2.json' }
    ]);

    name.set('Ada Lovelace');
    await selectFramework('one');
    await selectFramework('two');

    expect(get(name)).toBe('Ada Lovelace');
  });
});

describe('resetAll', () => {
  it('is a no-op when no framework is active', () => {
    expect(() => resetAll()).not.toThrow();
    expect(get(milestones)).toEqual({});
  });

  it('clears milestones, name, and resets focus to first track', async () => {
    const framework = buildFramework();
    registerFramework(framework);
    frameworkManifest.set([{ id: framework.id, label: framework.displayName, path: '/x.json' }]);

    await selectFramework(framework.id, { T1: 3, T2: 2 });
    name.set('Grace Hopper');
    focusedTrackId.set('T2');

    resetAll();

    expect(get(milestones)).toEqual({ T1: 0, T2: 0 });
    expect(get(name)).toBe('');
    expect(get(focusedTrackId)).toBe('T1');
    // title is NOT cleared here - that's the job of the auto-snap subscription,
    // which lives in the boot layer.
  });
});
