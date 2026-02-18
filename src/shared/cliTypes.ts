import type { CliType } from './types'

export const CLAUDE_CODE_CLI: CliType = {
  id: 'claude-code',
  name: 'Claude Code',
  envKeys: [
    { key: 'ANTHROPIC_BASE_URL', label: 'Base URL', secret: false },
    { key: 'ANTHROPIC_AUTH_TOKEN', label: 'Auth Token (API Key)', secret: true },
    { key: 'API_TIMEOUT_MS', label: 'API Timeout (ms)', secret: false },
    { key: 'ANTHROPIC_MODEL', label: 'Model', secret: false },
    { key: 'ANTHROPIC_SMALL_FAST_MODEL', label: 'Small Fast Model', secret: false },
    { key: 'CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC', label: 'Disable non-essential traffic (0/1)', secret: false },
  ],
  envDefaults: {
    ANTHROPIC_BASE_URL: 'https://api.deepseek.com/anthropic',
    ANTHROPIC_AUTH_TOKEN: '',
    API_TIMEOUT_MS: '600000',
    ANTHROPIC_MODEL: 'deepseek-chat',
    ANTHROPIC_SMALL_FAST_MODEL: 'deepseek-chat',
    CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC: '1',
  },
}

const cliTypes: CliType[] = [CLAUDE_CODE_CLI]

export function getCliTypes(): CliType[] {
  return cliTypes
}

export function getCliTypeById(id: string): CliType | undefined {
  return cliTypes.find((c) => c.id === id)
}
