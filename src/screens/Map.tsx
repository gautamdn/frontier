import { useMemo, useState } from 'react'
import { frontier, mastered } from '../lib/graph'
import { useAppState, useActiveLog, useChildAge } from '../lib/store'
import { ALL_TOPICS, TOPICS, type Topic } from '../lib/taxonomy'
import { TopicDetail } from '../ui/TopicDetail'
import { STATUS_BADGE, type TopicStatus } from '../ui/theme'

export function Map() {
  const log = useActiveLog()
  const childAge = useChildAge()
  const { settings } = useAppState()
  const [selected, setSelected] = useState<Topic | null>(null)
  const [subject, setSubject] = useState<string>('All')

  const maxAge = (childAge ?? 0) + settings.windowDelta

  const { inWindow, hiddenByAge, subjects } = useMemo(() => {
    const frontierIds = new Set(
      frontier(TOPICS, log, {
        childAge: childAge ?? 0,
        windowDelta: settings.windowDelta,
      }).topics.map((t) => t.id),
    )
    const inWindow: { topic: Topic; status: TopicStatus }[] = []
    let hiddenByAge = 0
    for (const topic of ALL_TOPICS) {
      if (topic.ageRangeStart > maxAge) {
        hiddenByAge++
        continue
      }
      const status: TopicStatus = mastered(topic, log)
        ? 'mastered'
        : frontierIds.has(topic.id)
          ? 'frontier'
          : 'locked'
      inWindow.push({ topic, status })
    }
    inWindow.sort(
      (a, b) =>
        STATUS_ORDER[a.status] - STATUS_ORDER[b.status] ||
        b.topic.centrality - a.topic.centrality,
    )
    const subjects = [
      'All',
      ...[...new Set(inWindow.map((x) => x.topic.subject))].sort(),
    ]
    return { inWindow, hiddenByAge, subjects }
  }, [log, childAge, settings.windowDelta, maxAge])

  const shown =
    subject === 'All'
      ? inWindow
      : inWindow.filter((x) => x.topic.subject === subject)

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <header className="mb-4">
        <h1 className="text-3xl font-bold text-slate-900">Map</h1>
        <p className="mt-1 text-lg text-slate-500">
          {inWindow.length} topics in the age window
          {hiddenByAge > 0 && (
            <span className="text-slate-400">
              {' '}
              · {hiddenByAge} hidden beyond it
            </span>
          )}
        </p>
      </header>

      <div className="mb-4 flex flex-wrap gap-2">
        {subjects.map((s) => (
          <button
            key={s}
            onClick={() => setSubject(s)}
            className={`min-h-11 rounded-full px-4 text-base font-medium transition ${
              subject === s
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 active:bg-slate-200'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map(({ topic, status }) => {
          const badge = STATUS_BADGE[status]
          return (
            <button
              key={topic.id}
              onClick={() => setSelected(topic)}
              className="flex min-h-16 flex-col justify-between gap-2 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition active:scale-[0.99] active:bg-slate-50"
            >
              <span className="text-base font-semibold text-slate-900">
                {topic.name}
              </span>
              <span
                className={`inline-block w-fit rounded-full px-2.5 py-0.5 text-sm font-medium ${badge.classes}`}
              >
                {badge.label}
              </span>
            </button>
          )
        })}
      </div>

      {selected && (
        <TopicDetail topic={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  )
}

const STATUS_ORDER: Record<TopicStatus, number> = {
  frontier: 0,
  mastered: 1,
  locked: 2,
}
