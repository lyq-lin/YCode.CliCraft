# YCode.CliCraft

<p align="center">
  <strong>一键切换 CLI 环境变量配置</strong> · 多套方案，一键启动
</p>

<p align="center">
  <a href="https://github.com/lyq-lin/YCode.CliCraft/blob/main/LICENSE"><img src="https://img.shields.io/github/license/lyq-lin/YCode.CliCraft" alt="License"></a>
  <a href="https://github.com/lyq-lin/YCode.CliCraft"><img src="https://img.shields.io/github/stars/lyq-lin/YCode.CliCraft" alt="Stars"></a>
</p>

---

## 项目简介

YCode.CliCraft 是一款面向 **AI CLI 工具**（如 Claude Code）的配置管理桌面应用。使用 DeepSeek、智谱 GLM 等第三方 API 时，需要频繁切换环境变量。CliCraft 将每套配置保存为独立方案，一键以当前配置启动新终端，或选择全局生效，告别手动改变量。

### 核心特性

- **多套配置方案** — 每套方案对应一套环境变量（如 DeepSeek、智谱 GLM），增删改查
- **以当前启动** — 点击即打开新终端，环境变量已注入，无需手动 source
- **作用域可选** — 默认仅新窗口生效；可选全局生效（写入 shell 配置或 setx）
- **配置看板** — 自动读取 `~/.claude/settings.json` 与环境变量，展示 Claude Code 当前实际使用的配置
- **密钥显示控制** — 密钥字段支持显示/隐藏切换，新建与编辑时均可
- **Electron 桌面应用** — 跨平台（Linux / Windows / macOS）

### 适用场景

使用 Claude Code 时，除官方 Claude 账号外，还会用 DeepSeek、智谱等第三方 API。用量耗尽或想切换供应商时，需改多条环境变量。CliCraft 将每套配置保存为方案，一键切换并启动，省时省心。

---

## 技术栈

| 层级 | 技术 |
|------|------|
| **桌面壳** | [Electron](https://www.electronjs.org/) |
| **前端** | React 18 + TypeScript + Vite + [Ant Design](https://ant.design/) |
| **构建** | [electron-vite](https://electron-vite.org/) |

---

## 快速开始

**环境**：Node.js 18+

```bash
git clone https://github.com/lyq-lin/YCode.CliCraft.git
cd YCode.CliCraft
npm install
npm run dev
```

> Linux 下若遇 SUID sandbox 错误，开发脚本已默认设置 `NO_SANDBOX=1`。若仍报错，可手动执行：`NO_SANDBOX=1 npm run dev`。

### 使用说明

1. **新建方案** — 点击「新建方案」，选择 CLI 类型（如 Claude Code），填写方案名称和各环境变量
2. **以当前启动** — 点击某方案的「以当前启动」主按钮，默认在新终端窗口生效；或通过下拉选择「全局生效」
3. **配置看板** — 底部展示 Claude Code 当前使用的配置（`~/.claude/settings.json` + 环境变量），可刷新查看

---

## 构建与打包

```bash
npm run build   # 构建
```

产物在 `release/`。支持 AppImage (Linux)、nsis (Windows)、dmg (macOS)。

---

## 配置存储

配置保存在 Electron 用户数据目录下的 `store.json`（由 `app.getPath('userData')` 决定）。

---

## 贡献

遇问题或建议请提 [Issue](https://github.com/lyq-lin/YCode.CliCraft/issues)，欢迎 [PR](https://github.com/lyq-lin/YCode.CliCraft/pulls)。

---

## 许可证

[MIT](LICENSE)

---

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=lyq-lin/YCode.CliCraft&type=Date)](https://star-history.com/#lyq-lin/YCode.CliCraft&Date)
