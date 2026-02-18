import { useState, useEffect } from 'react'
import { Dashboard } from './components/Dashboard'
import type { Profile } from '../shared/types'

function App() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    try {
      const [p, a] = await Promise.all([
        window.clicraft.getProfiles(),
        window.clicraft.getActiveProfileId(),
      ])
      setProfiles(p)
      setActiveId(a)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        加载中…
      </div>
    )
  }

  return (
    <Dashboard
      profiles={profiles}
      activeProfileId={activeId}
      onRefresh={load}
      onActivate={setActiveId}
    />
  )
}

export default App
