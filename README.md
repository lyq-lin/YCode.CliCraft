# CliCraft

一键切换 CLI 环境变量配置的桌面工具。管理多套配置方案（如 DeepSeek、智谱 GLM），一键生成激活脚本，在终端中执行即可生效。

## 技术栈

- Electron + Vite + React 18 + TypeScript

## 开发

```bash
npm install
npm run dev
```

开发脚本已默认设置 `NO_SANDBOX=1`，在 Linux 下可避免沙箱权限错误（chrome-sandbox）。若仍报错，可手动执行：`NO_SANDBOX=1 npm run dev`。

## 打包

```bash
npm run build
```

产物在 `release/` 目录（由 electron-builder 输出）。

## 使用说明

1. **新建方案**：点击「新建方案」，选择 CLI 类型（如 Claude Code），填写方案名称和各环境变量。
2. **使用此配置**：在看板中点击某方案的「使用此配置」，会生成激活脚本并弹出提示。
3. **在终端激活**：将提示中的命令复制到当前终端执行即可使环境变量生效，无需重启终端。
   - Linux/macOS：`source ~/.config/clicraft/current.env`
   - Windows CMD：`call "%APPDATA%\clicraft\activate.bat"`
   - Windows PowerShell：`. "$env:APPDATA\clicraft\activate.ps1"`

## 配置存储

配置保存在 Electron 用户数据目录下的 `store.json`（由 `app.getPath('userData')` 决定）。

## License

MIT
