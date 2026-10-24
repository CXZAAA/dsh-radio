/**
 * 设置与本地存储的解析规则。这里不碰 window，便于 node:test 直接校验。
 */
export type SpectrumMode = 'real' | 'decor' | 'off';

export interface Settings {
  mediaKeys: boolean;
  spectrum: SpectrumMode;
  remember: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  mediaKeys: true,
  spectrum: 'real',
  remember: true,
};

export const DEFAULT_VOLUME = 0.7;

export const STORAGE_KEYS = {
  lastStation: 'dsh-radio:lastStation',
  volume: 'dsh-radio:volume',
  muted: 'dsh-radio:muted',
  settings: 'dsh-radio:settings',
} as const;

/** 频谱样式选项；界面分段控件与设置解析共用这一份顺序。 */
export const SPECTRUM_MODES: readonly SpectrumMode[] = ['real', 'decor', 'off'];

function isSpectrumMode(value: unknown): value is SpectrumMode {
  return typeof value === 'string' && (SPECTRUM_MODES as readonly string[]).includes(value);
}

/** 损坏、缺失或字段非法的设置逐项回落到默认值，不整份丢弃。 */
export function parseSettings(raw: string | null): Settings {
  if (raw === null || raw === '') return { ...DEFAULT_SETTINGS };
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
  if (typeof value !== 'object' || value === null) return { ...DEFAULT_SETTINGS };
  const record = value as Record<string, unknown>;
  // 旧版本设置里可能还有 `placement`：不认识就忽略，不报错、不迁移。
  return {
    mediaKeys: typeof record.mediaKeys === 'boolean' ? record.mediaKeys : DEFAULT_SETTINGS.mediaKeys,
    spectrum: isSpectrumMode(record.spectrum) ? record.spectrum : DEFAULT_SETTINGS.spectrum,
    remember: typeof record.remember === 'boolean' ? record.remember : DEFAULT_SETTINGS.remember,
  };
}

/** 音量按 0–1 存储；越界钳制，非法值回落到默认。 */
export function parseVolume(raw: string | null): number {
  if (raw === null || raw.trim() === '') return DEFAULT_VOLUME;
  const value = Number(raw);
  if (!Number.isFinite(value)) return DEFAULT_VOLUME;
  return Math.min(1, Math.max(0, value));
}

export function parseMuted(raw: string | null): boolean {
  return raw === '1' || raw === 'true';
}

/** 存储里只认 `1` / `0`，避免把任意字符串写回去。 */
export function serializeMuted(muted: boolean): string {
  return muted ? '1' : '0';
}
