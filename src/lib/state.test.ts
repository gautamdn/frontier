import { describe, expect, test } from 'vitest'
import {
  initialState,
  reducer,
  STATE_VERSION,
  validateImport,
  type AppState,
  type Child,
} from './state'

const NOW = '2026-10-18T12:00:00.000Z'
const kavya: Child = { id: 'c1', name: 'Kavya', birthdate: '2021-06-01' }

function withChild(): AppState {
  return reducer(initialState, { type: 'addChild', child: kavya })
}

describe('addChild', () => {
  test('appends the child and creates an empty log', () => {
    const s = withChild()
    expect(s.children).toEqual([kavya])
    expect(s.logs['c1']).toEqual({})
  })

  test('first child becomes the active child', () => {
    const s = withChild()
    expect(s.settings.activeChildId).toBe('c1')
  })

  test('a second child does not steal active status', () => {
    const s = reducer(withChild(), {
      type: 'addChild',
      child: { id: 'c2', name: 'Kai', birthdate: '2025-01-01' },
    })
    expect(s.settings.activeChildId).toBe('c1')
    expect(s.children).toHaveLength(2)
  })
})

describe('toggleEvidence', () => {
  test('ticks an evidence item with a timestamp', () => {
    const s = reducer(withChild(), {
      type: 'toggleEvidence',
      childId: 'c1',
      topicId: 'A',
      index: 0,
      now: NOW,
    })
    expect(s.logs['c1']['A'].evidence[0]).toEqual({ seenAt: NOW })
  })

  test('toggling the same item again removes it', () => {
    let s = reducer(withChild(), {
      type: 'toggleEvidence',
      childId: 'c1',
      topicId: 'A',
      index: 0,
      now: NOW,
    })
    s = reducer(s, {
      type: 'toggleEvidence',
      childId: 'c1',
      topicId: 'A',
      index: 0,
      now: NOW,
    })
    expect(s.logs['c1']['A']?.evidence[0]).toBeUndefined()
  })

  test('does not mutate the previous state', () => {
    const before = withChild()
    const after = reducer(before, {
      type: 'toggleEvidence',
      childId: 'c1',
      topicId: 'A',
      index: 0,
      now: NOW,
    })
    expect(before.logs['c1']['A']).toBeUndefined()
    expect(after).not.toBe(before)
  })
})

describe('setExplicitMastered', () => {
  test('sets the flag and a masteredAt timestamp', () => {
    const s = reducer(withChild(), {
      type: 'setExplicitMastered',
      childId: 'c1',
      topicId: 'A',
      value: true,
      now: NOW,
    })
    expect(s.logs['c1']['A'].explicitMastered).toBe(true)
    expect(s.logs['c1']['A'].masteredAt).toBe(NOW)
  })

  test('clearing the flag removes masteredAt', () => {
    let s = reducer(withChild(), {
      type: 'setExplicitMastered',
      childId: 'c1',
      topicId: 'A',
      value: true,
      now: NOW,
    })
    s = reducer(s, {
      type: 'setExplicitMastered',
      childId: 'c1',
      topicId: 'A',
      value: false,
      now: NOW,
    })
    expect(s.logs['c1']['A'].explicitMastered).toBe(false)
    expect(s.logs['c1']['A'].masteredAt).toBeUndefined()
  })
})

describe('settings', () => {
  test('setWindowDelta updates the window', () => {
    const s = reducer(withChild(), { type: 'setWindowDelta', delta: 3 })
    expect(s.settings.windowDelta).toBe(3)
  })

  test('setActiveChild switches the active child', () => {
    let s = reducer(withChild(), {
      type: 'addChild',
      child: { id: 'c2', name: 'Kai', birthdate: '2025-01-01' },
    })
    s = reducer(s, { type: 'setActiveChild', id: 'c2' })
    expect(s.settings.activeChildId).toBe('c2')
  })

  test('updateChild patches fields but keeps the id', () => {
    const s = reducer(withChild(), {
      type: 'updateChild',
      id: 'c1',
      patch: { name: 'Kavya R.' },
    })
    expect(s.children[0]).toEqual({ ...kavya, name: 'Kavya R.' })
  })
})

describe('hydrate / importState', () => {
  test('replaces the whole state', () => {
    const imported: AppState = {
      version: STATE_VERSION,
      children: [kavya],
      logs: { c1: { A: { evidence: { 0: { seenAt: NOW } } } } },
      settings: { activeChildId: 'c1', windowDelta: 2 },
    }
    expect(
      reducer(initialState, { type: 'importState', state: imported }),
    ).toBe(imported)
    expect(reducer(withChild(), { type: 'hydrate', state: imported })).toBe(
      imported,
    )
  })
})

describe('validateImport', () => {
  test('accepts a well-formed current-version blob', () => {
    const blob: AppState = {
      version: STATE_VERSION,
      children: [kavya],
      logs: { c1: {} },
      settings: { activeChildId: 'c1', windowDelta: 1 },
    }
    expect(validateImport(blob)).toEqual(blob)
  })

  test('rejects a wrong version', () => {
    expect(() => validateImport({ ...initialState, version: 999 })).toThrow(
      /version/i,
    )
  })

  test('rejects a non-object', () => {
    expect(() => validateImport('nope')).toThrow()
    expect(() => validateImport(null)).toThrow()
  })

  test('rejects a blob missing required fields', () => {
    expect(() => validateImport({ version: STATE_VERSION })).toThrow()
  })
})
