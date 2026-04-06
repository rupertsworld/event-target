# @rupertsworld/event-target

Typed `EventTarget` with convenient event type creation.

## Install

```bash
npm install @rupertsworld/event-target
```

## Usage

```ts
import { EventTarget, defineEvent } from "@rupertsworld/event-target";

// Define events
interface UserEvent extends Event {
  type: "user-login" | "user-logout";
  userId: string;
}
const UserEvent = defineEvent<UserEvent>();

interface CloseEvent extends Event {
  type: "close";
}
const CloseEvent = defineEvent<CloseEvent>();

// Define union
type ServerEvent = UserEvent | CloseEvent;

// Create typed EventTarget
class Server extends EventTarget<ServerEvent> {
  login(userId: string) {
    this.dispatchEvent(
      new UserEvent("user-login", { userId })
    );
  }

  logout(userId: string) {
    this.dispatchEvent(new UserEvent("user-logout", { userId }));
  }

  close() {
    this.dispatchEvent(new CloseEvent("close"));
  }
}

const server = new Server();

// Listeners are fully typed — no annotation needed
server.addEventListener("user-login", (e) => {
  console.log(e.userId);
});

server.addEventListener("close", () => {
  console.log("server closed");
}, { once: true });
```

## API

### `defineEvent<TEvent>()`

Creates a typed event constructor from an interface.

```ts
interface MyEvent extends Event {
  type: "my-event";
  payload: string;
}
const MyEvent = defineEvent<MyEvent>();

new MyEvent("my-event", { payload: "hello" });
new MyEvent("my-event", { payload: "hello", bubbles: true });
```

- Constructor signature: `(type: TEvent["type"], init?: Props & EventInit)` — `init` is optional when no custom props
- `type` argument is constrained to the interface's `type` literal
- `init` accepts custom props plus standard `EventInit` (`bubbles`, `cancelable`, `composed`)
- Throws at runtime if payload tries to overwrite reserved `Event` fields like `target` or `preventDefault`

### `EventTarget<TUnion>`

A typed replacement for native `EventTarget`.

- `addEventListener` and `removeEventListener` are typed by event `type`
- `dispatchEvent` only accepts events from the declared union
- Runtime behavior remains native `EventTarget`

## Environment Support

Works in browser and Node.js 18+ with native `EventTarget` / `Event`.
