/**
 * Typed access to the generated taxonomy. The JSON is produced by
 * scripts/build-data.ts from the vendored Marble Skill Taxonomy and bundled at
 * build time, so the app works fully offline.
 */
import raw from '../data/taxonomy.json'

export type Strength = 'hard' | 'soft'

export interface Adjacency {
  hard: string[]
  soft: string[]
}

export interface Topic {
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
  /** Topics this one depends on. */
  prereqs: Adjacency
  /** Topics that depend on this one. */
  unlocks: Adjacency
}

export interface Taxonomy {
  version: string
  topicCount: number
  edgeCount: number
  topics: Record<string, Topic>
}

// The imported JSON is cast once here (the inferred literal type is enormous
// and slows type-checking); every other module imports these typed accessors.
const taxonomy = raw as unknown as Taxonomy

export const TOPICS: Record<string, Topic> = taxonomy.topics
export const ALL_TOPICS: Topic[] = Object.values(taxonomy.topics)
export const TAXONOMY_VERSION = taxonomy.version

export function getTopic(id: string): Topic | undefined {
  return TOPICS[id]
}

export const SUBJECTS: string[] = [
  ...new Set(ALL_TOPICS.map((t) => t.subject)),
].sort()
