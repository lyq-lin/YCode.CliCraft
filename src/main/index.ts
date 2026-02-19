import { app, BrowserWindow, ipcMain, Menu } from 'electron'
import { join } from 'path'
import { getProfiles, saveProfile, deleteProfile } from './store'
import { getCliTypes } from '../shared/cliTypes'
import { launchProfile } from './launcher'
import { detectAllCliStatus } from './detector'

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged

function createWindow(): void {
  const win = new BrowserWindow({
    width: 960,
    height: 740,
    webPreferences: {
      preload: join(__dirname, '../preload/index.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  Menu.setApplicationMenu(null)

  if (isDev) {
    win.loadURL(process.env['ELECTRON_RENDERER_URL'] || 'http://localhost:5173')
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }

  ipcMain.handle('getProfiles', () => getProfiles())
  ipcMain.handle('getCliTypes', () => getCliTypes())

  ipcMain.handle('saveProfile', (_e, profile: unknown) => {
    try {
      if (!profile || typeof profile !== 'object' || !('id' in profile) || !('name' in profile) || !('cliTypeId' in profile) || !('env' in profile)) {
        return { success: false as const, error: '无效的配置数据' }
      }
      const p = profile as Parameters<typeof saveProfile>[0]
      if (typeof p.env !== 'object' || p.env === null) {
        return { success: false as const, error: '环境变量格式错误' }
      }
      saveProfile(p)
      return { success: true as const }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      return { success: false as const, error: message }
    }
  })

  ipcMain.handle('deleteProfile', (_e, id: string) => deleteProfile(id))

  ipcMain.handle('launchProfile', (_e, profileId: string, scope?: string) => {
    try {
      return launchProfile(profileId, (scope === 'global' ? 'global' : 'local'))
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      return { success: false, error: message }
    }
  })

  ipcMain.handle('detectCliStatus', () => detectAllCliStatus())
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})
