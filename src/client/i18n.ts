import type { SpectrumMode } from './settings.ts';

/** 中文是默认语言；`navigator.language` 明确不是 zh 时切英文。 */
interface Strings {
  appName: string;
  panelLabel: string;
  settingsLabel: string;
  back: string;
  status: Record<'idle' | 'loading' | 'playing' | 'paused' | 'error', string>;
  retry: string;
  playAria: string;
  pauseAria: string;
  nextAria: string;
  panelAria: (stationName: string) => string;
  nowPlaying: string;
  volume: string;
  mute: string;
  unmute: string;
  mediaKeys: string;
  spectrum: string;
  spectrumOption: Record<SpectrumMode, string>;
  remember: string;
}

const zh: Strings = {
  appName: 'DSH 电台',
  panelLabel: '电台面板',
  settingsLabel: '播放设置',
  back: '返回',
  status: {
    idle: '待机',
    loading: '连接中…',
    playing: '正在播放',
    paused: '已暂停',
    error: '连接失败',
  },
  retry: '连接失败，点击重试',
  playAria: '播放',
  pauseAria: '暂停',
  nextAria: '下一个电台',
  panelAria: (stationName) => `电台面板：${stationName}`,
  nowPlaying: '正在播放',
  volume: '音量',
  mute: '静音',
  unmute: '取消静音',
  mediaKeys: '系统媒体键',
  spectrum: '频谱样式',
  spectrumOption: {
    real: '真实',
    decor: '装饰',
    off: '关闭',
  },
  remember: '记住上次电台',
};

const en: Strings = {
  appName: 'DSH Radio',
  panelLabel: 'Radio panel',
  settingsLabel: 'Playback settings',
  back: 'Back',
  status: {
    idle: 'Idle',
    loading: 'Connecting…',
    playing: 'Now playing',
    paused: 'Paused',
    error: 'Connection failed',
  },
  retry: 'Connection failed · click to retry',
  playAria: 'Play',
  pauseAria: 'Pause',
  nextAria: 'Next station',
  panelAria: (stationName) => `Radio panel · ${stationName}`,
  nowPlaying: 'Now playing',
  volume: 'Volume',
  mute: 'Mute',
  unmute: 'Unmute',
  mediaKeys: 'Media keys',
  spectrum: 'Spectrum',
  spectrumOption: {
    real: 'Live',
    decor: 'Decorative',
    off: 'Off',
  },
  remember: 'Remember station',
};

let cached: Strings | undefined;

export function getStrings(): Strings {
  if (cached !== undefined) return cached;
  const language =
    typeof navigator !== 'undefined' && typeof navigator.language === 'string'
      ? navigator.language.toLowerCase()
      : 'zh';
  cached = language.startsWith('zh') ? zh : en;
  return cached;
}
