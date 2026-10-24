# 内置电台可达性实测

测量目标：确定预置电台在**中国大陆移动网络**下能否播放、首声多快，并据此决定每个电台条目最终使用的流地址。

## 结论（2026-10-23 22:12）

在 iPhone + 中国联通 5G（出口 `123.158.254.242`，浙江绍兴，AS4837 China169）上，7 条流**全部可播放**：

| 电台条目 | 流地址 | 首声 |
| --- | --- | --- |
| ChillSynth | `https://stream.nightride.fm/chillsynth.mp3` | 5.4s |
| Nightride | `https://stream.nightride.fm/nightride.mp3` | 3.1s |
| Darksynth | `https://stream.nightride.fm/darksynth.mp3` | 1.8s |
| Spacesynth | `https://stream.nightride.fm/spacesynth.mp3` | 2.0s |
| Main Mix | `https://stream.radioparadise.com/aac-320` | 4.4s |
| Mellow Mix | `https://stream.radioparadise.com/mellow-128` | 3.8s |
| EVE Radio | `https://media01.gamingnow.net:8010/erweb.mp3` | 6.7s |

结论：**可达性不是问题，首声是问题**。1.8–6.7 秒的等待必须靠预缓冲和码率选择来压。

测量方法：手机开 Tailscale 访问 NAS 上的探测页，页面由 NAS 提供、音频流由手机自己的网络直连，因此测到的是手机所在网络（大陆）的真实表现。原始页面见 `probe/index.html`。

## 流的技术属性（2026-10-23 实测）

| 属性 | Nightride FM | Radio Paradise | EVE Radio |
| --- | --- | --- | --- |
| 容器/编码 | MP3 320；另有 Ogg/Opus | AAC 320 / AAC 128 / MP3 128 | MP3 256（Icecast 2.4.4） |
| `Access-Control-Allow-Origin` | `*` | `*` | `*` |
| HTTPS | 是 | 是 | 是（8010）；另有 http（8000） |
| HLS | **没有**（`.m3u8` 全部 404） | 没有 | 没有 |

全部是渐进式流，浏览器可直放，不需要 hls.js，也不需要服务端代理。

## 已知问题

- **Nightride 没有低码率 mp3**，只有 320k mp3 与 Opus/Ogg。iOS Safari 不认 Ogg 容器，所以无法靠降码率提速，只能靠预缓冲。
- **EVE Radio 的 8010 端口**在本机复测 3/3 正常，但曾出现一次超时，属偶发；`http://media01.gamingnow.net:8000/er.mp3` 可用作备用。注意：若将来把 dsh 部署在 https 下，http 备用流会被混合内容策略拦掉。
- **SomaFM 在本机不可用**（`ice1/2/4/5/6.somafm.com` 全部 302 到 `somafm.com/alert.mp3`，不带 Range 时 403），因此不能作为备选来源。

## 待办

- 码率/地址变体对比：`probe/variants.html`（AAC 320 vs 128、MP3 128、Opus、EVE 8000/8010，以及预缓冲实验）。结果回来后更新本文件并冻结流地址。

## 预置电台的来源

7 个名字与流地址逐字来自 NousResearch/hermes-agent 的 Radio 插件（PR #107072，`apps/desktop/src/plugins/radio/plugin.js`），本项目按同源清单复刻，并修正了其中 `Mellow Mix` 的 Ogg-FLAC 地址（浏览器兼容性差，改为 AAC 128）。
