import { app } from 'electron'
import { writeFileSync, mkdirSync, existsSync } from 'fs'
import { join } from 'path'
import { getProfileById } from './store'
import { getCliTypeById } from '../shared/cliTypes'

const LINUX_MAC_DIR = join(process.env.HOME || process.env.USERPROFILE || '', '.config', 'clicraft')
const WINDOWS_DIR = join(app.getPath('appData'), 'clicraft')
const ENV_FILE = 'current.env'
const BAT_FILE = 'activate.bat'
const PS1_FILE = 'activate.ps1'

function escapeForShell(value: string): string {
  return value.replace(/'/g, "'\\''")
}

function escapeForBat(value: string): string {
  return value.replace(/"/g, '""')
}

function escapeForPs1(value: string): string {
  return value.replace(/"/g, '`"')
}

export interface ActivateResult {
  success: boolean
  command: string
  commandLabel?: string
  /** Windows PowerShell command (only on win32) */
  commandPs1?: string
  error?: string
}

export function activateProfile(profileId: string): ActivateResult {
  const profile = getProfileById(profileId)
  if (!profile) {
    return { success: false, command: '', error: 'Profile not found' }
  }

  const cliType = getCliTypeById(profile.cliTypeId)
  if (!cliType) {
    return { success: false, command: '', error: 'CLI type not found' }
  }

  const env: Record<string, string> = { ...cliType.envDefaults, ...profile.env }
  const platform = process.platform
  const isWin = platform === 'win32'

  if (isWin) {
    const dir = WINDOWS_DIR
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true })

    const batPath = join(dir, BAT_FILE)
    const ps1Path = join(dir, PS1_FILE)

    const batLines: string[] = ['@echo off']
    const ps1Lines: string[] = []
    for (const [key, value] of Object.entries(env)) {
      if (value === undefined || value === null) continue
      batLines.push(`set "${key}=${escapeForBat(value)}"`)
      ps1Lines.push(`$env:${key}="${escapeForPs1(value)}"`)
    }

    writeFileSync(batPath, batLines.join('\r\n') + '\r\n', 'utf-8')
    writeFileSync(ps1Path, ps1Lines.join('\n') + '\n', 'utf-8')

    // 返回便携命令，方便用户在任何终端复制执行
    return {
      success: true,
      command: 'call "%APPDATA%\\clicraft\\activate.bat"',
      commandLabel: 'CMD',
      commandPs1: '. "$env:APPDATA\\clicraft\\activate.ps1"',
      error: undefined,
    }
  }

  // Linux / macOS
  const dir = LINUX_MAC_DIR
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })

  const envPath = join(dir, ENV_FILE)
  const lines: string[] = []
  for (const [key, value] of Object.entries(env)) {
    if (value === undefined || value === null) continue
    lines.push(`export ${key}='${escapeForShell(value)}'`)
  }
  writeFileSync(envPath, lines.join('\n') + '\n', 'utf-8')

  // 若路径在 HOME 下，展示便携形式 ~/.config/clicraft/current.env
  const home = process.env.HOME || process.env.USERPROFILE || ''
  const displayPath = home && envPath.startsWith(home)
    ? join('~', '.config', 'clicraft', ENV_FILE)
    : envPath

  return {
    success: true,
    command: `source ${displayPath}`,
    commandLabel: 'Bash / Zsh',
    error: undefined,
  }
}

