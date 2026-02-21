import type { CliType } from './types'

export const CLAUDE_CODE_CLI: CliType = {
  id: 'claude-code',
  name: 'Claude Code',
  // Claude Code 原生支持 Anthropic 协议，也可以通过转换层支持其他 OpenAI 格式
  supportedProviders: ['anthropic', 'deepseek', 'moonshot'],
  extraEnvKeys: [
    { key: 'API_TIMEOUT_MS', label: 'API Timeout (ms)', secret: false },
    { key: 'ANTHROPIC_MODEL', label: 'Model', secret: false },
    { key: 'ANTHROPIC_SMALL_FAST_MODEL', label: 'Small Fast Model', secret: false },
    { key: 'CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC', label: 'Disable non-essential traffic (0/1)', secret: false },
  ],
  envDefaults: {
    API_TIMEOUT_MS: '600000',
    ANTHROPIC_MODEL: 'claude-sonnet-4-5',
    ANTHROPIC_SMALL_FAST_MODEL: 'claude-haiku-4-5',
    CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC: '1',
  },
}

export const KIMI_CODE_CLI: CliType = {
  id: 'kimi-code',
  name: 'Kimi Code',
  // Kimi Code 官方只支持自家的 API
  supportedProviders: ['moonshot'],
  extraEnvKeys: [
    { key: 'KIMI_CLI_NO_AUTO_UPDATE', label: '禁用自动更新 (0/1)', secret: false },
  ],
  envDefaults: {
    KIMI_CLI_NO_AUTO_UPDATE: '',
  },
}

export const OPENCODE_CLI: CliType = {
  id: 'opencode',
  name: 'OpenCode',
  // OpenCode 支持多 Provider
  supportedProviders: ['openai', 'deepseek', 'moonshot', 'siliconflow', 'anthropic-compatible', 'google', 'aws-bedrock'],
  extraEnvKeys: [
    { key: 'OPENCODE_CONFIG', label: '自定义配置文件路径', secret: false },
    { key: 'OPENCODE_MODEL', label: '模型 (provider/model 格式)', secret: false },
    { key: 'OPENCODE_SERVER_PASSWORD', label: '服务器密码', secret: true },
  ],
  envDefaults: {
    OPENCODE_CONFIG: '',
    OPENCODE_MODEL: '',
    OPENCODE_SERVER_PASSWORD: '',
  },
}

const cliTypes: CliType[] = [CLAUDE_CODE_CLI, KIMI_CODE_CLI, OPENCODE_CLI]

export function getCliTypes(): CliType[] {
  return cliTypes
}

export function getCliTypeById(id: string): CliType | undefined {
  return cliTypes.find((c) => c.id === id)
}
