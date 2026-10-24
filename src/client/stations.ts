/**
 * 预置电台。顺序即面板列表顺序；第一条是默认台，也是无记忆时的预缓冲目标。
 * 数据以本文件为准（docs/spec-v0.1.md 的频道表）。
 */
export interface Station {
  readonly id: string;
  readonly name: string;
  readonly provider: string;
  /** 主地址；全部 HTTPS、CORS `*`、渐进式（非 HLS）。 */
  readonly url: string;
  /** 备用流；主地址失败时静默切换一次。 */
  readonly fallbackUrl?: string;
}

export const STATIONS: readonly Station[] = [
  {
    id: 'chillsynth',
    name: 'ChillSynth',
    provider: 'Nightride FM',
    url: 'https://stream.nightride.fm/chillsynth.mp3',
  },
  {
    id: 'nightride',
    name: 'Nightride',
    provider: 'Nightride FM',
    url: 'https://stream.nightride.fm/nightride.mp3',
  },
  {
    id: 'darksynth',
    name: 'Darksynth',
    provider: 'Nightride FM',
    url: 'https://stream.nightride.fm/darksynth.mp3',
  },
  {
    id: 'spacesynth',
    name: 'Spacesynth',
    provider: 'Nightride FM',
    url: 'https://stream.nightride.fm/spacesynth.mp3',
  },
  {
    id: 'main',
    name: 'Main Mix',
    provider: 'Radio Paradise',
    url: 'https://stream.radioparadise.com/aac-320',
    fallbackUrl: 'https://stream.radioparadise.com/aac-128',
  },
  {
    id: 'mellow',
    name: 'Mellow Mix',
    provider: 'Radio Paradise',
    url: 'https://stream.radioparadise.com/mellow-128',
    fallbackUrl: 'https://stream.radioparadise.com/mellow-320',
  },
  {
    id: 'eve',
    name: 'EVE Radio',
    provider: 'GamingNow',
    url: 'https://media01.gamingnow.net:8010/erweb.mp3',
    // 8000 端口只有 http；dsh-web 部署在 https 下时该备用会被混合内容策略拦掉。
    fallbackUrl: 'http://media01.gamingnow.net:8000/er.mp3',
  },
];

export const DEFAULT_STATION_ID = STATIONS[0].id;

/** 严格查找：用于「记住上次电台」里可能已失效的 id。 */
export function findStation(id: string | null | undefined): Station | undefined {
  if (id === null || id === undefined || id === '') return undefined;
  return STATIONS.find((station) => station.id === id);
}

/** 宽松查找：未知名回落到默认台，界面永远有一条可播的条目。 */
export function stationById(id: string | null | undefined): Station {
  return findStation(id) ?? STATIONS[0];
}
