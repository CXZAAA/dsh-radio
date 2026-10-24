# DSH 电台入口 · 视觉原型

单文件、内联 CSS/JS、零外部依赖、零构建。目的是和用户讨论「入口放哪儿、长什么样、字体、频谱表现」，不是可上线实现。

## 跑起来

```bash
cd prototype
python3 -m http.server 8901
# 打开 http://127.0.0.1:8901/
```

截图都在 `shots/`，用 1440×900 视口 + Chromium headless 生成。

## 先看这几张

| 文件 | 内容 |
|---|---|
| `shots/v4-dock-thin-dark.png` | **V4 状态栏细条**，待机；与两个模拟 status pill 并排 |
| `shots/v4-dock-thin-playing.png` | **V4 播放中**，面板从胶囊向上展开 |
| `shots/v4-loading.png` | **V4 加载态**：连接中 + 呼吸频谱 |
| `shots/v1-bottom-slim-dark.png` | 压细后的 V1（待机 28 / 播放 32） |
| `shots/font-compare.png` | A/B/C 三种字体同屏对比（DEV-only） |
| `shots/v1-bottom-dark.png` | V1 底栏，深色，电台面板展开 |
| `shots/v2-dock-dark.png` | V2 composer 下方窄条，深色 |
| `shots/v3-pill-dark.png` | V3 右下角悬浮胶囊，深色 |
| `shots/v1-bottom-light.png` | V1 浅色，面板展开 |
| `shots/v1-bottom-typoB.png` | V1 字体方案 B 对比 |

## 顶部 DEV 条

产品 UI 之外的一根调试条，深色固定，不跟主题走。

| 控件 | 取值 | 作用 |
|---|---|---|
| 位置 | V1 底栏 / V2 输入框下 / V3 悬浮 / V4 状态栏 | 移动同一个电台组件，四处状态互通 |
| 主题 | 深 / 浅 | 切换 DSH 深色 / 浅色 token |
| 频谱 | 真实 / 装饰 / 关 | 真实 = AnalyserNode；装饰 = 正弦动效兜底；关 = 不渲染 |
| 字体 | A / B / C | 三套字体方案，右下角显示当前方案全名 |
| 状态 | 待机 / 加载 / 播放 / 失败 | 只切视觉四态，不启动音频、不发网络请求 |
| 面板 | 展开 / 收起 | 等价于点击播放器 |
| 对比 | A/B/C 同屏 | DEV-only，叠加三种字体的底栏与面板列表 |

位置对应的 DSH slot 是设计映射，不是已经接线的插件：

- **V1** → `shell.bottom`：顶栏 + 三栏之下的整宽一行。待机 28px，播放中 32px（原 40/60）。
- **V2** → `conversation.composer.dock`：与聊天列同宽，紧贴 composer 下方。
- **V3** → `shell.overlay`：`position: fixed` 右下角胶囊，展开为向上浮层。
- **V4** → `conversation.composer.dock`：composer 卡片下方的一行 24px 胶囊，第一个是电台，后面两个是模拟的 activity / usage pill。真实 DSH 里这一行是横向 list 槽位，本原型只是视觉模拟。

四种位置都有四态（V4 另有胶囊形态）：

- **待机**：只显示播放键 + 「电台」标签；V4 只显示播放图标 + 「电台」。
- **加载**：播放键 + 「连接中」+ 三个脉冲点；频谱低幅呼吸，不出声。完成时 180ms 淡入。
- **播放中**：暂停键 + 台名 / 来源 + 频谱 + 音量 + 展开按钮；V4 是强调色描边 + 4 根迷你频谱，音量/展开悬停才显示。
- **失败**：红点 + 「连接失败，点击重试」+ 重试键（点击重试当前台）。

## 字体方案

| 方案 | 规则 |
|---|---|
| A · DSH 原生栈 | 完全 `--dsh-font-family-text-default`，不额外加字重 |
| B · 台名/数字等宽 | 底栏台名、面板 `.st-name`、面板副标题、来源、音量数字、码率全部用 `ui-monospace, SFMono-Regular, Menlo, monospace` + `tabular-nums`，字距略加宽 |
| C · 品牌感大字 | 底栏台名与面板 `.st-name` 15px / 600，来源文字改 label-3 色 |

当前方案名同时显示在 DEV 条右侧和 URL 里，方便直接指名。

## URL 参数

DEV 条的每次切换都会 `history.replaceState` 回写 URL，可直接复制复现：

| 参数 | 值 | 说明 |
|---|---|---|
| `v` | `bottom` / `dock` / `pill` / `thin` | 投放位置（`thin` = V4 状态栏） |
| `theme` | `dark` / `light` | 主题 |
| `spec` | `real` / `decor` / `off` | 频谱模式 |
| `font` | `A` / `B` / `C` | 字体方案 |
| `state` | `playing` / `idle` / `loading` / `error` | 视觉状态；**`playing` 不代表真的在出声**，`loading` 不发起网络 |
| `panel` | `open` | 展开电台面板 |
| `station` | `chillsynth` / `nightride` / … | 当前台 |
| `settings` | `open` | 展开设置浮层（需同时 `panel=open`） |
| `compare` | `font` | DEV-only：A/B/C 字体同屏对比 |

例：

```text
http://127.0.0.1:8901/?v=bottom&theme=dark&spec=decor&panel=open&state=playing&font=A
```

## 真实播放与频谱

- 接了 4 条真实直播流：ChillSynth / Nightride / Darksynth / Spacesynth（Nightride FM）。
  点击播放键或电台行时用 `new Audio()` 播放，先设 `crossOrigin='anonymous'` 再设 `src`。
- 首次播放时创建 `AudioContext` + `AnalyserNode`（fftSize 512），14 根竖条的频率数据用 `requestAnimationFrame` 更新。
- 实测流响应：`HTTP/2 200`、`content-type: audio/mpeg`、`access-control-allow-origin: *`（curl，2026-10-23），所以 CORS + AnalyserNode 路径成立。**但没有在真实浏览器里点过播放/听过声音**，见「未验证」。
- Main Mix / Mellow Mix / EVE Radio 是占位条目，没有接 URL；点击会进入失败态，用来演示第三态。
- 音量滑杆会同步 `audio.volume`，数字在字体 B 下走等宽。

页面默认以「播放中」的**视觉态**打开，方便讨论和截图，但不会自动请求音频；点播放键才真正建立连接（受浏览器自动播放策略限制）。

截图里的频谱全部是 `spec=decor`（无用户手势、无自动播放），不是真实音频的频谱。

## 面板 / 设置

- 点播放器、展开按钮或 DEV 的「面板」打开向上浮层；点浮层外部或 Esc 关闭。
- 例外：DEV 条不算产品 UI，点它不会关闭面板，方便边切字体边看面板。
- V2 的窄条宽度与 composer 内容宽一致（760px），不占满整条聊天列。
- 7 条电台：ChillSynth、Nightride、Darksynth、Spacesynth、Main Mix、Mellow Mix、EVE Radio；来源分别为 Nightride FM / Radio Paradise / GamingNow。
- 当前台高亮，播放中显示 `LIVE` 和迷你 EQ。
- 面板右上角齿轮打开设置浮层，三个开关：系统媒体键、频谱样式、记住上次电台，标注「原型占位」。

## 占位 / 不生效

- **系统媒体键**：没有接 `navigator.mediaSession`，开关只改视觉。
- **频谱样式**：开关只改视觉；真正切频谱是 DEV 条的「频谱」。
- **记住上次电台**：没有持久化，刷新后回到默认台；URL 里的 `station` 只是当次状态。
- **Main Mix / Mellow Mix / EVE Radio**：占位，点击进失败态。
- **假外壳**：会话列表、搜索、新会话、聊天消息、工具卡、代码块、文件列表、预览缩略图、发送消息都是静态假数据；搜索/输入/发送不会产生真实行为。
- DEV 条的「待机/加载/播放/失败」只切视觉；要真的出声必须点播放。
- `loading` 的脉冲是 1.2s 循环，不是需求文字里的 60ms（60ms 会变成频闪）。
- `settings=open` 只用于截图/调试，不是产品能力。

## 视觉 token 来源

抄自：

```text
/home/Henri/.nvm/versions/node/v22.23.2/lib/node_modules/@deepseek-ai/dsh/node_modules/@deepseek-ai/dsh-client-ui-theme/lib/client.js
```

- base 字体栈/圆角：约 L1407（`base_css_default`）。
- 深浅两套 alias：约 L1413（`design_platform_css_default`，`body` 是浅色，`body[data-ds-dark-theme]` 是深色）。

主要抄录值（深色 / 浅色）：

- 背景：`--dsw-alias-bg-base` `#151517` / `#fff`；layer-1/2/3 `#232324`、`#2c2c2e`、`#353638` / 均为 `#fff`；sidebar `#1b1b1c` / `#f9fafb`。
- 文本：primary `#f9fafb` / `#0f1115`；secondary `#cfd3d6` / `#61666b`；tertiary `#adb2b8` / `#81858c`；caption `#81858c` / `#adb2b8`。
- 边框：l1 `#ffffff0f` / `#0000000a`；l2 `#ffffff1f` / `#0000001a`；l3 `#ffffff29` / `#0000001f`；l4 `#ffffff33` / `#00000029`。
- 强调：deepseek-450 `#5686fe` / deepseek-500 `#4176e6`；失败态 `#f25a5a` / `#ec1313`。
- 圆角：`4 / 8 / 12 / 16 / 20 / 28`；字体栈、代码栈照抄。
- 浅色主题不是推断：DSH 两套 alias 都有定义。只有浮层阴影强度是推断，代码注释里已标「推断」。

## 未验证 / 限制

- 未在真实 DSH Web GUI / 插件 slot 中挂载，slot 名是设计映射；V4 的 activity / usage pill 是静态假数据，真实 `conversation.composer.dock` 的 slot API、样式和溢出行为未验证。
- V4 的 loading→playing 真实链路（canplay/playing）只做了代码实现，未在浏览器里实际点播验证；DEV 状态按钮和截图都是纯视觉。
- 真实音频播放和真实频谱未在浏览器里人工验证（headless 无用户手势，自动播放会被拦）；只验证了流本身返回 `audio/mpeg` + ACAO `*`。
- 只在 Chromium / 1440×900 下截图；没有做移动端、Safari、Firefox 验证。代码用到 `color-mix()`，需要较新的浏览器。
- 面板覆盖右栏是 `shell.overlay` 的预期行为；V1/V2 的面板定位是贴着播放器向上，未做视口边界碰撞检测。
- 调试服务只用于截图，结束已关闭。
