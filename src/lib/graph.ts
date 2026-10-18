/**
 * Pure domain logic for the skill graph. Every function takes the topic data
 * and evidence log as arguments (no module-level taxonomy import) so it can be
 * tested against small fixtures.
 */
import type { Topic } from './taxonomy'

export interface EvidenceEntry {
  seenAt: string
}

export interface TopicLog {
  /** evidenceIndex -> when the parent saw it */
  evidence: Record<number, EvidenceEntry>
  explicitMastered?: boolean
  masteredAt?: string
}

export type Log = Record<string, TopicLog>

export type TopicMap = Record<string, Topic>

export interface FrontierOpts {
  childAge: number
  /** include topics with ageRangeStart <= childAge + windowDelta */
  windowDelta?: number
}

export interface FrontierResult {
  topics: Topic[]
  /** frontier-eligible topics excluded only by the age window */
  hiddenByAge: number
}

export interface ResolvedAdjacency {
  hard: Topic[]
  soft: Topic[]
}

export function mastered(topic: Topic, log: Log): boolean {
  const entry = log[topic.id]
  if (entry?.explicitMastered) return true
  // A topic with no evidence items is masterable only via the explicit flag
  // above — never vacuously mastered.
  if (topic.evidence.length === 0) return false
  return topic.evidence.every((_item, i) => entry?.evidence[i] !== undefined)
}

export function frontier(
  topics: TopicMap,
  log: Log,
  opts: FrontierOpts,
): FrontierResult {
  const windowDelta = opts.windowDelta ?? 1
  const maxAge = opts.childAge + windowDelta

  const result: Topic[] = []
  let hiddenByAge = 0

  for (const topic of Object.values(topics)) {
    if (mastered(topic, log)) continue
    const hardPrereqsMet = topic.prereqs.hard.every((id) => {
      const prereq = topics[id]
      return prereq !== undefined && mastered(prereq, log)
    })
    if (!hardPrereqsMet) continue

    if (topic.ageRangeStart <= maxAge) result.push(topic)
    else hiddenByAge++
  }

  result.sort((a, b) => b.centrality - a.centrality)
  return { topics: result, hiddenByAge }
}

function resolve(ids: string[], topics: TopicMap): Topic[] {
  return ids.map((id) => topics[id]).filter((t): t is Topic => t !== undefined)
}

export function unlocks(topicId: string, topics: TopicMap): ResolvedAdjacency {
  const topic = topics[topicId]
  if (!topic) return { hard: [], soft: [] }
  return {
    hard: resolve(topic.unlocks.hard, topics),
    soft: resolve(topic.unlocks.soft, topics),
  }
}

export function helpsToKnowFirst(topic: Topic, topics: TopicMap): Topic[] {
  return resolve(topic.prereqs.soft, topics)
}
