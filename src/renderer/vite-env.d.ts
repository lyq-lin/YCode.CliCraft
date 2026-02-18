import type { Profile, CliType } from '@shared/types'

export interface ActivateResult {
  success: boolean
  command: string
  commandLabel?: string
  commandPs1?: string
  error?: string
}

export interface CliCraftAPI {
  getProfiles: () => Promise<Profile[]>
  getCliTypes: () => Promise<CliType[]>
  saveProfile: (profile: Profile) => Promise<{ success: true } | { success: false; error: string }>
  deleteProfile: (id: string) => Promise<void>
  getActiveProfileId: () => Promise<string | null>
  setActiveProfileId: (id: string | null) => Promise<void>
  activateProfile: (profileId: string) => Promise<ActivateResult>
}

declare global {
  interface Window {
    clicraft: CliCraftAPI
  }
}

export {}
