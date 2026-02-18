import { app, BrowserWindow, Menu, ipcMain } from "electron";
import { join } from "path";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import __cjs_mod__ from "node:module";
const __filename = import.meta.filename;
const __dirname = import.meta.dirname;
const require2 = __cjs_mod__.createRequire(import.meta.url);
const CONFIG_DIR = app.getPath("userData");
const CONFIG_FILE = join(CONFIG_DIR, "store.json");
const defaultData = {
  profiles: [],
  activeProfileId: null
};
function ensureConfigDir() {
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true });
  }
}
function readData() {
  ensureConfigDir();
  if (!existsSync(CONFIG_FILE)) {
    return { ...defaultData };
  }
  try {
    const raw = readFileSync(CONFIG_FILE, "utf-8");
    const data = JSON.parse(raw);
    return {
      profiles: Array.isArray(data.profiles) ? data.profiles : defaultData.profiles,
      activeProfileId: data.activeProfileId ?? defaultData.activeProfileId
    };
  } catch {
    return { ...defaultData };
  }
}
function writeData(data) {
  ensureConfigDir();
  writeFileSync(CONFIG_FILE, JSON.stringify(data, null, 2), "utf-8");
}
function getProfiles() {
  return readData().profiles;
}
function normalizeEnv(env) {
  const out = {};
  for (const [k, v] of Object.entries(env)) {
    if (v !== void 0 && v !== null) {
      out[k] = String(v);
    }
  }
  return out;
}
function saveProfile(profile) {
  const normalized = {
    id: String(profile.id),
    name: String(profile.name).trim(),
    cliTypeId: String(profile.cliTypeId),
    env: normalizeEnv(profile.env)
  };
  const data = readData();
  const index = data.profiles.findIndex((p) => p.id === normalized.id);
  if (index >= 0) {
    data.profiles[index] = normalized;
  } else {
    data.profiles.push(normalized);
  }
  writeData(data);
}
function deleteProfile(id) {
  const data = readData();
  data.profiles = data.profiles.filter((p) => p.id !== id);
  if (data.activeProfileId === id) {
    data.activeProfileId = null;
  }
  writeData(data);
}
function getActiveProfileId() {
  return readData().activeProfileId;
}
function setActiveProfileId(id) {
  const data = readData();
  data.activeProfileId = id;
  writeData(data);
}
function getProfileById(id) {
  return readData().profiles.find((p) => p.id === id);
}
const CLAUDE_CODE_CLI = {
  id: "claude-code",
  name: "Claude Code",
  envKeys: [
    { key: "ANTHROPIC_BASE_URL", label: "Base URL", secret: false },
    { key: "ANTHROPIC_AUTH_TOKEN", label: "Auth Token (API Key)", secret: true },
    { key: "API_TIMEOUT_MS", label: "API Timeout (ms)", secret: false },
    { key: "ANTHROPIC_MODEL", label: "Model", secret: false },
    { key: "ANTHROPIC_SMALL_FAST_MODEL", label: "Small Fast Model", secret: false },
    { key: "CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC", label: "Disable non-essential traffic (0/1)", secret: false }
  ],
  envDefaults: {
    ANTHROPIC_BASE_URL: "https://api.deepseek.com/anthropic",
    ANTHROPIC_AUTH_TOKEN: "",
    API_TIMEOUT_MS: "600000",
    ANTHROPIC_MODEL: "deepseek-chat",
    ANTHROPIC_SMALL_FAST_MODEL: "deepseek-chat",
    CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC: "1"
  }
};
const cliTypes = [CLAUDE_CODE_CLI];
function getCliTypes() {
  return cliTypes;
}
function getCliTypeById(id) {
  return cliTypes.find((c) => c.id === id);
}
const LINUX_MAC_DIR = join(process.env.HOME || process.env.USERPROFILE || "", ".config", "clicraft");
const WINDOWS_DIR = join(app.getPath("appData"), "clicraft");
const ENV_FILE = "current.env";
const BAT_FILE = "activate.bat";
const PS1_FILE = "activate.ps1";
function escapeForShell(value) {
  return value.replace(/'/g, "'\\''");
}
function escapeForBat(value) {
  return value.replace(/"/g, '""');
}
function escapeForPs1(value) {
  return value.replace(/"/g, '`"');
}
function activateProfile(profileId) {
  const profile = getProfileById(profileId);
  if (!profile) {
    return { success: false, command: "", error: "Profile not found" };
  }
  const cliType = getCliTypeById(profile.cliTypeId);
  if (!cliType) {
    return { success: false, command: "", error: "CLI type not found" };
  }
  const env = { ...cliType.envDefaults, ...profile.env };
  const platform = process.platform;
  const isWin = platform === "win32";
  if (isWin) {
    const dir2 = WINDOWS_DIR;
    if (!existsSync(dir2)) mkdirSync(dir2, { recursive: true });
    const batPath = join(dir2, BAT_FILE);
    const ps1Path = join(dir2, PS1_FILE);
    const batLines = ["@echo off"];
    const ps1Lines = [];
    for (const [key, value] of Object.entries(env)) {
      if (value === void 0 || value === null) continue;
      batLines.push(`set "${key}=${escapeForBat(value)}"`);
      ps1Lines.push(`$env:${key}="${escapeForPs1(value)}"`);
    }
    writeFileSync(batPath, batLines.join("\r\n") + "\r\n", "utf-8");
    writeFileSync(ps1Path, ps1Lines.join("\n") + "\n", "utf-8");
    return {
      success: true,
      command: 'call "%APPDATA%\\clicraft\\activate.bat"',
      commandLabel: "CMD",
      commandPs1: '. "$env:APPDATA\\clicraft\\activate.ps1"',
      error: void 0
    };
  }
  const dir = LINUX_MAC_DIR;
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  const envPath = join(dir, ENV_FILE);
  const lines = [];
  for (const [key, value] of Object.entries(env)) {
    if (value === void 0 || value === null) continue;
    lines.push(`export ${key}='${escapeForShell(value)}'`);
  }
  writeFileSync(envPath, lines.join("\n") + "\n", "utf-8");
  const home = process.env.HOME || process.env.USERPROFILE || "";
  const displayPath = home && envPath.startsWith(home) ? join("~", ".config", "clicraft", ENV_FILE) : envPath;
  return {
    success: true,
    command: `source ${displayPath}`,
    commandLabel: "Bash / Zsh",
    error: void 0
  };
}
const isDev = process.env.NODE_ENV === "development" || !app.isPackaged;
function createWindow() {
  const win = new BrowserWindow({
    width: 900,
    height: 700,
    webPreferences: {
      preload: join(__dirname, "../preload/index.cjs"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  Menu.setApplicationMenu(null);
  if (isDev) {
    win.loadURL(process.env["ELECTRON_RENDERER_URL"] || "http://localhost:5173");
  } else {
    win.loadFile(join(__dirname, "../renderer/index.html"));
  }
  ipcMain.handle("getProfiles", () => getProfiles());
  ipcMain.handle("getCliTypes", () => getCliTypes());
  ipcMain.handle("saveProfile", (_e, profile) => {
    try {
      if (!profile || typeof profile !== "object" || !("id" in profile) || !("name" in profile) || !("cliTypeId" in profile) || !("env" in profile)) {
        return { success: false, error: "无效的配置数据" };
      }
      const p = profile;
      if (typeof p.env !== "object" || p.env === null) {
        return { success: false, error: "环境变量格式错误" };
      }
      saveProfile(p);
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return { success: false, error: message };
    }
  });
  ipcMain.handle("deleteProfile", (_e, id) => deleteProfile(id));
  ipcMain.handle("getActiveProfileId", () => getActiveProfileId());
  ipcMain.handle("setActiveProfileId", (_e, id) => setActiveProfileId(id));
  ipcMain.handle("activateProfile", async (_e, profileId) => {
    const result = activateProfile(profileId);
    if (result.success) setActiveProfileId(profileId);
    return result;
  });
}
app.whenReady().then(createWindow);
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
