import assert from 'node:assert/strict';
import { test } from 'node:test';

// @ts-expect-error lib/index.js 是构建产物，不带类型声明。
import * as host from '../lib/index.js';

interface CapturedRoute {
  kind: 'exact';
  path: string;
  handler: (req: FakeRequest, res: FakeResponse) => Promise<void>;
}

class FakeResponse {
  statusCode = 0;
  readonly headers = new Map<string, string>();
  body = '';
  ended = false;

  setHeader(name: string, value: string): void {
    this.headers.set(name.toLowerCase(), value);
  }

  end(chunk?: string): void {
    this.body = chunk ?? '';
    this.ended = true;
  }
}

interface FakeRequest {
  method: string;
  url: string;
}

function request(method: string, url: string): FakeRequest {
  return { method, url };
}

function response(): FakeResponse {
  return new FakeResponse();
}

function run(handler: CapturedRoute['handler'], method: string, url: string): Promise<FakeResponse> {
  const res = response();
  return handler(request(method, url), res).then(() => res);
}

function jsonBody(res: FakeResponse): Record<string, unknown> {
  return JSON.parse(res.body) as Record<string, unknown>;
}

const fetched: string[] = [];

function fakeFetch(payload: unknown): typeof fetch {
  return (async (input: string | URL | Request) => {
    fetched.push(String(input));
    return {
      ok: true,
      status: 200,
      json: async () => payload,
    } as Response;
  }) as typeof fetch;
}

test('apply 注册一条 exact 宿主路由', () => {
  const routes: CapturedRoute[] = [];
  const disposers: Array<() => void> = [];
  const ctx = {
    webServer: {
      register(route: CapturedRoute): () => void {
        routes.push(route);
        return () => {};
      },
    },
    effect(effect: () => void | (() => void)): () => void {
      const dispose = effect();
      if (typeof dispose === 'function') disposers.push(dispose);
      return () => {};
    },
  };
  (host.apply as (context: typeof ctx) => void)(ctx);
  assert.equal(routes.length, 1);
  assert.equal(routes[0].kind, 'exact');
  assert.equal(routes[0].path, '/plugins/dsh-plugin-radio/now-playing');
  assert.equal(typeof routes[0].handler, 'function');
  assert.equal(disposers.length, 1);
});

test('GET main-mix 映射 chan=0，返回 JSON 与缓存头', async () => {
  fetched.length = 0;
  const handler = host.createNowPlayingHandler({
    fetch: fakeFetch({ artist: 'The Bee Gees', title: 'Lonely Days', album: 'Best' }),
    now: () => 0,
  });
  const res = await run(handler, 'GET', '/plugins/dsh-plugin-radio/now-playing?station=main-mix');
  assert.equal(res.statusCode, 200);
  assert.equal(res.headers.get('content-type'), 'application/json; charset=utf-8');
  assert.equal(res.headers.get('cache-control'), 'public, max-age=10');
  assert.deepEqual(jsonBody(res), {
    ok: true,
    artist: 'The Bee Gees',
    title: 'Lonely Days',
    album: 'Best',
  });
  assert.ok(fetched[0].includes('chan=0'), `应转发 chan=0，实际 ${fetched[0]}`);
});

test('GET mellow-mix 映射 chan=1', async () => {
  fetched.length = 0;
  const handler = host.createNowPlayingHandler({
    fetch: fakeFetch({ artist: 'Xavier Rudd', title: 'Home', album: 'Dark Shades' }),
    now: () => 0,
  });
  const res = await run(handler, 'GET', '/plugins/dsh-plugin-radio/now-playing?station=mellow-mix');
  assert.equal(res.statusCode, 200);
  assert.ok(fetched[0].includes('chan=1'), `应转发 chan=1，实际 ${fetched[0]}`);
});

test('POST 405，未知 station 400', async () => {
  const handler = host.createNowPlayingHandler({ fetch: fakeFetch({}), now: () => 0 });
  assert.equal((await run(handler, 'POST', '/plugins/dsh-plugin-radio/now-playing?station=main-mix')).statusCode, 405);
  assert.equal((await run(handler, 'GET', '/plugins/dsh-plugin-radio/now-playing?station=nope')).statusCode, 400);
  assert.equal((await run(handler, 'GET', '/plugins/dsh-plugin-radio/now-playing')).statusCode, 400);
});

test('上游失败 502 且不泄露错误细节', async () => {
  const handler = host.createNowPlayingHandler({
    fetch: (async () => {
      throw new Error('boom');
    }) as typeof fetch,
    now: () => 0,
  });
  const res = await run(handler, 'GET', '/plugins/dsh-plugin-radio/now-playing?station=main-mix');
  assert.equal(res.statusCode, 502);
  assert.deepEqual(jsonBody(res), { ok: false });
});

test('10 秒缓存：同一 chan 只打一次上游，过期后再打', async () => {
  fetched.length = 0;
  let clock = 1_000;
  const handler = host.createNowPlayingHandler({
    fetch: fakeFetch({ artist: 'A', title: 'T', album: 'B' }),
    now: () => clock,
  });
  const url = '/plugins/dsh-plugin-radio/now-playing?station=main-mix';
  assert.equal((await run(handler, 'GET', url)).statusCode, 200);
  clock += 9_999;
  assert.equal((await run(handler, 'GET', url)).statusCode, 200);
  assert.equal(fetched.length, 1, '10 秒内应复用缓存');
  clock += 1;
  assert.equal((await run(handler, 'GET', url)).statusCode, 200);
  assert.equal(fetched.length, 2, '超过 10 秒应重新请求');
});

test('HEAD 返回头但不返回正文', async () => {
  const handler = host.createNowPlayingHandler({
    fetch: fakeFetch({ artist: 'A', title: 'T', album: 'B' }),
    now: () => 0,
  });
  const res = await run(handler, 'HEAD', '/plugins/dsh-plugin-radio/now-playing?station=main-mix');
  assert.equal(res.statusCode, 200);
  assert.equal(res.body, '');
});
