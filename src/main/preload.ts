import { contextBridge, ipcRenderer } from 'electron'
import type { Profile, CliType, LaunchResult, LaunchScope, CliStatusInfo } from '../shared/types'

const api = {
  getProfiles: (): Promise<Profile[]> => ipcRenderer.invoke('getProfiles'),
  getCliTypes: (): Promise<CliType[]> => ipcRenderer.invoke('getCliTypes'),
  saveProfile: (profile: Profile): Promise<{ success: true } | { success: false; error: string }> =>
    ipcRenderer.invoke('saveProfile', profile),
  deleteProfile: (id: string): Promise<void> => ipcRenderer.invoke('deleteProfile', id),
  launchProfile: (profileId: string, scope?: LaunchScope): Promise<LaunchResult> =>
    ipcRenderer.invoke('launchProfile', profileId, scope),
  detectCliStatus: (): Promise<CliStatusInfo[]> => ipcRenderer.invoke('detectCliStatus'),
}

contextBridge.exposeInMainWorld('clicraft', api)

export type CliCraftAPI = typeof api
