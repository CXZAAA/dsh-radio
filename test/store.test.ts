import assert from 'node:assert/strict';
import { afterEach, beforeEach, test } from 'node:test';

import { clearNowPlayingCache } from '../src/client/nowPlaying.ts';
import { STATIONS } from '../src/client/stations.ts';

class FakeAudioElement {
  static instances: FakeAudioElement[] = [];

  readonly listeners = new Map<string, Array<() => void>>();
  src = '';
  volume = 1;
  muted = false;
  crossOrigin = '';
  preload = '';
  plays = 0;
  loads = 0;
  pauses = 0;

  constructor() {
    FakeAudioElement.instances.push(this);
  }

  addEventListener(type: string, listener: () => void): void {
    const list = this.listeners.get(type) ?? [];
    list.push(listener);
    this.listeners.set(type, list);
  }

  emit(type: string): void {
    for (const listener of this.listeners.get(type) ?? []) listener();
  }

  pause(): void {
    this.pauses += 1;
  }

  load(): void {
    this.loads += 1;
  }

  play(): Promise<void> {
    this.plays += 1;
    return Promise.resolve();
  }

  removeAttribute(name: string): void {
    if (name === 'src') this.src = '';
  }
}

const storage = new Map<string, string>();
const localStorageStub = {
  getItem(key: string): string | null {
    return storage.get(key) ?? null;
  },
  setItem(key: string, value: string): void {
    storage.set(key, value);
  },
  removeItem(key: string): void {
    storage.delete(key);
  },
};

// store 在模块求值时就读取 window.localStorage，所以必须先铺好全局再动态 import。
(globalThis as unknown as { window: unknown }).window = { localStorage: localStorageStub };
(globalThis as unknown as { Audio: unknown }).Audio = FakeAudioElement;

type Store = typeof import('../src/client/store.ts');

let store: Store;
let audio: FakeAudioElement;

beforeEach(async () => {
  storage.clear();
  clearNowPlayingCache();
  FakeAudioElement.instances.length = 0;
  // 每次重新求值模块，保证 store 是默认状态。
  const version = `${Date.now()}-${Math.random()}`;
  store = (await import(`../src/client/store.ts?store-test=${version}`)) as Store;
  store.startRadio();
  audio = FakeAudioElement.instances[0];
});

afterEach(() => {
  store.disposeRadio();
});

test('nextStation 按列表顺序切台并立即播放', () => {
  assert.equal(audio.src, 'https://stream.nightride.fm/chillsynth.mp3');
  assert.equal(audio.plays, 0);

  store.nextStation();
  assert.equal(audio.src, 'https://stream.nightride.fm/nightride.mp3');
  assert.equal(audio.plays, 1, '切到下一台后应立即开始播放');
  assert.ok(audio.pauses >= 1, '换 src 前必须先停旧流');
  assert.equal(storage.get('dsh-radio:lastStation'), 'nightride');
});

test('nextStation 在列表末尾回到第一台', () => {
  store.selectStation('eve');
  assert.equal(audio.src, STATIONS[6].url);

  store.nextStation();
  assert.equal(audio.src, STATIONS[0].url);
  assert.equal(storage.get('dsh-radio:lastStation'), 'chillsynth');
});

test('连续 nextStation 依次前进两台', () => {
  store.nextStation();
  store.nextStation();
  assert.equal(audio.src, STATIONS[2].url);
  assert.equal(storage.get('dsh-radio:lastStation'), STATIONS[2].id);
});

test('切台立即清空上一台曲目', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async () => ({
    ok: true,
    status: 200,
    json: async () => ({
      icestats: {
        source: [{ listenurl: 'https://stream.nightride.fm/chillsynth.mp3', title: 'Track A' }],
      },
    }),
  })) as unknown as typeof fetch;
  try {
    store.selectStation('chillsynth');
    audio.emit('playing');
    await new Promise((resolve) => setTimeout(resolve, 20));
    assert.equal(store.getRadioState().nowPlaying?.title, 'Track A');

    store.nextStation();
    assert.equal(store.getRadioState().nowPlaying, null, '切台后不能短暂显示上一台的歌');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('切台立即发起曲目请求，loading→playing 不中止它', async () => {
  const originalFetch = globalThis.fetch;
  const requested: string[] = [];
  const signals: AbortSignal[] = [];
  let release: () => void = () => {};
  globalThis.fetch = (async (input: string | URL | Request, init?: RequestInit) => {
    requested.push(String(input));
    if (init?.signal) signals.push(init.signal);
    await new Promise<void>((resolve) => {
      release = resolve;
    });
    return {
      ok: true,
      status: 200,
      json: async () => ({
        icestats: {
          source: [{ listenurl: 'https://stream.nightride.fm/nightride.mp3', title: 'Track B' }],
        },
      }),
    } as unknown as Response;
  }) as unknown as typeof fetch;
  try {
    // 切台瞬间（仍在 loading/尚未出声）就应发出请求，这是 spec 的要求。
    store.nextStation(); // chillsynth → nightride
    assert.equal(requested.length, 1, '切台瞬间就应发起一次曲目请求，不等 playing');
    assert.equal(requested[0], 'https://stream.nightride.fm/status-json.xsl');
    assert.equal(store.getRadioState().nowPlaying, null, '新台的曲目尚未到达');

    audio.emit('playing'); // loading → playing
    await Promise.resolve();
    assert.equal(signals.length, 1, 'playing 时复用在途请求，不重复打');
    assert.equal(signals[0].aborted, false, 'loading→playing 不得中止切台的请求');

    release();
    await new Promise((resolve) => setTimeout(resolve, 0));
    assert.equal(store.getRadioState().nowPlaying?.stationId, 'nightride');
    assert.equal(store.getRadioState().nowPlaying?.title, 'Track B');
  } finally {
    globalThis.fetch = originalFetch;
  }
});
