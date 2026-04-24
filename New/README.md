# Snowflake (Svelte rewrite)

A flexible, JSON-driven reimagining of Medium's Snowflake career framework, built with SvelteKit + TypeScript. Each team configures its own categories/areas, tracks, milestones, scoring and titles via a single JSON preset.

Legacy (Next.js/React) app still lives one directory up.

## Quick start

```bash
cd New
npm install
npm run dev          # http://localhost:5173
npm run test         # unit tests
npm run check        # type + svelte-check
npm run build        # static build → build/
```

## Authoring a framework

1. Drop a `my-team.json` into `static/frameworks/`.
2. Add one line to `static/frameworks/index.json`.
3. Reload — the new framework appears in the picker.

Schema (validated by zod at load time):

```jsonc
{
  "id": "my-team",
  "displayName": "My Team",
  "categories": [
    { "id": "tech", "label": "Technical", "color": "#00abc2" }
  ],
  "tracks": [
    {
      "id": "MOBILE",
      "displayName": "Mobile",
      "categoryId": "tech",
      "description": "…",
      "milestones": [
        { "summary": "…", "signals": ["…"], "examples": ["…"] }
      ]
    }
  ],
  "milestonePoints": [0, 1, 3, 6, 12, 20],
  "pointsToLevels": [
    { "minPoints": 0, "label": "1.1" }
  ],
  "titles": [
    { "label": "Engineer I", "minPoints": 0, "maxPoints": 16 }
  ]
}
```

The number of categories, tracks and milestones-per-track is entirely up to the framework. Every track must have the same number of milestones, and `milestonePoints.length` must equal milestones-per-track + 1.

## Architecture

- `src/lib/domain/` — pure TypeScript: schema (`zod`), scoring, hash codec. No Svelte/DOM.
- `src/lib/frameworks/` — fetch + cache of preset JSONs.
- `src/lib/stores/` — Svelte stores (framework, milestones, identity, focus, derived, hash sync).
- `src/lib/components/` — single-responsibility `.svelte` components.
- `src/routes/+page.svelte` — composition root.
- Tests co-located (`*.test.ts`) and run with Vitest.

## Shareable links

`#f=<frameworkId>&m=<m1,...,mN>&n=<name>&t=<title>` — the framework id is preserved, so a link sent between teams with different schemas still resolves.
