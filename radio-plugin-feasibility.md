# DSH Web GUI 客户端 UI 插件机制调查报告（网络电台播放器可行性）

路径前缀：`INS=/home/Henri/.nvm/versions/node/v22.23.2/lib/node_modules/@deepseek-ai/dsh/node_modules/@deepseek-ai`
（权威安装副本，v0.2.1-rc.2；`~/.dsh/profiles/node_modules/@deepseek-ai/*` 里是指向它的符号链接，部分是悬空链）

## 1. 插件类型与结构
- 只有一个模型：cordis 插件包。同一 package.json 可同时带 node 半（`main`）和浏览器半（`exports["./client"]`）；所谓 client plugin = 带 `dsh.client.platform: "web"` 声明的包（`INS/dsh-client-modules/README.zh.md:38`）。
- 真实最小样例：`INS/dsh-experimental-client-ui-voice-input/package.json` — `type: module`、`exports["./client"]={default:"./lib/client.js"}`、`dsh:{client:{platform:"web", inject:[…包名], external:[…]}}`。`dsh.client.inject` 是"信息性依赖/加载顺序"，不是 cordis 服务注入（`INS/dsh-package-manifest/lib/types/types.d.ts:79-80`）。
- 安装位置：没有 `~/.dsh/plugins`（确认不存在）。插件装进 profile 目录 `~/.dsh/profiles/web/`，pnpm workspace root、`nodeLinker: hoisted`（`~/.dsh/profiles/web/pnpm-workspace.yaml`），第三方包落在 `~/.dsh/profiles/web/node_modules/`。@deepseek-ai/* 由 `~/.dsh/profiles/node_modules/` 符号链接解析到安装目录。
- 启用/禁用：Loader 行，写在 `~/.dsh/profiles/web/cordis.patch.yml`（`- insert:` 新行 / `disabled: true` 关行，样式见该文件 214-221 行）；GUI「设置→插件」等价写入；CLI `dsh plugin --profile web <pnpm args>`（`INS/dsh/README.zh.md:18`）。`dsh.profile.bundles` 只是分层包清单，普通插件不需要改它。

## 2. UI 扩展点（关键结论：能做，底栏空闲）
- 权威 slot 目录是机器可读的 100 条表，在 `INS/dsh-cordis-client-runner/lib/client.js`（2871 行起），每条含 key/kind/scope/summary/occupants/replaceRisk/example/source。
- **`shell.bottom`（single, root，catalog:5374）= 三栏下方整行**，正是"页脚/底栏"：`INS/dsh-client-ui-layout/lib/client.js:346-347`（渲染 `data-shell-bottom`）、`:639`（声明）。占满宽度，高度由占用者决定，空内容不占位，切主面板不卸载（`INS/dsh-client-ui-layout/README.zh.md:34`）。
- 底栏没有内置占用者：默认组合不使用（layout README:34）；唯一 occupant 是未启用的 experimental-inspector（catalog:5389 附近 `occupants`），replaceRisk=`shadows-shipped-ui`。用户当前 web profile 未启用它 → **可用**。
- 官方注册写法（catalog:5400 的 example 原文）：`ctx.slots.inject('shell.bottom', () => ctx.slots.register({ name: 'shell.bottom' }, Component))`。
- 备选位（都空着）：`conversation.input.right`（list, session，提交按钮前的紧凑控件，catalog:3670）、`conversation.composer.dock`（list，composer 卡片下方常驻条，已被 chat 的 ActivityPill/UsagePill 占两位，catalog:2958）、`conversation.input.left`（3400）；`conversation.input.activity` 已被语音输入占用（3260）。
- 浮层：`shell.overlay`（list, root，覆盖整框架、在各列滚动容器之外，catalog:5432；渲染 `layout/lib/client.js:313`）。插件也可自行 portal 到 body（`INS/dsh-client-ui-jobs/README.zh.md:26` 用固定定位 MenuSurface）。侧栏底部：`sidebar.footer.action`（list, root, catalog:5651，已被 CordisPanel 占一位）。

## 3. 客户端运行时 API
- 框架 = **React 18**（插件把 react/react-dom 当 devDependency，如 `INS/dsh-client-ui-model-selection/package.json:56`）；shell 通过冻结的静态模块表提供同一份实例（`INS/dsh-client-ui-renderer/README.zh.md`「身份」节）。平台种子表实测含 `react`、`react-dom/client`、`cordis`、`@deepseek-ai/dsh-client-ui-primitives`、`@deepseek-ai/dsh-client-store`（`INS/dsh-web-frontend/dist/assets/index-*.js` 内可 grep 到这些 id；第三方 `~/.dsh/profiles/web/node_modules/@botharness/ui/lib/client.js` 就直接 `require("react")` / `require("@deepseek-ai/dsh-client-ui-primitives")`）。
- 注册：`ctx.slots.inject(name, () => ctx.slots.register({name, key?, id?, locale, children?, inject: () => props}, Component))`；组件 props 由 `PropsRuntime<'slot'>` 派生（`INS/dsh-client-ui-model-selection/README.zh.md:54`）。React 无 `h`，用 `React.createElement`。
- 数据/状态：slot 标准 props 含 `useSessions/usePanelInfo/useResource/useWorkspaces/useSessionStatus/useSessionAccess…`（catalog:5381-5391）；状态用 cordis 服务 + 插件自带 store（平台表有 dsh-client-store）；事件总线 = `ctx.on/emit`（如 `theme/change`，`layout/lib/client.js:702`）。
- 主题：`--dsw-*` token 定义在 `body`（含深色覆盖），`INS/dsh-client-ui-theme/lib/client.js:1413`；`ctx.theme.getTheme()` 拿快照，第三方主题可用 `ctx.theme` 注册别名 token（theme README「注册主题」）。
- CSS 注入：可。插件把 CSS 字符串写成 `<style>` 插 head，HMR 卸载时移除（`@botharness/ui/lib/client.js:62049-62055`）。localStorage：可（同上 6983/47180）。

## 4. 音频播放（关键结论：能做）
- **页面没有 CSP**：index 与静态资源只写 `content-type`（`INS/dsh-host-frontend-static/lib/index.js:73`）；`INS/dsh-web-frontend/dist/index.html` 无 CSP meta。全发行包里 CSP 只有 3 处且与主文档无关：HTML 产物响应 `sandbox; default-src 'none'`（`INS/dsh-api-session-controller/lib/index.js:2428`）、文档预览 iframe 自己的 `media-src data: … connect-src 'none'`（`INS/dsh-client-ui-sidebar-documentpreview/lib/client.js:4244`）。→ 远程 mp3/aac 的 `media-src`/`connect-src` 无限制。
- Web Audio 在客户端插件里已被实际使用：`new AudioContext()`（`INS/dsh-experimental-client-ui-voice-input/lib/client.js:1555`）、`OfflineAudioContext`（:1651）。`new Audio()`/`<audio>` 同理不受限（无 CSP 即默认放开）。
- autoplay：仓库内无任何 autoplay 处理代码（仅 documentpreview iframe 有 `autoplay` 属性）；浏览器默认策略要求用户手势 —— 点按钮触发即满足。页面是 `http://127.0.0.1:3080`（环回 http），播 https 流不存在混合内容问题。
- 未找到 mediaSession / 现成播放器实现。

## 5. 开发与发布
- 浏览器半产物格式固定为注册式 CJS：`window.__ModuleLoader__.load({ id: "<包名>", factory: (require) => {...} })`（`@botharness/ui/lib/client.js:1-4`；宿主侧协议 `INS/dsh-client-modules/lib/index.js:461-480`）。用 tsdown/esbuild/rolldown 打成一个 `lib/client.js`（CSS 可内联），运行时由 `/plugins/<id>/client.js?rev=` combo 提供；基座外依赖写 `dsh.client.external`。
- 热重载：`client-hmr` 在 web 组合里常驻（`INS/dsh-web-app/cordis.patch.yml:217-219`），host 半按 500ms 轮询 bundle mtime 并推 `/plugins/events`，重建后自动替换进已打开页面（`INS/dsh-client-hmr/README.zh.md:28,42`；副作用：插件内 React 状态丢失）。用户跑的是安装版 `dsh web`（systemd），**不需要** `pnpm run dev:web`（那只在 DSH 源码 checkout 里做重建 watcher 用）；自己跑一个 `tsdown --watch` 重建 `lib/client.js` 即可热生效。
- 新增插件行/依赖：`dsh-hmr` 已启用（`INS/dsh-base/cordis.patch.yml:28-29`），patch 层变更可热重组合（`INS/dsh/README.zh.md:37`）；插件管理器在拿不到 hmr 服务时返回 `restart-required`（`INS/dsh-plugin-manager/lib/index.js:2380-2384`）。实践上首次装包仍建议 `sudo systemctl restart dsh-web` + 刷新页面（`~/.dsh/memory/dsh-frontend-custom.md`）。
- 已知踩坑（本机经验，`~/.dsh/memory/dsh-frontend-custom.md`）：client 插件必须作为 npm 包安装（ESM 不支持目录导入，单文件 .mjs 只适用 host 插件）；cordis 同名服务不能重复 provide。

## 6. 既有先例
- 仓库内可当模板：`INS/dsh-experimental-client-ui-voice-input`（工具条 seat + 展开面板 + Web Audio，最贴近）；`INS/dsh-client-ui-jobs`（头部控件 + body 固定定位菜单）；`INS/dsh-client-ui-model-selection`（最小 slot 注册示例）；`INS/dsh-client-ui-open-in-app`（外部应用/目录打开）；`INS/dsh-client-ui-cordis`（侧栏底部小部件）；`INS/dsh-client-ui-schedule`。
- 本机第三方 client 插件：`~/.dsh/profiles/web/node_modules/@botharness/ui`（`shell.overlay` + `sidebar.panellist` + localStorage + `<style>`，v1.2.0，可读作真实成品样例）、`@botharness/im-provider`、`@dsh-external/dsh-super-injector`。
- 状态栏小部件：无通用组件；最接近的是 composer 下方 ActivityPill/UsagePill 与 `sidebar.footer.action`。媒体播放器：无先例。

## 最小可行插件骨架（文件清单，不贴代码）
```
dsh-radio/
├─ package.json        # name/version/type:module；exports{"./client":{default:"./lib/client.js"}}；
│                      # dsh.manifestVersion:1；dsh.client:{platform:"web", inject:[], external:[]}；
│                      # files:["lib/client.js"]；react/react-dom 只放 devDependencies
├─ tsdown.config.ts    # 把 src/client 打成单个 lib/client.js（CJS-factory + window.__ModuleLoader__.load 包装）
├─ src/client/index.ts # export name / inject:["slots"] / apply(ctx)：
│                      #   ctx.slots.inject("shell.bottom", () => ctx.slots.register({name:"shell.bottom"}, RadioBar))
├─ src/client/RadioBar.tsx  # React 组件（createElement）：按钮 + 展开条；持有 new Audio() 单例与内置电台表
├─ src/client/stations.ts   # 固定电台 {id, name, url, codec}
├─ src/client/styles.ts     # CSS 字符串（用 --dsw-alias-* 变量），apply 里插 <style data-dsh-radio>
├─ src/client/locales.ts    # 可选：zh 事实源 + en
└─ lib/client.js            # 构建产物，必须存在，否则该行激活直接失败
```
安装：包放进 `~/.dsh/profiles/web/node_modules/`（或 `pnpm add` 到该 profile），再在 `~/.dsh/profiles/web/cordis.patch.yml` 加一行 `- insert: [{ id: radio, name: dsh-radio }]`，重建 client bundle 后热生效（首装建议重启 dsh-web）。

## 不确定 / 未查到
- 没有在浏览器里实测播放：`dsh web` 用签名 cookie 鉴权，curl 401（`INS/dsh-client-connection/lib/index.js:566-577`），本会话无法无头验证。"无 CSP"结论来自源码（服务端只写 content-type、index.html 无 meta）。
- 未查 Desktop(Electron) 壳是否另加 CSP；本机跑的是 web。
- `@deepseek-ai/dsh-client-ui-primitives` 只以平台种子模块形式存在，没有独立包目录，组件导出清单未能核实（README 在 profiles 下是悬空链）。
- `shell.bottom` 是 single：若将来启用 experimental-inspector profile 会与之冲突。
- `~/.dsh/profiles/web/package.json` 的 dependencies 只剩 modlens，但 node_modules 里有 @botharness/* 等 → 安装状态与清单不一致，实际启用以 patch 为准，未逐一核对。
