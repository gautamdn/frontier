import { useMemo } from 'react'
import { mastered } from '../lib/graph'
import { useAppState, useActiveLog, useChildAge } from '../lib/store'
import { ALL_TOPICS, getTopic } from '../lib/taxonomy'
import { subjectTheme } from '../ui/theme'

interface SubjectProgress {
  subject: string
  mastered: number
  inWindow: number
}

interface FeedEvent {
  key: string
  topicName: string
  label: string
  at: number
}

export function Progress() {
  const log = useActiveLog()
  const childAge = useChildAge()
  const { settings } = useAppState()
  const maxAge = (childAge ?? 0) + settings.windowDelta

  const subjects = useMemo<SubjectProgress[]>(() => {
    const acc = new Map<string, SubjectProgress>()
    for (const t of ALL_TOPICS) {
      const row = acc.get(t.subject) ?? {
        subject: t.subject,
        mastered: 0,
        inWindow: 0,
      }
      if (t.ageRangeStart <= maxAge) row.inWindow++
      if (mastered(t, log)) row.mastered++
      acc.set(t.subject, row)
    }
    return [...acc.values()]
      .filter((r) => r.inWindow > 0 || r.mastered > 0)
      .sort((a, b) => b.mastered - a.mastered)
  }, [log, maxAge])

  const recent = useMemo<FeedEvent[]>(() => {
    const now = Date.now()
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000
    const events: FeedEvent[] = []
    for (const [topicId, topicLog] of Object.entries(log)) {
      const topic = getTopic(topicId)
      if (!topic) continue
      for (const [idx, e] of Object.entries(topicLog.evidence)) {
        const at = Date.parse(e.seenAt)
        if (at >= weekAgo)
          events.push({
            key: `${topicId}-e${idx}`,
            topicName: topic.name,
            label: topic.evidence[Number(idx)] ?? 'Evidence seen',
            at,
          })
      }
      if (topicLog.masteredAt) {
        const at = Date.parse(topicLog.masteredAt)
        if (at >= weekAgo)
          events.push({
            key: `${topicId}-mastered`,
            topicName: topic.name,
            label: 'Marked mastered',
            at,
          })
      }
    }
    return events.sort((a, b) => b.at - a.at)
  }, [log])

  const totalMastered = subjects.reduce((n, s) => n + s.mastered, 0)

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900">Progress</h1>
        <p className="mt-1 text-lg text-slate-500">
          {totalMastered} {totalMastered === 1 ? 'topic' : 'topics'} mastered so
          far
        </p>
      </header>

      <section className="mb-10 space-y-4">
        {subjects.map((s) => {
          const theme = subjectTheme(s.subject)
          const pct =
            s.inWindow > 0
              ? Math.min(100, Math.round((s.mastered / s.inWindow) * 100))
              : s.mastered > 0
                ? 100
                : 0
          return (
            <div key={s.subject}>
              <div className="mb-1 flex items-baseline justify-between">
                <span className="font-semibold text-slate-800">
                  {s.subject}
                </span>
                <span className="text-slate-500">
                  {s.mastered}
                  {s.inWindow > 0 && (
                    <span className="text-slate-400"> / {s.inWindow}</span>
                  )}
                </span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full ${theme.dot}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )
        })}
      </section>

      <section>
        <h2 className="mb-3 text-xl font-semibold text-slate-800">
          Last 7 days
        </h2>
        {recent.length === 0 ? (
          <p className="rounded-2xl bg-slate-100 p-6 text-slate-600">
            Nothing logged this week yet. Tap evidence on the Today or Map
            screens as you notice it.
          </p>
        ) : (
          <ul className="space-y-2">
            {recent.map((e) => (
              <li
                key={e.key}
                className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4"
              >
                <div>
                  <p className="font-semibold text-slate-900">{e.topicName}</p>
                  <p className="text-slate-500">{e.label}</p>
                </div>
                <span className="shrink-0 text-sm text-slate-400">
                  {relativeDay(e.at)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

function relativeDay(at: number): string {
  const days = Math.floor((Date.now() - at) / (24 * 60 * 60 * 1000))
  if (days <= 0) return 'today'
  if (days === 1) return 'yesterday'
  return `${days} days ago`
}
