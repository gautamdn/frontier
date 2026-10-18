import { describe, expect, test } from 'vitest'
import type { Topic } from './taxonomy'
import {
  frontier,
  helpsToKnowFirst,
  mastered,
  unlocks,
  type Log,
  type TopicMap,
} from './graph'

// --- Fixtures --------------------------------------------------------------
// Minimal topics. Defaults are overridden per test. Edges are declared on the
// dependent side (prereqs) and mirrored into unlocks by buildMap().

function topic(partial: Partial<Topic> & { id: string }): Topic {
  return {
    id: partial.id,
    subject: partial.subject ?? 'Mathematics',
    domain: partial.domain ?? 'Number',
    name: partial.name ?? partial.id,
    description: partial.description ?? '',
    ageRangeStart: partial.ageRangeStart ?? 4,
    ageRangeEnd: partial.ageRangeEnd ?? 7,
    centrality: partial.centrality ?? 0,
    evidence: partial.evidence ?? ['e0'],
    assessmentPrompt: partial.assessmentPrompt ?? '',
    prereqs: partial.prereqs ?? { hard: [], soft: [] },
    unlocks: { hard: [], soft: [] },
  }
}

/** Build a TopicMap and derive `unlocks` from the declared `prereqs`. */
function buildMap(topics: Topic[]): TopicMap {
  const map: TopicMap = {}
  for (const t of topics) map[t.id] = t
  for (const t of topics) {
    for (const p of t.prereqs.hard) map[p]?.unlocks.hard.push(t.id)
    for (const p of t.prereqs.soft) map[p]?.unlocks.soft.push(t.id)
  }
  return map
}

const ticked = (seenAt = '2026-10-18T00:00:00Z') => ({ seenAt })

// --- mastered --------------------------------------------------------------
describe('mastered', () => {
  const t = topic({ id: 'A', evidence: ['e0', 'e1'] })

  test('false when no evidence ticked', () => {
    expect(mastered(t, {})).toBe(false)
  })

  test('false when only some evidence ticked', () => {
    const log: Log = { A: { evidence: { 0: ticked() } } }
    expect(mastered(t, log)).toBe(false)
  })

  test('true when every evidence item ticked', () => {
    const log: Log = { A: { evidence: { 0: ticked(), 1: ticked() } } }
    expect(mastered(t, log)).toBe(true)
  })

  test('true when explicitly marked mastered, even with no ticks', () => {
    const log: Log = { A: { evidence: {}, explicitMastered: true } }
    expect(mastered(t, log)).toBe(true)
  })

  test('no-evidence topic is NOT vacuously mastered', () => {
    const empty = topic({ id: 'E', evidence: [] })
    expect(mastered(empty, {})).toBe(false)
    expect(mastered(empty, { E: { evidence: {} } })).toBe(false)
  })

  test('no-evidence topic masterable only via explicit flag', () => {
    const empty = topic({ id: 'E', evidence: [] })
    const log: Log = { E: { evidence: {}, explicitMastered: true } }
    expect(mastered(empty, log)).toBe(true)
  })
})

// --- frontier --------------------------------------------------------------
describe('frontier', () => {
  test('root topics (no hard prereqs) are on the frontier from the start', () => {
    const map = buildMap([topic({ id: 'A' }), topic({ id: 'B' })])
    const result = frontier(map, {}, { childAge: 4 })
    expect(result.topics.map((t) => t.id).sort()).toEqual(['A', 'B'])
  })

  test('mastered topics are not on the frontier', () => {
    const map = buildMap([topic({ id: 'A', evidence: ['e0'] })])
    const log: Log = { A: { evidence: { 0: ticked() } } }
    const result = frontier(map, log, { childAge: 4 })
    expect(result.topics).toHaveLength(0)
  })

  test('a topic is gated until all its hard prereqs are mastered', () => {
    const map = buildMap([
      topic({ id: 'A', evidence: ['e0'] }),
      topic({ id: 'B', prereqs: { hard: ['A'], soft: [] } }),
    ])
    // A mastered, B not: B becomes frontier, A drops off.
    const log: Log = { A: { evidence: { 0: ticked() } } }
    const result = frontier(map, log, { childAge: 4 })
    expect(result.topics.map((t) => t.id)).toEqual(['B'])
  })

  test('a topic with an unmet hard prereq is locked (not on frontier)', () => {
    const map = buildMap([
      topic({ id: 'A', evidence: ['e0'] }),
      topic({ id: 'B', prereqs: { hard: ['A'], soft: [] } }),
    ])
    const result = frontier(map, {}, { childAge: 4 })
    expect(result.topics.map((t) => t.id)).toEqual(['A'])
  })

  test('soft prereqs do NOT gate the frontier', () => {
    const map = buildMap([
      topic({ id: 'A', evidence: ['e0'] }),
      topic({ id: 'C', prereqs: { hard: [], soft: ['A'] } }),
    ])
    // A not mastered, but C has only a soft prereq -> both on frontier.
    const result = frontier(map, {}, { childAge: 4 })
    expect(result.topics.map((t) => t.id).sort()).toEqual(['A', 'C'])
  })

  test('age window: default includes ageRangeStart <= childAge + 1', () => {
    const map = buildMap([
      topic({ id: 'now', ageRangeStart: 5 }),
      topic({ id: 'later', ageRangeStart: 8 }),
    ])
    const result = frontier(map, {}, { childAge: 4 })
    expect(result.topics.map((t) => t.id)).toEqual(['now'])
    expect(result.hiddenByAge).toBe(1)
  })

  test('age window: windowDelta override widens the window', () => {
    const map = buildMap([topic({ id: 'later', ageRangeStart: 8 })])
    const result = frontier(map, {}, { childAge: 4, windowDelta: 4 })
    expect(result.topics.map((t) => t.id)).toEqual(['later'])
    expect(result.hiddenByAge).toBe(0)
  })

  test('hiddenByAge counts only frontier-eligible topics excluded by age', () => {
    const map = buildMap([
      topic({ id: 'A', ageRangeStart: 4, evidence: ['e0'] }),
      // locked by unmet hard prereq AND out of age window -> not counted
      topic({
        id: 'locked',
        ageRangeStart: 9,
        prereqs: { hard: ['A'], soft: [] },
      }),
      // frontier-eligible but out of age window -> counted
      topic({ id: 'oldRoot', ageRangeStart: 9 }),
    ])
    const result = frontier(map, {}, { childAge: 4 })
    expect(result.topics.map((t) => t.id)).toEqual(['A'])
    expect(result.hiddenByAge).toBe(1)
  })

  test('result is sorted by centrality descending', () => {
    const map = buildMap([
      topic({ id: 'low', centrality: 0.1 }),
      topic({ id: 'high', centrality: 0.9 }),
      topic({ id: 'mid', centrality: 0.5 }),
    ])
    const result = frontier(map, {}, { childAge: 4 })
    expect(result.topics.map((t) => t.id)).toEqual(['high', 'mid', 'low'])
  })
})

// --- unlocks ---------------------------------------------------------------
describe('unlocks', () => {
  test('returns resolved topics that depend on the given topic', () => {
    const map = buildMap([
      topic({ id: 'A', evidence: ['e0'] }),
      topic({ id: 'B', prereqs: { hard: ['A'], soft: [] } }),
      topic({ id: 'C', prereqs: { hard: [], soft: ['A'] } }),
    ])
    const result = unlocks('A', map)
    expect(result.hard.map((t) => t.id)).toEqual(['B'])
    expect(result.soft.map((t) => t.id)).toEqual(['C'])
  })

  test('returns empty for a leaf topic', () => {
    const map = buildMap([topic({ id: 'A' })])
    const result = unlocks('A', map)
    expect(result.hard).toEqual([])
    expect(result.soft).toEqual([])
  })
})

// --- helpsToKnowFirst ------------------------------------------------------
describe('helpsToKnowFirst', () => {
  test('resolves a topic’s soft prereqs to topics', () => {
    const map = buildMap([
      topic({ id: 'A' }),
      topic({ id: 'C', prereqs: { hard: [], soft: ['A'] } }),
    ])
    const result = helpsToKnowFirst(map['C'], map)
    expect(result.map((t) => t.id)).toEqual(['A'])
  })

  test('is empty when there are no soft prereqs', () => {
    const map = buildMap([topic({ id: 'A' })])
    expect(helpsToKnowFirst(map['A'], map)).toEqual([])
  })
})
