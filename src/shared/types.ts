import type { ProtocolType } from './providers'

// ==================== CLI Type ====================

export interface CliType {
  id: string
  name: string
  // 支持的 provider IDs
  supportedProviders: string[]
  // 额外的环境变量（不依赖 provider 的）
  extraEnvKeys?: EnvKeyDef[]
  envDefaults?: Record<string, string>
}

export interface EnvKeyDef {
  key: string
  label?: string
  secret?: boolean
}

// ==================== Profile ====================

export interface Profile {
  id: string
  name: string
  cliTypeId: string
  // 选择的 provider
  providerId: string
  // 对应的环境变量值
  env: Record<string, string>
  // 选择的模型（可选，为空时使用 provider 默认）
  model?: string
}

export interface StoreData {
  profiles: Profile[]
}

// ==================== Provider ====================

export interface Provider {
  id: string
  name: string
  protocol: ProtocolType
  baseUrlDefault?: string
  envKeys: EnvKeyDef[]
  models: string[]
}

// ==================== CLI Status Detection ====================

export interface CliStatusEntry {
  source: 'file' | 'env'
  path?: string
  data: Record<string, string>
  secretKeys?: string[]
}

export interface AuthMethodInfo {
  type: 'oauth' | 'api_key' | 'unknown'
  displayName: string
  details?: string
}

export interface CliStatusInfo {
  cliTypeId: string
  cliName: string
  found: boolean
  entries: CliStatusEntry[]
  authMethod?: AuthMethodInfo
}

// ==================== Launch ====================

export type LaunchScope = 'local' | 'global'

export interface LaunchResult {
  success: boolean
  message?: string
  error?: string
}
