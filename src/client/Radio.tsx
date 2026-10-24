import * as React from 'react';

const useIsomorphicLayoutEffect = typeof window === 'undefined' ? React.useEffect : React.useLayoutEffect;

import { getStrings } from './i18n.ts';
import type { NowPlaying } from './nowPlaying.ts';
import { sampleRealSpectrum, type PlaybackStatus } from './player.ts';
import { STATIONS, stationById } from './stations.ts';
import { SPECTRUM_MODES, type SpectrumMode } from './settings.ts';
import {
  closePanel,
  closeSettings,
  nextStation,
  openSettings,
  retry,
  selectStation,
  setVolume,
  toggleMute,
  togglePanel,
  togglePlay,
  updateSettings,
  useRadioState,
  type RadioState,
} from './store.ts';

// 收起态：28 根 1.5px 小方柱、2px 间距，铺满约 94.5px，右端贴住胶囊内缘。
const COLLAPSED_BARS = 28;
const COLLAPSED_BAR_W = 1.5;
const COLLAPSED_GAP = 2;
const COLLAPSED_HEIGHT = 14;
const COLLAPSED_MIN_H = 3;
const COLLAPSED_WIDTH =
  COLLAPSED_BARS * COLLAPSED_BAR_W + (COLLAPSED_BARS - 1) * COLLAPSED_GAP;

// 面板：56 根、1.5px 宽，横向铺满 328px 内容宽（实际间距约 4.4px）。
const PANEL_BARS = 56;
const PANEL_BAR_W = 1.5;
const PANEL_WIDTH = 328;
const PANEL_HEIGHT = 20;
const PANEL_MIN_H = 4;

const NAME_SWAP_MS = 120;

type Strings = ReturnType<typeof getStrings>;
type SpectrumSize = 'bar' | 'panel';

function decorLevels(time: number, count: number): number[] {
  const phases = 16 / count;
  const levels = new Array<number>(count);
  for (let index = 0; index < count; index += 1) {
    const a = Math.abs(Math.sin(time / 460 + index * phases * 0.62));
    const b = Math.abs(Math.sin(time / 1130 + index * phases * 0.27));
    const envelope = 0.55 + 0.45 * Math.abs(Math.sin(time / 2400));
    levels[index] = Math.min(1, 0.16 + (a * 0.52 + b * 0.3) * envelope);
  }
  return levels;
}

function breathingLevels(time: number, count: number): number[] {
  const levels = new Array<number>(count);
  for (let index = 0; index < count; index += 1) {
    levels[index] = 0.1 + 0.13 * (0.5 + 0.5 * Math.sin(time / 680 + index * 0.55));
  }
  return levels;
}

/** 未播放时也保留一排矮柱，让「完整结构」始终在，但不假装在动。 */
function restingLevels(count: number): number[] {
  const levels = new Array<number>(count);
  for (let index = 0; index < count; index += 1) {
    levels[index] = 0.2 + 0.2 * (0.5 + 0.5 * Math.sin(index * 0.7));
  }
  return levels;
}

/** 把 16 个真实频段插值到 28/56 根柱子。 */
function expandLevels(levels: number[], count: number): number[] {
  if (levels.length === 0) return restingLevels(count);
  return Array.from({ length: count }, (_, index) => {
    const position = (index / Math.max(1, count - 1)) * (levels.length - 1);
    const low = Math.floor(position);
    const high = Math.min(levels.length - 1, low + 1);
    const blend = position - low;
    return levels[low] * (1 - blend) + levels[high] * blend;
  });
}

function levelsFor(
  time: number,
  count: number,
  status: PlaybackStatus,
  mode: SpectrumMode,
): number[] {
  if (status === 'loading') return breathingLevels(time, count);
  if (status === 'playing') {
    const real = mode === 'real' ? sampleRealSpectrum() : null;
    return real === null ? decorLevels(time, count) : expandLevels(real, count);
  }
  return restingLevels(count);
}

/**
 * 强调色小方柱频谱：无发光、无渐变，只靠柱高与透明度表达幅度。
 * `real` 用 AnalyserNode 数据（采样不到时退装饰动画），`decor` 纯动画，`off` 不渲染。
 */
function Spectrum({
  status,
  mode,
  size,
}: {
  status: PlaybackStatus;
  mode: SpectrumMode;
  size: SpectrumSize;
}): React.ReactElement | null {
  const panel = size === 'panel';
  const count = panel ? PANEL_BARS : COLLAPSED_BARS;
  const width = panel ? PANEL_WIDTH : COLLAPSED_WIDTH;
  const maxHeight = panel ? PANEL_HEIGHT : COLLAPSED_HEIGHT;
  const minHeight = panel ? PANEL_MIN_H : COLLAPSED_MIN_H;
  const barWidth = panel ? PANEL_BAR_W : COLLAPSED_BAR_W;
  const step = panel
    ? (PANEL_WIDTH - PANEL_BAR_W) / (PANEL_BARS - 1)
    : COLLAPSED_BAR_W + COLLAPSED_GAP;
  const animated = status === 'playing' || status === 'loading' || mode === 'decor';
  const bars = React.useRef<Array<SVGRectElement | null>>([]);

  React.useEffect(() => {
    if (mode === 'off') return undefined;
    let frame = 0;
    const paint = (time: number) => {
      const levels = levelsFor(time, count, status, mode);
      for (let index = 0; index < count; index += 1) {
        const node = bars.current[index];
        if (node === null || node === undefined) continue;
        const level = Math.max(0, Math.min(1, levels[index] ?? 0));
        const height = minHeight + level * (maxHeight - minHeight);
        node.setAttribute('y', (maxHeight - height).toFixed(2));
        node.setAttribute('height', height.toFixed(2));
        node.setAttribute('opacity', (0.35 + level * 0.65).toFixed(2));
      }
      // 静止态只画一帧；播放/加载才持续跑动画。
      if (status === 'playing' || status === 'loading') {
        frame = requestAnimationFrame(paint);
      }
    };
    frame = requestAnimationFrame(paint);
    return () => {
      cancelAnimationFrame(frame);
    };
  }, [status, mode, count, maxHeight, minHeight, animated]);

  if (mode === 'off') return null;
  return (
    <svg
      className="dsh-radio__wave"
      data-size={size}
      viewBox={`0 0 ${width} ${maxHeight}`}
      aria-hidden="true"
    >
      {Array.from({ length: count }, (_, index) => (
        <rect
          key={index}
          ref={(node) => {
            bars.current[index] = node;
          }}
          x={(index * step).toFixed(2)}
          y={maxHeight - minHeight}
          width={barWidth}
          height={minHeight}
          rx={0.4}
          opacity={0.4}
        />
      ))}
    </svg>
  );
}

function LoadingDots(): React.ReactElement {
  return (
    <span className="dsh-radio__dots" aria-hidden="true">
      <i />
      <i />
      <i />
    </span>
  );
}

function PlayIcon(): React.ReactElement {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M5.4 3.6v8.8l7-4.4-7-4.4Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PauseIcon(): React.ReactElement {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M5.6 3.6v8.8M10.4 3.6v8.8"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** 双三角 + 竖线（⏭ 风格），14px 显示、1.5px 描边。 */
function NextIcon(): React.ReactElement {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M2.4 3.8v8.4L7.6 8 2.4 3.8Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M8 3.8v8.4L13.2 8 8 3.8Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M14.4 3.4v9.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

/** 8 齿齿轮的闭合轮廓（12×12 画布），齿根 3.5、齿顶 4.85。 */
const GEAR_PATH = (() => {
  const points: string[] = [];
  const center = 6;
  const root = 3.5;
  const tip = 4.85;
  const rootHalf = 21;
  const tipHalf = 9.5;
  for (let tooth = 0; tooth < 8; tooth += 1) {
    const angle = -90 + tooth * 45;
    const corners: Array<[number, number]> = [
      [root, angle - rootHalf],
      [tip, angle - tipHalf],
      [tip, angle + tipHalf],
      [root, angle + rootHalf],
    ];
    for (const [radius, degrees] of corners) {
      const radians = (degrees * Math.PI) / 180;
      points.push(
        `${(center + radius * Math.cos(radians)).toFixed(2)} ${(
          center +
          radius * Math.sin(radians)
        ).toFixed(2)}`,
      );
    }
  }
  return `M${points.join('L')}Z`;
})();

function GearIcon(): React.ReactElement {
  return (
    <svg viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path
        d={GEAR_PATH}
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      <circle
        cx="6"
        cy="6"
        r="1.45"
        stroke="currentColor"
        strokeWidth="1.4"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

function SpeakerIcon({ muted }: { muted: boolean }): React.ReactElement {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M3 6.1h2.2L8.4 3.5v9L5.2 9.9H3V6.1Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      {muted ? (
        <path
          d="M10.5 6.1l3.2 3.8M13.7 6.1l-3.2 3.8"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinecap="round"
        />
      ) : (
        <>
          <path
            d="M10.7 6.2a2.6 2.6 0 0 1 0 3.6"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinecap="round"
          />
          <path
            d="M12.4 4.8a4.5 4.5 0 0 1 0 6.4"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinecap="round"
          />
        </>
      )}
    </svg>
  );
}

function Switch({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}): React.ReactElement {
  return (
    <button
      type="button"
      role="switch"
      className="dsh-radio__switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => {
        onChange(!checked);
      }}
    />
  );
}

function SettingsView({ state, t }: { state: RadioState; t: Strings }): React.ReactElement {
  return (
    <div className="dsh-radio__settings">
      <div className="dsh-radio__setting">
        <span className="dsh-radio__setting-label">{t.mediaKeys}</span>
        <Switch
          label={t.mediaKeys}
          checked={state.settings.mediaKeys}
          onChange={(mediaKeys) => {
            updateSettings({ mediaKeys });
          }}
        />
      </div>
      <div className="dsh-radio__setting">
        <span className="dsh-radio__setting-label">{t.spectrum}</span>
        <div className="dsh-radio__seg" role="group" aria-label={t.spectrum}>
          {SPECTRUM_MODES.map((spectrum) => (
            <button
              key={spectrum}
              type="button"
              data-active={state.settings.spectrum === spectrum}
              aria-pressed={state.settings.spectrum === spectrum}
              onClick={() => {
                updateSettings({ spectrum });
              }}
            >
              {t.spectrumOption[spectrum]}
            </button>
          ))}
        </div>
      </div>
      <div className="dsh-radio__setting">
        <span className="dsh-radio__setting-label">{t.remember}</span>
        <Switch
          label={t.remember}
          checked={state.settings.remember}
          onChange={(remember) => {
            updateSettings({ remember });
          }}
        />
      </div>
    </div>
  );
}

function StationList({ state, t }: { state: RadioState; t: Strings }): React.ReactElement {
  return (
    <ul className="dsh-radio__list" aria-label={t.panelLabel}>
      {STATIONS.map((station) => (
        <li key={station.id}>
          <button
            type="button"
            className="dsh-radio__row"
            data-current={state.stationId === station.id}
            aria-current={state.stationId === station.id}
            onClick={() => {
              selectStation(station.id);
            }}
          >
            <span className="dsh-radio__row-name">{station.name}</span>
            <span className="dsh-radio__row-src">{station.provider}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}

/** 一行曲目：有 artist 时 `Artist — Title`，否则只显示 title。 */
function trackLine(track: NowPlaying): string {
  return track.artist === undefined ? track.title : `${track.artist} — ${track.title}`;
}

function VolumeBar({ state, t }: { state: RadioState; t: Strings }): React.ReactElement {
  const active = state.status === 'playing' || state.status === 'loading';
  return (
    <div className="dsh-radio__volume">
      <div className="dsh-radio__transport">
        <button
          type="button"
          className="dsh-radio__transport-btn"
          aria-label={state.status === 'error' ? t.retry : active ? t.pauseAria : t.playAria}
          onClick={() => {
            if (state.status === 'error') retry();
            else togglePlay();
          }}
        >
          {active ? <PauseIcon /> : <PlayIcon />}
        </button>
        <button
          type="button"
          className="dsh-radio__transport-btn"
          aria-label={t.nextAria}
          onClick={nextStation}
        >
          <NextIcon />
        </button>
      </div>
      <div className="dsh-radio__volume-controls">
        <button
          type="button"
          className="dsh-radio__mute"
          aria-label={state.muted ? t.unmute : t.mute}
          aria-pressed={state.muted}
          onClick={toggleMute}
        >
          <SpeakerIcon muted={state.muted} />
        </button>
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={Math.round(state.volume * 100)}
          aria-label={t.volume}
          onChange={(event) => {
            setVolume(Number(event.currentTarget.value) / 100);
          }}
        />
        <span className="dsh-radio__volume-value">{Math.round(state.volume * 100)}</span>
      </div>
    </div>
  );
}

function Panel({
  state,
  t,
  style,
}: {
  state: RadioState;
  t: Strings;
  style?: React.CSSProperties;
}): React.ReactElement {
  const station = stationById(state.stationId);
  return (
    <div className="dsh-radio__panel" role="dialog" aria-label={t.panelLabel} style={style}>
      <div className="dsh-radio__panel-head">
        {state.settingsOpen ? (
          <>
            <button
              type="button"
              className="dsh-radio__back"
              aria-label={t.back}
              onClick={closeSettings}
            >
              ‹
            </button>
            <span className="dsh-radio__kicker">{t.settingsLabel}</span>
          </>
        ) : (
          <>
            <span className="dsh-radio__kicker">{t.status[state.status]}</span>
            <span className="dsh-radio__now">{station.name}</span>
            <span className="dsh-radio__provider">{station.provider}</span>
            <button
              type="button"
              className="dsh-radio__gear"
              aria-label={t.settingsLabel}
              onClick={openSettings}
            >
              <GearIcon />
            </button>
          </>
        )}
      </div>
      {state.settingsOpen ? <SettingsView state={state} t={t} /> : <StationList state={state} t={t} />}
      <div className="dsh-radio__band">
        <Spectrum status={state.status} mode={state.settings.spectrum} size="panel" />
      </div>
      {state.nowPlaying !== null && state.nowPlaying.stationId === state.stationId ? (
        <div className="dsh-radio__track" aria-label={t.nowPlaying}>
          <span className="dsh-radio__track-mark" aria-hidden="true">
            ♪
          </span>
          <span className="dsh-radio__track-text">{trackLine(state.nowPlaying)}</span>
        </div>
      ) : null}
      <VolumeBar state={state} t={t} />
    </div>
  );
}

function RadioSurface({ state }: { state: RadioState }): React.ReactElement {
  const t = getStrings();
  const root = React.useRef<HTMLDivElement>(null);
  const station = stationById(state.stationId);
  const error = state.status === 'error';
  const active = state.status === 'playing' || state.status === 'loading';
  // 台名始终显示当前台；失败时在原位置换成重试文案。
  const label = error ? t.retry : station.name;
  const [shownLabel, setShownLabel] = React.useState(label);
  const [phase, setPhase] = React.useState<'in' | 'out'>('in');
  const [anchor, setAnchor] = React.useState<{ left: number; bottom: number } | null>(null);

  React.useEffect(() => {
    if (label === shownLabel) return undefined;
    setPhase('out');
    const timer = window.setTimeout(() => {
      setShownLabel(label);
      setPhase('in');
    }, NAME_SWAP_MS);
    return () => {
      window.clearTimeout(timer);
    };
  }, [label, shownLabel]);

  // 面板用视口坐标（fixed）定位：composer 容器是 overflow:auto，绝对定位会被裁掉。
  // 跟随胶囊锚点，并保证面板在视口内。
  useIsomorphicLayoutEffect(() => {
    if (!state.panelOpen) {
      setAnchor(null);
      return undefined;
    }
    const update = () => {
      const node = root.current;
      if (node === null) return;
      const rect = node.getBoundingClientRect();
      const width = Math.min(360, window.innerWidth - 16);
      const margin = 8;
      const left = Math.min(
        Math.max(margin, rect.left),
        Math.max(margin, window.innerWidth - width - margin),
      );
      setAnchor({ left, bottom: window.innerHeight - rect.top + 6 });
    };
    update();
    window.addEventListener('resize', update);
    // 捕获阶段监听所有滚动容器（聊天区、输入框）。
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [state.panelOpen]);

  React.useEffect(() => {
    if (!state.panelOpen) return undefined;
    const onPointerDown = (event: PointerEvent) => {
      if (root.current !== null && !root.current.contains(event.target as Node)) closePanel();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closePanel();
    };
    document.addEventListener('pointerdown', onPointerDown, true);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [state.panelOpen]);

  const onSurfaceClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest('button') !== null) return;
    togglePanel();
  };

  return (
    <div
      ref={root}
      className="dsh-radio"
      data-status={state.status}
      data-expanded={state.panelOpen ? 'true' : 'false'}
    >
      {state.panelOpen && anchor !== null ? (
        <Panel state={state} t={t} style={{ left: anchor.left, bottom: anchor.bottom }} />
      ) : null}
      <div className="dsh-radio__pill" onClick={onSurfaceClick}>
        <button
          type="button"
          className="dsh-radio__play"
          aria-label={error ? t.retry : active ? t.pauseAria : t.playAria}
          onClick={(event) => {
            event.stopPropagation();
            if (error) retry();
            else togglePlay();
          }}
        >
          {active ? <PauseIcon /> : <PlayIcon />}
        </button>
        <button
          type="button"
          className="dsh-radio__next"
          aria-label={t.nextAria}
          title={t.nextAria}
          onClick={(event) => {
            event.stopPropagation();
            nextStation();
          }}
        >
          <NextIcon />
        </button>
        <button
          type="button"
          className="dsh-radio__body"
          aria-haspopup="dialog"
          aria-expanded={state.panelOpen}
          aria-label={t.panelAria(station.name)}
          onClick={(event) => {
            event.stopPropagation();
            togglePanel();
          }}
        >
          {error ? <span className="dsh-radio__dot dsh-radio__dot--error" aria-hidden="true" /> : null}
          <span
            className="dsh-radio__name"
            data-phase={phase}
            onClick={
              error
                ? (event) => {
                    event.stopPropagation();
                    retry();
                  }
                : undefined
            }
          >
            {shownLabel}
          </span>
          {state.status === 'loading' ? <LoadingDots /> : null}
        </button>
        <Spectrum status={state.status} mode={state.settings.spectrum} size="bar" />
      </div>
    </div>
  );
}

export function DockRadio(): React.ReactElement {
  const state = useRadioState();
  return <RadioSurface state={state} />;
}
