/**
 * 「当前曲目」解析：两条有效来源、15 秒进程内缓存。
 *
 * - Nightride FM：Icecast `status-json.xsl`，CORS `*`，浏览器直读。
 * - Radio Paradise：同源宿主路由 `/plugins/dsh-plugin-radio/now-playing`
 *   （RP 官方接口只允许自家 Origin，浏览器直读被 CORS 拦）。
 * - EVE Radio：无元数据（title 恒为 `Unknown`），直接返回 null、不发请求。
 *
 * 由 store 在 `playing` 时轮询、切台时立即拉一次；失败返回 null 且不弹错、不写 console。
 */
import type { Station } from './stations.ts';

export interface Track {
  readonly artist?: string;
  readonly title: string;
}

export interface NowPlaying extends Track {
  readonly stationId: string;
}

const NIGHTRIDE_STATUS = 'https://stream.nightride.fm/status-json.xsl';
const RP_ROUTE = '/plugins/dsh-plugin-radio/now-playing';

/** Nightride 四个台的 channel（与流地址里的文件名一致）。 */
const NIGHTRIDE_CHANNELS: Readonly<Record<string, string>> = {
  chillsynth: 'chillsynth',
  nightride: 'nightride',
  darksynth: 'darksynth',
  spacesynth: 'spacesynth',
};

/** 面板电台 id → 宿主路由的 `station` 参数（RP chan 映射的对外名字）。 */
const RP_CHANNELS: Readonly<Record<string, string>> = {
  main: 'main-mix',
  mellow: 'mellow-mix',
};

const CACHE_MS = 15_000;

interface CacheEntry {
  readonly at: number;
  readonly track: Track;
}

const cache = new Map<string, CacheEntry>();

/** 测试用：清掉跨用例的 15 秒缓存。 */
export function clearNowPlayingCache(): void {
  cache.clear();
}

function sourcesOf(json: unknown): ReadonlyArray<Record<string, unknown>> {
  if (typeof json !== 'object' || json === null) return [];
  const icestats = (json as Record<string, unknown>).icestats;
  if (typeof icestats !== 'object' || icestats === null) return [];
  const source = (icestats as Record<string, unknown>).source;
  if (Array.isArray(source)) {
    return source.filter(
      (entry): entry is Record<string, unknown> => typeof entry === 'object' && entry !== null,
    );
  }
  if (typeof source === 'object' && source !== null) return [source as Record<string, unknown>];
  return [];
}

function trackFromTitle(title: unknown): Track | null {
  if (typeof title !== 'string') return null;
  const trimmed = title.trim();
  if (trimmed === '' || trimmed.toLowerCase() === 'unknown') return null;
  return { title: trimmed };
}

/** 在 Icecast stats 里按 `listenurl` 片段找源；多源、缺字段都安全。 */
export function parseIcecast(json: unknown, listenUrlPart: string): Track | null {
  for (const source of sourcesOf(json)) {
    const listenurl = source.listenurl;
    if (typeof listenurl !== 'string' || !listenurl.includes(listenUrlPart)) continue;
    return trackFromTitle(source.title);
  }
  return null;
}

/** 宿主路由的响应：只认 `ok === true` 且有 title 的情况。 */
export function parseNowPlayingResponse(json: unknown): Track | null {
  if (typeof json !== 'object' || json === null) return null;
  const record = json as Record<string, unknown>;
  if (record.ok !== true) return null;
  const title = typeof record.title === 'string' ? record.title.trim() : '';
  if (title === '' || title.toLowerCase() === 'unknown') return null;
  const artist = typeof record.artist === 'string' ? record.artist.trim() : '';
  return artist === '' ? { title } : { artist, title };
}

export interface ResolveDeps {
  readonly fetch?: typeof fetch;
  /** 测试用假时钟；默认 `Date.now`。 */
  readonly now?: () => number;
}

async function getJson(
  url: string,
  signal: AbortSignal,
  fetchImpl: typeof fetch,
): Promise<unknown> {
  const response = await fetchImpl(url, { signal, headers: { accept: 'application/json' } });
  if (!response.ok) return null;
  return response.json() as Promise<unknown>;
}

async function fetchTrack(
  station: Station,
  signal: AbortSignal,
  fetchImpl: typeof fetch,
): Promise<Track | null> {
  const nightride = NIGHTRIDE_CHANNELS[station.id];
  if (nightride !== undefined) {
    return parseIcecast(await getJson(NIGHTRIDE_STATUS, signal, fetchImpl), `${nightride}.mp3`);
  }

  const rp = RP_CHANNELS[station.id];
  if (rp !== undefined) {
    const url = `${RP_ROUTE}?station=${encodeURIComponent(rp)}`;
    return parseNowPlayingResponse(await getJson(url, signal, fetchImpl));
  }

  // EVE 的 Icecast title 恒为 `Unknown`，ADR-0003 决定不显示；这里直接返回 null，
  // 不再发请求，免得每 20 秒白打一次接口。
  return null;
}

/**
 * 取当前台曲目。同一台 15 秒内复用上次成功结果；网络/解析失败一律返回 null，
 * 由调用方保留上一次显示值。切台由调用方清空并中止旧请求。
 */
export async function resolveNowPlaying(
  station: Station,
  signal: AbortSignal,
  deps: ResolveDeps = {},
): Promise<Track | null> {
  const now = deps.now ?? Date.now;
  const cached = cache.get(station.id);
  if (cached !== undefined && now() - cached.at < CACHE_MS) return cached.track;

  const fetchImpl = deps.fetch ?? globalThis.fetch;
  try {
    const track = await fetchTrack(station, signal, fetchImpl);
    if (track === null) return null;
    cache.set(station.id, { at: now(), track });
    return track;
  } catch {
    // 中止、断网、CORS、坏 JSON：都当作「这台暂时没有曲目」。
    return null;
  }
}
