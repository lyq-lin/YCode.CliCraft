import { useState, useEffect } from 'react'
import type { Profile } from '@shared/types'
import { getCliTypes } from '@shared/cliTypes'
import { ArrowLeft } from 'lucide-react'

interface ProfileFormProps {
  profile?: Profile
  onSave: () => void
  onCancel: () => void
}

function generateId(): string {
  return `profile_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

export function ProfileForm({ profile, onSave, onCancel }: ProfileFormProps) {
  const cliTypes = getCliTypes()
  const [name, setName] = useState(profile?.name ?? '')
  const [cliTypeId, setCliTypeId] = useState(profile?.cliTypeId ?? cliTypes[0]?.id ?? '')
  const [env, setEnv] = useState<Record<string, string>>(profile?.env ?? {})

  const selectedCli = cliTypes.find((c) => c.id === cliTypeId)

  useEffect(() => {
    if (!selectedCli) return
    const next: Record<string, string> = {}
    for (const def of selectedCli.envKeys) {
      // 仅当该 key 未在 env 中或为 undefined 时用默认值，保留用户清空后的空字符串
      const val = env[def.key]
      next[def.key] = (val !== undefined && val !== null) ? val : (selectedCli.envDefaults[def.key] ?? '')
    }
    setEnv(next)
  }, [cliTypeId])

  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      alert('请输入方案名称')
      return
    }
    setSaveError(null)
    setSaving(true)
    try {
      const p: Profile = {
        id: profile?.id ?? generateId(),
        name: name.trim(),
        cliTypeId,
        env: { ...env },
      }
      const result = await window.clicraft.saveProfile(p)
      if (result.success) {
        onSave()
      } else {
        setSaveError(result.error || '保存失败')
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      setSaveError(message || '保存失败')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-surface rounded-xl border border-gray-200 shadow-card p-6 max-w-lg"
    >
      <h2 className="text-lg font-semibold text-text-primary m-0 mb-5">
        {profile ? '编辑方案' : '新建方案'}
      </h2>

      <div className="mb-4">
        <label htmlFor="profile-name" className="block text-sm font-medium text-text-secondary mb-1">
          方案名称
        </label>
        <input
          id="profile-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="如：DeepSeek、智谱 GLM"
          className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white text-text-primary placeholder:text-text-muted transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        />
      </div>

      <div className="mb-4">
        <label htmlFor="profile-clitype" className="block text-sm font-medium text-text-secondary mb-1">
          CLI 类型
        </label>
        <select
          id="profile-clitype"
          value={cliTypeId}
          onChange={(e) => setCliTypeId(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white text-text-primary cursor-pointer transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        >
          {cliTypes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {selectedCli?.envKeys.map((def) => (
        <div key={def.key} className="mb-4">
          <label
            htmlFor={`env-${def.key}`}
            className="block text-sm font-medium text-text-secondary mb-1"
          >
            {def.label ?? def.key}
            {def.secret ? '（密钥）' : ''}
          </label>
          <input
            id={`env-${def.key}`}
            type={def.secret ? 'password' : 'text'}
            value={env[def.key] ?? ''}
            onChange={(e) => setEnv((prev) => ({ ...prev, [def.key]: e.target.value }))}
            placeholder={selectedCli.envDefaults[def.key]}
            autoComplete={def.secret ? 'off' : undefined}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white text-text-primary placeholder:text-text-muted transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
      ))}

      {saveError && (
        <p className="mt-4 text-sm text-red-600" role="alert">
          {saveError}
        </p>
      )}

      <div className="flex flex-wrap gap-2 mt-6">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white border border-primary text-sm font-medium cursor-pointer transition-colors duration-200 hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 min-h-[44px] disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {saving ? '保存中…' : '保存'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 bg-surface text-text-primary text-sm font-medium cursor-pointer transition-colors duration-200 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 min-h-[44px] disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <ArrowLeft className="w-4 h-4 shrink-0" aria-hidden />
          取消
        </button>
      </div>
    </form>
  )
}
