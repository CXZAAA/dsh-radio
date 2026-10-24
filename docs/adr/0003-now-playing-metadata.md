# 0003 — 当前曲目元数据：三条来源，RP 走宿主代理

状态：已采纳（2026-10-24）

## 背景

ADR-0001 决定音频由浏览器直放，v0.1 不显示曲目。用户现在要「当前曲目」，但不想引入音频代理，也不想为此增加常驻进程或凭据。三条来源的实测事实（`docs/network-probe.md` 之外的本轮验证）：

| 电台 | 接口 | 浏览器可直读 | 元数据 |
| --- | --- | --- | --- |
| Nightride FM（4 台） | `https://stream.nightride.fm/status-json.xsl` | 是，`Access-Control-Allow-Origin: *` | `icestats.source[].title`，如 `Shadowrunner - Shidoshi` |
| EVE Radio | `https://media01.gamingnow.net:8010/status-json.xsl` | 是，CORS `*` | `title` 恒为 `Unknown`（无元数据） |
| Radio Paradise（2 台） | `https://api.radioparadise.com/api/now_playing?chan=N` | **否**，只回 `Access-Control-Allow-Origin: https://radioparadise.com` | `artist` / `title` / `album` |

## 决定

1. **只代理元数据，不代理音频**：音频仍按 ADR-0001 由 `<audio>` 直放；宿主只增加一条只读 JSON 路由 `GET /plugins/dsh-plugin-radio/now-playing?station=main-mix|mellow-mix`。
2. **Nightride / EVE 浏览器直读** Icecast stats，不经过宿主。
3. **RP 的两个台经宿主路由读上游**：RP 的 CORS 白名单逼的。宿主路由只做三件事——白名单映射、5 秒超时上游请求、进程内缓存；不转发音频、不写文件、不读任何凭据。
4. **EVE 不显示曲目**：接口可用但无有效 title，前端把 `Unknown`/空串当无数据，整行不渲染。
5. **轮询 20 秒，两层缓存**：
   - 宿主层 10 秒缓存（按 `chan`），避免多客户端/频繁轮询打上游；
   - 客户端 15 秒缓存（按电台），切台/恢复可见时立即拉一次，失败保留上一次成功值。

## RP `chan` 映射的验证

映射假设：`main-mix → chan=0`，`mellow-mix → chan=1`。

2026-10-24 实测（带 `Origin: https://radioparadise.com` 请求 API，同时以 `Icy-MetaData: 1` 读取两条流的 `StreamTitle`）：

- `chan=0` → `The Bee Gees — Lonely Days`（album *Their Most Beautiful Love Songs*）
- 主流 `stream.radioparadise.com/aac-320` 的 `StreamTitle='The Bee Gees - Lonely Days'` —— 一致
- `chan=1` → `Xavier Rudd — Home`（album *Dark Shades Of Blue*）
- Mellow 流 `stream.radioparadise.com/mellow-128` 的 `StreamTitle='Xavier Rudd - Home'` —— 一致

因此 `chan=0 = Main Mix`、`chan=1 = Mellow Mix` 已由流元数据交叉确证。映射写在 `src/index.ts` 的 `CHANNELS` 与 `src/client/nowPlaying.ts` 的 `RP_CHANNELS`。

## 后果

- 宿主半侧从空 `apply` 变成真插件：`inject = ['webServer']`，路由随 effect 生命周期注册/释放。**宿主改动不能热更新，必须重启 dsh**。
- 宿主路由只接受 `GET`/`HEAD`：非 `GET`/`HEAD` 返回 `405`（带 `allow: GET, HEAD`），未知 station 返回 `400`；上游任何失败统一 `502 {"ok":false}`，不泄露错误细节。
- RP 曲目最多滞后约 10 秒（宿主缓存）+ 15 秒（客户端缓存）+ 20 秒（轮询）。
- 分享部署时不需要额外服务或密钥；RP 可达性取决于宿主机网络。
- 若 RP 更改 CORS 或接口路径，只有宿主路由需要改，客户端不用动。

## 备选与否决理由

- **主进程代理全部元数据**：能统一实现，但 Nightride/EVE 已允许浏览器直读，多一跳没有收益。
- **浏览器直读 RP 接口**：被 CORS 拦，且不能靠 `no-cors` 读到 JSON。
- **第三方元数据服务**：多一个依赖与单点，且没有必要。
- **把 RP 音频也代理回同源**：只为元数据没有必要，且会引入长连接、背压与带宽成本，违反 ADR-0001 的边界。
