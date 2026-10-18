# Frontier — M1 Design Spec

**Date:** 2026-10-18
**Milestone:** M1 — iPad-friendly web app, local-only
**Status:** Approved for planning

## Purpose

A parent-facing tracker that answers one question: _what is my child ready for
next?_ Built on the open [Marble Skill Taxonomy](https://github.com/withmarbleapp/os-taxonomy)
(1,590 primary-school micro-topics in a prerequisite DAG). The parent logs
evidence they've observed; the app computes the **frontier** — topics not yet
mastered whose hard prerequisites are all met — and presents that as the child's
"growing edge."

**First user:** one 4-year-old. Multi-child data model from day one; v1 UI is
single-child.

**Framing rule (non-negotiable):** the parent is the user; the child never uses
the app. Never frame anything as "behind" or "delayed" — only "ready for next."

## Scope

This spec covers **M1 only**. M2 (daily activity generation), M3 (second child /
under-4 extension), and M4 (iOS via Capacitor) are out of scope and will each get
their own spec → plan → implementation cycle.

## Key decisions (locked)

1. **Data delivery = git submodule** at `vendor/os-taxonomy`. CI checkout uses
   `submodules: true`. Fall back to vendoring the two JSON files only if the
   Pages Action fights the submodule; record the fallback in `docs/decisions.md`.
2. **No-evidence topics (35 of them) = explicit-only mastery.** A topic with an
   empty `evidence` array can never be auto-mastered; it is masterable solely via
   the parent's explicit "mark mastered" toggle. (Default `every()` over an empty
   array is vacuously true, which would phantom-master 35 topics — rejected.)
3. **Repo:** public `gautamdn/frontier`, served at `gautamdn.github.io/frontier/`
   via GitHub Pages + Actions. `gh` is installed and authenticated as `gautamdn`.

## Environment facts

- Node v20.20.0, npm 10.8.2. No Homebrew. `gh` 2.102.0 installed to
  `~/.local/bin` and authenticated (`repo`, `workflow` scopes).
- Taxonomy data validated against the live repo:
  - `topics.json`: `{ version, topicCount, topics[] }`, 1,590 topics. Each topic
    has `id, type, subject, domain, name, description, ageRangeStart,
ageRangeEnd, centrality, evidence[], assessmentPrompt, standards[]`.
  - `dependencies.json`: `{ version, note, edgeCount, dependencies[] }`, 3,221
    edges. Each edge: `{ topicId, prerequisiteId, strength: "hard"|"soft",
reason }`.
  - 8 subjects. `ageRangeStart` distribution: 4→41, 5→256, 6→129, 7→289, 8→147,
    9→308, 10→155, 11→145, 12→92, 13→28.
  - 297 topics have `ageRangeStart <= 5` (the default window for a 4-year-old).
  - 35 topics have an empty `evidence` array; 0 topics lack `assessmentPrompt`.

## Architecture

Static, local-first SPA. No backend, no router, no state-management library.

```
frontier/
  vendor/os-taxonomy/            # git submodule (upstream data + licenses)
  scripts/
    build-data.ts                # emits src/data/taxonomy.json (prebuild step)
  src/
    data/taxonomy.json           # GENERATED, committed
    lib/
      graph.ts                   # pure domain logic (Vitest)
      graph.test.ts
      store.ts                   # IndexedDB persistence + reducer/context
      taxonomy.ts                # typed loader for taxonomy.json
    screens/{Today,Map,Progress,Settings}.tsx
    ui/                          # shared touch-friendly components
    App.tsx, main.tsx
  docs/{decisions.md, superpowers/specs/...}
  .github/workflows/deploy.yml
  README.md
```

### Stack

Vite + React + TypeScript (strict) + Tailwind + `vite-plugin-pwa`. Vitest for
logic. ESLint + Prettier. `idb-keyval` for persistence. Navigation is a tab
value held in React context (no router). State via React context + `useReducer`.

## Data pipeline — `scripts/build-data.ts`

Runs as an npm `prebuild` (and manually). Steps:

1. Read `vendor/os-taxonomy/data/topics.json` and `dependencies.json`.
2. **Validate referential integrity:** every `topicId` / `prerequisiteId` in
   dependencies resolves to a real topic; report (and fail on) dangling edges.
   Detect and warn on cycles (do not fail — just log; the DAG is upstream's
   responsibility).
3. Emit trimmed `src/data/taxonomy.json`:
   ```jsonc
   {
     "version": "<upstream taxonomyVersion>",
     "generatedAt": "<build time>",
     "topics": {
       "<id>": {
         "id", "subject", "domain", "name", "description",
         "ageRangeStart", "ageRangeEnd", "centrality",
         "evidence": [ ... ],
         "assessmentPrompt": "...",
         "prereqs":  { "hard": ["id", ...], "soft": ["id", ...] },
         "unlocks":  { "hard": ["id", ...], "soft": ["id", ...] }
       }
     }
   }
   ```
   Adjacency (`prereqs`, `unlocks`) is baked at build time so the app does zero
   graph assembly at runtime.
4. Log the output byte size.

Do **not** hand-edit taxonomy data. The `standards[]` field and
`curriculum-standards.json` are not shipped in M1 (attribution still displayed;
revisit if/when standards are surfaced in UI).

## Domain logic — `src/lib/graph.ts` (pure, fully unit-tested)

All functions pure; the evidence log and child age are passed in.

- **`mastered(topic, log): boolean`**
  - If `topic.evidence.length === 0`: return `log[topic.id]?.explicitMastered === true`.
  - Else: return `true` when every evidence index is ticked **OR**
    `log[topic.id]?.explicitMastered === true`.
- **`frontier(log, opts): { topics: Topic[], hiddenByAge: number }`**
  - A topic is on the frontier when it is **not** mastered and **every hard
    prereq is mastered**. Topics with no hard prereqs (roots) are on the frontier
    from the start.
  - **Soft prereqs never gate.** They are surfaced per-topic as
    `helpsToKnowFirst` in the Today detail view.
  - Age window filter: include topics with `ageRangeStart <= childAge + windowDelta`
    (default `windowDelta = 1`, overridable in settings). `hiddenByAge` = count of
    otherwise-frontier topics excluded by the age filter, so the filter is visible.
- **`unlocks(topicId): { hard: Topic[], soft: Topic[] }`** — reverse edges, read
  from the baked `unlocks` adjacency.

### Types (sketch)

```ts
interface EvidenceEntry {
  seenAt: string
} // ISO timestamp
interface TopicLog {
  evidence: Record<number, EvidenceEntry> // evidenceIndex -> seen
  explicitMastered?: boolean
  masteredAt?: string
}
type Log = Record<string /*topicId*/, TopicLog>
```

## State & persistence — `src/lib/store.ts`

- **Profiles:** `children: { id, name, birthdate }[]` from day one. v1 UI uses the
  first child only; schema is ready for M3's switcher.
- **Log:** `Record<childId, Log>` as above.
- **Settings:** `{ activeChildId, windowDelta }`.
- **Derived:** `childAge` computed from `birthdate` at render (whole years).
- **Persistence:** IndexedDB via `idb-keyval`, debounced writes. One top-level
  record `{ version, children, logs, settings }`.
- **Export/import:** Settings screen exports the full record as a downloaded JSON
  file and imports it back (with a version check), so data is never trapped on
  one device.

## Screens

iPad landscape **and** portrait. 44px+ touch targets, large type, high contrast.

- **Today** — the frontier, grouped by subject, each group sorted by `centrality`
  desc. Tapping a topic opens a detail panel: `description`, a one-tap evidence
  checklist (tap toggles `seenAt`), the `assessmentPrompt` with `{{name}}`
  replaced by the child's name, what this topic **unlocks**, and a "helps to know
  first" list (soft prereqs). A "mark mastered" toggle is available (and is the
  only path to mastery for no-evidence topics).
- **Map** — all age-window topics as a list/grid, each with a status badge
  (**mastered** / **frontier** / **locked**). Subject filter. Shows the
  hidden-by-age count. No 3D graph.
- **Progress** — mastered count per subject (simple bars) and a last-7-days feed
  of logged evidence.
- **Settings** — child profile (name, birthdate), age-window override, JSON
  export/import, and the attribution block.

### Framing

No "behind," "late," or "delayed" anywhere in copy. Locked topics read as
"ready after …"; the frontier is "ready for next."

## Attribution (license requirement)

Displayed in Settings **and** the README:

> Marble Skill Taxonomy (v1) · © Generative Spark, Inc. (Marble) ·
> https://withmarble.com · licensed under ODbL 1.0 (database) and CC BY-SA 4.0
> (content).

Plus the upstream notices from `vendor/os-taxonomy/PROVENANCE.md` for any
curriculum standards displayed. (M1 does not surface standards in the UI, but the
PROVENANCE notices are included for completeness and future-proofing.)

## Deploy — GitHub Pages via Actions

`.github/workflows/deploy.yml` on push to `main`:

1. `actions/checkout` with `submodules: true`.
2. Setup Node 20, `npm ci`.
3. `npm run build` (runs `build-data.ts` via `prebuild`, then `vite build`).
4. Upload `dist/` artifact, deploy to Pages.

Vite `base: '/frontier/'`. `vite-plugin-pwa` with `scope`/`start_url` matching the
base so the installed PWA works offline. README gets the live URL + attribution.
Pages enabled (source = GitHub Actions) via `gh`.

## Testing

- Vitest covers `graph.ts` exhaustively: `mastered` (ticked, explicit,
  no-evidence explicit-only, partial), `frontier` (roots, hard-gated,
  soft-non-gating, age window + `hiddenByAge`), `unlocks`.
- `build-data.ts` referential-integrity validation covered by a test over the
  real vendored data (or a fixture subset).
- No E2E in v1.

## Ambiguities → `docs/decisions.md`

- No-evidence topics → explicit-only mastery (above).
- Cycles in the dependency graph → log a warning at build, do not fail.
- `childAge` granularity → whole years from birthdate.
- `standards` / curriculum data not shipped in M1.

## Conventions

TypeScript strict. ESLint + Prettier. Vitest for logic, no E2E. Small, named
commits, pushed after each checkpoint, no squashing. Static and local-first.
No state-management library. Prefer boring, well-known libraries.

## Checkpoints (commit + push each)

1. **Scaffold** — Vite + React + TS + Tailwind + PWA, lint/format/test configured.
2. **Data pipeline** — submodule added, `build-data.ts`, generated `taxonomy.json`.
3. **Graph logic + tests** — `graph.ts` + passing Vitest suite.
4. **Screens** — Today / Map / Progress / Settings wired to store.
5. **Deploy** — Action live, Pages enabled, URL in README.
