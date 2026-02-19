import { spawn, execSync } from 'child_process'
import { writeFileSync, readFileSync, mkdirSync, existsSync, chmodSync, appendFileSync } from 'fs'
import { join } from 'path'
import { getProfileById } from './store'
import { getCliTypeById } from '../shared/cliTypes'
import type { LaunchScope, LaunchResult } from '../shared/types'

const HOME = process.env.HOME || process.env.USERPROFILE || ''
const CRAFT_DIR = join(HOME, '.config', 'clicraft')
const MARKER = '# >>> CliCraft managed - do not edit >>>'
const MARKER_END = '# <<< CliCraft managed <<<'

function escapeForShell(value: string): string {
  return value.replace(/'/g, "'\\''")
}

function escapeForBat(value: string): string {
  return value.replace(/"/g, '""')
}

function buildEnv(profileId: string): { env: Record<string, string>; profileName: string } | { error: string } {
  const profile = getProfileById(profileId)
  if (!profile) return { error: '配置方案不存在' }
  const cliType = getCliTypeById(profile.cliTypeId)
  if (!cliType) return { error: 'CLI 类型不存在' }
  return {
    env: { ...cliType.envDefaults, ...profile.env },
    profileName: profile.name,
  }
}

function ensureDir(dir: string): void {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
}

function hasCommand(cmd: string): boolean {
  try {
    execSync(`which ${cmd}`, { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

function writeEnvFile(env: Record<string, string>, profileName: string): string {
  ensureDir(CRAFT_DIR)
  const envPath = join(CRAFT_DIR, 'current.env')
  const lines = [
    `# CliCraft — ${profileName}`,
    `# Generated at ${new Date().toISOString()}`,
  ]
  for (const [key, value] of Object.entries(env)) {
    if (value === undefined || value === null) continue
    lines.push(`export ${key}='${escapeForShell(value)}'`)
  }
  writeFileSync(envPath, lines.join('\n') + '\n', 'utf-8')
  return envPath
}

/** Inject source line into shell rc files for global mode. */
function injectGlobalSource(envPath: string): string[] {
  const affectedFiles: string[] = []
  const sourceLine = `source "${envPath}"`
  const block = `${MARKER}\n${sourceLine}\n${MARKER_END}`

  const rcFiles = [
    join(HOME, '.bashrc'),
    join(HOME, '.zshrc'),
  ]

  for (const rc of rcFiles) {
    if (!existsSync(rc)) continue
    const content = readFileSync(rc, 'utf-8')

    if (content.includes(MARKER)) {
      const replaced = content.replace(
        new RegExp(`${escapeRegExp(MARKER)}[\\s\\S]*?${escapeRegExp(MARKER_END)}`),
        block,
      )
      writeFileSync(rc, replaced, 'utf-8')
    } else {
      appendFileSync(rc, '\n' + block + '\n', 'utf-8')
    }
    affectedFiles.push(rc)
  }
  return affectedFiles
}

/** Remove CliCraft block from shell rc files. */
export function removeGlobalSource(): void {
  const rcFiles = [join(HOME, '.bashrc'), join(HOME, '.zshrc')]
  for (const rc of rcFiles) {
    if (!existsSync(rc)) continue
    const content = readFileSync(rc, 'utf-8')
    if (!content.includes(MARKER)) continue
    const cleaned = content.replace(
      new RegExp(`\\n?${escapeRegExp(MARKER)}[\\s\\S]*?${escapeRegExp(MARKER_END)}\\n?`),
      '\n',
    )
    writeFileSync(rc, cleaned, 'utf-8')
  }
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// --------------- Local launch (spawn terminal) ---------------

function launchLocalLinuxMac(env: Record<string, string>, profileName: string): LaunchResult {
  ensureDir(CRAFT_DIR)
  const scriptPath = join(CRAFT_DIR, 'launch.sh')
  const lines = [
    '#!/usr/bin/env bash',
    `# CliCraft — ${profileName}`,
  ]
  for (const [key, value] of Object.entries(env)) {
    if (value === undefined || value === null) continue
    lines.push(`export ${key}='${escapeForShell(value)}'`)
  }
  lines.push(`echo -e "\\033[32m[CliCraft]\\033[0m 已加载配置：${profileName}"`)
  lines.push('exec bash')
  writeFileSync(scriptPath, lines.join('\n') + '\n', 'utf-8')
  chmodSync(scriptPath, 0o755)

  if (process.platform === 'darwin') {
    try {
      const escaped = scriptPath.replace(/"/g, '\\"')
      const osa = `tell application "Terminal" to do script "bash \\"${escaped}\\""`
      spawn('osascript', ['-e', osa], { detached: true, stdio: 'ignore' }).unref()
      return { success: true, message: '已在新终端窗口启动' }
    } catch {
      return { success: false, error: '无法打开 Terminal.app' }
    }
  }

  const terminals: { cmd: string; args: string[] }[] = [
    { cmd: 'x-terminal-emulator', args: ['-e', 'bash', scriptPath] },
    { cmd: 'gnome-terminal', args: ['--', 'bash', scriptPath] },
    { cmd: 'konsole', args: ['-e', 'bash', scriptPath] },
    { cmd: 'xfce4-terminal', args: ['--command', `bash ${scriptPath}`] },
    { cmd: 'mate-terminal', args: ['--command', `bash ${scriptPath}`] },
    { cmd: 'xterm', args: ['-e', 'bash', scriptPath] },
  ]

  for (const t of terminals) {
    if (!hasCommand(t.cmd)) continue
    try {
      const child = spawn(t.cmd, t.args, { detached: true, stdio: 'ignore' })
      child.unref()
      return { success: true, message: '已在新终端窗口启动' }
    } catch {
      continue
    }
  }

  return {
    success: false,
    error: '未找到可用的终端模拟器（已尝试 x-terminal-emulator / gnome-terminal / konsole / xfce4-terminal / xterm）',
  }
}

function launchLocalWindows(env: Record<string, string>, profileName: string): LaunchResult {
  const appData = process.env.APPDATA || join(HOME, 'AppData', 'Roaming')
  const dir = join(appData, 'clicraft')
  ensureDir(dir)

  const batPath = join(dir, 'launch.bat')
  const batLines = ['@echo off', `rem CliCraft — ${profileName}`]
  for (const [key, value] of Object.entries(env)) {
    if (value === undefined || value === null) continue
    batLines.push(`set "${key}=${escapeForBat(value)}"`)
  }
  batLines.push(`echo [CliCraft] 已加载配置：${profileName}`)
  batLines.push('cmd /k')
  writeFileSync(batPath, batLines.join('\r\n') + '\r\n', 'utf-8')

  try {
    spawn('cmd.exe', ['/c', 'start', 'cmd.exe', '/k', batPath], { detached: true, stdio: 'ignore' }).unref()
    return { success: true, message: '已在新 CMD 窗口启动' }
  } catch {
    return { success: false, error: '无法打开 CMD' }
  }
}

// --------------- Global launch (write to rc files) ---------------

function launchGlobalLinuxMac(env: Record<string, string>, profileName: string): LaunchResult {
  const envPath = writeEnvFile(env, profileName)
  const affected = injectGlobalSource(envPath)
  if (affected.length === 0) {
    return {
      success: true,
      message: `已写入 ${envPath}，但未找到 .bashrc / .zshrc 文件，请手动添加 source "${envPath}" 到你的 shell 配置中。`,
    }
  }
  return {
    success: true,
    message: `已全局配置 ${profileName}，修改了 ${affected.map((f) => f.replace(HOME, '~')).join('、')}。新终端窗口将自动加载此配置。`,
  }
}

function launchGlobalWindows(env: Record<string, string>, profileName: string): LaunchResult {
  const errors: string[] = []
  for (const [key, value] of Object.entries(env)) {
    if (value === undefined || value === null) continue
    try {
      execSync(`setx ${key} "${escapeForBat(value)}"`, { stdio: 'ignore' })
    } catch {
      errors.push(key)
    }
  }
  if (errors.length > 0) {
    return { success: false, error: `以下环境变量设置失败：${errors.join(', ')}` }
  }
  return {
    success: true,
    message: `已通过 setx 全局配置 ${profileName}。新终端窗口将自动生效。`,
  }
}

// --------------- Entry ---------------

export function launchProfile(profileId: string, scope: LaunchScope = 'local'): LaunchResult {
  const result = buildEnv(profileId)
  if ('error' in result) return { success: false, error: result.error }

  const { env, profileName } = result
  const isWin = process.platform === 'win32'

  if (scope === 'global') {
    return isWin
      ? launchGlobalWindows(env, profileName)
      : launchGlobalLinuxMac(env, profileName)
  }

  return isWin
    ? launchLocalWindows(env, profileName)
    : launchLocalLinuxMac(env, profileName)
}
