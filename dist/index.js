const RESERVED_EVENT_KEYS = new Set([
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
function assertNoReservedPayloadKeys(props) {
    for (const key of Object.keys(props)) {
        if (RESERVED_EVENT_KEYS.has(key)) {
            throw new Error(`Event payload key "${key}" is reserved; choose a different property name`);
        }
    }
}
function assignPayload(target, props) {
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
export function defineEvent(type, init) {
    class DefinedEvent extends Event {
        constructor(props) {
            super(type, init);
            if (props !== undefined) {
                assignPayload(this, props);
            }
        }
    }
    return DefinedEvent;
}
export class EventTarget extends globalThis.EventTarget {
}
//# sourceMappingURL=index.js.map