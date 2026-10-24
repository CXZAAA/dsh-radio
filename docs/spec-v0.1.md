# v0.1 规格（实现任务书）

## 目标

一个 dsh 客户端插件：在 Web GUI 的状态行里提供电台入口，点一下播放内置电台，支持切换、音量、暂停与记忆。面向公开分享（GitHub），中文界面 + 英文文案。

## 范围

做：7 个内置电台、状态行单槽位、播放/暂停/下一台/切台/音量、预缓冲、失败重试、MediaSession 开关、明暗主题、状态记忆、当前曲目（见 ADR-0003）。
不做：自定义电台、定时关闭、录音、歌词、多语言之外的本地化。

## 内置信道（顺序即列表顺序）

| 名称 | 来源 | 主地址 | 备用地址 |
| --- | --- | --- | --- |
| ChillSynth | Nightride FM | `https://stream.nightride.fm/chillsynth.mp3` | — |
| Nightride | Nightride FM | `https://stream.nightride.fm/nightride.mp3` | — |
| Darksynth | Nightride FM | `https://stream.nightride.fm/darksynth.mp3` | — |
| Spacesynth | Nightride FM | `https://stream.nightride.fm/spacesynth.mp3` | — |
| Main Mix | Radio Paradise | `https://stream.radioparadise.com/aac-320` | `https://stream.radioparadise.com/aac-128` |
| Mellow Mix | Radio Paradise | `https://stream.radioparadise.com/mellow-128` | `https://stream.radioparadise.com/mellow-320` |
| EVE Radio | GamingNow | `https://media01.gamingnow.net:8010/erweb.mp3` | `http://media01.gamingnow.net:8000/er.mp3`（仅 http 页面可用） |

所有流 HTTPS（EVE 备用除外）、`Access-Control-Allow-Origin: *`、渐进式（无 HLS）。数据以 `src/client/stations.ts` 为准。

## 音频内核

- 单例 `HTMLAudioElement`，全局复用；切换电台时 `pause()` → 改 `src` → `load()` → `play()`。
- `crossOrigin = 'anonymous'`（频谱要用 Web Audio）。
- 预缓冲：**只预热一条**——上次播放的电台（无记录则 ChillSynth）。`preload='auto'`，不 `play()`；用户点播放时复用该元素。
- 失败处理：`error` 或 12 秒未 `playing` → 若有备用地址则切备用（静默）；仍失败 → 进 `error` 态，显示「连接失败，点击重试」。
- 播放中再次点击同一台 → 暂停（暂停后保留 `src`，恢复时 `play()`，不做 seek）。
- 下一台：按 7 条列表顺序 +1 取模（末尾回到第一台），停旧流 → 改 `src` → `load()` → `play()`，不等用户再点播放。
- 切台必须先停旧流，禁止叠音。
- 音量 0–1，持久化；`muted` 单独持久化。

## 状态机

`idle → loading → playing ⇄ paused`，任意态 `→ error → loading`。
- `loading`：点击后立即进入，显示三点脉冲（1.2s 循环）与低幅呼吸频谱。
- `playing`：`playing` 事件后进入；频谱 180ms 淡入。
- `paused`：用户暂停；收起态仍是完整结构（播放图标 + 下一台 + 台名 + 静止矮柱频谱）。
- `error`：红点 + 「连接失败，点击重试」；点击播放键或文案重试。
- `idle`：从未播放过或停止；显示播放图标、当前台名与静止矮柱频谱。

## 界面

视觉基线：`design/directions/b.html`（唯一视觉真相源）。要点：

- 唯一位置：`conversation.composer.dock` 里的 24px 胶囊（`id: 'radio'`，`order: -1`），与 `activity`/`usage` 两个状态胶囊同高；字号 11px/500。
- 收起态从左到右固定为四段：播放/暂停按钮 → 下一台按钮（14px 双三角+竖线，1.5px 描边）→ 台名（始终显示，不再显示「电台」）→ 频谱（靠右）。不设「播放中」强调点；加载时台名旁三点脉冲。
- 频谱：收起态 28 根强调色小方柱，1.5px 宽、2px 间距、高 3–14px、总宽约 95px；面板内 56 根，横跨约 328px 内容宽、高 4–20px，放在电台列表下方、音量条上方（上下留 9px）。只用柱体颜色，不加发光/渐变；透明度与高度都随幅度（0.35–1）。取真实 `AnalyserNode` 数据（`sampleRealSpectrum()`），`decor` 用装饰动画，`off` 不渲染。
- 面板 360px 宽，向上弹出，距状态行 6px；行高 28px；来源列右对齐 10px；当前行左侧 2px 灰线 + 台名提亮；无色块。右上角 12px、1.4px 描边的 8 齿齿轮。
- 面板底部紧凑一行：左侧播放/暂停 + 下一台；右侧喇叭图标（点击静音，muted 带斜线）+ 112px 细轨滑杆 + 百分比，不占满面板宽度。
- 只用 `--dsw-*` 主题变量，不硬编码颜色（失败红除外，取主题 danger 变量，没有就 `#E5484D`）。
- 明暗主题都成立。
- CSS 通过 `<style data-dsh-radio>` 注入，插件卸载时移除。

## 当前曲目

- 位置：面板内频谱带下面、音量行上面，单行高 20px，左右 padding 与频谱带共用 `--dsh-radio-panel-pad`（16px），避免两处各写一个值后漂移。
- 样式：10.5px、`--dsw-alias-label-tertiary`、单行省略号；左侧一个 11px 的 ♪（视觉标记，`aria-label` 用「正在播放」/「Now playing」）。
- 文案：有 artist 时 `Artist — Title`，只有 title 时直接显示 title；无数据时**整行不渲染**。
- 数据：Nightride 直读 Icecast stats；RP 读同源宿主路由；EVE 因无元数据不显示。
- 轮询：仅 `playing` 时每 20 秒；切台立即拉、暂停/待机/失败停止、页面隐藏暂停、恢复可见重拉；切台先清空上一台。
- 缓存：客户端 15 秒（按电台，失败保留上次成功值）；宿主 10 秒（按 RP chan）。

## 设置（面板右上角齿轮）

- 系统媒体键：开 / 关（默认开）
- 频谱样式：真实 / 装饰 / 关闭（默认真实）
- 记住上次电台：开 / 关（默认开）

## MediaSession

开启时 `navigator.mediaSession.metadata` 设置电台名与来源，绑定 `play`/`pause`/`stop`；播放状态同步 `playbackState`。关闭时清空 metadata 与 handler。

## 持久化键

`dsh-radio:lastStation`、`dsh-radio:volume`、`dsh-radio:muted`、`dsh-radio:settings`（JSON：mediaKeys/spectrum/remember；旧数据里的 placement 忽略不报错）。

## 槽位挂载

- 只注册到 `conversation.composer.dock`（`id: 'radio'`，`order: -1`）；不再注册 `shell.bottom` / `shell.overlay`。
- 组件之间共享模块级 store（`useSyncExternalStore`），音频与设置状态唯一；`nextStation()` 也在 store 里。

## 工程

- 包名 `dsh-plugin-radio`，`type: module`，`exports['./client'] = ./lib/client.js`，`dsh.client = { platform: 'web', inject: [], external: ['react','react-dom/client'] }`；react/react-dom 只放 devDependencies。
- 构建：把 `src/client/index.ts` 打成单文件 `lib/client.js`，格式必须是 `window.__ModuleLoader__.load({ id: 'dsh-plugin-radio', factory: (require) => { ... } })`；`react`、`react-dom/client` 通过 factory 的 `require` 取，不打进包。
- 技术栈：TypeScript + React 18（`React.createElement`，不用 JSX 运行时以外的依赖）。
- 宿主半侧：`export const name = 'dsh-plugin-radio'`、`inject = ['webServer']`，用 `ctx.effect` + `ctx.webServer.register({ kind: 'exact', path: '/plugins/dsh-plugin-radio/now-playing', handler })` 注册只读路由；`station=main-mix|mellow-mix` → RP `chan=0|1`，5 秒超时，10 秒缓存，失败 502。宿主改动不热更新，需重启 dsh。
- 轻量测试：`node:test` 校验 stations 数据（7 条、https、无 m3u8、主备不重复）、设置解析、Icecast/RP 解析与缓存、宿主路由（GET/POST/未知台/502/10 秒缓存）。
- 安装脚本 `scripts/install-local.sh`：优先 `dsh plugin --profile web add link:<repo>`，失败时回退到 `pnpm add link:<repo>`；幂等地往 `~/.dsh/profiles/web/cordis.patch.yml` 追加 loader 行（文件不存在时先创建），并打印重启提示。
- 组合包声明：`dsh.bundle.patch = ./cordis.patch.yml`，patch 内容为插入 `id: radio` / `name: dsh-plugin-radio` 一行；`files`/`exports` 需包含该文件。这样 dsh 的「插件 → 添加插件」可直接从 GitHub 仓库地址安装并自动启用。

## 验收

见 `docs/acceptance.md`。

## 参考

`radio-plugin-feasibility.md`（插件机制与构建格式）、`design/BRIEF.md`（设计基线）、`design/directions/b.html`（视觉）、`prototype/index.html`（交互与状态）、`docs/network-probe.md`（流事实）、`docs/adr/0003-now-playing-metadata.md`（曲目来源与 RP 代理）。
