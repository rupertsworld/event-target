# @rupertsworld/event-target Specification

This document defines the API surface, behavioral invariants, and type requirements.

---

## API

### `defineEvent<TEvent>()`

Creates a typed event constructor.

```ts
interface UserLoginEvent extends Event {
  type: "user-login";
  userId: string;
  timestamp: number;
}
const UserLoginEvent = defineEvent<UserLoginEvent>();

interface CloseEvent extends Event {
  type: "close";
}
const CloseEvent = defineEvent<CloseEvent>();
```

**Signature:**

```ts
function defineEvent<TEvent extends Event>(): EventConstructor<TEvent>;
```

**Returns:**

A constructor that:

- Accepts `(type: TEvent["type"], init: Props & EventInit)` where `Props` is `Omit<TEvent, keyof Event>`
- Sets `event.type` to the provided type string
- Assigns all props onto the instance
- Passes `bubbles`, `cancelable`, `composed` to native `Event` constructor

**Construction (DOM-style):**

```ts
new UserLoginEvent("user-login", { userId: "abc", timestamp: Date.now() });
new UserLoginEvent("user-login", { userId: "abc", timestamp: Date.now(), bubbles: true });
new CloseEvent("close");
new CloseEvent("close", { bubbles: true });
```

- Events with custom props require `init`
- Events with no custom props have optional `init` (can still pass `EventInit`)

---

### `EventTarget<TUnion>`

A typed replacement for native `EventTarget`.

```ts
type ServerEvents = UserLoginEvent | CloseEvent;

class Server extends EventTarget<ServerEvents> {
  // ...
}
```

**Provides typed versions of:**

- `addEventListener(type, listener, options?)`
- `removeEventListener(type, listener, options?)`
- `dispatchEvent(event)`

---

## Behavioral Invariants

### Event construction

1. `new UserLoginEvent("user-login", { userId: "abc", timestamp: 1 })` produces an instance where:
   - `event.type === "user-login"` (literal match)
   - `event.userId === "abc"`
   - `event.timestamp === 1`
   - `event instanceof Event === true`

2. `new CloseEvent("close")` produces an instance where:
   - `event.type === "close"`

3. `new UserLoginEvent("user-login", { userId: "abc", bubbles: true })` produces an instance where:
   - `event.bubbles === true`

4. Type string argument is constrained by the interface's `type` property:
   - `new UserLoginEvent("wrong", { ... })` is a compile-time error
   - `init.type` (if present via `any`/JS) throws at runtime; constructor `type` argument is authoritative

5. Attempting to set reserved `Event` properties via props throws at runtime:
   - Reserved keys: `target`, `currentTarget`, `defaultPrevented`, `isTrusted`, `timeStamp`, `srcElement`, `returnValue`, `cancelBubble`, `eventPhase`, `NONE`, `CAPTURING_PHASE`, `AT_TARGET`, `BUBBLING_PHASE`, `composedPath`, `stopPropagation`, `stopImmediatePropagation`, `preventDefault`, `initEvent`
   - Note: `type`, `bubbles`, `cancelable`, `composed` are handled specially (not reserved for props)

### EventTarget dispatch

1. `dispatchEvent(event)` only accepts instances from the declared union (type-level)
2. Runtime behavior is native `EventTarget` (no additional validation)

### EventTarget listeners

1. `addEventListener(type, listener)` narrows `type` to known event type strings
2. Listener callback parameter is inferred from the event type string — **no explicit annotation required**

---

## Type Requirements

### Inference

Given:

```ts
interface UserLoginEvent extends Event {
  type: "user-login";
  userId: string;
}
const UserLoginEvent = defineEvent<UserLoginEvent>();

interface CloseEvent extends Event {
  type: "close";
}
const CloseEvent = defineEvent<CloseEvent>();

class Server extends EventTarget<UserLoginEvent | CloseEvent> {}
const server = new Server();
```

The following **must** compile without explicit type annotations:

```ts
server.addEventListener("user-login", (e) => {
  e.userId;  // inferred as string
  e.type;    // inferred as "user-login"
});

server.addEventListener("close", (e) => {
  e.type;  // inferred as "close"
});
```

### Discrimination

Given a union:

```ts
function handle(e: UserLoginEvent | CloseEvent) {
  if (e.type === "user-login") {
    e.userId;  // narrowed to UserLoginEvent
  }
}
```

This must narrow correctly based on `.type` literal.

### instanceof

```ts
if (e instanceof UserLoginEvent) {
  e.userId;  // narrowed
}
```

This must also narrow correctly.
