/**
 * 宿主半侧：只做一件事——把 Radio Paradise 的「当前曲目」转成同源 JSON。
 *
 * RP 的 now_playing 接口只允许 Origin `https://radioparadise.com`，浏览器直读会被
 * CORS 拦下（见 docs/adr/0003-now-playing-metadata.md）。这里只代理元数据，不代理
 * 音频；Nightride / EVE 的 Icecast stats 自带 CORS，由浏览器直接读取。
 *
 * 路由只读、无凭据、不暴露 token：GET/HEAD，白名单两个电台，上游失败统一 502。
 */
import type { IncomingMessage, ServerResponse } from 'node:http';

export const name = 'dsh-plugin-radio';
export const inject = ['webServer'];

export const NOW_PLAYING_PATH = '/plugins/dsh-plugin-radio/now-playing';

const UPSTREAM = 'https://api.radioparadise.com/api/now_playing?chan=';
const CACHE_MS = 10_000;
const TIMEOUT_MS = 5_000;

/** `station` 查询参数 → RP `chan`。映射依据见 docs/adr/0003-now-playing-metadata.md。 */
const CHANNELS: Readonly<Record<string, number>> = {
  'main-mix': 0,
  'mellow-mix': 1,
};

const JSON_HEADERS = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'public, max-age=10',
} as const;

export interface NowPlayingDeps {
  /** 测试替身；默认用全局 fetch。 */
  readonly fetch?: typeof fetch;
  /** 测试用假时钟；默认 `Date.now`。 */
  readonly now?: () => number;
  readonly timeoutMs?: number;
  readonly cacheMs?: number;
}

interface CachedResponse {
  readonly at: number;
  readonly status: number;
  readonly body: string;
}

export type NowPlayingHandler = (req: IncomingMessage, res: ServerResponse) => Promise<void>;

function setHeaders(res: ServerResponse): void {
  for (const [key, value] of Object.entries(JSON_HEADERS)) res.setHeader(key, value);
}

/**
 * 唯一出口：JSON 头、状态码、HEAD 不写 body 都只在这里决定。
 * 缓存命中与实时上游两条分支必须走同一条路径，避免 header/语义悄悄漂移。
 */
function respond(req: IncomingMessage, res: ServerResponse, status: number, body: string): void {
  setHeaders(res);
  res.statusCode = status;
  res.end(req.method === 'HEAD' ? undefined : body);
}

function sendJson(
  req: IncomingMessage,
  res: ServerResponse,
  status: number,
  payload: Record<string, unknown>,
): void {
  respond(req, res, status, JSON.stringify(payload));
}

function stringField(record: Record<string, unknown>, key: string): string {
  const value = record[key];
  return typeof value === 'string' ? value.trim() : '';
}

async function fetchUpstream(
  chan: number,
  fetchImpl: typeof fetch,
  timeoutMs: number,
): Promise<Record<string, unknown>> {
  const signal =
    typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function'
      ? AbortSignal.timeout(timeoutMs)
      : undefined;
  const response = await fetchImpl(`${UPSTREAM}${chan}`, {
    signal,
    headers: { accept: 'application/json' },
  });
  if (!response.ok) throw new Error(`upstream responded ${response.status}`);
  const raw: unknown = await response.json();
  if (typeof raw !== 'object' || raw === null) throw new Error('upstream returned non-object');
  const record = raw as Record<string, unknown>;
  const title = stringField(record, 'title');
  if (title === '') throw new Error('upstream returned no title');
  return {
    ok: true,
    artist: stringField(record, 'artist'),
    title,
    album: stringField(record, 'album'),
  };
}

/**
 * 创建一个带 10 秒进程内缓存的 handler。缓存与时钟经 `deps` 注入，测试可完全离线。
 * 上游失败也缓存 10 秒：避免 RP 抖动时每个轮询都重打一次。
 */
export function createNowPlayingHandler(deps: NowPlayingDeps = {}): NowPlayingHandler {
  const fetchImpl = deps.fetch ?? globalThis.fetch;
  const now = deps.now ?? Date.now;
  const timeoutMs = deps.timeoutMs ?? TIMEOUT_MS;
  const cacheMs = deps.cacheMs ?? CACHE_MS;
  const cache = new Map<number, CachedResponse>();

  return async (req, res) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.setHeader('allow', 'GET, HEAD');
      sendJson(req, res, 405, { ok: false });
      return;
    }

    const url = new URL(String(req.url ?? ''), 'http://localhost');
    const station = url.searchParams.get('station') ?? '';
    if (!Object.prototype.hasOwnProperty.call(CHANNELS, station)) {
      sendJson(req, res, 400, { ok: false });
      return;
    }
    const chan = CHANNELS[station];

    const cached = cache.get(chan);
    if (cached !== undefined && now() - cached.at < cacheMs) {
      respond(req, res, cached.status, cached.body);
      return;
    }

    let status = 502;
    let body = JSON.stringify({ ok: false });
    try {
      const payload = await fetchUpstream(chan, fetchImpl, timeoutMs);
      status = 200;
      body = JSON.stringify(payload);
    } catch {
      // 上游超时、CORS 之外的网络错误、非 2xx、无 title：一律当作「暂时没有」。
    }
    cache.set(chan, { at: now(), status, body });

    respond(req, res, status, body);
  };
}

interface HostContext {
  readonly webServer: {
    register(route: {
      kind: 'exact';
      path: string;
      handler: NowPlayingHandler;
    }): () => void;
  };
  effect(effect: () => void | (() => void), label?: string): void;
}

export function apply(ctx: HostContext): void {
  const handler = createNowPlayingHandler();
  ctx.effect(
    () =>
      ctx.webServer.register({
        kind: 'exact',
        path: NOW_PLAYING_PATH,
        handler,
      }),
    `dsh-radio: GET ${NOW_PLAYING_PATH}`,
  );
}
