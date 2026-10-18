import type { Log } from './graph'

export const STATE_VERSION = 1

export interface Child {
  id: string
  name: string
  /** ISO date, yyyy-mm-dd */
  birthdate: string
}

export interface Settings {
  activeChildId: string | null
  /** age window: include topics with ageRangeStart <= childAge + windowDelta */
  windowDelta: number
}

export interface AppState {
  version: number
  children: Child[]
  logs: Record<string, Log>
  settings: Settings
}

export type Action =
  | { type: 'hydrate'; state: AppState }
  | { type: 'importState'; state: AppState }
  | { type: 'addChild'; child: Child }
  | { type: 'updateChild'; id: string; patch: Partial<Omit<Child, 'id'>> }
  | { type: 'setActiveChild'; id: string }
  | { type: 'setWindowDelta'; delta: number }
  | {
      type: 'toggleEvidence'
      childId: string
      topicId: string
      index: number
      now: string
    }
  | {
      type: 'setExplicitMastered'
      childId: string
      topicId: string
      value: boolean
      now: string
    }

export const initialState: AppState = {
  version: STATE_VERSION,
  children: [],
  logs: {},
  settings: { activeChildId: null, windowDelta: 1 },
}

export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'hydrate':
    case 'importState':
      return action.state

    case 'addChild': {
      const isFirst = state.children.length === 0
      return {
        ...state,
        children: [...state.children, action.child],
        logs: { ...state.logs, [action.child.id]: {} },
        settings: isFirst
          ? { ...state.settings, activeChildId: action.child.id }
          : state.settings,
      }
    }

    case 'updateChild':
      return {
        ...state,
        children: state.children.map((c) =>
          c.id === action.id ? { ...c, ...action.patch } : c,
        ),
      }

    case 'setActiveChild':
      return {
        ...state,
        settings: { ...state.settings, activeChildId: action.id },
      }

    case 'setWindowDelta':
      return {
        ...state,
        settings: { ...state.settings, windowDelta: action.delta },
      }

    case 'toggleEvidence': {
      const log = state.logs[action.childId] ?? {}
      const topicLog = log[action.topicId] ?? { evidence: {} }
      const evidence = { ...topicLog.evidence }
      if (evidence[action.index]) delete evidence[action.index]
      else evidence[action.index] = { seenAt: action.now }
      return {
        ...state,
        logs: {
          ...state.logs,
          [action.childId]: {
            ...log,
            [action.topicId]: { ...topicLog, evidence },
          },
        },
      }
    }

    case 'setExplicitMastered': {
      const log = state.logs[action.childId] ?? {}
      const topicLog = log[action.topicId] ?? { evidence: {} }
      const next = { ...topicLog, explicitMastered: action.value }
      if (action.value) next.masteredAt = action.now
      else delete next.masteredAt
      return {
        ...state,
        logs: {
          ...state.logs,
          [action.childId]: { ...log, [action.topicId]: next },
        },
      }
    }
  }
}

/** Parse + validate an imported JSON blob into AppState (throws on mismatch). */
export function validateImport(raw: unknown): AppState {
  if (typeof raw !== 'object' || raw === null) {
    throw new Error('Import must be a JSON object')
  }
  const obj = raw as Record<string, unknown>
  if (obj.version !== STATE_VERSION) {
    throw new Error(
      `Unsupported data version: ${String(obj.version)} (expected ${STATE_VERSION})`,
    )
  }
  if (
    !Array.isArray(obj.children) ||
    typeof obj.logs !== 'object' ||
    obj.logs === null ||
    typeof obj.settings !== 'object' ||
    obj.settings === null
  ) {
    throw new Error(
      'Import is missing required fields (children, logs, settings)',
    )
  }
  return raw as AppState
}
