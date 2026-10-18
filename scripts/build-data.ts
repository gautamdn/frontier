/**
 * build-data.ts — reads the vendored Marble Skill Taxonomy and emits a trimmed
 * src/data/taxonomy.json with only the fields the app needs, plus baked
 * prereq/unlock adjacency so the app does zero graph assembly at runtime.
 *
 * Run: `npm run build:data` (also runs automatically via `prebuild`).
 * Do NOT hand-edit taxonomy data — change the upstream submodule instead.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(HERE, '..')
const DATA = resolve(ROOT, 'vendor/os-taxonomy/data')
const OUT = resolve(ROOT, 'src/data/taxonomy.json')

type Strength = 'hard' | 'soft'

interface UpstreamTopic {
  id: string
  subject: string
  domain: string
  name: string
  description: string
  ageRangeStart: number
  ageRangeEnd: number
  centrality: number
  evidence: string[]
  assessmentPrompt: string
}

interface UpstreamEdge {
  topicId: string
  prerequisiteId: string
  strength: Strength
  reason: string
}

interface Adjacency {
  hard: string[]
  soft: string[]
}

interface OutTopic extends UpstreamTopic {
  prereqs: Adjacency
  unlocks: Adjacency
}

function readJson<T>(name: string): T {
  return JSON.parse(readFileSync(resolve(DATA, name), 'utf8')) as T
}

function die(message: string): never {
  console.error(`\n✖ build-data failed: ${message}\n`)
  process.exit(1)
}

// --- Load ------------------------------------------------------------------
const topicsFile = readJson<{ version: string; topics: UpstreamTopic[] }>(
  'topics.json',
)
const depsFile = readJson<{ dependencies: UpstreamEdge[] }>('dependencies.json')
const manifest = readJson<{ taxonomyVersion: string }>('manifest.json')

const topics = topicsFile.topics
const edges = depsFile.dependencies
const byId = new Map(topics.map((t) => [t.id, t]))

// --- Validate referential integrity (fatal) --------------------------------
const dangling: string[] = []
for (const e of edges) {
  if (!byId.has(e.topicId)) dangling.push(`topicId ${e.topicId}`)
  if (!byId.has(e.prerequisiteId))
    dangling.push(`prerequisiteId ${e.prerequisiteId}`)
}
if (dangling.length > 0) {
  die(
    `${dangling.length} dependency endpoint(s) reference unknown topics, e.g. ` +
      dangling.slice(0, 5).join(', '),
  )
}

// --- Build adjacency -------------------------------------------------------
const empty = (): Adjacency => ({ hard: [], soft: [] })
const prereqs = new Map<string, Adjacency>(topics.map((t) => [t.id, empty()]))
const unlocks = new Map<string, Adjacency>(topics.map((t) => [t.id, empty()]))

for (const e of edges) {
  // e.prerequisiteId must be known before e.topicId.
  prereqs.get(e.topicId)![e.strength].push(e.prerequisiteId)
  unlocks.get(e.prerequisiteId)![e.strength].push(e.topicId)
}

// --- Cycle detection over HARD prereq edges (warn only) --------------------
// Edge direction for ordering: prerequisite -> topic. A cycle means a topic is
// (transitively) its own hard prerequisite, which would make it unreachable.
const WHITE = 0,
  GREY = 1,
  BLACK = 2
const color = new Map<string, number>(topics.map((t) => [t.id, WHITE]))

function findCycle(start: string, stack: string[]): string[] | null {
  color.set(start, GREY)
  stack.push(start)
  for (const next of unlocks.get(start)!.hard) {
    const c = color.get(next)
    if (c === GREY) {
      const from = stack.indexOf(next)
      return stack.slice(from).concat(next)
    }
    if (c === WHITE) {
      const found = findCycle(next, stack)
      if (found) return found
    }
  }
  stack.pop()
  color.set(start, BLACK)
  return null
}

let cycleExample: string[] | null = null
for (const t of topics) {
  if (color.get(t.id) === WHITE) {
    cycleExample = findCycle(t.id, [])
    if (cycleExample) break
  }
}
if (cycleExample) {
  console.warn(
    `⚠ hard-prereq cycle detected (upstream data): ${cycleExample.join(' → ')}`,
  )
}

// --- Emit ------------------------------------------------------------------
const outTopics: Record<string, OutTopic> = {}
for (const t of topics) {
  outTopics[t.id] = {
    id: t.id,
    subject: t.subject,
    domain: t.domain,
    name: t.name,
    description: t.description,
    ageRangeStart: t.ageRangeStart,
    ageRangeEnd: t.ageRangeEnd,
    centrality: t.centrality,
    evidence: t.evidence ?? [],
    assessmentPrompt: t.assessmentPrompt,
    prereqs: prereqs.get(t.id)!,
    unlocks: unlocks.get(t.id)!,
  }
}

const out = {
  version: manifest.taxonomyVersion ?? topicsFile.version,
  // Not Date.now() — keep the build deterministic for a given data commit.
  generatedFrom: 'vendor/os-taxonomy',
  topicCount: topics.length,
  edgeCount: edges.length,
  topics: outTopics,
}

mkdirSync(dirname(OUT), { recursive: true })
const json = JSON.stringify(out, null, 0)
writeFileSync(OUT, json)

const kb = (json.length / 1024).toFixed(1)
const noEvidence = topics.filter((t) => (t.evidence ?? []).length === 0).length
console.log(
  `✓ wrote src/data/taxonomy.json — ${topics.length} topics, ${edges.length} edges, ${kb} KB` +
    ` (${noEvidence} topics have no evidence → explicit-mastery only)`,
)
