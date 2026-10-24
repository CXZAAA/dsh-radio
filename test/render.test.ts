import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';
import type * as ReactTypes from 'react';

import { DEFAULT_SETTINGS } from '../src/client/settings.ts';

const nodeRequire = createRequire(import.meta.url);
const React = nodeRequire('react') as typeof ReactTypes;
const renderToStaticMarkup = nodeRequire('react-dom/server').renderToStaticMarkup as (
  element: unknown,
) => string;

const source = readFileSync(new URL('../lib/client.js', import.meta.url), 'utf8');

interface SlotOptions {
  name: string;
  id?: string;
  order?: number;
}

interface Loaded {
  options: SlotOptions;
  component: () => unknown;
}

function load(
  settings: string | null,
  lastStation: string | null,
  language: string,
): Loaded[] {
  const store = new Map<string, string>();
  if (settings !== null) store.set('dsh-radio:settings', settings);
  if (lastStation !== null) store.set('dsh-radio:lastStation', lastStation);
  const localStorage = {
    getItem: (key: string): string | null => store.get(key) ?? null,
    setItem: (key: string, value: string): void => {
      store.set(key, value);
    },
    removeItem: (key: string): void => {
      store.delete(key);
    },
  };
  const documentStub = {
    head: { appendChild: (): void => {} },
    createElement: () => ({
      attrs: new Map<string, string>(),
      textContent: '',
      setAttribute(key: string, value: string): void {
        this.attrs.set(key, value);
      },
      remove(): void {},
    }),
    addEventListener(): void {},
    removeEventListener(): void {},
  };
  let registration:
    | { id: string; factory: (require: (id: string) => unknown) => Record<string, unknown> }
    | undefined;
  const sandbox: Record<string, unknown> = {
    window: {
      __ModuleLoader__: {
        load: (value: typeof registration): void => {
          registration = value;
        },
      },
      localStorage,
    },
    document: documentStub,
    navigator: { language },
    localStorage,
    console,
    setTimeout,
    clearTimeout,
    performance,
  };
  sandbox.globalThis = sandbox;
  runInNewContext(source, sandbox);
  assert.ok(registration !== undefined);
  const exports = registration.factory((id) => {
    if (id === 'react') return React;
    throw new Error(`unexpected external module: ${id}`);
  });
  const loaded: Loaded[] = [];
  const ctx = {
    slots: {
      inject(_name: string, register: () => unknown): void {
        register();
      },
      register(options: SlotOptions, component: () => unknown): () => void {
        loaded.push({ options, component });
        return () => {};
      },
    },
    effect(effect: () => void | (() => void)): () => void {
      const dispose = effect();
      return typeof dispose === 'function' ? dispose : () => {};
    },
  };
  (exports.apply as (context: typeof ctx) => void)(ctx);
  return loaded;
}

test('只注册一个状态行槽位，收起态始终是完整结构', () => {
  const loaded = load(JSON.stringify(DEFAULT_SETTINGS), null, 'zh-CN');
  assert.equal(loaded.length, 1);
  assert.equal(loaded[0].options.name, 'conversation.composer.dock');
  assert.equal(loaded[0].options.id, 'radio');
  assert.equal(loaded[0].options.order, -1);
  const html = renderToStaticMarkup(
    React.createElement(loaded[0].component as ReactTypes.ComponentType),
  );
  assert.ok(html.includes('dsh-radio__pill'));
  assert.ok(html.includes('dsh-radio__play'));
  assert.ok(html.includes('dsh-radio__next'));
  assert.ok(html.includes('>ChillSynth</span>'));
  assert.ok(html.includes('dsh-radio__wave'));
  assert.ok(!html.includes('>电台</span>'), '台名位置不应再显示「电台」');
  assert.ok(html.includes('data-status="idle"'));
  assert.ok(html.includes('aria-label="下一个电台"'));
});

test('旧 placement 设置被忽略，仍然渲染在状态行', () => {
  const loaded = load(
    JSON.stringify({ ...DEFAULT_SETTINGS, placement: 'overlay' }),
    null,
    'zh-CN',
  );
  const html = renderToStaticMarkup(
    React.createElement(loaded[0].component as ReactTypes.ComponentType),
  );
  assert.ok(html.includes('dsh-radio__pill'));
});

test('频谱样式为 off 时不渲染柱体', () => {
  const loaded = load(JSON.stringify({ ...DEFAULT_SETTINGS, spectrum: 'off' }), null, 'zh-CN');
  const html = renderToStaticMarkup(
    React.createElement(loaded[0].component as ReactTypes.ComponentType),
  );
  assert.ok(html.includes('dsh-radio__pill'));
  assert.ok(!html.includes('dsh-radio__wave'));
});

test('记住上次电台时以暂停态显示台名', () => {
  const loaded = load(JSON.stringify(DEFAULT_SETTINGS), 'main', 'zh-CN');
  const dock = loaded[0];
  const html = renderToStaticMarkup(React.createElement(dock.component as ReactTypes.ComponentType));
  assert.ok(html.includes('data-status="paused"'));
  assert.ok(html.includes('Main Mix'));
});

test('非中文 locale 使用英文文案', () => {
  const loaded = load(JSON.stringify(DEFAULT_SETTINGS), null, 'en-US');
  const dock = loaded[0];
  const html = renderToStaticMarkup(React.createElement(dock.component as ReactTypes.ComponentType));
  assert.ok(html.includes('>ChillSynth</span>'));
  assert.ok(html.includes('aria-label="Play"'));
  assert.ok(html.includes('aria-label="Next station"'));
  assert.ok(html.includes('Radio panel · ChillSynth'));
});
