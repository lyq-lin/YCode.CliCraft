import { useState } from 'react'
import type { Profile } from '@shared/types'
import { Plus } from 'lucide-react'
import { ProfileCard } from './ProfileCard'
import { ProfileForm } from './ProfileForm'
import { ActivateToast } from './ActivateToast'

interface DashboardProps {
  profiles: Profile[]
  activeProfileId: string | null
  onRefresh: () => void | Promise<void>
  onActivate: (id: string | null) => void
}

export function Dashboard({ profiles, activeProfileId, onRefresh, onActivate }: DashboardProps) {
  const [editing, setEditing] = useState<Profile | null>(null)
  const [creating, setCreating] = useState(false)
  const [toast, setToast] = useState<{ command: string; commandPs1?: string } | null>(null)

  const handleActivate = async (profile: Profile) => {
    const result = await window.clicraft.activateProfile(profile.id)
    if (result.success) {
      onActivate(profile.id)
      setToast({
        command: result.command,
        commandPs1: result.commandPs1,
      })
    } else {
      alert(result.error || '激活失败')
    }
  }

  const handleSave = async () => {
    setEditing(null)
    setCreating(false)
    await onRefresh()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确定删除该配置方案？')) return
    try {
      await window.clicraft.deleteProfile(id)
      await onRefresh()
      if (activeProfileId === id) onActivate(null)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      alert('删除失败：' + message)
    }
  }

  if (editing || creating) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-6">
        <ProfileForm
          profile={editing ?? undefined}
          onSave={handleSave}
          onCancel={() => {
            setEditing(null)
            setCreating(false)
          }}
        />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-6">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-text-primary m-0 tracking-tight">CliCraft</h1>
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 bg-surface shadow-card text-text-primary text-sm font-medium cursor-pointer transition-colors duration-200 hover:bg-gray-50 hover:border-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          aria-label="新建方案"
        >
          <Plus className="w-4 h-4 shrink-0" aria-hidden />
          新建方案
        </button>
      </header>

      {profiles.length === 0 ? (
        <div className="text-center py-12 px-6 bg-surface rounded-xl border border-dashed border-gray-300 text-text-secondary">
          <p className="m-0 text-text-secondary">还没有任何配置方案</p>
          <p className="mt-1 text-text-muted text-sm">点击「新建方案」添加第一套配置（如 DeepSeek、智谱等）</p>
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 bg-surface text-text-primary text-sm font-medium cursor-pointer transition-colors duration-200 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            <Plus className="w-4 h-4 shrink-0" aria-hidden />
            新建方案
          </button>
        </div>
      ) : (
        <ul className="flex flex-col gap-3 list-none p-0 m-0">
          {profiles.map((p) => (
            <li key={p.id}>
              <ProfileCard
                profile={p}
                isActive={p.id === activeProfileId}
                onUse={() => handleActivate(p)}
                onEdit={() => setEditing(p)}
                onDelete={() => handleDelete(p.id)}
              />
            </li>
          ))}
        </ul>
      )}

      {toast && (
        <ActivateToast
          command={toast.command}
          commandPs1={toast.commandPs1}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  )
}
