import { useState } from 'react'
import { Card, Button, Dropdown, Typography, Space, Tag, message } from 'antd'
import {
  CodeOutlined,
  GlobalOutlined,
  DownOutlined,
  EditOutlined,
  DeleteOutlined,
  LoadingOutlined,
} from '@ant-design/icons'
import type { Profile, LaunchScope } from '@shared/types'
import { getCliTypes } from '@shared/cliTypes'
import type { MenuProps } from 'antd'

const { Text } = Typography

interface ProfileCardProps {
  profile: Profile
  onLaunch: (scope: LaunchScope) => Promise<void>
  onEdit: () => void
  onDelete: () => void
}

export function ProfileCard({ profile, onLaunch, onEdit, onDelete }: ProfileCardProps) {
  const cliTypes = getCliTypes()
  const cliType = cliTypes.find((c) => c.id === profile.cliTypeId)
  const [launching, setLaunching] = useState(false)

  const doLaunch = async (scope: LaunchScope) => {
    setLaunching(true)
    try {
      await onLaunch(scope)
    } finally {
      setLaunching(false)
    }
  }

  const dropdownItems: MenuProps['items'] = [
    {
      key: 'local',
      icon: <CodeOutlined />,
      label: '仅新窗口生效',
      onClick: () => doLaunch('local'),
    },
    {
      key: 'global',
      icon: <GlobalOutlined />,
      label: '全局生效（写入 shell 配置）',
      onClick: () => doLaunch('global'),
    },
  ]

  return (
    <Card
      size="small"
      hoverable
      styles={{
        body: { padding: '16px 20px' },
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <Text strong className="text-base block truncate">{profile.name}</Text>
          <Space size={4} className="mt-1">
            <Tag color="green" bordered={false}>{cliType?.name ?? profile.cliTypeId}</Tag>
          </Space>
        </div>

        <Space size={8}>
          <Dropdown.Button
            type="primary"
            icon={<DownOutlined />}
            menu={{ items: dropdownItems }}
            onClick={() => doLaunch('local')}
            loading={launching}
            disabled={launching}
          >
            <CodeOutlined />
            以当前启动
          </Dropdown.Button>

          <Button
            icon={<EditOutlined />}
            onClick={onEdit}
            aria-label="编辑方案"
          />
          <Button
            icon={<DeleteOutlined />}
            danger
            onClick={onDelete}
            aria-label="删除方案"
          />
        </Space>
      </div>
    </Card>
  )
}
