import { useState, useEffect, useMemo } from 'react'
import { Form, Input, Select, Button, Space, Alert, Typography, Card } from 'antd'
import { ArrowLeftOutlined, InfoCircleOutlined, RobotOutlined } from '@ant-design/icons'
import type { Profile } from '@shared/types'
import type { Provider, ModelInfo } from '@shared/providers'
import { getCliTypes } from '@shared/cliTypes'
import { getDefaultModelForProvider } from '@shared/providers'

const { Title, Text } = Typography

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
  const [providers, setProviders] = useState<Provider[]>([])
  
  const [name, setName] = useState(profile?.name ?? '')
  const [cliTypeId, setCliTypeId] = useState(profile?.cliTypeId ?? cliTypes[0]?.id ?? '')
  const [providerId, setProviderId] = useState(profile?.providerId ?? '')
  const [model, setModel] = useState(profile?.model ?? '')
  const [env, setEnv] = useState<Record<string, string>>(profile?.env ?? {})
  
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const selectedCli = useMemo(() => cliTypes.find((c) => c.id === cliTypeId), [cliTypeId])
  const selectedProvider = useMemo(() => providers.find((p) => p.id === providerId), [providers, providerId])
  
  // 当前可用的模型列表
  const availableModels = useMemo(() => selectedProvider?.models ?? [], [selectedProvider])

  // 加载 Providers
  useEffect(() => {
    if (!cliTypeId) return
    window.clicraft.getProviders(cliTypeId).then((ps) => {
      setProviders(ps)
      // 如果没有选择 provider，且存在已有配置，尝试找到匹配的 provider
      if (!providerId) {
        // 如果是编辑模式，保留原值；否则选第一个
        if (profile?.providerId) {
          const exists = ps.find((p) => p.id === profile.providerId)
          if (exists) {
            setProviderId(profile.providerId)
            return
          }
        }
        // 默认选第一个
        if (ps.length > 0) {
          const firstProvider = ps[0]
          setProviderId(firstProvider.id)
        }
      }
    })
  }, [cliTypeId])

  // Provider 变化时自动切换模型
  useEffect(() => {
    if (!selectedProvider) {
      setModel('')
      setEnv({})
      return
    }
    
    // 自动选择第一个模型（如果当前模型不在新 provider 的列表中）
    const currentModelValid = selectedProvider.models.some((m) => m.id === model)
    if (!currentModelValid) {
      const defaultModel = selectedProvider.models[0]?.id ?? ''
      setModel(defaultModel)
    }
    
    // 初始化环境变量
    const next: Record<string, string> = {}
    // 初始化 provider 的环境变量
    for (const def of selectedProvider.envKeys) {
      const val = env[def.key]
      next[def.key] = (val !== undefined && val !== null) 
        ? val 
        : (def.key.includes('BASE_URL') && selectedProvider.baseUrlDefault 
            ? selectedProvider.baseUrlDefault 
            : '')
    }
    
    // 初始化 CLI 特定的环境变量
    if (selectedCli?.extraEnvKeys) {
      for (const def of selectedCli.extraEnvKeys) {
        const val = env[def.key]
        next[def.key] = (val !== undefined && val !== null) 
          ? val 
          : (selectedCli.envDefaults?.[def.key] ?? '')
      }
    }
    
    setEnv(next)
  }, [providerId, selectedProvider])

  const handleSubmit = async () => {
    if (!name.trim()) return
    if (!providerId) {
      setSaveError('请选择一个 Provider')
      return
    }
    
    setSaveError(null)
    setSaving(true)
    try {
      const p: Profile = {
        id: profile?.id ?? generateId(),
        name: name.trim(),
        cliTypeId,
        providerId,
        model,
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

  // 渲染模型选项 - label 必须是字符串，自定义渲染用 optionRender
  const modelOptions = useMemo(() => {
    return availableModels.map((m: ModelInfo) => ({
      label: m.name,  // 字符串，用于显示选中值
      value: m.id,
      description: m.description,
      isRecommended: m.id === availableModels[0]?.id,
    }))
  }, [availableModels])

  return (
    <div className="bg-white rounded-xl p-6 shadow-card max-w-2xl border border-gray-100">
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
            placeholder="如：DeepSeek 生产环境"
            size="large"
          />
        </Form.Item>

        <Form.Item label="CLI 工具">
          <Select
            value={cliTypeId}
            onChange={(id) => {
              setCliTypeId(id)
              setProviderId('')
              setModel('')
              setEnv({})
            }}
            size="large"
            options={cliTypes.map((c) => ({ label: c.name, value: c.id }))}
          />
        </Form.Item>

        {selectedCli && (
          <Form.Item label="模型供应商 (Provider)" required>
            <Select
              value={providerId}
              onChange={(pid) => {
                setProviderId(pid)
                // 模型会在 useEffect 中自动切换
              }}
              size="large"
              placeholder="选择供应商"
              options={providers.map((p) => ({ 
                label: p.name, 
                value: p.id,
                protocol: p.protocol,
              }))}
              optionRender={(option) => (
                <div className="flex items-center justify-between">
                  <span>{option.label}</span>
                  <span className="text-xs text-gray-400 ml-2">{option.data.protocol}</span>
                </div>
              )}
            />
          </Form.Item>
        )}

        {selectedProvider && (
          <>
            <Card 
              size="small" 
              className="mb-4 bg-blue-50/50 border-blue-100"
              title={<span className="text-sm font-medium"><InfoCircleOutlined className="mr-2"/>协议信息</span>}
            >
              <div className="text-sm space-y-1">
                <div>
                  <Text type="secondary">协议类型：</Text>
                  <Text code className={selectedProvider.protocol === 'openai' ? 'text-green-600' : 'text-blue-600'}>
                    {selectedProvider.protocol}
                  </Text>
                </div>
                <div>
                  <Text type="secondary">默认 Base URL：</Text>
                  <Text>{selectedProvider.baseUrlDefault || '无'}</Text>
                </div>
                {selectedProvider.models.length > 0 && (
                  <div>
                    <Text type="secondary">可用模型：</Text>
                    <Text>{selectedProvider.models.length} 个</Text>
                  </div>
                )}
              </div>
            </Card>

            <Form.Item label="模型">
              <Select
                value={model}
                onChange={setModel}
                size="large"
                placeholder="选择模型"
                allowClear
                options={modelOptions}
                optionRender={(option) => (
                  <div className="flex items-center justify-between py-1">
                    <div>
                      <div className="font-medium">{option.label}</div>
                      {option.data.description && (
                        <div className="text-xs text-gray-400 mt-0.5">{option.data.description}</div>
                      )}
                    </div>
                    {option.data.isRecommended && (
                      <span className="text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded ml-2">推荐</span>
                    )}
                  </div>
                )}
              />
              <Text type="secondary" className="text-xs mt-1 block">
                {model ? (
                  <>
                    已选择：<Text code>{model}</Text>
                    {selectedProvider.models.find((m) => m.id === model)?.description && (
                      <span className="ml-2">
                        - {selectedProvider.models.find((m) => m.id === model)?.description}
                      </span>
                    )}
                  </>
                ) : (
                  '不选择时将使用 CLI 工具的默认模型'
                )}
              </Text>
            </Form.Item>

            {/* Provider 环境变量 */}
            <div className="mb-4">
              <Text strong className="text-sm block mb-2">
                <RobotOutlined className="mr-1" />Provider 配置
              </Text>
              {selectedProvider.envKeys.map((def) => (
                <Form.Item 
                  key={def.key} 
                  label={`${def.label ?? def.key}`}
                  required={def.secret}
                  className="mb-3"
                >
                  {def.secret ? (
                    <Input.Password
                      value={env[def.key] ?? ''}
                      onChange={(e) => setEnv((prev) => ({ ...prev, [def.key]: e.target.value }))}
                      placeholder={def.key.includes('BASE_URL') ? selectedProvider.baseUrlDefault : ''}
                      autoComplete="off"
                      visibilityToggle
                    />
                  ) : (
                    <Input
                      value={env[def.key] ?? ''}
                      onChange={(e) => setEnv((prev) => ({ ...prev, [def.key]: e.target.value }))}
                      placeholder={def.key.includes('BASE_URL') ? selectedProvider.baseUrlDefault : ''}
                    />
                  )}
                </Form.Item>
              ))}
            </div>
          </>
        )}

        {/* CLI 特定环境变量 */}
        {selectedCli?.extraEnvKeys && selectedCli.extraEnvKeys.length > 0 && (
          <div className="mb-4">
            <Text strong className="text-sm block mb-2">
              {selectedCli.name} 额外配置
            </Text>
            {selectedCli.extraEnvKeys.map((def) => (
              <Form.Item 
                key={def.key} 
                label={`${def.label ?? def.key}${def.secret ? '（密钥）' : ''}`}
                className="mb-3"
              >
                {def.secret ? (
                  <Input.Password
                    value={env[def.key] ?? ''}
                    onChange={(e) => setEnv((prev) => ({ ...prev, [def.key]: e.target.value }))}
                    placeholder={selectedCli.envDefaults?.[def.key]}
                    autoComplete="off"
                    visibilityToggle
                  />
                ) : (
                  <Input
                    value={env[def.key] ?? ''}
                    onChange={(e) => setEnv((prev) => ({ ...prev, [def.key]: e.target.value }))}
                    placeholder={selectedCli.envDefaults?.[def.key]}
                  />
                )}
              </Form.Item>
            ))}
          </div>
        )}

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
