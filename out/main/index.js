import { app, BrowserWindow, Menu, ipcMain } from "electron";
import { join } from "path";
import { existsSync, readFileSync, writeFileSync, mkdirSync, chmodSync, appendFileSync } from "fs";
import { execSync, spawn } from "child_process";
import __cjs_mod__ from "node:module";
const __filename = import.meta.filename;
const __dirname = import.meta.dirname;
const require2 = __cjs_mod__.createRequire(import.meta.url);
const CONFIG_DIR = app.getPath("userData");
const CONFIG_FILE = join(CONFIG_DIR, "store.json");
const defaultData = {
  profiles: []
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
      profiles: Array.isArray(data.profiles) ? data.profiles : defaultData.profiles
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
const HOME$1 = process.env.HOME || process.env.USERPROFILE || "";
const CRAFT_DIR = join(HOME$1, ".config", "clicraft");
const MARKER = "# >>> CliCraft managed - do not edit >>>";
const MARKER_END = "# <<< CliCraft managed <<<";
function escapeForShell(value) {
  return value.replace(/'/g, "'\\''");
}
function escapeForBat(value) {
  return value.replace(/"/g, '""');
}
function buildEnv(profileId) {
  const profile = getProfileById(profileId);
  if (!profile) return { error: "配置方案不存在" };
  const cliType = getCliTypeById(profile.cliTypeId);
  if (!cliType) return { error: "CLI 类型不存在" };
  return {
    env: { ...cliType.envDefaults, ...profile.env },
    profileName: profile.name
  };
}
function ensureDir(dir) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}
function hasCommand(cmd) {
  try {
    execSync(`which ${cmd}`, { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}
function writeEnvFile(env, profileName) {
  ensureDir(CRAFT_DIR);
  const envPath = join(CRAFT_DIR, "current.env");
  const lines = [
    `# CliCraft — ${profileName}`,
    `# Generated at ${(/* @__PURE__ */ new Date()).toISOString()}`
  ];
  for (const [key, value] of Object.entries(env)) {
    if (value === void 0 || value === null) continue;
    lines.push(`export ${key}='${escapeForShell(value)}'`);
  }
  writeFileSync(envPath, lines.join("\n") + "\n", "utf-8");
  return envPath;
}
function injectGlobalSource(envPath) {
  const affectedFiles = [];
  const sourceLine = `source "${envPath}"`;
  const block = `${MARKER}
${sourceLine}
${MARKER_END}`;
  const rcFiles = [
    join(HOME$1, ".bashrc"),
    join(HOME$1, ".zshrc")
  ];
  for (const rc of rcFiles) {
    if (!existsSync(rc)) continue;
    const content = readFileSync(rc, "utf-8");
    if (content.includes(MARKER)) {
      const replaced = content.replace(
        new RegExp(`${escapeRegExp(MARKER)}[\\s\\S]*?${escapeRegExp(MARKER_END)}`),
        block
      );
      writeFileSync(rc, replaced, "utf-8");
    } else {
      appendFileSync(rc, "\n" + block + "\n", "utf-8");
    }
    affectedFiles.push(rc);
  }
  return affectedFiles;
}
function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function launchLocalLinuxMac(env, profileName) {
  ensureDir(CRAFT_DIR);
  const scriptPath = join(CRAFT_DIR, "launch.sh");
  const lines = [
    "#!/usr/bin/env bash",
    `# CliCraft — ${profileName}`
  ];
  for (const [key, value] of Object.entries(env)) {
    if (value === void 0 || value === null) continue;
    lines.push(`export ${key}='${escapeForShell(value)}'`);
  }
  lines.push(`echo -e "\\033[32m[CliCraft]\\033[0m 已加载配置：${profileName}"`);
  lines.push("exec bash");
  writeFileSync(scriptPath, lines.join("\n") + "\n", "utf-8");
  chmodSync(scriptPath, 493);
  if (process.platform === "darwin") {
    try {
      const escaped = scriptPath.replace(/"/g, '\\"');
      const osa = `tell application "Terminal" to do script "bash \\"${escaped}\\""`;
      spawn("osascript", ["-e", osa], { detached: true, stdio: "ignore" }).unref();
      return { success: true, message: "已在新终端窗口启动" };
    } catch {
      return { success: false, error: "无法打开 Terminal.app" };
    }
  }
  const terminals = [
    { cmd: "x-terminal-emulator", args: ["-e", "bash", scriptPath] },
    { cmd: "gnome-terminal", args: ["--", "bash", scriptPath] },
    { cmd: "konsole", args: ["-e", "bash", scriptPath] },
    { cmd: "xfce4-terminal", args: ["--command", `bash ${scriptPath}`] },
    { cmd: "mate-terminal", args: ["--command", `bash ${scriptPath}`] },
    { cmd: "xterm", args: ["-e", "bash", scriptPath] }
  ];
  for (const t of terminals) {
    if (!hasCommand(t.cmd)) continue;
    try {
      const child = spawn(t.cmd, t.args, { detached: true, stdio: "ignore" });
      child.unref();
      return { success: true, message: "已在新终端窗口启动" };
    } catch {
      continue;
    }
  }
  return {
    success: false,
    error: "未找到可用的终端模拟器（已尝试 x-terminal-emulator / gnome-terminal / konsole / xfce4-terminal / xterm）"
  };
}
function launchLocalWindows(env, profileName) {
  const appData = process.env.APPDATA || join(HOME$1, "AppData", "Roaming");
  const dir = join(appData, "clicraft");
  ensureDir(dir);
  const batPath = join(dir, "launch.bat");
  const batLines = ["@echo off", `rem CliCraft — ${profileName}`];
  for (const [key, value] of Object.entries(env)) {
    if (value === void 0 || value === null) continue;
    batLines.push(`set "${key}=${escapeForBat(value)}"`);
  }
  batLines.push(`echo [CliCraft] 已加载配置：${profileName}`);
  batLines.push("cmd /k");
  writeFileSync(batPath, batLines.join("\r\n") + "\r\n", "utf-8");
  try {
    spawn("cmd.exe", ["/c", "start", "cmd.exe", "/k", batPath], { detached: true, stdio: "ignore" }).unref();
    return { success: true, message: "已在新 CMD 窗口启动" };
  } catch {
    return { success: false, error: "无法打开 CMD" };
  }
}
function launchGlobalLinuxMac(env, profileName) {
  const envPath = writeEnvFile(env, profileName);
  const affected = injectGlobalSource(envPath);
  if (affected.length === 0) {
    return {
      success: true,
      message: `已写入 ${envPath}，但未找到 .bashrc / .zshrc 文件，请手动添加 source "${envPath}" 到你的 shell 配置中。`
    };
  }
  return {
    success: true,
    message: `已全局配置 ${profileName}，修改了 ${affected.map((f) => f.replace(HOME$1, "~")).join("、")}。新终端窗口将自动加载此配置。`
  };
}
function launchGlobalWindows(env, profileName) {
  const errors = [];
  for (const [key, value] of Object.entries(env)) {
    if (value === void 0 || value === null) continue;
    try {
      execSync(`setx ${key} "${escapeForBat(value)}"`, { stdio: "ignore" });
    } catch {
      errors.push(key);
    }
  }
  if (errors.length > 0) {
    return { success: false, error: `以下环境变量设置失败：${errors.join(", ")}` };
  }
  return {
    success: true,
    message: `已通过 setx 全局配置 ${profileName}。新终端窗口将自动生效。`
  };
}
function launchProfile(profileId, scope = "local") {
  const result = buildEnv(profileId);
  if ("error" in result) return { success: false, error: result.error };
  const { env, profileName } = result;
  const isWin = process.platform === "win32";
  if (scope === "global") {
    return isWin ? launchGlobalWindows(env, profileName) : launchGlobalLinuxMac(env, profileName);
  }
  return isWin ? launchLocalWindows(env, profileName) : launchLocalLinuxMac(env, profileName);
}
const HOME = process.env.HOME || process.env.USERPROFILE || "";
class ClaudeCodeDetector {
  cliTypeId = "claude-code";
  settingsPath = join(HOME, ".claude", "settings.json");
  envKeys = [
    "ANTHROPIC_BASE_URL",
    "ANTHROPIC_AUTH_TOKEN",
    "API_TIMEOUT_MS",
    "ANTHROPIC_MODEL",
    "ANTHROPIC_SMALL_FAST_MODEL",
    "CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC"
  ];
  secretEnvKeys = /* @__PURE__ */ new Set(["ANTHROPIC_AUTH_TOKEN"]);
  detect() {
    const entries = [];
    if (existsSync(this.settingsPath)) {
      try {
        const raw = readFileSync(this.settingsPath, "utf-8");
        const data = JSON.parse(raw);
        entries.push({
          source: "file",
          path: this.settingsPath,
          data: this.flattenForDisplay(data)
        });
      } catch {
        entries.push({
          source: "file",
          path: this.settingsPath,
          data: { _error: "文件解析失败" }
        });
      }
    }
    const envData = {};
    const secretKeys = [];
    for (const key of this.envKeys) {
      const val = process.env[key];
      if (val !== void 0) {
        envData[key] = val;
        if (this.secretEnvKeys.has(key)) secretKeys.push(key);
      }
    }
    if (Object.keys(envData).length > 0) {
      entries.push({ source: "env", data: envData, secretKeys });
    }
    return {
      cliTypeId: this.cliTypeId,
      cliName: "Claude Code",
      found: entries.length > 0,
      entries
    };
  }
  flattenForDisplay(obj, prefix = "", depth = 0) {
    const out = {};
    if (depth > 3 || !obj || typeof obj !== "object") return out;
    for (const [k, v] of Object.entries(obj)) {
      const key = prefix ? `${prefix}.${k}` : k;
      if (v === null || v === void 0) continue;
      if (typeof v === "object" && !Array.isArray(v)) {
        Object.assign(out, this.flattenForDisplay(v, key, depth + 1));
      } else {
        out[key] = String(v);
      }
    }
    return out;
  }
}
const detectors = [
  new ClaudeCodeDetector()
];
function detectAllCliStatus() {
  return detectors.map((d) => d.detect());
}
const isDev = process.env.NODE_ENV === "development" || !app.isPackaged;
function createWindow() {
  const win = new BrowserWindow({
    width: 960,
    height: 740,
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
  ipcMain.handle("launchProfile", (_e, profileId, scope) => {
    try {
      return launchProfile(profileId, scope === "global" ? "global" : "local");
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return { success: false, error: message };
    }
  });
  ipcMain.handle("detectCliStatus", () => detectAllCliStatus());
}
app.whenReady().then(createWindow);
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
