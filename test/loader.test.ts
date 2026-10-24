import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';

const source = readFileSync(new URL('../lib/client.js', import.meta.url), 'utf8');

class FakeStyle {
  readonly tag: string;
  readonly attrs = new Map<string, string>();
  readonly styles: FakeStyle[];
  textContent = '';
  removed = false;

  constructor(tag: string, styles: FakeStyle[]) {
    this.tag = tag;
    this.styles = styles;
  }

  setAttribute(name: string, value: string): void {
    this.attrs.set(name, value);
  }

  remove(): void {
    this.removed = true;
    const index = this.styles.indexOf(this);
    if (index >= 0) this.styles.splice(index, 1);
  }
}

interface Registration {
  id: string;
  factory: (require: (id: string) => unknown) => Record<string, unknown>;
}

interface SlotOptions {
  name: string;
  id?: string;
  order?: number;
}

const styles: FakeStyle[] = [];
const documentStub = {
  head: {
    appendChild(node: FakeStyle): void {
      styles.push(node);
    },
  },
  createElement(tag: string): FakeStyle {
    return new FakeStyle(tag, styles);
  },
  addEventListener(): void {},
  removeEventListener(): void {},
};

const storage = new Map<string, string>();
const localStorageStub = {
  getItem(key: string): string | null {
    return storage.get(key) ?? null;
  },
  setItem(key: string, value: string): void {
    storage.set(key, value);
  },
  removeItem(key: string): void {
    storage.delete(key);
  },
};

const reactStub = {
  createElement(type: unknown, props: unknown, ...children: unknown[]): unknown {
    return { type, props, children };
  },
  Fragment: Symbol('Fragment'),
  useSyncExternalStore(_subscribe: unknown, getSnapshot: () => unknown): unknown {
    return getSnapshot();
  },
  useState(initial: unknown): unknown[] {
    return [typeof initial === 'function' ? (initial as () => unknown)() : initial, () => {}];
  },
  useEffect(): void {},
  useRef(value: unknown): { current: unknown } {
    return { current: value };
  },
  useMemo(factory: () => unknown): unknown {
    return factory();
  },
  useCallback(fn: unknown): unknown {
    return fn;
  },
};

const requested: string[] = [];
function requireStub(id: string): unknown {
  requested.push(id);
  if (id === 'react') return reactStub;
  if (id === 'react-dom/client') return { createRoot: () => undefined };
  throw new Error(`unexpected external module: ${id}`);
}

let registration: Registration | undefined;

const sandbox: Record<string, unknown> = {
  window: {
    __ModuleLoader__: {
      load(value: Registration): void {
        registration = value;
      },
    },
    localStorage: localStorageStub,
  },
  document: documentStub,
  navigator: { language: 'zh-CN' },
  localStorage: localStorageStub,
  console,
  setTimeout,
  clearTimeout,
  performance,
};
sandbox.globalThis = sandbox;

runInNewContext(source, sandbox);

test('产物是 ModuleLoader 注册式 CJS 包装', () => {
  assert.match(source, /^window\.__ModuleLoader__\.load\(\{/);
  assert.match(source, /id: "dsh-plugin-radio"/);
  assert.match(source, /factory: \(require\) => \{/);
  assert.match(source, /return module\.exports;/);
  assert.ok(source.trimEnd().endsWith('});'));
});

test('factory 只从宿主 require 取 react，不把 react 打进包', () => {
  assert.ok(registration !== undefined, 'bundle 没有调用 __ModuleLoader__.load');
  assert.equal(registration.id, 'dsh-plugin-radio');
  const exports = registration.factory(requireStub);
  assert.ok(requested.length > 0);
  assert.deepEqual([...new Set(requested)], ['react']);
  assert.equal(exports.name, 'dsh-plugin-radio');
  assert.deepEqual(Array.from(exports.inject as string[]), ['slots']);
  assert.equal(typeof exports.apply, 'function');
});

test('apply 只注册状态行槽位并注入样式，dispose 时移除', () => {
  assert.ok(registration !== undefined);
  const exports = registration.factory(requireStub);
  const injections: string[] = [];
  const registrations: Array<{ options: SlotOptions; component: unknown }> = [];
  const disposers: Array<() => void> = [];
  const ctx = {
    slots: {
      inject(slot: string, register: () => unknown): void {
        injections.push(slot);
        register();
      },
      register(options: SlotOptions, component: unknown): () => void {
        registrations.push({ options, component });
        return () => {};
      },
    },
    effect(effect: () => void | (() => void)): () => void {
      const dispose = effect();
      if (typeof dispose === 'function') disposers.push(dispose);
      return () => {};
    },
  };

  assert.doesNotThrow(() => {
    (exports.apply as (context: typeof ctx) => void)(ctx);
  });
  assert.deepEqual(injections, ['conversation.composer.dock']);
  assert.equal(registrations.length, 1);
  assert.equal(registrations[0].options.name, 'conversation.composer.dock');
  assert.equal(registrations[0].options.id, 'radio');
  assert.equal(registrations[0].options.order, -1);
  assert.equal(typeof registrations[0].component, 'function');

  assert.equal(styles.length, 1);
  const style = styles[0];
  assert.equal(style.attrs.get('data-dsh-radio'), '');
  assert.ok(style.textContent.includes('.dsh-radio__pill'));
  assert.ok(style.textContent.includes('.dsh-radio__wave'));
  assert.ok(!style.textContent.includes('.dsh-radio--overlay'));
  assert.ok(!style.textContent.includes('.dsh-radio--bottom'));
  for (const dispose of disposers) dispose();
  assert.equal(style.removed, true);
  assert.equal(styles.length, 0);
});
