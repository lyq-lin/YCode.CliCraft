import { app } from 'electron'
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import { join } from 'path'
import type { Profile, StoreData } from '../shared/types'

const CONFIG_DIR = app.getPath('userData')
const CONFIG_FILE = join(CONFIG_DIR, 'store.json')

const defaultData: StoreData = {
  profiles: [],
}

function ensureConfigDir(): void {
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true })
  }
}

function readData(): StoreData {
  ensureConfigDir()
  if (!existsSync(CONFIG_FILE)) {
    return { ...defaultData }
  }
  try {
    const raw = readFileSync(CONFIG_FILE, 'utf-8')
    const data = JSON.parse(raw) as StoreData
    return {
      profiles: Array.isArray(data.profiles) ? data.profiles : defaultData.profiles,
    }
  } catch {
    return { ...defaultData }
  }
}

function writeData(data: StoreData): void {
  ensureConfigDir()
  writeFileSync(CONFIG_FILE, JSON.stringify(data, null, 2), 'utf-8')
}

export function getProfiles(): Profile[] {
  return readData().profiles
}

function normalizeEnv(env: Record<string, unknown>): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [k, v] of Object.entries(env)) {
    if (v !== undefined && v !== null) {
      out[k] = String(v)
    }
  }
  return out
}

export function saveProfile(profile: Profile): void {
  const normalized: Profile = {
    id: String(profile.id),
    name: String(profile.name).trim(),
    cliTypeId: String(profile.cliTypeId),
    env: normalizeEnv(profile.env as Record<string, unknown>),
  }
  const data = readData()
  const index = data.profiles.findIndex((p) => p.id === normalized.id)
  if (index >= 0) {
    data.profiles[index] = normalized
  } else {
    data.profiles.push(normalized)
  }
  writeData(data)
}

export function deleteProfile(id: string): void {
  const data = readData()
  data.profiles = data.profiles.filter((p) => p.id !== id)
  writeData(data)
}

export function getProfileById(id: string): Profile | undefined {
  return readData().profiles.find((p) => p.id === id)
}
