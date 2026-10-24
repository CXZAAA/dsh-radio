import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  DEFAULT_STATION_ID,
  STATIONS,
  findStation,
  stationById,
} from '../src/client/stations.ts';

test('内置电台：7 条、顺序固定、id 唯一', () => {
  assert.equal(STATIONS.length, 7);
  assert.deepEqual(
    STATIONS.map((station) => station.id),
    ['chillsynth', 'nightride', 'darksynth', 'spacesynth', 'main', 'mellow', 'eve'],
  );
  assert.equal(new Set(STATIONS.map((station) => station.id)).size, STATIONS.length);
});

test('主地址均 HTTPS 且不是 HLS', () => {
  for (const station of STATIONS) {
    assert.match(station.url, /^https:\/\//, `${station.id} 主地址必须是 https`);
    assert.ok(!station.url.includes('.m3u8'), `${station.id} 主地址不能是 HLS`);
    if (station.fallbackUrl !== undefined) {
      assert.ok(!station.fallbackUrl.includes('.m3u8'), `${station.id} 备用地址不能是 HLS`);
    }
  }
});

test('主备地址全局不重复，且备用不等于主地址', () => {
  const seen = new Map<string, string>();
  for (const station of STATIONS) {
    const urls = [station.url, ...(station.fallbackUrl === undefined ? [] : [station.fallbackUrl])];
    for (const url of urls) {
      const owner = seen.get(url);
      assert.equal(owner, undefined, `${url} 同时出现在 ${owner ?? ''} 与 ${station.id}`);
      seen.set(url, station.id);
    }
    if (station.fallbackUrl !== undefined) {
      assert.notEqual(station.fallbackUrl, station.url);
    }
  }
});

test('默认台与查找回落', () => {
  assert.equal(DEFAULT_STATION_ID, 'chillsynth');
  assert.equal(stationById(DEFAULT_STATION_ID).name, 'ChillSynth');
  assert.equal(stationById('does-not-exist').id, 'chillsynth');
  assert.equal(findStation('does-not-exist'), undefined);
  assert.equal(findStation(null), undefined);
  assert.equal(findStation('main')?.fallbackUrl, 'https://stream.radioparadise.com/aac-128');
});
