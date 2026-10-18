// Per-subject accent classes and topic status styling. Kept as a small lookup
// so every screen reads as one visual system.

export type TopicStatus = 'mastered' | 'frontier' | 'locked'

interface SubjectTheme {
  /** soft background for group headers / chips */
  soft: string
  /** solid dot / accent */
  dot: string
  /** text accent */
  text: string
}

const SUBJECT_THEMES: Record<string, SubjectTheme> = {
  Mathematics: {
    soft: 'bg-indigo-100',
    dot: 'bg-indigo-500',
    text: 'text-indigo-700',
  },
  Science: {
    soft: 'bg-emerald-100',
    dot: 'bg-emerald-500',
    text: 'text-emerald-700',
  },
  English: { soft: 'bg-rose-100', dot: 'bg-rose-500', text: 'text-rose-700' },
  History: {
    soft: 'bg-amber-100',
    dot: 'bg-amber-500',
    text: 'text-amber-700',
  },
  Computing: { soft: 'bg-sky-100', dot: 'bg-sky-500', text: 'text-sky-700' },
  'Life Skills': {
    soft: 'bg-teal-100',
    dot: 'bg-teal-500',
    text: 'text-teal-700',
  },
  'Personal & Social Development': {
    soft: 'bg-violet-100',
    dot: 'bg-violet-500',
    text: 'text-violet-700',
  },
  'Learning to Learn': {
    soft: 'bg-fuchsia-100',
    dot: 'bg-fuchsia-500',
    text: 'text-fuchsia-700',
  },
}

const FALLBACK: SubjectTheme = {
  soft: 'bg-slate-100',
  dot: 'bg-slate-500',
  text: 'text-slate-700',
}

export function subjectTheme(subject: string): SubjectTheme {
  return SUBJECT_THEMES[subject] ?? FALLBACK
}

export const STATUS_BADGE: Record<
  TopicStatus,
  { label: string; classes: string }
> = {
  mastered: { label: 'Mastered', classes: 'bg-emerald-100 text-emerald-800' },
  frontier: { label: 'Ready now', classes: 'bg-indigo-100 text-indigo-800' },
  locked: { label: 'Ready later', classes: 'bg-slate-100 text-slate-500' },
}
