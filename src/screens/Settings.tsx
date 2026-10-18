import { useRef, useState } from 'react'
import {
  useActiveChild,
  useAppState,
  useChildAge,
  useDispatch,
} from '../lib/store'
import { validateImport } from '../lib/state'
import { TAXONOMY_VERSION } from '../lib/taxonomy'
import { Attribution } from '../ui/Attribution'

export function Settings() {
  const state = useAppState()
  const dispatch = useDispatch()
  const child = useActiveChild()
  const childAge = useChildAge()
  const fileInput = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState<string | null>(null)

  function exportData() {
    const blob = new Blob([JSON.stringify(state, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'frontier-data.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  async function importData(file: File) {
    try {
      const data: unknown = JSON.parse(await file.text())
      dispatch({ type: 'importState', state: validateImport(data) })
      setMessage('Imported successfully.')
    } catch (err) {
      setMessage(`Import failed: ${(err as Error).message}`)
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="mb-6 text-3xl font-bold text-slate-900">Settings</h1>

      {child && (
        <section className="mb-8">
          <h2 className="mb-3 text-xl font-semibold text-slate-800">Child</h2>
          <label className="mb-3 block">
            <span className="mb-1 block text-slate-600">Name</span>
            <input
              type="text"
              value={child.name}
              onChange={(e) =>
                dispatch({
                  type: 'updateChild',
                  id: child.id,
                  patch: { name: e.target.value },
                })
              }
              className="min-h-12 w-full rounded-2xl border border-slate-300 px-4 text-lg"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-slate-600">Birthdate</span>
            <input
              type="date"
              value={child.birthdate}
              onChange={(e) =>
                dispatch({
                  type: 'updateChild',
                  id: child.id,
                  patch: { birthdate: e.target.value },
                })
              }
              className="min-h-12 w-full rounded-2xl border border-slate-300 px-4 text-lg"
            />
          </label>
          {childAge !== null && (
            <p className="mt-2 text-slate-500">
              Currently {childAge} years old.
            </p>
          )}
        </section>
      )}

      <section className="mb-8">
        <h2 className="mb-1 text-xl font-semibold text-slate-800">
          Age window
        </h2>
        <p className="mb-3 text-slate-500">
          Show topics starting at up to{' '}
          <strong>{(childAge ?? 0) + state.settings.windowDelta}</strong> years.
        </p>
        <div className="flex flex-wrap gap-2">
          {[0, 1, 2, 3].map((d) => (
            <button
              key={d}
              onClick={() => dispatch({ type: 'setWindowDelta', delta: d })}
              className={`min-h-11 rounded-full px-4 font-medium transition ${
                state.settings.windowDelta === d
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 active:bg-slate-200'
              }`}
            >
              age +{d}
            </button>
          ))}
        </div>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-xl font-semibold text-slate-800">Your data</h2>
        <p className="mb-3 text-slate-500">
          Everything is stored only on this device. Export to back up or move to
          another device.
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={exportData}
            className="min-h-12 rounded-2xl bg-slate-900 px-5 font-semibold text-white active:bg-slate-700"
          >
            Export JSON
          </button>
          <button
            onClick={() => fileInput.current?.click()}
            className="min-h-12 rounded-2xl bg-slate-100 px-5 font-semibold text-slate-700 active:bg-slate-200"
          >
            Import JSON
          </button>
          <input
            ref={fileInput}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) void importData(file)
              e.target.value = ''
            }}
          />
        </div>
        {message && <p className="mt-3 text-slate-600">{message}</p>}
      </section>

      <section>
        <h2 className="mb-3 text-xl font-semibold text-slate-800">About</h2>
        <p className="mb-3 text-slate-500">
          Skill data: Marble Skill Taxonomy {TAXONOMY_VERSION}.
        </p>
        <Attribution />
      </section>
    </div>
  )
}
