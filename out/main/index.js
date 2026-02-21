import { app, BrowserWindow, Menu, ipcMain } from "electron";
import { join } from "path";
import { existsSync, readFileSync, writeFileSync, mkdirSync, chmodSync, appendFileSync } from "fs";
import { execSync, spawn } from "child_process";
import * as TOML from "smol-toml";
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
  // Claude Code 原生支持 Anthropic 协议，也可以通过转换层支持其他 OpenAI 格式
  supportedProviders: ["anthropic", "deepseek", "moonshot"],
  extraEnvKeys: [
    { key: "API_TIMEOUT_MS", label: "API Timeout (ms)", secret: false },
    { key: "ANTHROPIC_MODEL", label: "Model", secret: false },
    { key: "ANTHROPIC_SMALL_FAST_MODEL", label: "Small Fast Model", secret: false },
    { key: "CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC", label: "Disable non-essential traffic (0/1)", secret: false }
  ],
  envDefaults: {
    API_TIMEOUT_MS: "600000",
    ANTHROPIC_MODEL: "claude-sonnet-4-5",
    ANTHROPIC_SMALL_FAST_MODEL: "claude-haiku-4-5",
    CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC: "1"
  }
};
const KIMI_CODE_CLI = {
  id: "kimi-code",
  name: "Kimi Code",
  // Kimi Code 官方只支持自家的 API
  supportedProviders: ["moonshot"],
  extraEnvKeys: [
    { key: "KIMI_CLI_NO_AUTO_UPDATE", label: "禁用自动更新 (0/1)", secret: false }
  ],
  envDefaults: {
    KIMI_CLI_NO_AUTO_UPDATE: ""
  }
};
const OPENCODE_CLI = {
  id: "opencode",
  name: "OpenCode",
  // OpenCode 支持多 Provider
  supportedProviders: ["openai", "deepseek", "moonshot", "siliconflow", "anthropic-compatible", "google", "aws-bedrock"],
  extraEnvKeys: [
    { key: "OPENCODE_CONFIG", label: "自定义配置文件路径", secret: false },
    { key: "OPENCODE_MODEL", label: "模型 (provider/model 格式)", secret: false },
    { key: "OPENCODE_SERVER_PASSWORD", label: "服务器密码", secret: true }
  ],
  envDefaults: {
    OPENCODE_CONFIG: "",
    OPENCODE_MODEL: "",
    OPENCODE_SERVER_PASSWORD: ""
  }
};
const cliTypes = [CLAUDE_CODE_CLI, KIMI_CODE_CLI, OPENCODE_CLI];
function getCliTypes() {
  return cliTypes;
}
function getCliTypeById(id) {
  return cliTypes.find((c) => c.id === id);
}
const OPENAI_PROVIDER = {
  id: "openai",
  name: "OpenAI",
  protocol: "openai",
  baseUrlDefault: "https://api.openai.com/v1",
  envKeys: [
    { key: "OPENAI_API_KEY", label: "OpenAI API Key", secret: true },
    { key: "OPENAI_BASE_URL", label: "Base URL (可选)", secret: false }
  ],
  models: [
    { id: "gpt-5.2", name: "GPT-5.2", description: "最佳编码和 agentic 任务模型" },
    { id: "gpt-5.1", name: "GPT-5.1", description: "可配置推理强度的智能模型" },
    { id: "gpt-5", name: "GPT-5", description: "最快、最有用的模型" },
    { id: "gpt-5-mini", name: "GPT-5 Mini", description: "更快的 GPT-5 轻量版本" },
    { id: "gpt-5-nano", name: "GPT-5 Nano", description: "最快、最经济的 GPT-5 版本" },
    { id: "gpt-4.1", name: "GPT-4.1", description: "强大的编程模型" },
    { id: "gpt-4.1-mini", name: "GPT-4.1 Mini", description: "经济型编程模型" },
    { id: "gpt-4.1-nano", name: "GPT-4.1 Nano", description: "快速轻量模型" },
    { id: "gpt-4o", name: "GPT-4o", description: "多模态旗舰模型" },
    { id: "gpt-4o-mini", name: "GPT-4o Mini", description: "经济型多模态模型" },
    { id: "o3-mini", name: "o3 Mini", description: "快速推理模型" },
    { id: "o1", name: "o1", description: "复杂推理模型" }
  ]
};
const DEEPSEEK_PROVIDER = {
  id: "deepseek",
  name: "DeepSeek",
  protocol: "openai",
  baseUrlDefault: "https://api.deepseek.com/v1",
  envKeys: [
    { key: "OPENAI_API_KEY", label: "DeepSeek API Key", secret: true },
    { key: "OPENAI_BASE_URL", label: "Base URL", secret: false }
  ],
  models: [
    { id: "deepseek-chat", name: "DeepSeek Chat", description: "DeepSeek-V3 非推理模式" },
    { id: "deepseek-reasoner", name: "DeepSeek Reasoner", description: "DeepSeek-V3 推理模式（思维链）" },
    { id: "deepseek-coder", name: "DeepSeek Coder", description: "代码生成专用模型" }
  ]
};
const MOONSHOT_PROVIDER = {
  id: "moonshot",
  name: "Moonshot (Kimi)",
  protocol: "openai",
  baseUrlDefault: "https://api.moonshot.cn/v1",
  envKeys: [
    { key: "OPENAI_API_KEY", label: "Moonshot API Key", secret: true },
    { key: "OPENAI_BASE_URL", label: "Base URL", secret: false }
  ],
  models: [
    { id: "kimi-k2-thinking", name: "Kimi K2 Thinking", description: "K2 思考模型" },
    { id: "kimi-k2-instruct", name: "Kimi K2 Instruct", description: "K2 指令模型" },
    { id: "kimi-for-coding", name: "Kimi for Coding", description: "编程专用模型" },
    { id: "kimi-dev-72b", name: "Kimi Dev 72B", description: "开发场景 72B 模型" }
  ]
};
const SILICONFLOW_PROVIDER = {
  id: "siliconflow",
  name: "SiliconFlow",
  protocol: "openai",
  baseUrlDefault: "https://api.siliconflow.cn/v1",
  envKeys: [
    { key: "OPENAI_API_KEY", label: "SiliconFlow API Key", secret: true },
    { key: "OPENAI_BASE_URL", label: "Base URL", secret: false }
  ],
  models: [
    { id: "deepseek-ai/DeepSeek-V3", name: "DeepSeek V3", description: "DeepSeek V3 模型" },
    { id: "deepseek-ai/DeepSeek-R1", name: "DeepSeek R1", description: "DeepSeek 推理模型" },
    { id: "Qwen/Qwen3-32B", name: "Qwen3 32B", description: "通义千问 32B 模型" },
    { id: "THUDM/GLM-4.7", name: "GLM-4.7", description: "智谱 GLM-4.7" },
    { id: "moonshotai/Kimi-K2-Thinking", name: "Kimi K2 Thinking", description: "Kimi K2 思考模型" }
  ]
};
const ANTHROPIC_PROVIDER = {
  id: "anthropic",
  name: "Anthropic",
  protocol: "anthropic",
  baseUrlDefault: "https://api.anthropic.com",
  envKeys: [
    { key: "ANTHROPIC_API_KEY", label: "Anthropic API Key", secret: true }
  ],
  models: [
    { id: "claude-sonnet-4-6", name: "Claude Sonnet 4.6", description: "最新智能模型" },
    { id: "claude-opus-4", name: "Claude Opus 4", description: "最高能力模型" },
    { id: "claude-sonnet-4-5", name: "Claude Sonnet 4.5", description: "平衡型模型" },
    { id: "claude-haiku-4-5", name: "Claude Haiku 4.5", description: "快速轻量模型" },
    { id: "claude-sonnet-4", name: "Claude Sonnet 4", description: "Sonnet 4 系列" },
    { id: "claude-3-7-sonnet", name: "Claude 3.7 Sonnet", description: "3.7 版本" }
  ]
};
const ANTHROPIC_COMPATIBLE_PROVIDER = {
  id: "anthropic-compatible",
  name: "Anthropic (OpenAI 兼容)",
  protocol: "openai",
  baseUrlDefault: "https://api.anthropic.com/v1",
  envKeys: [
    { key: "OPENAI_API_KEY", label: "Anthropic API Key", secret: true },
    { key: "OPENAI_BASE_URL", label: "Base URL", secret: false }
  ],
  models: [
    { id: "claude-sonnet-4-6", name: "Claude Sonnet 4.6", description: "OpenAI 兼容格式" },
    { id: "claude-opus-4", name: "Claude Opus 4", description: "OpenAI 兼容格式" }
  ]
};
const GOOGLE_PROVIDER = {
  id: "google",
  name: "Google Gemini",
  protocol: "google",
  baseUrlDefault: "https://generativelanguage.googleapis.com",
  envKeys: [
    { key: "GOOGLE_API_KEY", label: "Google API Key", secret: true }
  ],
  models: [
    { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash", description: "快速多模态模型" },
    { id: "gemini-2.0-flash-lite", name: "Gemini 2.0 Flash-Lite", description: "经济型快速模型" },
    { id: "gemini-1.5-pro", name: "Gemini 1.5 Pro", description: "专业级多模态模型" },
    { id: "gemini-1.5-flash", name: "Gemini 1.5 Flash", description: "1.5 快速模型" }
  ]
};
const AWS_BEDROCK_PROVIDER = {
  id: "aws-bedrock",
  name: "AWS Bedrock",
  protocol: "aws",
  envKeys: [
    { key: "AWS_ACCESS_KEY_ID", label: "AWS Access Key ID", secret: true },
    { key: "AWS_SECRET_ACCESS_KEY", label: "AWS Secret Access Key", secret: true },
    { key: "AWS_REGION", label: "AWS Region", secret: false }
  ],
  models: [
    { id: "anthropic.claude-sonnet-4-5", name: "Claude Sonnet 4.5", description: "AWS Bedrock 版" },
    { id: "anthropic.claude-opus-4", name: "Claude Opus 4", description: "AWS Bedrock 版" },
    { id: "amazon.nova-pro", name: "Amazon Nova Pro", description: "Amazon 自研模型" }
  ]
};
const ALL_PROVIDERS = [
  OPENAI_PROVIDER,
  DEEPSEEK_PROVIDER,
  MOONSHOT_PROVIDER,
  SILICONFLOW_PROVIDER,
  ANTHROPIC_PROVIDER,
  ANTHROPIC_COMPATIBLE_PROVIDER,
  GOOGLE_PROVIDER,
  AWS_BEDROCK_PROVIDER
];
const CLI_SUPPORTED_PROVIDERS = {
  // Claude Code: 原生支持 Anthropic 协议，也可通过转换层支持 OpenAI 格式
  "claude-code": ["anthropic", "deepseek", "moonshot"],
  // Kimi Code: 官方只支持自家的 API
  "kimi-code": ["moonshot"],
  // OpenCode: 支持多 Provider
  "opencode": ["openai", "deepseek", "moonshot", "siliconflow", "anthropic-compatible", "google", "aws-bedrock"]
};
function getProviderById(id) {
  return ALL_PROVIDERS.find((p) => p.id === id);
}
function getProvidersForCli(cliTypeId) {
  const supportedIds = CLI_SUPPORTED_PROVIDERS[cliTypeId] || [];
  return supportedIds.map((id) => getProviderById(id)).filter(Boolean);
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
  const provider = getProviderById(profile.providerId);
  if (!provider) return { error: "Provider 不存在" };
  const env = {};
  for (const envKey of provider.envKeys) {
    const value = profile.env[envKey.key];
    if (value) {
      env[envKey.key] = value;
    } else if (envKey.key.includes("BASE_URL") && provider.baseUrlDefault) {
      env[envKey.key] = provider.baseUrlDefault;
    }
  }
  if (cliType.envDefaults) {
    for (const [key, defaultValue] of Object.entries(cliType.envDefaults)) {
      if (!(key in env) && defaultValue) {
        env[key] = defaultValue;
      }
    }
  }
  Object.assign(env, profile.env);
  if (profile.model) {
    const modelKey = cliType.id === "claude-code" ? "ANTHROPIC_MODEL" : "OPENCODE_MODEL";
    env[modelKey] = profile.model;
  }
  return {
    env,
    profileName: `${profile.name} (${provider.name})`
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
function detectProviderAuth(cliTypeId) {
  const providers = getProvidersForCli(cliTypeId);
  const entries = [];
  const envData = {};
  const secretKeys = [];
  const detectedProviders = [];
  for (const provider of providers) {
    let hasProviderKey = false;
    for (const envKey of provider.envKeys) {
      const val = process.env[envKey.key];
      if (val !== void 0) {
        envData[envKey.key] = val;
        if (envKey.secret) secretKeys.push(envKey.key);
        if (val && envKey.secret) hasProviderKey = true;
      }
    }
    if (hasProviderKey) {
      detectedProviders.push(provider.name);
    }
  }
  if (Object.keys(envData).length > 0) {
    entries.push({ source: "env", data: envData, secretKeys });
  }
  let method;
  if (detectedProviders.length > 0) {
    method = {
      type: "api_key",
      displayName: "API Key",
      details: `通过环境变量配置 (${detectedProviders.join(", ")})`
    };
  } else if (entries.length > 0) {
    method = {
      type: "unknown",
      displayName: "配置不完整",
      details: "检测到环境变量但未找到有效的 Provider API Key"
    };
  } else {
    method = {
      type: "unknown",
      displayName: "未配置",
      details: "未检测到相关配置文件和环境变量"
    };
  }
  return { method, entries };
}
class ClaudeCodeDetector {
  cliTypeId = "claude-code";
  settingsPath = join(HOME, ".claude", "settings.json");
  claudeJsonPath = join(HOME, ".claude.json");
  detect() {
    const entries = [];
    let authMethod = { type: "unknown", displayName: "未配置" };
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
    let hasOAuthSession = false;
    if (existsSync(this.claudeJsonPath)) {
      try {
        const raw = readFileSync(this.claudeJsonPath, "utf-8");
        const data = JSON.parse(raw);
        if (data.sessionToken || data.oauth && data.oauth.accessToken) {
          hasOAuthSession = true;
          authMethod = {
            type: "oauth",
            displayName: "账号登录 (OAuth)",
            details: "通过浏览器登录授权"
          };
        }
        entries.push({
          source: "file",
          path: this.claudeJsonPath,
          data: this.flattenForDisplay(data)
        });
      } catch {
        entries.push({
          source: "file",
          path: this.claudeJsonPath,
          data: { _error: "文件解析失败" }
        });
      }
    }
    const providerAuth = detectProviderAuth(this.cliTypeId);
    entries.push(...providerAuth.entries);
    if (providerAuth.method.type === "api_key") {
      authMethod = providerAuth.method;
      if (hasOAuthSession) {
        authMethod.details += "（覆盖账号登录）";
      }
    } else if (hasOAuthSession) {
      authMethod = {
        type: "oauth",
        displayName: "账号登录 (OAuth)",
        details: "通过浏览器登录授权"
      };
    } else if (entries.length > 0) {
      authMethod = {
        type: "unknown",
        displayName: "配置不完整",
        details: "未检测到有效的认证信息"
      };
    }
    return {
      cliTypeId: this.cliTypeId,
      cliName: "Claude Code",
      found: entries.length > 0,
      entries,
      authMethod
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
class KimiCodeDetector {
  cliTypeId = "kimi-code";
  tomlConfigPath = join(HOME, ".kimi", "config.toml");
  jsonConfigPath = join(HOME, ".kimi", "config.json");
  detect() {
    const entries = [];
    let authMethod = { type: "unknown", displayName: "未配置" };
    let configPath = "";
    let hasApiKeyInConfig = false;
    let configProviderName = "";
    if (existsSync(this.tomlConfigPath)) {
      configPath = this.tomlConfigPath;
      try {
        const raw = readFileSync(configPath, "utf-8");
        const data = TOML.parse(raw);
        const providers = data.providers;
        if (providers) {
          for (const [name, provider] of Object.entries(providers)) {
            if (provider.api_key) {
              hasApiKeyInConfig = true;
              configProviderName = name;
              break;
            }
          }
        }
        entries.push({
          source: "file",
          path: configPath,
          data: this.flattenForDisplay(data)
        });
      } catch (e) {
        entries.push({
          source: "file",
          path: configPath,
          data: { _error: `TOML 解析失败: ${e}` }
        });
      }
    } else if (existsSync(this.jsonConfigPath)) {
      configPath = this.jsonConfigPath;
      try {
        const raw = readFileSync(configPath, "utf-8");
        const data = JSON.parse(raw);
        const providers = data.providers;
        if (providers) {
          for (const [name, provider] of Object.entries(providers)) {
            if (provider.api_key) {
              hasApiKeyInConfig = true;
              configProviderName = name;
              break;
            }
          }
        }
        entries.push({
          source: "file",
          path: configPath,
          data: this.flattenForDisplay(data)
        });
      } catch {
        entries.push({
          source: "file",
          path: configPath,
          data: { _error: "JSON 解析失败" }
        });
      }
    }
    const providerAuth = detectProviderAuth(this.cliTypeId);
    entries.push(...providerAuth.entries);
    if (providerAuth.method.type === "api_key") {
      authMethod = providerAuth.method;
      if (hasApiKeyInConfig) {
        authMethod.details += `（覆盖配置文件中的 ${configProviderName}）`;
      }
    } else if (hasApiKeyInConfig) {
      authMethod = {
        type: "api_key",
        displayName: "API Key",
        details: `通过配置文件配置 (${configProviderName})`
      };
    } else if (entries.length > 0) {
      authMethod = {
        type: "unknown",
        displayName: "配置不完整",
        details: "未检测到有效的 API Key，请运行 kimi /login 进行登录，或在配置文件中添加 providers"
      };
    } else {
      authMethod = {
        type: "unknown",
        displayName: "未配置",
        details: "未找到 Kimi Code 配置文件"
      };
    }
    return {
      cliTypeId: this.cliTypeId,
      cliName: "Kimi Code",
      found: entries.length > 0,
      entries,
      authMethod
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
class OpenCodeDetector {
  cliTypeId = "opencode";
  globalConfigPath = join(HOME, ".config", "opencode", "opencode.json");
  authPath = join(HOME, ".local", "share", "opencode", "auth.json");
  detect() {
    const entries = [];
    let authMethod = { type: "unknown", displayName: "未配置" };
    if (existsSync(this.globalConfigPath)) {
      try {
        const raw = readFileSync(this.globalConfigPath, "utf-8");
        const data = JSON.parse(raw);
        entries.push({
          source: "file",
          path: this.globalConfigPath,
          data: this.flattenForDisplay(data)
        });
      } catch {
        entries.push({
          source: "file",
          path: this.globalConfigPath,
          data: { _error: "配置文件解析失败" }
        });
      }
    }
    let authProviders = [];
    if (existsSync(this.authPath)) {
      try {
        const raw = readFileSync(this.authPath, "utf-8");
        const data = JSON.parse(raw);
        if (data.providers) {
          for (const [name, provider] of Object.entries(data.providers)) {
            if (provider.apiKey || provider.api_key || provider.token) {
              authProviders.push(name);
            }
          }
        }
        entries.push({
          source: "file",
          path: this.authPath,
          data: this.flattenForDisplay(data)
        });
      } catch {
        entries.push({
          source: "file",
          path: this.authPath,
          data: { _error: "认证文件解析失败" }
        });
      }
    }
    const providerAuth = detectProviderAuth(this.cliTypeId);
    entries.push(...providerAuth.entries);
    if (providerAuth.method.type === "api_key") {
      authMethod = providerAuth.method;
      if (authProviders.length > 0) {
        authMethod.details += `（同时配置了 opencode auth login: ${authProviders.join(", ")}）`;
      }
    } else if (authProviders.length > 0) {
      authMethod = {
        type: "api_key",
        displayName: "API Key",
        details: `通过 opencode auth login 配置 (${authProviders.join(", ")})`
      };
    } else if (entries.length > 0) {
      authMethod = {
        type: "unknown",
        displayName: "配置不完整",
        details: "未检测到有效的 API Key，请运行 opencode auth login 或设置环境变量"
      };
    } else {
      authMethod = {
        type: "unknown",
        displayName: "未配置",
        details: "未找到 OpenCode 配置文件"
      };
    }
    return {
      cliTypeId: this.cliTypeId,
      cliName: "OpenCode",
      found: entries.length > 0,
      entries,
      authMethod
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
  new ClaudeCodeDetector(),
  new KimiCodeDetector(),
  new OpenCodeDetector()
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
  ipcMain.handle("getProviders", (_e, cliTypeId) => getProvidersForCli(cliTypeId));
  ipcMain.handle("saveProfile", (_e, profile) => {
    try {
      if (!profile || typeof profile !== "object" || !("id" in profile) || !("name" in profile) || !("cliTypeId" in profile) || !("providerId" in profile) || !("env" in profile)) {
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
