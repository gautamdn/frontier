/* eslint-disable react-refresh/only-export-components --
   The store intentionally co-locates its provider with the hooks that read it;
   fast-refresh granularity is not worth splitting this small module. */
import { get, set } from 'idb-keyval'
import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useRef,
  useState,
  type Dispatch,
  type ReactNode,
} from 'react'
import { ageInYears } from './age'
import type { Log } from './graph'
import {
  initialState,
  reducer,
  validateImport,
  type Action,
  type AppState,
  type Child,
} from './state'

const IDB_KEY = 'frontier-state'

const StateContext = createContext<AppState>(initialState)
const DispatchContext = createContext<Dispatch<Action>>(() => {})

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState)
  const [loaded, setLoaded] = useState(false)

  // Load once from IndexedDB.
  useEffect(() => {
    let cancelled = false
    void get(IDB_KEY).then((saved) => {
      if (cancelled) return
      if (saved) {
        try {
          dispatch({ type: 'hydrate', state: validateImport(saved) })
        } catch {
          // Corrupt or incompatible blob — start fresh rather than crash.
        }
      }
      setLoaded(true)
    })
    return () => {
      cancelled = true
    }
  }, [])

  // Debounced persist after hydration.
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  useEffect(() => {
    if (!loaded) return
    clearTimeout(timer.current)
    timer.current = setTimeout(() => void set(IDB_KEY, state), 300)
    return () => clearTimeout(timer.current)
  }, [state, loaded])

  if (!loaded) return null

  return (
    <StateContext.Provider value={state}>
      <DispatchContext.Provider value={dispatch}>
        {children}
      </DispatchContext.Provider>
    </StateContext.Provider>
  )
}

export function useAppState(): AppState {
  return useContext(StateContext)
}

export function useDispatch(): Dispatch<Action> {
  return useContext(DispatchContext)
}

export function useActiveChild(): Child | null {
  const { children, settings } = useAppState()
  return children.find((c) => c.id === settings.activeChildId) ?? null
}

export function useActiveLog(): Log {
  const { logs, settings } = useAppState()
  return (settings.activeChildId && logs[settings.activeChildId]) || {}
}

/** Completed whole years of the active child, or null if none. */
export function useChildAge(): number | null {
  const child = useActiveChild()
  if (!child) return null
  return ageInYears(child.birthdate, new Date())
}
