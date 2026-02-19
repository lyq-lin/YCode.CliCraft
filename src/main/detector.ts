import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import type { CliStatusInfo, CliStatusEntry } from '../shared/types'

const HOME = process.env.HOME || process.env.USERPROFILE || ''

interface CliDetector {
  cliTypeId: string
  detect(): CliStatusInfo
}

class ClaudeCodeDetector implements CliDetector {
  cliTypeId = 'claude-code'

  private settingsPath = join(HOME, '.claude', 'settings.json')

  private envKeys = [
    'ANTHROPIC_BASE_URL',
    'ANTHROPIC_AUTH_TOKEN',
    'API_TIMEOUT_MS',
    'ANTHROPIC_MODEL',
    'ANTHROPIC_SMALL_FAST_MODEL',
    'CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC',
  ]

  private secretEnvKeys = new Set(['ANTHROPIC_AUTH_TOKEN'])

  detect(): CliStatusInfo {
    const entries: CliStatusEntry[] = []

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

    const envData: Record<string, string> = {}
    const secretKeys: string[] = []
    for (const key of this.envKeys) {
      const val = process.env[key]
      if (val !== undefined) {
        envData[key] = val
        if (this.secretEnvKeys.has(key)) secretKeys.push(key)
      }
    }
    if (Object.keys(envData).length > 0) {
      entries.push({ source: 'env', data: envData, secretKeys })
    }

    return {
      cliTypeId: this.cliTypeId,
      cliName: 'Claude Code',
      found: entries.length > 0,
      entries,
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
]

export function detectAllCliStatus(): CliStatusInfo[] {
  return detectors.map((d) => d.detect())
}

export function detectCliStatus(cliTypeId: string): CliStatusInfo | null {
  const d = detectors.find((det) => det.cliTypeId === cliTypeId)
  return d ? d.detect() : null
}
