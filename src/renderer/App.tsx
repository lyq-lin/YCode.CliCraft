import { useState, useEffect } from 'react'
import { ConfigProvider, App as AntApp, Spin } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import { Dashboard } from './components/Dashboard'
import type { Profile } from '../shared/types'

const theme = {
  token: {
    colorPrimary: '#0a7c42',
    borderRadius: 8,
    colorBgContainer: '#ffffff',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
}

function AppContent() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    try {
      const p = await window.clicraft.getProfiles()
      setProfiles(p)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spin size="large" />
      </div>
    )
  }

  return <Dashboard profiles={profiles} onRefresh={load} />
}

function App() {
  return (
    <ConfigProvider theme={theme} locale={zhCN}>
      <AntApp>
        <AppContent />
      </AntApp>
    </ConfigProvider>
  )
}

export default App
