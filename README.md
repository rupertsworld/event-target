# @rupertsworld/event-target

Typed `EventTarget` with convenient event type creation.

## Install

```bash
npm install @rupertsworld/event-target
```

## Usage

```ts
import { EventTarget, defineEvent } from "@rupertsworld/event-target";

interface UserLoginEvent extends Event {
  userId: string;
  timestamp: number;
}
const UserLoginEvent = defineEvent<UserLoginEvent>("userLogin");

interface UserLogoutEvent extends Event {
  userId: string;
}
const UserLogoutEvent = defineEvent<UserLogoutEvent>("userLogout");

interface CloseEvent extends Event {}
const CloseEvent = defineEvent<CloseEvent>("close");

type ServerEvent = UserLoginEvent | UserLogoutEvent | CloseEvent;

class Server extends EventTarget<ServerEvent> {
  login(userId: string) {
    this.dispatchEvent(new UserLoginEvent({ userId, timestamp: Date.now() }));
  }

  close() {
    this.dispatchEvent(new CloseEvent());
  }
}

const server = new Server();

server.addEventListener("userLogin", (e) => {
  console.log(e.userId, e.timestamp);
});

server.addEventListener("close", () => {
  console.log("server closed");
}, { once: true });
```

## API

### `defineEvent<TEvent>(type, options?)`

Creates an event constructor for `TEvent`.

- `TEvent` must extend `Event`
- Constructor accepts only the non-`Event` properties of `TEvent`
- Throws at runtime if payload tries to overwrite reserved `Event` fields like `type` or `preventDefault`

### `EventTarget<TUnion>`

A typed replacement for native `EventTarget`.

- `addEventListener` and `removeEventListener` are typed by event `type`
- `dispatchEvent` is typed to only accept known event unions
- Runtime behavior remains native `EventTarget`

## Environment Support

Works in browser and Node.js 18+ with native `EventTarget` / `Event`.
