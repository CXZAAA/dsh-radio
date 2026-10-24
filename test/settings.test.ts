import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  DEFAULT_SETTINGS,
  DEFAULT_VOLUME,
  STORAGE_KEYS,
  parseMuted,
  parseSettings,
  parseVolume,
  serializeMuted,
} from '../src/client/settings.ts';

test('设置缺失或损坏时回到默认值', () => {
  assert.deepEqual(parseSettings(null), DEFAULT_SETTINGS);
  assert.deepEqual(parseSettings(''), DEFAULT_SETTINGS);
  assert.deepEqual(parseSettings('{'), DEFAULT_SETTINGS);
  assert.deepEqual(parseSettings('null'), DEFAULT_SETTINGS);
  assert.deepEqual(parseSettings('"text"'), DEFAULT_SETTINGS);
  assert.deepEqual(DEFAULT_SETTINGS, {
    mediaKeys: true,
    spectrum: 'real',
    remember: true,
  });
});

test('设置逐字段校验，非法字段回落到默认值', () => {
  assert.deepEqual(
    parseSettings(
      JSON.stringify({
        mediaKeys: false,
        spectrum: 'decor',
        remember: false,
      }),
    ),
    { mediaKeys: false, spectrum: 'decor', remember: false },
  );

  assert.deepEqual(
    parseSettings(
      JSON.stringify({
        mediaKeys: 'yes',
        spectrum: 'live',
        remember: 1,
      }),
    ),
    DEFAULT_SETTINGS,
  );

  assert.deepEqual(
    parseSettings(JSON.stringify({ spectrum: 'off', extra: true })),
    { ...DEFAULT_SETTINGS, spectrum: 'off' },
  );
});

test('旧版本设置里的 placement 被忽略，不报错也不写回', () => {
  assert.deepEqual(
    parseSettings(JSON.stringify({ placement: 'overlay', mediaKeys: false })),
    { ...DEFAULT_SETTINGS, mediaKeys: false },
  );
  assert.deepEqual(
    parseSettings(JSON.stringify({ placement: 'sidebar', remember: false })),
    { ...DEFAULT_SETTINGS, remember: false },
  );
  assert.deepEqual(parseSettings(JSON.stringify({ placement: 'dock' })), DEFAULT_SETTINGS);
});

test('音量按 0–1 解析并钳制', () => {
  assert.equal(parseVolume(null), DEFAULT_VOLUME);
  assert.equal(parseVolume(''), DEFAULT_VOLUME);
  assert.equal(parseVolume('abc'), DEFAULT_VOLUME);
  assert.equal(parseVolume('0.35'), 0.35);
  assert.equal(parseVolume('0'), 0);
  assert.equal(parseVolume('1'), 1);
  assert.equal(parseVolume('2'), 1);
  assert.equal(parseVolume('-1'), 0);
});

test('静音位与存储键', () => {
  assert.equal(parseMuted('1'), true);
  assert.equal(parseMuted('true'), true);
  assert.equal(parseMuted('0'), false);
  assert.equal(parseMuted(null), false);
  assert.equal(serializeMuted(true), '1');
  assert.equal(serializeMuted(false), '0');
  assert.deepEqual(STORAGE_KEYS, {
    lastStation: 'dsh-radio:lastStation',
    volume: 'dsh-radio:volume',
    muted: 'dsh-radio:muted',
    settings: 'dsh-radio:settings',
  });
});
