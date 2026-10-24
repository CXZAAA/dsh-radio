import type { ComponentType } from 'react';

import { DockRadio } from './Radio.tsx';
import { disposeRadio, startRadio } from './store.ts';
import { installStyles } from './styles.ts';

interface SlotOptions {
  name: string;
  id?: string;
  order?: number;
}

interface SlotsService {
  inject(name: string, register: () => unknown): void;
  register(options: SlotOptions, component: ComponentType): unknown;
}

interface ClientContext {
  slots: SlotsService;
  effect(effect: () => void | (() => void), label?: string): void;
}

export const name = 'dsh-plugin-radio';
export const inject = ['slots'];

export function apply(ctx: ClientContext): void {
  ctx.effect(() => installStyles(), 'dsh-radio: styles');
  ctx.effect(() => {
    startRadio();
    return disposeRadio;
  }, 'dsh-radio: audio');

  // 唯一位置：会话输入框状态行。插件只在这一处出现。
  ctx.slots.inject('conversation.composer.dock', () =>
    ctx.slots.register(
      { name: 'conversation.composer.dock', id: 'radio', order: -1 },
      DockRadio,
    ),
  );
}
