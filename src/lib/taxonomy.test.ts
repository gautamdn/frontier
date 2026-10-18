import { describe, expect, test } from 'vitest'
import { ALL_TOPICS, SUBJECTS, TOPICS } from './taxonomy'

// Invariants over the generated taxonomy.json — a regression guard that the
// build-data.ts pipeline emitted internally consistent data.
describe('generated taxonomy integrity', () => {
  test('has the expected scale', () => {
    expect(ALL_TOPICS.length).toBe(1590)
    expect(SUBJECTS.length).toBe(8)
  })

  test('every prereq and unlock id resolves to a real topic', () => {
    const missing: string[] = []
    for (const t of ALL_TOPICS) {
      for (const id of [...t.prereqs.hard, ...t.prereqs.soft]) {
        if (!TOPICS[id]) missing.push(`${t.id} prereq ${id}`)
      }
      for (const id of [...t.unlocks.hard, ...t.unlocks.soft]) {
        if (!TOPICS[id]) missing.push(`${t.id} unlock ${id}`)
      }
    }
    expect(missing).toEqual([])
  })

  test('unlocks are the exact mirror of prereqs', () => {
    const mismatches: string[] = []
    for (const t of ALL_TOPICS) {
      for (const p of t.prereqs.hard) {
        if (!TOPICS[p].unlocks.hard.includes(t.id)) {
          mismatches.push(`${p} should hard-unlock ${t.id}`)
        }
      }
      for (const p of t.prereqs.soft) {
        if (!TOPICS[p].unlocks.soft.includes(t.id)) {
          mismatches.push(`${p} should soft-unlock ${t.id}`)
        }
      }
    }
    expect(mismatches).toEqual([])
  })

  test('no topic is its own prerequisite', () => {
    const selfRefs = ALL_TOPICS.filter(
      (t) => t.prereqs.hard.includes(t.id) || t.prereqs.soft.includes(t.id),
    )
    expect(selfRefs).toEqual([])
  })
})
