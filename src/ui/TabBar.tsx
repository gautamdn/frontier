export type Tab = 'today' | 'map' | 'progress' | 'settings'

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'today', label: 'Today', icon: '☀️' },
  { id: 'map', label: 'Map', icon: '🗺️' },
  { id: 'progress', label: 'Progress', icon: '📈' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
]

export function TabBar({ tab, onTab }: { tab: Tab; onTab: (t: Tab) => void }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
      <div className="mx-auto flex max-w-3xl">
        {TABS.map((t) => {
          const active = t.id === tab
          return (
            <button
              key={t.id}
              onClick={() => onTab(t.id)}
              className={`flex min-h-16 flex-1 flex-col items-center justify-center gap-0.5 text-sm font-medium transition ${
                active
                  ? 'text-indigo-600'
                  : 'text-slate-400 active:text-slate-600'
              }`}
            >
              <span className="text-2xl leading-none">{t.icon}</span>
              {t.label}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
