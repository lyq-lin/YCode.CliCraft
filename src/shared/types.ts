export interface CliType {
  id: string
  name: string
  envKeys: EnvKeyDef[]
  envDefaults: Record<string, string>
}

export interface EnvKeyDef {
  key: string
  label?: string
  secret?: boolean
}

export interface Profile {
  id: string
  name: string
  cliTypeId: string
  env: Record<string, string>
}

export interface StoreData {
  profiles: Profile[]
}

// --- CLI Status Detection ---

export interface CliStatusEntry {
  source: 'file' | 'env'
  path?: string
  data: Record<string, string>
  /** Keys whose values are secrets (tokens, keys) — frontend decides masking */
  secretKeys?: string[]
}

export interface CliStatusInfo {
  cliTypeId: string
  cliName: string
  found: boolean
  entries: CliStatusEntry[]
}

// --- Launch ---

export type LaunchScope = 'local' | 'global'

export interface LaunchResult {
  success: boolean
  message?: string
  error?: string
}
