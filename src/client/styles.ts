/**
 * B 版（静音条）样式。颜色只取 `--dsw-*` 主题变量；失败红是唯一例外，
 * 并且也只作为主题 danger token 的兜底出现。频谱只用强调色柱体，不加发光/渐变。
 */
const CSS = `
.dsh-radio {
  --name-w: 62px;
  --dsh-radio-ease: cubic-bezier(.4, 0, .2, 1);
  --dsh-radio-accent: var(--dsw-alias-state-business-primary, var(--dsw-static-deepseek-450));
  /* 面板内容左右内边距：频谱带与曲目行共用，避免两处各写一个值后漂移。 */
  --dsh-radio-panel-pad: 16px;
  position: relative;
  z-index: 60;
  display: inline-flex;
  align-items: center;
  flex: none;
  font-family: var(--dsw-font-family);
  color: var(--dsw-alias-label-primary);
  font-size: 11px;
  line-height: 1;
}
.dsh-radio *,
.dsh-radio *::before,
.dsh-radio *::after { box-sizing: border-box; }
.dsh-radio button { font: inherit; color: inherit; margin: 0; }
.dsh-radio button:focus-visible {
  outline: 2px solid var(--dsw-alias-label-secondary);
  outline-offset: 2px;
}

/* ---------- 收起态胶囊 ---------- */
.dsh-radio__pill {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  height: 24px;
  padding: 0 8px 0 7px;
  border: 1px solid var(--dsw-alias-border-l1);
  border-radius: 999px;
  background: var(--dsw-alias-bg-layer-1);
  color: var(--dsw-alias-label-tertiary);
  white-space: nowrap;
  transition:
    background .15s var(--dsh-radio-ease),
    border-color .15s var(--dsh-radio-ease),
    color .15s var(--dsh-radio-ease);
}
.dsh-radio__pill:hover {
  background: var(--dsw-alias-bg-layer-2);
  border-color: var(--dsw-alias-border-l2);
  color: var(--dsw-alias-label-secondary);
}
.dsh-radio[data-expanded="true"] .dsh-radio__pill {
  background: var(--dsw-alias-bg-layer-3);
  border-color: var(--dsw-alias-border-l3);
  color: var(--dsw-alias-label-secondary);
}
.dsh-radio[data-expanded="true"] .dsh-radio__pill:hover {
  background: var(--dsw-alias-bg-layer-3);
  border-color: var(--dsw-alias-border-l3);
}

/* ---------- 播放 / 下一台 ---------- */
.dsh-radio__play,
.dsh-radio__next {
  position: relative;
  display: grid;
  place-items: center;
  flex: none;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--dsw-alias-label-caption);
  cursor: pointer;
  transition: color .15s var(--dsh-radio-ease);
}
.dsh-radio__play {
  width: 16px;
  height: 16px;
  border-radius: 50%;
}
.dsh-radio__play::after {
  content: "";
  position: absolute;
  inset: -4px;
  border-radius: 50%;
}
.dsh-radio__next {
  width: 18px;
  height: 24px;
  border-radius: 4px;
}
.dsh-radio__next::after {
  content: "";
  position: absolute;
  inset: 0 -3px;
}
.dsh-radio__play svg { width: 10px; height: 10px; display: block; }
.dsh-radio__next svg { width: 14px; height: 14px; display: block; }
.dsh-radio__pill:hover .dsh-radio__play,
.dsh-radio__pill:hover .dsh-radio__next { color: var(--dsw-alias-label-secondary); }
.dsh-radio[data-status="playing"] .dsh-radio__play,
.dsh-radio[data-status="loading"] .dsh-radio__play { color: var(--dsw-alias-label-secondary); }
.dsh-radio[data-status="error"] .dsh-radio__play {
  color: var(--dsw-alias-state-error-primary, #E5484D);
}

/* ---------- 台名 / 状态点 / 加载脉冲 ---------- */
.dsh-radio__body {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  height: 24px;
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
  cursor: pointer;
  white-space: nowrap;
}
.dsh-radio__name {
  display: inline-block;
  min-width: var(--name-w);
  max-width: 132px;
  overflow: hidden;
  font-size: 11px;
  font-weight: 500;
  line-height: 1;
  letter-spacing: .005em;
  color: var(--dsw-alias-label-tertiary);
  text-overflow: ellipsis;
  text-align: left;
}
.dsh-radio[data-status="paused"] .dsh-radio__name,
.dsh-radio[data-status="playing"] .dsh-radio__name,
.dsh-radio[data-status="loading"] .dsh-radio__name {
  color: var(--dsw-alias-label-secondary);
}
.dsh-radio[data-status="error"] .dsh-radio__name {
  max-width: 152px;
  color: var(--dsw-alias-state-error-primary, #E5484D);
}
.dsh-radio[data-status="error"] .dsh-radio__name:hover {
  text-decoration: underline;
  text-underline-offset: 3px;
}
.dsh-radio__name[data-phase="out"] { animation: dsh-radio-name-out 120ms var(--dsh-radio-ease) forwards; }
.dsh-radio__name[data-phase="in"] { animation: dsh-radio-name-in 180ms var(--dsh-radio-ease) both; }
@keyframes dsh-radio-name-out { from { opacity: 1; } to { opacity: 0; } }
@keyframes dsh-radio-name-in { from { opacity: 0; } to { opacity: 1; } }

.dsh-radio__dot {
  width: 4px;
  height: 4px;
  flex: none;
  border-radius: 50%;
  background: var(--dsh-radio-accent);
}
.dsh-radio__dot--error {
  background: var(--dsw-alias-state-error-primary, #E5484D);
}
.dsh-radio__dots {
  display: inline-flex;
  align-items: center;
  gap: 3px;
}
.dsh-radio__dots i {
  display: block;
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: var(--dsw-alias-label-caption);
  animation: dsh-radio-dot 1.2s infinite var(--dsh-radio-ease);
}
.dsh-radio__dots i:nth-child(2) { animation-delay: .16s; }
.dsh-radio__dots i:nth-child(3) { animation-delay: .32s; }
@keyframes dsh-radio-dot {
  0%, 100% { opacity: .25; transform: scale(.8); }
  45% { opacity: 1; transform: scale(1); }
}

/* ---------- 频谱：强调色小方柱 ---------- */
.dsh-radio__wave {
  flex: none;
  fill: var(--dsh-radio-accent);
  animation: dsh-radio-wave-in 180ms var(--dsh-radio-ease) both;
}
.dsh-radio__wave[data-size="bar"] {
  width: 95px;
  height: 14px;
}
.dsh-radio__wave[data-size="panel"] {
  width: 100%;
  height: 20px;
}
@keyframes dsh-radio-wave-in { from { opacity: 0; } to { opacity: 1; } }

/* ---------- 面板 ---------- */
.dsh-radio__panel {
  /* 视口定位：composer 容器是 overflow:auto，绝对定位会被裁掉。
     left/bottom 由组件按胶囊锚点实时计算。 */
  position: fixed;
  z-index: 1000;
  width: 360px;
  max-width: calc(100vw - 32px);
  padding: 0 0 6px;
  border: 1px solid var(--dsw-alias-border-l2);
  border-radius: 12px;
  background: var(--dsw-alias-bg-layer-1);
  box-shadow: var(--dsw-shadow-lv3);
  color: var(--dsw-alias-label-primary);
  animation: dsh-radio-panel-in 150ms var(--dsh-radio-ease) both;
}
@keyframes dsh-radio-panel-in {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: none; }
}

.dsh-radio__panel-head {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 32px;
  padding: 0 10px 0 17px;
  border-bottom: 1px solid var(--dsw-alias-border-l1);
}
.dsh-radio__kicker {
  flex: none;
  font-size: 11px;
  line-height: 1;
  letter-spacing: .02em;
  color: var(--dsw-alias-label-caption);
}
.dsh-radio__now {
  overflow: hidden;
  font-size: 11px;
  font-weight: 500;
  line-height: 1;
  color: var(--dsw-alias-label-primary);
  text-overflow: ellipsis;
  white-space: nowrap;
}
.dsh-radio__provider {
  margin-left: auto;
  overflow: hidden;
  font-size: 10px;
  line-height: 1;
  letter-spacing: .01em;
  color: var(--dsw-alias-label-caption);
  text-overflow: ellipsis;
  white-space: nowrap;
}
.dsh-radio__gear,
.dsh-radio__back {
  display: grid;
  place-items: center;
  width: 22px;
  height: 22px;
  flex: none;
  padding: 0;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--dsw-alias-label-caption);
  cursor: pointer;
}
.dsh-radio__gear { margin-left: 2px; }
.dsh-radio__back {
  width: 18px;
  margin-left: -4px;
  font-size: 14px;
  line-height: 1;
}
.dsh-radio__gear:hover,
.dsh-radio__back:hover {
  background: var(--dsw-alias-interactive-bg-hover);
  color: var(--dsw-alias-label-secondary);
}
.dsh-radio__gear svg { width: 12px; height: 12px; display: block; }

/* ---------- 电台列表 ---------- */
.dsh-radio__list {
  margin: 0;
  padding: 4px 0 2px;
  list-style: none;
}
.dsh-radio__row {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  height: 28px;
  padding: 0 14px 0 17px;
  border: 0;
  background: transparent;
  color: var(--dsw-alias-label-tertiary);
  text-align: left;
  cursor: pointer;
  transition: background .12s var(--dsh-radio-ease), color .12s var(--dsh-radio-ease);
}
.dsh-radio__row::before {
  content: "";
  position: absolute;
  left: 6px;
  top: 6px;
  bottom: 6px;
  width: 2px;
  border-radius: 1px;
  background: transparent;
}
.dsh-radio__row:hover {
  background: var(--dsw-alias-interactive-bg-hover);
  color: var(--dsw-alias-label-secondary);
}
.dsh-radio__row[data-current="true"] { color: var(--dsw-alias-label-primary); }
.dsh-radio__row[data-current="true"]::before { background: var(--dsw-alias-label-tertiary); }
.dsh-radio__row-name {
  font-size: 11.5px;
  font-weight: 450;
  line-height: 1;
  letter-spacing: .005em;
  white-space: nowrap;
}
.dsh-radio__row[data-current="true"] .dsh-radio__row-name { font-weight: 550; }
.dsh-radio__row-src {
  margin-left: auto;
  overflow: hidden;
  font-size: 10px;
  line-height: 1;
  letter-spacing: .01em;
  color: var(--dsw-alias-label-caption);
  text-overflow: ellipsis;
  white-space: nowrap;
}
.dsh-radio__row[data-current="true"] .dsh-radio__row-src {
  color: var(--dsw-alias-label-tertiary);
}

/* ---------- 面板频谱带 ---------- */
.dsh-radio__band {
  padding: 9px var(--dsh-radio-panel-pad);
}

/* ---------- 当前曲目：频谱下、音量上的一行 ---------- */
.dsh-radio__track {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 20px;
  padding: 0 var(--dsh-radio-panel-pad);
  overflow: hidden;
  font-size: 10.5px;
  line-height: 1;
  color: var(--dsw-alias-label-tertiary);
}
.dsh-radio__track-mark {
  flex: none;
  font-size: 11px;
  line-height: 1;
  color: var(--dsw-alias-label-caption);
}
.dsh-radio__track-text {
  min-width: 0;
  overflow: hidden;
  letter-spacing: .005em;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ---------- 设置 ---------- */
.dsh-radio__setting {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 32px;
  padding: 4px 14px 4px 17px;
}
.dsh-radio__settings { padding: 4px 0 2px; }
.dsh-radio__setting-label {
  min-width: 0;
  flex: 1;
  font-size: 11.5px;
  line-height: 1;
  color: var(--dsw-alias-label-secondary);
  white-space: nowrap;
}
.dsh-radio__seg {
  display: inline-flex;
  flex: none;
  overflow: hidden;
  border: 1px solid var(--dsw-alias-border-l1);
  border-radius: 7px;
}
.dsh-radio__seg button {
  height: 20px;
  padding: 0 7px;
  border: 0;
  background: transparent;
  font-size: 10px;
  line-height: 1;
  color: var(--dsw-alias-label-caption);
  cursor: pointer;
  white-space: nowrap;
}
.dsh-radio__seg button + button { border-left: 1px solid var(--dsw-alias-border-l1); }
.dsh-radio__seg button:hover { color: var(--dsw-alias-label-secondary); }
.dsh-radio__seg button[data-active="true"] {
  background: var(--dsw-alias-bg-layer-3);
  color: var(--dsw-alias-label-primary);
}
.dsh-radio__switch {
  position: relative;
  width: 28px;
  height: 16px;
  flex: none;
  margin-left: auto;
  padding: 0;
  border: 0;
  border-radius: 999px;
  background: var(--dsw-alias-border-l4);
  cursor: pointer;
  transition: background .15s var(--dsh-radio-ease);
}
.dsh-radio__switch::after {
  content: "";
  position: absolute;
  top: 2px;
  left: 2px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--dsw-alias-bg-layer-1);
  transition: transform .15s var(--dsh-radio-ease);
}
.dsh-radio__switch[aria-checked="true"] { background: var(--dsw-alias-label-tertiary); }
.dsh-radio__switch[aria-checked="true"]::after { transform: translateX(12px); }

/* ---------- 音量：紧凑一行，右对齐 ---------- */
.dsh-radio__volume {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  height: 30px;
  margin-top: 2px;
  padding: 0 14px 0 13px;
  border-top: 1px solid var(--dsw-alias-border-l1);
}
.dsh-radio__transport {
  display: flex;
  align-items: center;
  gap: 2px;
  flex: none;
}
.dsh-radio__transport-btn {
  display: grid;
  place-items: center;
  width: 22px;
  height: 22px;
  flex: none;
  padding: 0;
  border: 0;
  border-radius: 4px;
  background: transparent;
  color: var(--dsw-alias-label-tertiary);
  cursor: pointer;
  transition: background .15s var(--dsh-radio-ease), color .15s var(--dsh-radio-ease);
}
.dsh-radio__transport-btn:hover {
  background: var(--dsw-alias-interactive-bg-hover);
  color: var(--dsw-alias-label-primary);
}
.dsh-radio__transport-btn svg { width: 13px; height: 13px; display: block; }
.dsh-radio__volume-controls {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}
.dsh-radio__mute {
  display: grid;
  place-items: center;
  width: 20px;
  height: 20px;
  flex: none;
  padding: 0;
  border: 0;
  border-radius: 4px;
  background: transparent;
  color: var(--dsw-alias-label-tertiary);
  cursor: pointer;
}
.dsh-radio__mute:hover {
  background: var(--dsw-alias-interactive-bg-hover);
  color: var(--dsw-alias-label-primary);
}
.dsh-radio__mute svg { width: 14px; height: 14px; display: block; }
.dsh-radio__mute[aria-pressed="true"] { color: var(--dsw-alias-label-caption); }
.dsh-radio__volume input[type="range"] {
  width: 112px;
  flex: none;
  height: 2px;
  margin: 0;
  border-radius: 2px;
  outline: none;
  background: var(--dsw-alias-border-l4);
  cursor: pointer;
  -webkit-appearance: none;
  appearance: none;
}
.dsh-radio__volume input[type="range"]:focus-visible {
  outline: 2px solid var(--dsw-alias-label-secondary);
  outline-offset: 3px;
}
.dsh-radio__volume input[type="range"]::-webkit-slider-thumb {
  width: 9px;
  height: 9px;
  border: 0;
  border-radius: 50%;
  background: var(--dsw-alias-label-secondary);
  box-shadow: 0 0 0 1px var(--dsw-alias-border-l3);
  -webkit-appearance: none;
  appearance: none;
}
.dsh-radio__volume input[type="range"]::-moz-range-thumb {
  width: 9px;
  height: 9px;
  border: 0;
  border-radius: 50%;
  background: var(--dsw-alias-label-secondary);
}
.dsh-radio__volume-value {
  min-width: 20px;
  flex: none;
  font-size: 10px;
  line-height: 1;
  color: var(--dsw-alias-label-caption);
  text-align: right;
  font-variant-numeric: tabular-nums;
}
`;

/** 注入 `<style data-dsh-radio>`；返回的 disposer 在插件卸载时移除它。 */
export function installStyles(): () => void {
  if (typeof document === 'undefined') return () => {};
  const style = document.createElement('style');
  style.setAttribute('data-dsh-radio', '');
  style.textContent = CSS;
  document.head.appendChild(style);
  return () => {
    style.remove();
  };
}
