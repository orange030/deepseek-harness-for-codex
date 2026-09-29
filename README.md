# DeepSeek Harness for Codex

<p align="center">
  <strong>简体中文</strong> · <a href="./README.en.md">English</a>
</p>

<p align="center">
  <img src="./assets/icon.png" width="128" alt="DeepSeek Harness for Codex 图标">
</p>

DeepSeek Harness for Codex 让 Codex 在本地启动 [DeepSeek Harness](https://github.com/deepseek-ai/DeepSeek-Harness)，返回可点击的实时 Web 会话链接，将任务委派给它执行，并由 Codex 独立检查真实的工作区变更。

![DeepSeek Harness for Codex 演示](./imgs/examples.gif)

## 快速开始

除非你只需要独立的 MCP 服务，否则推荐安装 Codex 插件。插件会同时安装 MCP 工具和委派工作流，让 Codex 在 Harness 完成任务后独立验收结果。

### 1. 准备环境

- Node.js `^22.19.0` 或 `>=24.0.0`，并包含 `npx`
- 支持插件的 Codex 客户端
- DeepSeek API Key

推荐把 API Key 放在目标仓库根目录中不提交到 Git 的 `.env` 文件里：

```dotenv
DEEPSEEK_API_KEY=your-key
```

不要提交这个文件。你也可以把 `DEEPSEEK_API_KEY` 注入启动 Codex 的环境，或者稍后在 Harness 页面中的 **Settings → Models** 配置。

### 2. 安装插件

在终端中执行以下两条命令：

```sh
codex plugin marketplace add orange030/deepseek-harness-for-codex --ref main
codex plugin add deepseek-harness@deepseek-harness-for-codex
```

在 macOS 上，如果找不到 `codex`，或者其他全局安装覆盖了桌面客户端的命令，请直接使用客户端内置的可执行文件：

```sh
CODEX_APP_BIN="/Applications/ChatGPT.app/Contents/Resources/codex"
"$CODEX_APP_BIN" plugin marketplace add orange030/deepseek-harness-for-codex --ref main
"$CODEX_APP_BIN" plugin add deepseek-harness@deepseek-harness-for-codex
```

### 3. 新建 Codex 任务

插件会在新任务启动时加载。安装完成后新建一个 Codex 任务，并要求它使用 DeepSeek Harness，例如：

> 使用 DeepSeek Harness 在可见的本地会话中实现这个需求。不要自动打开浏览器，把 Harness 实时页面链接发给我；完成后由你检查 diff 并运行相关测试。

Codex 会在本地启动 Harness，在空闲的回环端口提供 Web 页面，返回可点击链接，提交任务并跟踪同一个可见会话，最后独立验收结果。浏览器不会自动打开；需要查看过程时，由你点击 Codex 消息中的链接。你不需要手动启动 Harness，也不需要另外注册 MCP 服务。

首次运行可能会下载固定版本的 Harness npm 包；MCP 服务本身已随插件分发，后续 Harness 运行会使用本地 npm 缓存。

此 fork 支持通过 `DSH_MCP_WEB_URL` 连接已经运行的 Harness Web，不会再启动一个 DSH 进程。请把 DSH 启动时打印的完整认证 URL（包括 `?token=...`）仅配置在本机环境中，不要提交到 Git。MCP 会用它换取会话 Cookie；为了让用户浏览器进入同一个受保护页面，返回的本地链接可能仍包含一次性 Token，应按敏感信息处理。运行记录不会把 Token URL、Cookie 或服务日志写入磁盘。`stop_service` 和 MCP 退出只会断开连接，不会停止外部 DSH。

## 从旧名称迁移

项目已从 `deepseek-harness-mcp` 更名为 `deepseek-harness-for-codex`。如果安装过旧版插件，请先移除旧插件和旧市场，再按照上面的“安装插件”重新安装：

```sh
codex plugin remove deepseek-harness-mcp@deepseek-harness
codex plugin marketplace remove deepseek-harness
```

旧版 npm 包不会自动替换为新包。默认数据目录仍保留为 `~/.deep-seek-harness-mcp`，因此重新安装后可以继续使用原有的本地 Harness 设置和会话。

## 更新

刷新插件市场并重新安装插件，然后新建一个 Codex 任务：

```sh
codex plugin marketplace upgrade deepseek-harness-for-codex
codex plugin add deepseek-harness@deepseek-harness-for-codex
```

## 卸载

```sh
codex plugin remove deepseek-harness@deepseek-harness-for-codex
codex plugin marketplace remove deepseek-harness-for-codex
```

## 独立安装 MCP

仅当你只需要 MCP 工具、不需要插件的委派工作流和 Codex UI 入口时使用：

```sh
codex mcp add deepseek-harness -- npx --yes --package=deepseek-harness-for-codex@0.3.1 -- deepseek-harness-for-codex
```

注册完成后新建一个 Codex 任务。

## 工作原理

插件直接启动安装缓存中随包分发的 MCP 服务，不会在运行时从 GitHub `main` 分支获取代码。某个工作区首次运行任务时，MCP 服务会通过 `npx` 启动精确版本的 `@deepseek-ai/dsh web --port 0`，但不会自动打开浏览器。Codex 通过 Harness Web API 创建工作区和会话，并把对应 URL 作为可点击链接发给用户，因此用户按需打开后看到的就是 Codex 正在控制的实时任务。后续任务会复用该本地服务，不会通过托管中转服务执行。

每次运行都是异步任务：

1. Codex 使用绝对工作区路径和完整任务调用 `start_run`。
2. MCP 服务启动或复用 Harness Web，提交可见会话，并向 Codex 返回页面链接。
3. Codex 展示可点击链接；用户需要时手动打开，同时 Codex 通过 `wait_run` 或 `get_run` 跟踪同一会话。
4. Codex 检查实际 diff，并运行自己的验证流程。

## MCP 工具

| 工具 | 用途 |
| --- | --- |
| `doctor` | 默认快速检查运行时和安全配置；传入 `deep: true` 与工作区后，启动真实 DSH 回合检查凭据和 Windows 临时目录读写删除。成功必须同时存在精确成功标记和匹配的成功工具调用记录。深度检查会使用模型额度并创建本地会话数据。 |
| `start_service` | 为工作区启动或复用 Harness Web，并返回页面链接；默认不打开浏览器。 |
| `open_service` | 在用户明确要求时打开正在运行的 Harness 页面。 |
| `list_services` | 列出本地 Harness Web 服务及其 URL。 |
| `stop_service` | 停止 Harness Web 服务。 |
| `start_run` | 由 Codex 选择创建新会话或继续已完成的会话，然后提交任务。 |
| `wait_run` | 等待可见会话，单次最多 30 秒。 |
| `get_run` | 读取 Web 会话状态和助手输出。 |
| `list_runs` | 列出本地持久化运行记录；MCP 重启前仍在运行的记录会保守标记为失败并保留 `sessionId`。 |
| `cancel_run` | 取消当前 agent turn，同时保留 Web 服务。 |

`start_service` 和 `start_run` 的 `openBrowser` 默认值都是 `false`，插件也会明确传入 `false`。Codex 应把返回的 `webUrl` 渲染成可点击链接；只有用户明确要求 Codex 代为打开时，才使用 `open_service`。等待审批时运行状态为 `needs_approval` 并返回结构化审批信息；DSH 以 blocked 原因结束时状态为 `blocked`。

## 配置

| 环境变量 | 默认值 | 说明 |
| --- | --- | --- |
| `DSH_MCP_DATA_DIR` | `~/.deep-seek-harness-mcp` | 持久化各工作区的 Harness Web 设置和会话。 |
| `DSH_MCP_WORKSPACE_ROOTS` | 不限制 | `start_run` 允许使用的绝对根目录列表，使用当前平台的路径分隔符。 |
| `DSH_MCP_HARNESS_PACKAGE` | `@deepseek-ai/dsh@0.1.7-rc.2` | 启动本地 Harness 进程时使用的精确 npm 包版本。Windows 上已在 `0.1.5-rc.2`、`0.1.7-rc.2` 和 `0.2.0-rc.1` 复现部分工作区的 ACL 初始化失败；请用 deep doctor 检查具体工作区。 |
| `DSH_MCP_NPX_COMMAND` | `npx` | 自定义 `npx` 命令路径。 |
| `DSH_MCP_WEB_URL` | 未设置 | DSH 启动时打印的完整回环认证 URL；设置后连接已有服务，不再启动 DSH 子进程。 |
| `DSH_PERMISSION_MODE` | `workspace-write` | DeepSeek Harness 权限模式。 |
| `DEEPSEEK_BASE_URL` | 服务商默认值 | 可选的 DeepSeek 兼容 API 地址。 |

Harness 子进程默认关闭遥测。Web 服务只绑定回环地址并自动选择空闲端口。会话数据和 `runs-v1/` 下的逐运行索引文件保留在配置的数据目录中，便于本地审计；索引只保存 run/session/workspace 映射、状态、序号和时间戳，不保存任务文本、助手输出、审批原因、Token URL、Cookie、进程句柄或服务日志。

## 安全模型

`start_run` 是可写工具。服务端要求工作区必须是已存在的绝对路径，会解析符号链接，并通过跨平台进程启动器传递独立 argv，而不是手工拼接 shell 命令；配置值中的换行符也会被拒绝。可通过 `DSH_MCP_WORKSPACE_ROOTS` 限制允许访问的根目录；未配置时 `doctor` 会给出安全警告，相对根目录会被拒绝。Harness Web 仅监听回环地址。默认权限模式是 `workspace-write`，本项目不会静默启用不受限制的主机访问权限。

`start_run.allowedWritePaths` 可选接受工作区相对的文件或目录前缀。运行结束后插件会报告范围之外的 Git 可见变更；这是审计提示，不是强制沙箱，也不覆盖 ignored 文件。显式使用该选项时，工作区当前必须是 Git 仓库根目录。

## 会话模型

每次调用 `start_run` 时，Codex 都可以选择会话。省略 `sessionId` 会创建新的可见 Harness 会话；传入之前已完成运行返回的 `sessionId`，会继续原有对话，并且只返回本轮新增输出。运行中的会话不能被并发复用。本地 Web 服务会持续复用，直到调用 `stop_service` 或 MCP 服务退出。每条运行映射使用独立文件原子替换，多个 MCP 进程不会互相覆盖；MCP 重启后可以继续列出已完成记录，但不会持久化任务/输出文本或失效的服务 URL。

## 本地开发

克隆仓库、构建 npm 包，然后把当前仓库作为本地插件市场添加到 Codex：

```sh
npm install
npm run check
codex plugin marketplace add /absolute/path/to/deepseek-harness-for-codex
codex plugin add deepseek-harness@deepseek-harness-for-codex
```

正常安装的插件会直接启动安装缓存中的 `plugins/deepseek-harness/server.mjs`，该文件包含 MCP 运行依赖。独立 npm MCP 安装仍使用上面的精确 npm 版本。

## 发布 npm 包

本仓库将无 scope 的公共包 `deepseek-harness-for-codex` 发布到 npm 官方 registry。`npm publish` 会自动执行类型检查、测试和构建。发布包包含 `dist/`、中英文 README、演示 GIF、`LICENSE` 和包清单。

登录并确认 npm 账号：

```sh
npm login --registry=https://registry.npmjs.org/
npm whoami --registry=https://registry.npmjs.org/
```

检查发布内容、发布并验证可执行文件：

```sh
npm run release:check
npm publish
npm view deepseek-harness-for-codex version --registry=https://registry.npmjs.org/
npx --yes --package=deepseek-harness-for-codex@0.3.1 -- deepseek-harness-for-codex
```

npm 版本不能被覆盖。后续发布前，需要同步更新 `package.json`、`.mcp.json` 和 MCP 服务元数据中的版本引用，然后执行 `npm version patch`、`npm version minor` 或 `npm version major`。
