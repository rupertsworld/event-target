type EventPayload<TEvent extends Event> = Omit<TEvent, keyof Event>;
type EventConstructor<TEvent extends Event> = keyof EventPayload<TEvent> extends never ? new () => TEvent : new (props: EventPayload<TEvent>) => TEvent;
export declare function defineEvent<const TType extends string>(type: TType, init?: EventInit): new () => Event & {
    readonly type: TType;
};
export declare function defineEvent<TEvent extends Event>(type: string, init?: EventInit): EventConstructor<TEvent>;
type EventNames<U extends Event> = U extends unknown ? U extends {
    readonly type: infer T extends string;
} ? T : never : never;
type EventForType<U extends Event, K extends string> = Extract<U, {
    type: K;
}>;
type NativeEventTarget = InstanceType<typeof globalThis.EventTarget>;
type ReducedEventTarget = Omit<NativeEventTarget, 'addEventListener' | 'removeEventListener' | 'dispatchEvent'>;
/**
 * Typed overloads for native `EventTarget` methods. Implementation comes from
 * `EventTarget`; this interface only narrows types at call sites.
 */
export interface EventTarget<T extends Event> extends ReducedEventTarget {
    addEventListener<K extends EventNames<T>>(type: K, listener: ((ev: EventForType<T, K>) => void) | EventListenerOrEventListenerObject | null, options?: boolean | AddEventListenerOptions): void;
    removeEventListener<K extends EventNames<T>>(type: K, listener: ((ev: EventForType<T, K>) => void) | EventListenerOrEventListenerObject | null, options?: boolean | EventListenerOptions): void;
    dispatchEvent(event: T): boolean;
}
export declare class EventTarget<T extends Event> extends globalThis.EventTarget {
}
export {};
//# sourceMappingURL=index.d.ts.map