import { useState, useEffect, useMemo } from 'react'
import { Form, Input, Select, Button, Space, Alert, Typography } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import type { Profile } from '@shared/types'
import { getCliTypes } from '@shared/cliTypes'

const { Title } = Typography

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
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const selectedCli = useMemo(() => cliTypes.find((c) => c.id === cliTypeId), [cliTypeId])

  useEffect(() => {
    if (!selectedCli) return
    const next: Record<string, string> = {}
    for (const def of selectedCli.envKeys) {
      const val = env[def.key]
      next[def.key] = (val !== undefined && val !== null) ? val : (selectedCli.envDefaults[def.key] ?? '')
    }
    setEnv(next)
  }, [cliTypeId])

  const handleSubmit = async () => {
    if (!name.trim()) return
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
    <div className="bg-white rounded-xl p-6 shadow-card max-w-lg border border-gray-100">
      <div className="flex items-center gap-3 mb-6">
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={onCancel}
          type="text"
          aria-label="返回"
        />
        <Title level={4} className="!m-0">
          {profile ? '编辑方案' : '新建方案'}
        </Title>
      </div>

      <Form layout="vertical" onFinish={handleSubmit}>
        <Form.Item label="方案名称" required>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="如：DeepSeek、智谱 GLM"
            size="large"
          />
        </Form.Item>

        <Form.Item label="CLI 类型">
          <Select
            value={cliTypeId}
            onChange={setCliTypeId}
            size="large"
            options={cliTypes.map((c) => ({ label: c.name, value: c.id }))}
          />
        </Form.Item>

        {selectedCli?.envKeys.map((def) => (
          <Form.Item key={def.key} label={`${def.label ?? def.key}${def.secret ? '（密钥）' : ''}`}>
            {def.secret ? (
              <Input.Password
                value={env[def.key] ?? ''}
                onChange={(e) => setEnv((prev) => ({ ...prev, [def.key]: e.target.value }))}
                placeholder={selectedCli.envDefaults[def.key]}
                autoComplete="off"
                visibilityToggle
              />
            ) : (
              <Input
                value={env[def.key] ?? ''}
                onChange={(e) => setEnv((prev) => ({ ...prev, [def.key]: e.target.value }))}
                placeholder={selectedCli.envDefaults[def.key]}
              />
            )}
          </Form.Item>
        ))}

        {saveError && (
          <Alert
            type="error"
            message={saveError}
            showIcon
            closable
            onClose={() => setSaveError(null)}
            className="mb-4"
          />
        )}

        <Form.Item className="!mb-0">
          <Space>
            <Button type="primary" htmlType="submit" loading={saving} size="large">
              保存
            </Button>
            <Button onClick={onCancel} disabled={saving} size="large">
              取消
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </div>
  )
}
