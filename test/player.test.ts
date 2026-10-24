import assert from 'node:assert/strict';
import { afterEach, beforeEach, test } from 'node:test';

import {
  configurePlayer,
  disposePlayer,
  pausePlayer,
  playStation,
  prewarmPlayer,
  resumePlayer,
  setPlayerMuted,
  setPlayerVolume,
  stopPlayer,
} from '../src/client/player.ts';
import { stationById } from '../src/client/stations.ts';

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

interface FakeGlobal {
  window: { AudioContext?: unknown };
  Audio: typeof FakeAudioElement;
}

(globalThis as unknown as FakeGlobal).window = {};
(globalThis as unknown as FakeGlobal).Audio = FakeAudioElement;

let statuses: string[] = [];
let audio: FakeAudioElement;

afterEach(() => {
  disposePlayer();
});

beforeEach(() => {
  FakeAudioElement.instances.length = 0;
  disposePlayer();
  statuses = [];
  configurePlayer({
    onStatus: (status) => {
      statuses.push(status);
    },
  });
  stopPlayer();
  statuses = [];
  prewarmPlayer(stationById('chillsynth'));
  audio = FakeAudioElement.instances[0];
});

test('预缓冲只建立 src，不播放', () => {
  assert.equal(audio.src, 'https://stream.nightride.fm/chillsynth.mp3');
  assert.equal(audio.loads, 1);
  assert.equal(audio.plays, 0);
  assert.deepEqual(statuses, []);
});

test('首次播放复用预缓冲的 src，不重新 load', () => {
  playStation(stationById('chillsynth'));
  assert.equal(audio.loads, 1);
  assert.equal(audio.plays, 1);
  audio.emit('playing');
  assert.deepEqual(statuses, ['loading', 'playing']);
});

test('预缓冲失败后首次播放会重新建立连接', () => {
  audio.emit('error');
  assert.deepEqual(statuses, []);
  playStation(stationById('chillsynth'));
  assert.equal(audio.loads, 2);
  audio.emit('playing');
  assert.deepEqual(statuses, ['loading', 'playing']);
});

test('切台：停旧流 → 改 src → load → play → playing', () => {
  playStation(stationById('nightride'));
  assert.equal(audio.pauses, 1);
  assert.equal(audio.src, 'https://stream.nightride.fm/nightride.mp3');
  assert.equal(audio.loads, 2);
  assert.equal(audio.plays, 1);
  assert.deepEqual(statuses, ['loading']);
  audio.emit('playing');
  assert.deepEqual(statuses, ['loading', 'playing']);
});

test('暂停后恢复复用同一个 src', () => {
  playStation(stationById('nightride'));
  audio.emit('playing');
  pausePlayer();
  assert.deepEqual(statuses, ['loading', 'playing', 'paused']);
  const playsBefore = audio.plays;
  const loadsBefore = audio.loads;
  resumePlayer(stationById('nightride'));
  assert.equal(audio.plays, playsBefore + 1);
  assert.equal(audio.loads, loadsBefore);
  assert.deepEqual(statuses, ['loading', 'playing', 'paused', 'loading']);
  audio.emit('playing');
  assert.equal(statuses.at(-1), 'playing');
});

test('主地址失败切备用一次，再失败进入 error', () => {
  playStation(stationById('main'));
  audio.emit('error');
  assert.equal(audio.src, 'https://stream.radioparadise.com/aac-128');
  assert.deepEqual(statuses, ['loading']);
  audio.emit('error');
  assert.deepEqual(statuses, ['loading', 'error']);
});

test('12 秒未 playing 进入 error（无备用流）', (context) => {
  context.mock.timers.enable({ apis: ['setTimeout'] });
  playStation(stationById('chillsynth'));
  assert.deepEqual(statuses, ['loading']);
  context.mock.timers.tick(12_000);
  assert.deepEqual(statuses, ['loading', 'error']);
});

test('音量与静音应用到音频元素', () => {
  setPlayerVolume(0.35);
  setPlayerMuted(true);
  playStation(stationById('darksynth'));
  assert.equal(audio.volume, 0.35);
  assert.equal(audio.muted, true);
  setPlayerVolume(2);
  assert.equal(audio.volume, 1);
});

test('dispose 释放元素，下一次播放重新创建', () => {
  disposePlayer();
  assert.equal(FakeAudioElement.instances.length, 1);
  playStation(stationById('nightride'));
  assert.equal(FakeAudioElement.instances.length, 2);
  assert.equal(FakeAudioElement.instances[1].src, 'https://stream.nightride.fm/nightride.mp3');
});
