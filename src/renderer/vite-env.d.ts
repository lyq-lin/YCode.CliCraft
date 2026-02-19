import type { Profile, CliType, LaunchResult, LaunchScope, CliStatusInfo } from '@shared/types'

export interface CliCraftAPI {
  getProfiles: () => Promise<Profile[]>
  getCliTypes: () => Promise<CliType[]>
  saveProfile: (profile: Profile) => Promise<{ success: true } | { success: false; error: string }>
  deleteProfile: (id: string) => Promise<void>
  launchProfile: (profileId: string, scope?: LaunchScope) => Promise<LaunchResult>
  detectCliStatus: () => Promise<CliStatusInfo[]>
}

declare global {
  interface Window {
    clicraft: CliCraftAPI
  }
}

export {}
