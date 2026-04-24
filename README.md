# Snowflake

A flexible, JSON-driven tool for planning engineering career growth. Each team configures its own areas (categories), tracks, milestones, scoring and job titles in a single JSON file — no code changes required.

**Live:** https://diegorv.github.io/snowflake/

## Where this came from

This is a fork of [Medium/snowflake](https://github.com/Medium/snowflake), the original career-growth framework tool Medium used internally. That project was archived ("Medium isn't using this tool anymore, but you're welcome to!") and its content — 16 tracks across 4 categories, specific point ladders, and eight predefined titles — was hardcoded in a ~1200-line `constants.js`. Forking Medium's tracks for another team meant editing that file by hand and redeploying.

This repo was rewritten from the ground up to keep what made the original great (the nightingale radar, the arrow-key editing, the shareable URL hash) while moving all the team-specific content into a plain JSON preset.

## What changed in the refactor

- **Stack:** Next.js + React + Flow → **SvelteKit + TypeScript + Vitest**, static build via `@sveltejs/adapter-static` (same "zero-server" deployment model as the old `next export`).
- **Content is data, not code.** Tracks, categories (teams can rename "areas"), milestones, point weights, level thresholds and titles all live in `static/frameworks/*.json`. Adding a new team means dropping a JSON file and one manifest line — no recompile.
- **Schema is validated at load time** with Zod. Bad JSON fails loudly with a readable error instead of rendering a broken UI.
- **Variable everything.** The original app hardcoded 16 tracks × 5 milestones × 4 categories. The new schema supports any N tracks, any M milestones-per-track, any number of categories. The radar, thermometer, selectors and track detail all adapt.
- **Shareable link carries the framework id.** Format: `#f=<framework>&m=<m1,...,mN>&n=<name>&t=<title>`. A link sent between teams with different schemas still resolves.
- **Thermometer redesigned.** The original's 15-label tick-ladder didn't fit any realistic column width; the new bar is a rounded pill with the points visible inside each category segment plus a legend and a "Level X • Y/Z pts" summary.
- **Responsive.** Works on iPhone-class viewports (tested at iPhone 16 Pro 402×874): radar scales fluidly, track selector scrolls horizontally with snap-points, inputs go full-width, tap targets ≥ 44px, no blue focus outlines on taps.
- **Architecture.** Strict single-responsibility modules — `src/lib/domain/` is pure TypeScript (types, zod schema, scoring, hash codec, defaults); `src/lib/stores/` holds framework/milestones/identity/focus stores plus hash sync; components under `src/lib/components/` are one concern each.
- **Tests.** 38 Vitest unit tests covering schema validation, scoring math, hash encode/decode round-trips (including unicode and clamping), and the framework loader.
- **Quality-of-life.** Reset button with confirmation, auto-snap of the title when milestones change make it invalid, proper `onDestroy` cleanup on the keyboard listener (the original had a leak), accessible focus-visible outlines.

## Quick start

```bash
npm install
npm run dev        # http://localhost:5173
npm run test       # unit tests
npm run check      # svelte-check + tsc
npm run build      # static output in build/
```

## Authoring a framework for your team

1. Copy `static/frameworks/example-small.json` as a starting point.
2. Edit the categories (your "areas"), tracks, milestones, scoring, titles.
3. Add the file name to `static/frameworks/index.json`.
4. Reload — it appears in the picker.

Schema (validated by Zod at load time):

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

Rules enforced by the validator:
- Every `track.categoryId` must reference an existing category.
- All tracks must have the same number of milestones.
- `milestonePoints.length` must equal milestones-per-track + 1 (index 0 = "not started").
- `pointsToLevels` must start at `minPoints: 0` and be strictly ascending.
- `titles[*].maxPoints` (when present) must be ≥ `minPoints`.

## Project layout

```
src/
├── lib/
│   ├── domain/          # Pure TS — types, zod schema, scoring, hash codec
│   ├── frameworks/      # Manifest, loader, registry (with in-memory cache)
│   ├── stores/          # Writable + derived Svelte stores, actions, hash sync
│   └── components/      # One .svelte per UI concern
└── routes/
    ├── +layout.svelte   # Chrome (Wordmark, global styles)
    └── +page.svelte     # Composition root (thin — wires stores)

static/
└── frameworks/
    ├── index.json           # manifest of available presets
    ├── medium.json          # full port of the original Medium framework
    └── example-small.json   # 3-track / 3-milestone demo
```

## Deployment

The project is deployed to GitHub Pages via `.github/workflows/deploy-pages.yml`. The workflow runs on push to `master` (or any `refactor/**` / `claude/**` branch): install → test → type-check → build with `BASE_PATH=/snowflake` → copy `index.html` to `404.html` (SPA fallback) → publish to Pages.

To deploy on your own fork: enable Pages in repo settings (Source: "GitHub Actions") and push.

## License

MIT, inherited from the original Medium/snowflake repository. See [LICENSE](./LICENSE).
