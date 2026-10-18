# Decisions

Running log of non-obvious choices, especially where the taxonomy data was
ambiguous. Newest first.

## 2026-10-18 — Data delivery: git submodule

The taxonomy ships as a git submodule at `vendor/os-taxonomy` (not vendored
JSON). CI checks out with `submodules: true`. Rationale: clean upstream tracking
and license/provenance files travel with the data. If the Pages Action ever
fights the submodule, fall back to committing the two JSON files and note it
here.

## 2026-10-18 — No-evidence topics: explicit-only mastery

35 of 1,590 topics have an empty `evidence` array. `mastered()` would treat
`[].every(...)` as vacuously `true` and auto-master them. Instead, a topic with
no evidence items is masterable **only** via the parent's explicit "mark
mastered" toggle. Keeps the frontier honest.

## 2026-10-18 — `taxonomy.json` is not timestamped

`build-data.ts` deliberately omits a `generatedAt` wall-clock timestamp. The
output is committed to git; a timestamp would make every rebuild produce a diff
even when the underlying data is unchanged. The output is a pure function of the
submodule commit. (`generatedFrom` records the source path instead.)

## 2026-10-18 — Cycles are warn-only

`build-data.ts` fails hard on dangling dependency endpoints (referential
integrity) but only warns on hard-prereq cycles — the DAG's acyclicity is
upstream's responsibility, and the current data has none. A cycle would not
crash the app (the frontier calc tolerates it); we'd rather ship than block on
upstream data.

## 2026-10-18 — `childAge` granularity: whole years

Age is computed from `birthdate` as completed whole years. The age window
(`ageRangeStart <= childAge + windowDelta`) therefore steps once per birthday.

## 2026-10-18 — Curriculum standards not surfaced in M1

The `standards[]` field and `curriculum-standards.json` are not rendered in the
M1 UI. Attribution and PROVENANCE notices are still shown in Settings. Revisit
if/when standards become a user-facing feature.

## 2026-10-18 — ESLint + Prettier over scaffold's oxlint

`npm create vite` now ships `oxlint`. The project spec calls for ESLint +
Prettier (more established, Prettier for formatting), so oxlint was removed in
favor of an ESLint flat config + Prettier.

## 2026-10-18 — Vitest config kept separate from Vite config

Vite 8 is rolldown-based; Vitest 3 bundles an older Vite, and combining the
`test` block into `vite.config.ts` produces a plugin-type conflict. Logic tests
are pure Node (no React/DOM), so `vitest.config.ts` is a separate, plugin-free
config.
