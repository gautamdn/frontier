import { useState } from 'react'
import { StoreProvider, useAppState } from './lib/store'
import { Map } from './screens/Map'
import { Onboarding } from './screens/Onboarding'
import { Progress } from './screens/Progress'
import { Settings } from './screens/Settings'
import { Today } from './screens/Today'
import { TabBar, type Tab } from './ui/TabBar'

function Shell() {
  const { children } = useAppState()
  const [tab, setTab] = useState<Tab>('today')

  if (children.length === 0) return <Onboarding />

  return (
    <div className="min-h-dvh bg-slate-50 pb-20">
      {tab === 'today' && <Today />}
      {tab === 'map' && <Map />}
      {tab === 'progress' && <Progress />}
      {tab === 'settings' && <Settings />}
      <TabBar tab={tab} onTab={setTab} />
    </div>
  )
}

export default function App() {
  return (
    <StoreProvider>
      <Shell />
    </StoreProvider>
  )
}
