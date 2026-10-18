# Frontier

A parent-facing tracker that answers one question: **what is my child ready for
next?**

Frontier is built on the open [Marble Skill Taxonomy](https://github.com/withmarbleapp/os-taxonomy)
— ~1,590 primary-school micro-topics wired into a prerequisite graph. You log
the evidence you've observed in your child; Frontier computes the **frontier**:
topics your child hasn't mastered yet but whose prerequisites are all met. That's
the growing edge — what they're ready for next.

The parent is the user; the child never uses the app. Nothing is ever framed as
"behind" — only "ready for next."

- **Local-first.** All data lives on your device (IndexedDB). No backend, no
  account. Export/import your data as JSON from Settings.
- **Installable.** It's a PWA — add it to your iPad home screen and it works
  offline.

> **Live app:** _added at the deploy checkpoint._

## Development

```bash
npm install
git submodule update --init   # fetches the taxonomy data under vendor/
npm run build:data            # generates src/data/taxonomy.json
npm run dev                   # local dev server
npm test                      # unit tests (Vitest)
npm run build                 # production build (runs build:data, then vite build)
```

Requires Node 20+.

## Attribution

Marble Skill Taxonomy (v1) · © Generative Spark, Inc. (Marble) ·
<https://withmarble.com> · licensed under ODbL 1.0 (database) and CC BY-SA 4.0
(content).

Curriculum-standards provenance notices are reproduced from the upstream
`PROVENANCE.md` and shown in the app's Settings screen.
