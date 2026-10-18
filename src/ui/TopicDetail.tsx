import { fillName } from '../lib/format'
import { helpsToKnowFirst, mastered, unlocks } from '../lib/graph'
import { useActiveChild, useActiveLog, useDispatch } from '../lib/store'
import { TOPICS, type Topic } from '../lib/taxonomy'
import { subjectTheme } from './theme'

export function TopicDetail({
  topic,
  onClose,
}: {
  topic: Topic
  onClose: () => void
}) {
  const child = useActiveChild()
  const log = useActiveLog()
  const dispatch = useDispatch()
  const name = child?.name ?? 'your child'
  const theme = subjectTheme(topic.subject)

  const entry = log[topic.id]
  const isMastered = mastered(topic, log)
  const willUnlock = unlocks(topic.id, TOPICS)
  const softHints = helpsToKnowFirst(topic, TOPICS)

  const toggle = (index: number) =>
    dispatch({
      type: 'toggleEvidence',
      childId: child!.id,
      topicId: topic.id,
      index,
      now: new Date().toISOString(),
    })

  const setMastered = (value: boolean) =>
    dispatch({
      type: 'setExplicitMastered',
      childId: child!.id,
      topicId: topic.id,
      value,
      now: new Date().toISOString(),
    })

  return (
    <div
      className="fixed inset-0 z-20 flex justify-center overflow-y-auto bg-slate-900/40 p-4 sm:items-center"
      onClick={onClose}
    >
      <div
        className="my-auto w-full max-w-2xl rounded-3xl bg-white p-6 shadow-xl sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <span
              className={`inline-block rounded-full px-3 py-1 text-sm font-semibold ${theme.soft} ${theme.text}`}
            >
              {topic.subject} · {topic.domain}
            </span>
            <h2 className="mt-2 text-2xl font-bold text-slate-900">
              {topic.name}
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-100 text-2xl text-slate-600 active:bg-slate-200"
          >
            ×
          </button>
        </div>

        <p className="text-lg leading-relaxed text-slate-700">
          {topic.description}
        </p>

        <section className="mt-6">
          <h3 className="mb-1 text-sm font-semibold tracking-wide text-slate-500 uppercase">
            How you'll know
          </h3>
          <p className="rounded-2xl bg-amber-50 p-4 text-lg text-slate-800">
            {fillName(topic.assessmentPrompt, name)}
          </p>
        </section>

        <section className="mt-6">
          <h3 className="mb-2 text-sm font-semibold tracking-wide text-slate-500 uppercase">
            Evidence {child ? `you've seen in ${name}` : ''}
          </h3>
          {topic.evidence.length === 0 ? (
            <p className="text-slate-500">
              No checklist for this one — mark it when you've seen it.
            </p>
          ) : (
            <ul className="space-y-2">
              {topic.evidence.map((item, i) => {
                const ticked = entry?.evidence[i] !== undefined
                return (
                  <li key={i}>
                    <button
                      onClick={() => toggle(i)}
                      className={`flex min-h-12 w-full items-center gap-3 rounded-2xl border-2 p-3 text-left text-lg transition ${
                        ticked
                          ? 'border-emerald-400 bg-emerald-50 text-slate-800'
                          : 'border-slate-200 bg-white text-slate-700 active:bg-slate-50'
                      }`}
                    >
                      <span
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-lg ${
                          ticked
                            ? 'bg-emerald-500 text-white'
                            : 'border-2 border-slate-300'
                        }`}
                      >
                        {ticked ? '✓' : ''}
                      </span>
                      {item}
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        {softHints.length > 0 && (
          <section className="mt-6">
            <h3 className="mb-2 text-sm font-semibold tracking-wide text-slate-500 uppercase">
              Helps to know first
            </h3>
            <div className="flex flex-wrap gap-2">
              {softHints.map((t) => (
                <span
                  key={t.id}
                  className="rounded-full bg-slate-100 px-3 py-1 text-slate-600"
                >
                  {t.name}
                </span>
              ))}
            </div>
          </section>
        )}

        {willUnlock.hard.length > 0 && (
          <section className="mt-6">
            <h3 className="mb-2 text-sm font-semibold tracking-wide text-slate-500 uppercase">
              Unlocks next
            </h3>
            <div className="flex flex-wrap gap-2">
              {willUnlock.hard.map((t) => (
                <span
                  key={t.id}
                  className="rounded-full bg-indigo-50 px-3 py-1 text-indigo-700"
                >
                  {t.name}
                </span>
              ))}
            </div>
          </section>
        )}

        {child && (
          <button
            onClick={() => setMastered(!entry?.explicitMastered)}
            className={`mt-8 min-h-12 w-full rounded-2xl p-4 text-lg font-semibold transition ${
              entry?.explicitMastered
                ? 'bg-emerald-100 text-emerald-800 active:bg-emerald-200'
                : 'bg-slate-900 text-white active:bg-slate-700'
            }`}
          >
            {entry?.explicitMastered
              ? '✓ Marked mastered — tap to undo'
              : isMastered
                ? 'Mark mastered (keep it)'
                : `Mark mastered`}
          </button>
        )}
      </div>
    </div>
  )
}
