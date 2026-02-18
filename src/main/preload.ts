import { contextBridge, ipcRenderer } from 'electron'
import type { Profile } from '../shared/types'
import type { CliType } from '../shared/types'
import type { ActivateResult } from './activate'

const api = {
  getProfiles: (): Promise<Profile[]> => ipcRenderer.invoke('getProfiles'),
  getCliTypes: (): Promise<CliType[]> => ipcRenderer.invoke('getCliTypes'),
  saveProfile: (profile: Profile): Promise<{ success: true } | { success: false; error: string }> =>
    ipcRenderer.invoke('saveProfile', profile),
  deleteProfile: (id: string): Promise<void> => ipcRenderer.invoke('deleteProfile', id),
  getActiveProfileId: (): Promise<string | null> => ipcRenderer.invoke('getActiveProfileId'),
  setActiveProfileId: (id: string | null): Promise<void> => ipcRenderer.invoke('setActiveProfileId', id),
  activateProfile: (profileId: string): Promise<ActivateResult> => ipcRenderer.invoke('activateProfile', profileId),
}

contextBridge.exposeInMainWorld('clicraft', api)

export type CliCraftAPI = typeof api
