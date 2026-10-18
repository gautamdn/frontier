import { useMemo, useState } from 'react'
import { frontier } from '../lib/graph'
import {
  useActiveChild,
  useAppState,
  useActiveLog,
  useChildAge,
} from '../lib/store'
import { TOPICS, type Topic } from '../lib/taxonomy'
import { TopicDetail } from '../ui/TopicDetail'
import { subjectTheme } from '../ui/theme'

export function Today() {
  const child = useActiveChild()
  const log = useActiveLog()
  const childAge = useChildAge()
  const { settings } = useAppState()
  const [selected, setSelected] = useState<Topic | null>(null)

  const { topics, hiddenByAge } = useMemo(
    () =>
      frontier(TOPICS, log, {
        childAge: childAge ?? 0,
        windowDelta: settings.windowDelta,
      }),
    [log, childAge, settings.windowDelta],
  )

  const bySubject = useMemo(() => {
    const groups = new Map<string, Topic[]>()
    for (const t of topics) {
      const list = groups.get(t.subject) ?? []
      list.push(t)
      groups.set(t.subject, list)
    }
    return [...groups.entries()].sort((a, b) => b[1].length - a[1].length)
  }, [topics])

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900">
          {child ? `${child.name} is ready for` : 'Ready for next'}
        </h1>
        <p className="mt-1 text-lg text-slate-500">
          {topics.length} {topics.length === 1 ? 'thing' : 'things'} at the
          growing edge
          {hiddenByAge > 0 && (
            <>
              {' · '}
              <span className="text-slate-400">
                {hiddenByAge} more hidden by the age filter
              </span>
            </>
          )}
        </p>
      </header>

      {topics.length === 0 && (
        <p className="rounded-2xl bg-slate-100 p-6 text-lg text-slate-600">
          Nothing on the frontier yet. Open the Map to mark what{' '}
          {child?.name ?? 'your child'} already knows, and new topics will
          appear here.
        </p>
      )}

      <div className="space-y-8">
        {bySubject.map(([subject, list]) => {
          const theme = subjectTheme(subject)
          return (
            <section key={subject}>
              <div className="mb-3 flex items-center gap-2">
                <span className={`h-3 w-3 rounded-full ${theme.dot}`} />
                <h2 className="text-xl font-semibold text-slate-800">
                  {subject}
                </h2>
                <span className="text-slate-400">{list.length}</span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {list.map((topic) => (
                  <button
                    key={topic.id}
                    onClick={() => setSelected(topic)}
                    className="flex min-h-16 flex-col justify-center rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition active:scale-[0.99] active:bg-slate-50"
                  >
                    <span className="text-lg font-semibold text-slate-900">
                      {topic.name}
                    </span>
                    <span className="mt-0.5 line-clamp-2 text-sm text-slate-500">
                      {topic.description}
                    </span>
                  </button>
                ))}
              </div>
            </section>
          )
        })}
      </div>

      {selected && (
        <TopicDetail topic={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  )
}
