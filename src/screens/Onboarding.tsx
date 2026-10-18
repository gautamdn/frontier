import { useState } from 'react'
import { useDispatch } from '../lib/store'

export function Onboarding() {
  const dispatch = useDispatch()
  const [name, setName] = useState('')
  const [birthdate, setBirthdate] = useState('')

  const canSubmit = name.trim() !== '' && birthdate !== ''

  function createChild() {
    if (!canSubmit) return
    dispatch({
      type: 'addChild',
      child: { id: crypto.randomUUID(), name: name.trim(), birthdate },
    })
  }

  return (
    <main className="flex min-h-dvh flex-col justify-center bg-slate-50 px-6">
      <div className="mx-auto w-full max-w-md">
        <h1 className="text-4xl font-bold text-indigo-600">Frontier</h1>
        <p className="mt-2 mb-8 text-xl text-slate-600">
          What your child is ready for next. Let's start with who you're
          tracking.
        </p>

        <label className="mb-4 block">
          <span className="mb-1 block text-slate-600">Child's name</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Kavya"
            className="min-h-14 w-full rounded-2xl border border-slate-300 px-4 text-lg"
          />
        </label>

        <label className="mb-8 block">
          <span className="mb-1 block text-slate-600">Birthdate</span>
          <input
            type="date"
            value={birthdate}
            onChange={(e) => setBirthdate(e.target.value)}
            className="min-h-14 w-full rounded-2xl border border-slate-300 px-4 text-lg"
          />
        </label>

        <button
          onClick={createChild}
          disabled={!canSubmit}
          className="min-h-14 w-full rounded-2xl bg-slate-900 text-lg font-semibold text-white transition active:bg-slate-700 disabled:opacity-40"
        >
          Start
        </button>
      </div>
    </main>
  )
}
