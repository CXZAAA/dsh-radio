import * as React from 'react';

import { getStrings } from './i18n.ts';
import { resolveNowPlaying, type NowPlaying } from './nowPlaying.ts';
import * as player from './player.ts';
import type { PlaybackStatus } from './player.ts';
import { DEFAULT_STATION_ID, STATIONS, findStation, stationById } from './stations.ts';
import {
  STORAGE_KEYS,
  parseMuted,
  parseSettings,
  parseVolume,
  serializeMuted,
  type Settings,
} from './settings.ts';

export interface RadioState {
  status: PlaybackStatus;
  stationId: string;
  volume: number;
  muted: boolean;
  settings: Settings;
  panelOpen: boolean;
  settingsOpen: boolean;
  /** 当前台的曲目；只对 `stationId` 指向的台有效，切台立即清空。 */
  nowPlaying: NowPlaying | null;
}

type Listener = () => void;

interface MediaSessionLike {
  metadata: unknown;
  playbackState: 'none' | 'paused' | 'playing';
  setActionHandler(action: 'play' | 'pause' | 'stop', handler: (() => void) | null): void;
}

const listeners = new Set<Listener>();

function read(key: string): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // 隐私模式或配额已满：设置仍在内存中生效。
  }
}

function remove(key: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // 同上。
  }
}

function createInitialState(): RadioState {
  const settings = parseSettings(read(STORAGE_KEYS.settings));
  const saved = settings.remember ? findStation(read(STORAGE_KEYS.lastStation)) : undefined;
  const station = saved ?? stationById(DEFAULT_STATION_ID);
  return {
    // 刷新后保留上次的电台，但绝不自动发声：呈现为暂停态。
    status: saved === undefined ? 'idle' : 'paused',
    stationId: station.id,
    volume: parseVolume(read(STORAGE_KEYS.volume)),
    muted: parseMuted(read(STORAGE_KEYS.muted)),
    settings,
    panelOpen: false,
    settingsOpen: false,
    nowPlaying: null,
  };
}

let state: RadioState = createInitialState();

function getSnapshot(): RadioState {
  return state;
}

function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useRadioState(): RadioState {
  return React.useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

/** 非 React 读取点（测试、调试）；界面仍走 `useRadioState`。 */
export function getRadioState(): RadioState {
  return state;
}

function setState(patch: Partial<RadioState>): void {
  const previous = state;
  const stationChanged = patch.stationId !== undefined && patch.stationId !== previous.stationId;
  state = { ...state, ...patch };
  // 切台时先清掉上一台的歌，避免在新台连接期间短暂显示旧曲目。
  if (stationChanged && patch.nowPlaying === undefined) state.nowPlaying = null;
  for (const listener of listeners) listener();
  // 音量、面板开合等变化不需要重建系统媒体键的 metadata / handler。
  if (
    state.status !== previous.status ||
    state.stationId !== previous.stationId ||
    state.settings.mediaKeys !== previous.settings.mediaKeys
  ) {
    syncMediaSession();
  }
  if (stationChanged) {
    stopNowPlaying();
    // spec：切台立即拉一次，不等 `playing`（`refreshNowPlaying(true)` 忽略状态门槛）。
    void refreshNowPlaying(true);
  } else if (state.status !== previous.status) {
    // 出声才轮询；暂停/待机/失败停掉，包含尚未返回的请求。
    // `loading` 既不停也不新起：切台的请求正在路上，由后续 `playing` 接管轮询。
    if (state.status === 'playing') void refreshNowPlaying();
    else if (state.status !== 'loading') stopNowPlaying();
  }
}

/** 曲目轮询：出声时每 20 秒一次；切台立即拉一次；隐藏页暂停。 */
const NOW_PLAYING_POLL_MS = 20_000;

let nowPlayingTimer: ReturnType<typeof setTimeout> | null = null;
let nowPlayingAbort: AbortController | null = null;
let nowPlayingRequest = 0;
/** 在途请求属于哪个台：同一台的请求被复用时，`loading → playing` 不会把它中止重打。 */
let nowPlayingInFlightStation: string | null = null;

function clearNowPlayingTimer(): void {
  if (nowPlayingTimer === null) return;
  clearTimeout(nowPlayingTimer);
  nowPlayingTimer = null;
}

function stopNowPlaying(): void {
  clearNowPlayingTimer();
  nowPlayingAbort?.abort();
  nowPlayingAbort = null;
  nowPlayingInFlightStation = null;
}

function pageHidden(): boolean {
  return typeof document !== 'undefined' && document.visibilityState === 'hidden';
}

function scheduleNowPlaying(delay: number): void {
  clearNowPlayingTimer();
  if (state.status !== 'playing' || pageHidden()) return;
  nowPlayingTimer = setTimeout(() => {
    nowPlayingTimer = null;
    void refreshNowPlaying();
  }, delay);
}

/**
 * 取一次曲目。`force` 用于切台：不管当前是 `loading` 还是 `paused` 都发请求。
 * 同一台已有在途请求时直接复用——这既避免 `playing` 重复打一次，也保证
 * 切台后 `loading → playing` 不会中止刚发出的请求。
 */
async function refreshNowPlaying(force = false): Promise<void> {
  if (!force && state.status !== 'playing') return;
  if (pageHidden()) return;
  const stationId = state.stationId;
  if (nowPlayingInFlightStation === stationId) return;
  const controller = new AbortController();
  stopNowPlaying();
  nowPlayingAbort = controller;
  nowPlayingInFlightStation = stationId;
  const request = (nowPlayingRequest += 1);
  const track = await resolveNowPlaying(stationById(stationId), controller.signal);
  if (nowPlayingInFlightStation === stationId) nowPlayingInFlightStation = null;
  if (request !== nowPlayingRequest || state.stationId !== stationId) return;
  if (track !== null) setState({ nowPlaying: { stationId, ...track } });
  // 失败保留上一次成功值，并继续按 20 秒重试；不弹错、不写 console。
  scheduleNowPlaying(NOW_PLAYING_POLL_MS);
}

function onVisibilityChange(): void {
  if (pageHidden()) {
    stopNowPlaying();
    return;
  }
  if (state.status === 'playing') void refreshNowPlaying();
}

function mediaSession(): MediaSessionLike | undefined {
  if (typeof navigator === 'undefined') return undefined;
  const session = (navigator as Navigator & { mediaSession?: MediaSessionLike }).mediaSession;
  return session;
}

function syncMediaSession(): void {
  const session = mediaSession();
  if (session === undefined) return;
  if (!state.settings.mediaKeys) {
    try {
      session.metadata = null;
      session.playbackState = 'none';
    } catch {
      // 浏览器拒绝时保持 UI 可用。
    }
    for (const action of ['play', 'pause', 'stop'] as const) {
      try {
        session.setActionHandler(action, null);
      } catch {
        // 个别动作不受支持。
      }
    }
    return;
  }

  const station = stationById(state.stationId);
  const MetadataCtor = (
    globalThis as typeof globalThis & { MediaMetadata?: new (init: Record<string, unknown>) => unknown }
  ).MediaMetadata;
  try {
    session.metadata =
      MetadataCtor === undefined
        ? null
        : new MetadataCtor({
            title: station.name,
            artist: station.provider,
            album: getStrings().appName,
          });
  } catch {
    session.metadata = null;
  }
  try {
    session.playbackState =
      state.status === 'playing' || state.status === 'loading'
        ? 'playing'
        : state.status === 'paused'
          ? 'paused'
          : 'none';
  } catch {
    // 同上。
  }
  const handlers = {
    play: () => {
      play();
    },
    pause: () => {
      pause();
    },
    stop: () => {
      stop();
    },
  };
  for (const action of ['play', 'pause', 'stop'] as const) {
    try {
      session.setActionHandler(action, handlers[action]);
    } catch {
      // 同上。
    }
  }
}

function persistStation(stationId: string): void {
  if (state.settings.remember) write(STORAGE_KEYS.lastStation, stationId);
  else remove(STORAGE_KEYS.lastStation);
}

export function startRadio(): void {
  player.configurePlayer({
    onStatus: (status) => {
      setState({ status });
    },
  });
  player.setPlayerVolume(state.volume);
  player.setPlayerMuted(state.muted);
  // 只预热一条：上次播放的电台；没有记录（或关闭记忆）时是默认台。
  player.prewarmPlayer(stationById(state.stationId));
  syncMediaSession();
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', onVisibilityChange);
  }
}

export function disposeRadio(): void {
  stopNowPlaying();
  if (typeof document !== 'undefined') {
    document.removeEventListener('visibilitychange', onVisibilityChange);
  }
  player.disposePlayer();
  const session = mediaSession();
  if (session === undefined) return;
  try {
    session.metadata = null;
    session.playbackState = 'none';
  } catch {
    // 卸载路径不因媒体键失败而中断。
  }
  for (const action of ['play', 'pause', 'stop'] as const) {
    try {
      session.setActionHandler(action, null);
    } catch {
      // 同上。
    }
  }
}

function play(): void {
  const station = stationById(state.stationId);
  if (state.status === 'playing' || state.status === 'loading') return;
  if (state.status === 'paused') player.resumePlayer(station);
  else if (state.status === 'error') player.retryPlayer(station);
  else player.playStation(station);
}

function pause(): void {
  player.pausePlayer();
}

function stop(): void {
  player.stopPlayer();
  setState({ panelOpen: false, settingsOpen: false });
}

export function togglePlay(): void {
  if (state.status === 'playing' || state.status === 'loading') pause();
  else play();
}

function playStation(id: string): void {
  const station = stationById(id);
  if (state.stationId !== station.id) setState({ stationId: station.id });
  persistStation(station.id);
  player.playStation(station);
}

/** 面板里点行：当前台播放中则暂停，否则恢复；别的台直接切。 */
export function selectStation(id: string): void {
  if (state.stationId === id) {
    if (state.status === 'playing' || state.status === 'loading') pause();
    else play();
    return;
  }
  playStation(id);
}

export function retry(): void {
  player.retryPlayer(stationById(state.stationId));
}

/** 按列表顺序切到下一台（末尾回到第一台），并立即开始播放。 */
export function nextStation(): void {
  const index = STATIONS.findIndex((station) => station.id === state.stationId);
  const next = STATIONS[(index + 1) % STATIONS.length];
  // `playStation` 换 src 前会先 pause 旧流，不会叠音。
  playStation(next.id);
}

export function setVolume(volume: number): void {
  const next = Math.min(1, Math.max(0, volume));
  setState({ volume: next });
  player.setPlayerVolume(next);
  write(STORAGE_KEYS.volume, String(next));
}

function setMuted(muted: boolean): void {
  setState({ muted });
  player.setPlayerMuted(muted);
  write(STORAGE_KEYS.muted, serializeMuted(muted));
}

export function toggleMute(): void {
  setMuted(!state.muted);
}

export function togglePanel(): void {
  setState({ panelOpen: !state.panelOpen, settingsOpen: false });
}

export function closePanel(): void {
  if (!state.panelOpen) return;
  setState({ panelOpen: false, settingsOpen: false });
}

export function openSettings(): void {
  setState({ panelOpen: true, settingsOpen: true });
}

export function closeSettings(): void {
  if (!state.settingsOpen) return;
  setState({ settingsOpen: false });
}

export function updateSettings(patch: Partial<Settings>): void {
  const previous = state.settings;
  const settings: Settings = { ...previous, ...patch };
  if (
    settings.mediaKeys === previous.mediaKeys &&
    settings.spectrum === previous.spectrum &&
    settings.remember === previous.remember
  ) {
    return;
  }
  setState({ settings });
  write(STORAGE_KEYS.settings, JSON.stringify(settings));

  if (settings.remember !== previous.remember) {
    if (settings.remember) {
      write(STORAGE_KEYS.lastStation, state.stationId);
    } else {
      remove(STORAGE_KEYS.lastStation);
      // 关闭记忆时如果没在出声，立即回到默认台；正在播放则不打断。
      if (state.status !== 'playing' && state.status !== 'loading') {
        const fallback = stationById(DEFAULT_STATION_ID);
        player.prewarmPlayer(fallback);
        if (state.stationId !== fallback.id || state.status !== 'idle') {
          setState({ stationId: fallback.id, status: 'idle' });
        }
      }
    }
  }
}
