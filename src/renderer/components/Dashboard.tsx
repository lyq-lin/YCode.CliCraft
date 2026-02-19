import { useState } from 'react'
import { Button, Typography, Space, Empty, App as AntApp } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import type { Profile, LaunchScope } from '@shared/types'
import { ProfileCard } from './ProfileCard'
import { ProfileForm } from './ProfileForm'
import { CliStatusPanel } from './CliStatusPanel'

const { Title } = Typography

interface DashboardProps {
  profiles: Profile[]
  onRefresh: () => void | Promise<void>
}

export function Dashboard({ profiles, onRefresh }: DashboardProps) {
  const [editing, setEditing] = useState<Profile | null>(null)
  const [creating, setCreating] = useState(false)
  const { message, modal } = AntApp.useApp()

  const handleLaunch = async (profile: Profile, scope: LaunchScope) => {
    const result = await window.clicraft.launchProfile(profile.id, scope)
    if (result.success) {
      message.success(result.message || '启动成功')
    } else {
      message.error(result.error || '启动失败')
    }
  }

  const handleSave = async () => {
    setEditing(null)
    setCreating(false)
    await onRefresh()
  }

  const handleDelete = async (id: string) => {
    modal.confirm({
      title: '确认删除',
      content: '确定删除该配置方案？此操作不可恢复。',
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await window.clicraft.deleteProfile(id)
          await onRefresh()
          message.success('已删除')
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err)
          message.error('删除失败：' + msg)
        }
      },
    })
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
    <div className="max-w-3xl mx-auto px-6 py-6 space-y-8">
      <section>
        <header className="flex items-center justify-between mb-4">
          <Title level={3} className="!m-0">CliCraft</Title>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setCreating(true)}
          >
            新建方案
          </Button>
        </header>

        {profiles.length === 0 ? (
          <div className="bg-white rounded-xl border border-dashed border-gray-300 py-12 px-6">
            <Empty description="还没有任何配置方案">
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setCreating(true)}
              >
                新建方案
              </Button>
            </Empty>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {profiles.map((p) => (
              <ProfileCard
                key={p.id}
                profile={p}
                onLaunch={(scope) => handleLaunch(p, scope)}
                onEdit={() => setEditing(p)}
                onDelete={() => handleDelete(p.id)}
              />
            ))}
          </div>
        )}
      </section>

      <CliStatusPanel />
    </div>
  )
}
