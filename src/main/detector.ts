import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import * as TOML from 'smol-toml'
import type { CliStatusInfo, CliStatusEntry, AuthMethodInfo } from '../shared/types'
import { getCliTypeById } from '../shared/cliTypes'
import { getProvidersForCli, type Provider } from '../shared/providers'

const HOME = process.env.HOME || process.env.USERPROFILE || ''

interface CliDetector {
  cliTypeId: string
  detect(): CliStatusInfo
}

// 根据 provider 获取认证方式信息
function detectProviderAuth(cliTypeId: string): { method: AuthMethodInfo; entries: CliStatusEntry[] } {
  const providers = getProvidersForCli(cliTypeId)
  const entries: CliStatusEntry[] = []
  
  // 检查每个 provider 的环境变量
  const envData: Record<string, string> = {}
  const secretKeys: string[] = []
  const detectedProviders: string[] = []
  
  for (const provider of providers) {
    let hasProviderKey = false
    for (const envKey of provider.envKeys) {
      const val = process.env[envKey.key]
      if (val !== undefined) {
        envData[envKey.key] = val
        if (envKey.secret) secretKeys.push(envKey.key)
        if (val && envKey.secret) hasProviderKey = true
      }
    }
    if (hasProviderKey) {
      detectedProviders.push(provider.name)
    }
  }
  
  if (Object.keys(envData).length > 0) {
    entries.push({ source: 'env', data: envData, secretKeys })
  }
  
  // 判断认证方式
  let method: AuthMethodInfo
  if (detectedProviders.length > 0) {
    method = {
      type: 'api_key',
      displayName: 'API Key',
      details: `通过环境变量配置 (${detectedProviders.join(', ')})`
    }
  } else if (entries.length > 0) {
    method = {
      type: 'unknown',
      displayName: '配置不完整',
      details: '检测到环境变量但未找到有效的 Provider API Key'
    }
  } else {
    method = {
      type: 'unknown',
      displayName: '未配置',
      details: '未检测到相关配置文件和环境变量'
    }
  }
  
  return { method, entries }
}

class ClaudeCodeDetector implements CliDetector {
  cliTypeId = 'claude-code'

  private settingsPath = join(HOME, '.claude', 'settings.json')
  private claudeJsonPath = join(HOME, '.claude.json')

  detect(): CliStatusInfo {
    const entries: CliStatusEntry[] = []
    let authMethod: AuthMethodInfo = { type: 'unknown', displayName: '未配置' }

    // 读取 settings.json
    if (existsSync(this.settingsPath)) {
      try {
        const raw = readFileSync(this.settingsPath, 'utf-8')
        const data = JSON.parse(raw)
        entries.push({
          source: 'file',
          path: this.settingsPath,
          data: this.flattenForDisplay(data),
        })
      } catch {
        entries.push({
          source: 'file',
          path: this.settingsPath,
          data: { _error: '文件解析失败' },
        })
      }
    }

    // 读取 ~/.claude.json 判断认证方式
    let hasOAuthSession = false
    if (existsSync(this.claudeJsonPath)) {
      try {
        const raw = readFileSync(this.claudeJsonPath, 'utf-8')
        const data = JSON.parse(raw)
        
        if (data.sessionToken || (data.oauth && data.oauth.accessToken)) {
          hasOAuthSession = true
          authMethod = { 
            type: 'oauth', 
            displayName: '账号登录 (OAuth)',
            details: '通过浏览器登录授权'
          }
        }

        entries.push({
          source: 'file',
          path: this.claudeJsonPath,
          data: this.flattenForDisplay(data),
        })
      } catch {
        entries.push({
          source: 'file',
          path: this.claudeJsonPath,
          data: { _error: '文件解析失败' },
        })
      }
    }

    // 检查 Provider 环境变量
    const providerAuth = detectProviderAuth(this.cliTypeId)
    entries.push(...providerAuth.entries)

    // 判断最终的认证方式
    if (providerAuth.method.type === 'api_key') {
      authMethod = providerAuth.method
      if (hasOAuthSession) {
        authMethod.details += '（覆盖账号登录）'
      }
    } else if (hasOAuthSession) {
      authMethod = { 
        type: 'oauth', 
        displayName: '账号登录 (OAuth)',
        details: '通过浏览器登录授权'
      }
    } else if (entries.length > 0) {
      authMethod = { 
        type: 'unknown', 
        displayName: '配置不完整',
        details: '未检测到有效的认证信息'
      }
    }

    return {
      cliTypeId: this.cliTypeId,
      cliName: 'Claude Code',
      found: entries.length > 0,
      entries,
      authMethod,
    }
  }

  private flattenForDisplay(obj: unknown, prefix = '', depth = 0): Record<string, string> {
    const out: Record<string, string> = {}
    if (depth > 3 || !obj || typeof obj !== 'object') return out
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      const key = prefix ? `${prefix}.${k}` : k
      if (v === null || v === undefined) continue
      if (typeof v === 'object' && !Array.isArray(v)) {
        Object.assign(out, this.flattenForDisplay(v, key, depth + 1))
      } else {
        out[key] = String(v)
      }
    }
    return out
  }
}

class KimiCodeDetector implements CliDetector {
  cliTypeId = 'kimi-code'

  private tomlConfigPath = join(HOME, '.kimi', 'config.toml')
  private jsonConfigPath = join(HOME, '.kimi', 'config.json')

  detect(): CliStatusInfo {
    const entries: CliStatusEntry[] = []
    let authMethod: AuthMethodInfo = { type: 'unknown', displayName: '未配置' }

    // 尝试读取配置文件（优先 TOML）
    let configPath = ''
    let hasApiKeyInConfig = false
    let configProviderName = ''

    if (existsSync(this.tomlConfigPath)) {
      configPath = this.tomlConfigPath
      try {
        const raw = readFileSync(configPath, 'utf-8')
        const data = TOML.parse(raw) as Record<string, unknown>
        
        const providers = data.providers as Record<string, Record<string, string>> | undefined
        if (providers) {
          for (const [name, provider] of Object.entries(providers)) {
            if (provider.api_key) {
              hasApiKeyInConfig = true
              configProviderName = name
              break
            }
          }
        }

        entries.push({
          source: 'file',
          path: configPath,
          data: this.flattenForDisplay(data),
        })
      } catch (e) {
        entries.push({
          source: 'file',
          path: configPath,
          data: { _error: `TOML 解析失败: ${e}` },
        })
      }
    } else if (existsSync(this.jsonConfigPath)) {
      configPath = this.jsonConfigPath
      try {
        const raw = readFileSync(configPath, 'utf-8')
        const data = JSON.parse(raw)
        
        const providers = data.providers as Record<string, Record<string, string>> | undefined
        if (providers) {
          for (const [name, provider] of Object.entries(providers)) {
            if (provider.api_key) {
              hasApiKeyInConfig = true
              configProviderName = name
              break
            }
          }
        }

        entries.push({
          source: 'file',
          path: configPath,
          data: this.flattenForDisplay(data),
        })
      } catch {
        entries.push({
          source: 'file',
          path: configPath,
          data: { _error: 'JSON 解析失败' },
        })
      }
    }

    // 检查 Provider 环境变量（Moonshot）
    const providerAuth = detectProviderAuth(this.cliTypeId)
    entries.push(...providerAuth.entries)

    // 判断最终的认证方式
    if (providerAuth.method.type === 'api_key') {
      authMethod = providerAuth.method
      if (hasApiKeyInConfig) {
        authMethod.details += `（覆盖配置文件中的 ${configProviderName}）`
      }
    } else if (hasApiKeyInConfig) {
      authMethod = { 
        type: 'api_key', 
        displayName: 'API Key',
        details: `通过配置文件配置 (${configProviderName})`
      }
    } else if (entries.length > 0) {
      authMethod = { 
        type: 'unknown', 
        displayName: '配置不完整',
        details: '未检测到有效的 API Key，请运行 kimi /login 进行登录，或在配置文件中添加 providers'
      }
    } else {
      authMethod = { 
        type: 'unknown', 
        displayName: '未配置',
        details: '未找到 Kimi Code 配置文件'
      }
    }

    return {
      cliTypeId: this.cliTypeId,
      cliName: 'Kimi Code',
      found: entries.length > 0,
      entries,
      authMethod,
    }
  }

  private flattenForDisplay(obj: unknown, prefix = '', depth = 0): Record<string, string> {
    const out: Record<string, string> = {}
    if (depth > 3 || !obj || typeof obj !== 'object') return out
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      const key = prefix ? `${prefix}.${k}` : k
      if (v === null || v === undefined) continue
      if (typeof v === 'object' && !Array.isArray(v)) {
        Object.assign(out, this.flattenForDisplay(v, key, depth + 1))
      } else {
        out[key] = String(v)
      }
    }
    return out
  }
}

class OpenCodeDetector implements CliDetector {
  cliTypeId = 'opencode'

  private globalConfigPath = join(HOME, '.config', 'opencode', 'opencode.json')
  private authPath = join(HOME, '.local', 'share', 'opencode', 'auth.json')

  detect(): CliStatusInfo {
    const entries: CliStatusEntry[] = []
    let authMethod: AuthMethodInfo = { type: 'unknown', displayName: '未配置' }

    // 读取全局配置文件
    if (existsSync(this.globalConfigPath)) {
      try {
        const raw = readFileSync(this.globalConfigPath, 'utf-8')
        const data = JSON.parse(raw)
        entries.push({
          source: 'file',
          path: this.globalConfigPath,
          data: this.flattenForDisplay(data),
        })
      } catch {
        entries.push({
          source: 'file',
          path: this.globalConfigPath,
          data: { _error: '配置文件解析失败' },
        })
      }
    }

    // 读取认证文件（auth.json）
    let authProviders: string[] = []
    if (existsSync(this.authPath)) {
      try {
        const raw = readFileSync(this.authPath, 'utf-8')
        const data = JSON.parse(raw)
        
        if (data.providers) {
          for (const [name, provider] of Object.entries(data.providers as Record<string, Record<string, string>>)) {
            if (provider.apiKey || provider.api_key || provider.token) {
              authProviders.push(name)
            }
          }
        }

        entries.push({
          source: 'file',
          path: this.authPath,
          data: this.flattenForDisplay(data),
        })
      } catch {
        entries.push({
          source: 'file',
          path: this.authPath,
          data: { _error: '认证文件解析失败' },
        })
      }
    }

    // 检查 Provider 环境变量
    const providerAuth = detectProviderAuth(this.cliTypeId)
    entries.push(...providerAuth.entries)

    // 判断最终的认证方式
    if (providerAuth.method.type === 'api_key') {
      authMethod = providerAuth.method
      if (authProviders.length > 0) {
        authMethod.details += `（同时配置了 opencode auth login: ${authProviders.join(', ')}）`
      }
    } else if (authProviders.length > 0) {
      authMethod = {
        type: 'api_key',
        displayName: 'API Key',
        details: `通过 opencode auth login 配置 (${authProviders.join(', ')})`
      }
    } else if (entries.length > 0) {
      authMethod = {
        type: 'unknown',
        displayName: '配置不完整',
        details: '未检测到有效的 API Key，请运行 opencode auth login 或设置环境变量'
      }
    } else {
      authMethod = {
        type: 'unknown',
        displayName: '未配置',
        details: '未找到 OpenCode 配置文件'
      }
    }

    return {
      cliTypeId: this.cliTypeId,
      cliName: 'OpenCode',
      found: entries.length > 0,
      entries,
      authMethod,
    }
  }

  private flattenForDisplay(obj: unknown, prefix = '', depth = 0): Record<string, string> {
    const out: Record<string, string> = {}
    if (depth > 3 || !obj || typeof obj !== 'object') return out
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      const key = prefix ? `${prefix}.${k}` : k
      if (v === null || v === undefined) continue
      if (typeof v === 'object' && !Array.isArray(v)) {
        Object.assign(out, this.flattenForDisplay(v, key, depth + 1))
      } else {
        out[key] = String(v)
      }
    }
    return out
  }
}

const detectors: CliDetector[] = [
  new ClaudeCodeDetector(),
  new KimiCodeDetector(),
  new OpenCodeDetector(),
]

export function detectAllCliStatus(): CliStatusInfo[] {
  return detectors.map((d) => d.detect())
}

export function detectCliStatus(cliTypeId: string): CliStatusInfo | null {
  const d = detectors.find((det) => det.cliTypeId === cliTypeId)
  return d ? d.detect() : null
}
