const RESERVED_EVENT_KEYS = new Set<string>([
  'target',
  'currentTarget',
  'eventPhase',
  'defaultPrevented',
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

type EventType<TEvent extends Event> = TEvent extends { type: infer TType extends string }
  ? TType
  : string;

type EventProps<TEvent extends Event> = Omit<TEvent, keyof Event>;

type IsEmptyObject<T> = keyof T extends never ? true : false;

type EventConstructorArgs<TEvent extends Event> =
  IsEmptyObject<EventProps<TEvent>> extends true
    ? [type: EventType<TEvent>, init?: EventInit]
    : [type: EventType<TEvent>, init: EventProps<TEvent> & EventInit];

export type EventConstructor<TEvent extends Event> = {
  new (...args: EventConstructorArgs<TEvent>): TEvent;
};

export function defineEvent<TEvent extends Event>(): EventConstructor<TEvent>;

export function defineEvent<TEvent extends Event>(): EventConstructor<TEvent> {
  class DefinedEvent extends Event {
    constructor(type: string, init?: Record<string, unknown> & EventInit) {
      const {
        type: initType,
        bubbles,
        cancelable,
        composed,
        ...payload
      } = init ?? {};
      if (initType !== undefined) {
        throw new Error(
          `Do not pass "type" in init; use the constructor argument instead`
        );
      }
      super(type, { bubbles, cancelable, composed });
      assignPayload(this, payload);
    }
  }
  return DefinedEvent as unknown as EventConstructor<TEvent>;
}

export type EventNames<U extends Event> = U extends unknown
  ? U extends { type: infer T extends string }
    ? T
    : never
  : never;

export type EventForType<U extends Event, K extends string> = Extract<U, { type: K }>;

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
    listener: ((ev: EventForType<T, K>) => void) | null,
    options?: boolean | AddEventListenerOptions
  ): void;

  addEventListener<K extends EventNames<T>>(
    type: K,
    listener:
      | EventListener
      | EventListenerObject
      | null,
    options?: boolean | AddEventListenerOptions
  ): void;

  removeEventListener<K extends EventNames<T>>(
    type: K,
    listener: ((ev: EventForType<T, K>) => void) | null,
    options?: boolean | EventListenerOptions
  ): void;

  removeEventListener<K extends EventNames<T>>(
    type: K,
    listener:
      | EventListener
      | EventListenerObject
      | null,
    options?: boolean | EventListenerOptions
  ): void;

  dispatchEvent(event: T): boolean;
}

export class EventTarget<T extends Event> extends globalThis.EventTarget {}
