import { useState, useEffect, useCallback } from 'react'
import { Collapse, Tag, Button, Empty, Typography, Spin, Space, Table } from 'antd'
import { ReloadOutlined, FileTextOutlined, CodeOutlined, EyeOutlined, EyeInvisibleOutlined } from '@ant-design/icons'
import type { CliStatusInfo, CliStatusEntry } from '@shared/types'
import type { ColumnsType } from 'antd/es/table'

const { Text, Title } = Typography

function shortenPath(p: string): string {
  const homeMatch = p.match(/^\/home\/[^/]+/)
  if (homeMatch) return '~' + p.slice(homeMatch[0].length)
  return p
}

function maskValue(val: string): string {
  if (val.length <= 8) return '••••••••'
  return val.slice(0, 4) + '••••••••' + val.slice(-4)
}

interface KVRow {
  key: string
  name: string
  value: string
  isSecret: boolean
}

function EntryTable({ entry }: { entry: CliStatusEntry }) {
  const [revealedKeys, setRevealedKeys] = useState<Set<string>>(new Set())

  const toggleReveal = useCallback((key: string) => {
    setRevealedKeys((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }, [])

  const secretSet = new Set(entry.secretKeys ?? [])

  const rows: KVRow[] = Object.entries(entry.data).map(([k, v]) => ({
    key: k,
    name: k,
    value: v,
    isSecret: secretSet.has(k),
  }))

  const columns: ColumnsType<KVRow> = [
    {
      title: '键',
      dataIndex: 'name',
      width: '35%',
      ellipsis: true,
      render: (name: string) => (
        <Text code className="text-xs !break-all !whitespace-normal">{name}</Text>
      ),
    },
    {
      title: '值',
      dataIndex: 'value',
      ellipsis: false,
      render: (_: string, row: KVRow) => {
        const revealed = revealedKeys.has(row.key)
        const display = row.isSecret && !revealed ? maskValue(row.value) : row.value
        return (
          <div className="flex items-start gap-2">
            <Text
              className="text-xs flex-1 break-all"
              copyable={(!row.isSecret || revealed) ? { text: row.value } : undefined}
            >
              {display}
            </Text>
            {row.isSecret && (
              <Button
                type="text"
                size="small"
                icon={revealed ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                onClick={() => toggleReveal(row.key)}
                aria-label={revealed ? '隐藏' : '显示'}
                className="shrink-0"
              />
            )}
          </div>
        )
      },
    },
  ]

  return (
    <Table<KVRow>
      dataSource={rows}
      columns={columns}
      pagination={false}
      size="small"
      bordered
      rowKey="key"
      className="[&_.ant-table-cell]:!py-2 [&_.ant-table-cell]:!px-3"
      tableLayout="fixed"
    />
  )
}

function SectionBlock({ entry }: { entry: CliStatusEntry }) {
  const isFile = entry.source === 'file'
  return (
    <div className="mb-4 last:mb-0">
      <Space size={6} className="mb-2">
        {isFile
          ? <FileTextOutlined className="text-gray-400" />
          : <CodeOutlined className="text-gray-400" />}
        <Text type="secondary" className="text-xs font-medium">
          {isFile ? '配置文件' : '环境变量'}
        </Text>
        {entry.path && (
          <Text type="secondary" className="text-xs opacity-60">{shortenPath(entry.path)}</Text>
        )}
      </Space>
      <EntryTable entry={entry} />
    </div>
  )
}

export function CliStatusPanel() {
  const [statuses, setStatuses] = useState<CliStatusInfo[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = async () => {
    setLoading(true)
    try {
      const result = await window.clicraft.detectCliStatus()
      setStatuses(result)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  const collapseItems = statuses.map((status) => {
    const fileEntries = status.entries.filter((e) => e.source === 'file')
    const envEntries = status.entries.filter((e) => e.source === 'env')

    return {
      key: status.cliTypeId,
      label: (
        <Space>
          <Text strong>{status.cliName}</Text>
          <Tag color={status.found ? 'success' : 'default'} bordered={false}>
            {status.found ? '已检测到' : '未检测到'}
          </Tag>
        </Space>
      ),
      children: status.found ? (
        <div>
          {fileEntries.map((entry, idx) => (
            <SectionBlock key={`file-${idx}`} entry={entry} />
          ))}
          {envEntries.map((entry, idx) => (
            <SectionBlock key={`env-${idx}`} entry={entry} />
          ))}
        </div>
      ) : (
        <Empty description="未检测到该 CLI 的配置" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      ),
    }
  })

  const defaultActiveKeys = statuses.filter((s) => s.found).map((s) => s.cliTypeId)

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <Title level={5} className="!m-0 !text-gray-500 tracking-wider uppercase" style={{ fontSize: 13 }}>
          当前 CLI 配置概览
        </Title>
        <Button
          size="small"
          icon={<ReloadOutlined spin={loading} />}
          onClick={refresh}
          disabled={loading}
        >
          刷新
        </Button>
      </div>

      {loading && statuses.length === 0 ? (
        <div className="flex justify-center py-8">
          <Spin />
        </div>
      ) : statuses.length === 0 ? (
        <Empty description="未检测到任何 CLI 工具配置" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      ) : (
        <Collapse
          items={collapseItems}
          defaultActiveKey={defaultActiveKeys}
          bordered={false}
          className="bg-white rounded-xl [&_.ant-collapse-header]:!rounded-lg"
        />
      )}
    </section>
  )
}
