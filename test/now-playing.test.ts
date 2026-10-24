import assert from 'node:assert/strict';
import { beforeEach, test } from 'node:test';

import {
  clearNowPlayingCache,
  parseIcecast,
  parseNowPlayingResponse,
  resolveNowPlaying,
} from '../src/client/nowPlaying.ts';
import { stationById } from '../src/client/stations.ts';

const nightrideStats = {
  icestats: {
    source: [
      { listenurl: 'https://stream.nightride.fm/chillsynth.mp3', title: 'The Midnight - Vampires' },
      { listenurl: 'https://stream.nightride.fm/darksynth.mp3', title: 'Dance With the Dead - Riot' },
    ],
  },
};

beforeEach(() => {
  clearNowPlayingCache();
});

test('Icecast：多源里按 listenurl 精确匹配', () => {
  assert.deepEqual(parseIcecast(nightrideStats, 'chillsynth.mp3'), {
    artist: 'The Midnight',
    title: 'Vampires',
  });
  assert.deepEqual(parseIcecast(nightrideStats, 'darksynth.mp3'), {
    artist: 'Dance With the Dead',
    title: 'Riot',
  });
});

test('Icecast：单源对象、缺字段、Unknown 与空 title', () => {
  assert.deepEqual(
    parseIcecast(
      { icestats: { source: { listenurl: 'https://x/erweb.mp3', title: 'Some Track' } } },
      'erweb.mp3',
    ),
    { title: 'Some Track' },
  );
  assert.equal(parseIcecast({ icestats: { source: {} } }, 'erweb.mp3'), null);
  assert.equal(
    parseIcecast({ icestats: { source: [{ listenurl: 'https://x/erweb.mp3' }] } }, 'erweb.mp3'),
    null,
  );
  assert.equal(
    parseIcecast(
      { icestats: { source: [{ listenurl: 'https://x/erweb.mp3', title: 'Unknown' }] } },
      'erweb.mp3',
    ),
    null,
  );
  assert.equal(
    parseIcecast(
      { icestats: { source: [{ listenurl: 'https://x/erweb.mp3', title: '  ' }] } },
      'erweb.mp3',
    ),
    null,
  );
  assert.equal(parseIcecast({}, 'erweb.mp3'), null);
  assert.equal(parseIcecast(null, 'erweb.mp3'), null);
});

test('RP 响应：ok + artist/title；无 artist 时只留 title', () => {
  assert.deepEqual(
    parseNowPlayingResponse({ ok: true, artist: 'The Bee Gees', title: 'Lonely Days', album: 'X' }),
    { artist: 'The Bee Gees', title: 'Lonely Days' },
  );
  assert.deepEqual(parseNowPlayingResponse({ ok: true, artist: '', title: 'Lonely Days' }), {
    title: 'Lonely Days',
  });
  assert.equal(parseNowPlayingResponse({ ok: false }), null);
  assert.equal(parseNowPlayingResponse({ ok: true, artist: 'A' }), null);
  assert.equal(parseNowPlayingResponse({ ok: true, title: 'Unknown' }), null);
  assert.equal(parseNowPlayingResponse(null), null);
});

test('Nightride 解析走 Icecast，拆分「歌手 - 曲名」', async () => {
  const requested: string[] = [];
  const fakeFetch = (async (input: string | URL | Request) => {
    requested.push(String(input));
    return { ok: true, status: 200, json: async () => nightrideStats } as Response;
  }) as typeof fetch;

  const track = await resolveNowPlaying(stationById('chillsynth'), new AbortController().signal, {
    fetch: fakeFetch,
    now: () => 0,
  });
  assert.deepEqual(track, { artist: 'The Midnight', title: 'Vampires' });
  assert.equal(requested[0], 'https://stream.nightride.fm/status-json.xsl');
});

test('15 秒缓存内不重复请求，过期后重新请求', async () => {
  let clock = 0;
  let calls = 0;
  const fakeFetch = (async () => {
    calls += 1;
    return { ok: true, status: 200, json: async () => nightrideStats } as Response;
  }) as typeof fetch;
  const station = stationById('chillsynth');

  await resolveNowPlaying(station, new AbortController().signal, { fetch: fakeFetch, now: () => clock });
  clock = 14_999;
  await resolveNowPlaying(station, new AbortController().signal, { fetch: fakeFetch, now: () => clock });
  assert.equal(calls, 1, '15 秒内应命中缓存');

  clock = 15_000;
  await resolveNowPlaying(station, new AbortController().signal, { fetch: fakeFetch, now: () => clock });
  assert.equal(calls, 2, '超过 15 秒应重新请求');
});

test('失败（网络错误、非 2xx、未知台）回退 null 且不缓存', async () => {
  const failing = (async () => {
    throw new Error('offline');
  }) as typeof fetch;
  assert.equal(
    await resolveNowPlaying(stationById('nightride'), new AbortController().signal, {
      fetch: failing,
      now: () => 0,
    }),
    null,
  );

  const notOk = (async () => ({ ok: false, status: 502 })) as unknown as typeof fetch;
  assert.equal(
    await resolveNowPlaying(stationById('main'), new AbortController().signal, {
      fetch: notOk,
      now: () => 0,
    }),
    null,
  );
});

test('RP 走同源宿主路由；EVE 无元数据、不发请求', async () => {
  const requested: string[] = [];
  const fakeFetch = (async (input: string | URL | Request) => {
    const url = String(input);
    requested.push(url);
    if (url.startsWith('/plugins/dsh-plugin-radio/now-playing')) {
      return { ok: true, status: 200, json: async () => ({ ok: true, artist: 'A', title: 'T' }) } as Response;
    }
    throw new Error(`unexpected request: ${url}`);
  }) as typeof fetch;

  const rp = await resolveNowPlaying(stationById('main'), new AbortController().signal, {
    fetch: fakeFetch,
    now: () => 0,
  });
  assert.deepEqual(rp, { artist: 'A', title: 'T' });
  assert.ok(requested[0].includes('station=main-mix'));

  // EVE 的 Icecast title 恒为 Unknown（ADR-0003），死路径已删除：不应产生任何请求。
  const before = requested.length;
  const eve = await resolveNowPlaying(stationById('eve'), new AbortController().signal, {
    fetch: fakeFetch,
    now: () => 0,
  });
  assert.equal(eve, null);
  assert.equal(requested.length, before, 'EVE 不应发任何网络请求');
});
