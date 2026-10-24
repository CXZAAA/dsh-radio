import type { Station } from './stations.ts';

/**
 * 播放器内核：全包唯一的 HTMLAudioElement。
 * 只做「播放/停/缓冲/失败回落/频谱采样」，不持有 React 状态。
 */
export type PlaybackStatus = 'idle' | 'loading' | 'playing' | 'paused' | 'error';

interface PlayerHooks {
  onStatus: (status: PlaybackStatus) => void;
}

const PLAY_TIMEOUT_MS = 12_000;
const SPECTRUM_BANDS = 16;
const FFT_SIZE = 512;

let audio: HTMLAudioElement | null = null;
let hooks: PlayerHooks = { onStatus: () => {} };
let current: Station | null = null;
let status: PlaybackStatus = 'idle';
let attempting = false;
let usingFallback = false;
let prewarmFailed = false;
let timer: ReturnType<typeof setTimeout> | null = null;

let context: AudioContext | null = null;
let analyser: AnalyserNode | null = null;
let frequencyData: Uint8Array<ArrayBuffer> | null = null;
let graphAttempted = false;

function emit(next: PlaybackStatus): void {
  if (status === next) return;
  status = next;
  hooks.onStatus(next);
}

function clearTimer(): void {
  if (timer === null) return;
  clearTimeout(timer);
  timer = null;
}

function armTimer(): void {
  clearTimer();
  timer = setTimeout(() => {
    timer = null;
    if (status === 'loading') fail();
  }, PLAY_TIMEOUT_MS);
}

function ensureAudio(): HTMLAudioElement | null {
  if (audio !== null) return audio;
  if (typeof Audio === 'undefined') return null;
  const element = new Audio();
  element.crossOrigin = 'anonymous';
  element.preload = 'auto';
  element.addEventListener('playing', () => {
    if (!attempting) return;
    prewarmFailed = false;
    clearTimer();
    emit('playing');
  });
  element.addEventListener('error', () => {
    if (!attempting) {
      // 预缓冲失败不打扰用户，但下次点击时强制重新建立连接。
      prewarmFailed = true;
      return;
    }
    fail();
  });
  audio = element;
  return audio;
}

function applyOutput(): void {
  if (audio === null) return;
  audio.volume = volumeLevel;
  audio.muted = mutedLevel;
}

let volumeLevel = 1;
let mutedLevel = false;

function ensureGraph(element: HTMLAudioElement): void {
  if (analyser !== null || graphAttempted) {
    if (context !== null && context.state === 'suspended') {
      void context.resume().catch(() => {});
    }
    return;
  }
  graphAttempted = true;
  if (typeof window === 'undefined') return;
  const AudioContextCtor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (AudioContextCtor === undefined) return;
  try {
    const next = new AudioContextCtor();
    const node = next.createAnalyser();
    node.fftSize = FFT_SIZE;
    node.smoothingTimeConstant = 0.78;
    const source = next.createMediaElementSource(element);
    source.connect(node);
    node.connect(next.destination);
    context = next;
    analyser = node;
    frequencyData = new Uint8Array(node.frequencyBinCount);
    void next.resume().catch(() => {});
  } catch {
    analyser = null;
    frequencyData = null;
    try {
      void context?.close();
    } catch {
      // 已关闭或从未建立：没有需要恢复的图。
    }
    context = null;
  }
}

function load(element: HTMLAudioElement, url: string): void {
  prewarmFailed = false;
  element.pause();
  element.src = url;
  element.load();
}

function startPlayback(element: HTMLAudioElement): void {
  ensureGraph(element);
  applyOutput();
  emit('loading');
  armTimer();
  try {
    void element.play().catch(() => fail());
  } catch {
    fail();
  }
}

function fail(): void {
  clearTimer();
  if (!attempting) return;
  if (!usingFallback && current?.fallbackUrl !== undefined && audio !== null) {
    usingFallback = true;
    load(audio, current.fallbackUrl);
    startPlayback(audio);
    return;
  }
  attempting = false;
  emit('error');
}

export function configurePlayer(next: PlayerHooks): void {
  hooks = next;
}

/** 只建立连接并缓冲，不 play()；用于「上次播放的电台」预缓冲。 */
export function prewarmPlayer(station: Station): void {
  const element = ensureAudio();
  current = station;
  prewarmFailed = false;
  if (element === null) return;
  element.src = station.url;
  element.load();
}

export function playStation(station: Station): void {
  const element = ensureAudio();
  current = station;
  attempting = true;
  usingFallback = false;
  clearTimer();
  if (element === null) {
    attempting = false;
    emit('error');
    return;
  }
  // 预缓冲/暂停保留的同一 src 直接复用；切台、预缓冲失败或失败重试才重新 load。
  if (prewarmFailed || element.src !== station.url || status === 'error') {
    load(element, station.url);
  }
  startPlayback(element);
}

/** 暂停后恢复：复用同一个 src，不 seek、不重新缓冲整段。 */
export function resumePlayer(station: Station): void {
  const element = ensureAudio();
  current = station;
  attempting = true;
  usingFallback = false;
  clearTimer();
  if (element === null) {
    attempting = false;
    emit('error');
    return;
  }
  if (prewarmFailed || element.src !== station.url) {
    load(element, station.url);
  }
  startPlayback(element);
}

export function pausePlayer(): void {
  if (status === 'idle' || status === 'error') return;
  clearTimer();
  attempting = false;
  audio?.pause();
  emit('paused');
}

export function stopPlayer(): void {
  clearTimer();
  attempting = false;
  audio?.pause();
  emit('idle');
}

export function retryPlayer(station: Station): void {
  playStation(station);
}

export function setPlayerVolume(volume: number): void {
  volumeLevel = Math.min(1, Math.max(0, volume));
  applyOutput();
}

export function setPlayerMuted(muted: boolean): void {
  mutedLevel = muted;
  applyOutput();
}

/** 真实频谱：16 个对数分布的频段，归一化到 0.06–1。 */
export function sampleRealSpectrum(): number[] | null {
  if (analyser === null || frequencyData === null) return null;
  analyser.getByteFrequencyData(frequencyData);
  const levels: number[] = new Array(SPECTRUM_BANDS);
  for (let index = 0; index < SPECTRUM_BANDS; index += 1) {
    const position = index / (SPECTRUM_BANDS - 1);
    const bin = Math.min(
      frequencyData.length - 1,
      Math.round(Math.pow(position, 1.8) * 96) + 2,
    );
    levels[index] = Math.max(0.06, Math.min(1, frequencyData[bin] / 200));
  }
  return levels;
}

export function disposePlayer(): void {
  clearTimer();
  attempting = false;
  usingFallback = false;
  prewarmFailed = false;
  // 重挂载时不能沿用上一次的状态：否则 startPlayback 的 emit('loading') 会因
  // status 相同而被吞掉，界面停在旧状态。这里静默复位，不通知 hooks。
  status = 'idle';
  if (audio !== null) {
    try {
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
    } catch {
      // 元素已被浏览器回收：没有需要释放的播放状态。
    }
    audio = null;
  }
  current = null;
  graphAttempted = false;
  analyser = null;
  frequencyData = null;
  if (context !== null) {
    void context.close().catch(() => {});
    context = null;
  }
}
