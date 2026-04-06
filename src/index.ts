const RESERVED_EVENT_KEYS = new Set<string>([
  'type',
  'target',
  'currentTarget',
  'eventPhase',
  'bubbles',
  'cancelable',
  'defaultPrevented',
  'composed',
  'isTrusted',
  'timeStamp',
  'srcElement',
  'returnValue',
  'cancelBubble',
  'NONE',
  'CAPTURING_PHASE',
  'AT_TARGET',
  'BUBBLING_PHASE',
  'composedPath',
  'stopPropagation',
  'stopImmediatePropagation',
  'preventDefault',
  'initEvent',
]);

function assertNoReservedPayloadKeys(props: Record<string, unknown>): void {
  for (const key of Object.keys(props)) {
    if (RESERVED_EVENT_KEYS.has(key)) {
      throw new Error(
        `Event payload key "${key}" is reserved; choose a different property name`
      );
    }
  }
}

function assignPayload(target: Event, props: Record<string, unknown>): void {
  assertNoReservedPayloadKeys(props);
  for (const key of Object.keys(props)) {
    Object.defineProperty(target, key, {
      value: props[key],
      writable: true,
      enumerable: true,
      configurable: true,
    });
  }
}

type EventPayload<TEvent extends Event> = Omit<TEvent, keyof Event>;

type EventConstructor<TEvent extends Event> = keyof EventPayload<TEvent> extends never
  ? new () => TEvent
  : new (props: EventPayload<TEvent>) => TEvent;

export function defineEvent<const TType extends string>(
  type: TType,
  init?: EventInit
): new () => Event & { readonly type: TType };

export function defineEvent<TEvent extends Event>(
  type: string,
  init?: EventInit
): EventConstructor<TEvent>;

export function defineEvent(type: string, init?: EventInit): new (props?: Record<string, unknown>) => Event {
  class DefinedEvent extends Event {
    constructor(props?: Record<string, unknown>) {
      super(type, init);
      if (props !== undefined) {
        assignPayload(this, props);
      }
    }
  }
  return DefinedEvent;
}

type EventNames<U extends Event> = U extends unknown
  ? U extends { readonly type: infer T extends string }
    ? T
    : never
  : never;

type EventForType<U extends Event, K extends string> = Extract<U, { type: K }>;

type NativeEventTarget = InstanceType<typeof globalThis.EventTarget>;

type ReducedEventTarget = Omit<
  NativeEventTarget,
  'addEventListener' | 'removeEventListener' | 'dispatchEvent'
>;

/**
 * Typed overloads for native `EventTarget` methods. Implementation comes from
 * `EventTarget`; this interface only narrows types at call sites.
 */
export interface EventTarget<T extends Event> extends ReducedEventTarget {
  addEventListener<K extends EventNames<T>>(
    type: K,
    listener:
      | ((ev: EventForType<T, K>) => void)
      | EventListenerOrEventListenerObject
      | null,
    options?: boolean | AddEventListenerOptions
  ): void;

  removeEventListener<K extends EventNames<T>>(
    type: K,
    listener:
      | ((ev: EventForType<T, K>) => void)
      | EventListenerOrEventListenerObject
      | null,
    options?: boolean | EventListenerOptions
  ): void;

  dispatchEvent(event: T): boolean;
}

export class EventTarget<T extends Event> extends globalThis.EventTarget {}
