import { describe, it } from 'node:test';
import assert from 'node:assert';
import { defineEvent, EventTarget } from '../src/index.js';

interface UserLoginEvent extends Event {
  userId: string;
  timestamp: number;
}
const UserLoginEvent = defineEvent<UserLoginEvent>('userLogin');

interface UserLogoutEvent extends Event {
  userId: string;
}
const UserLogoutEvent = defineEvent<UserLogoutEvent>('userLogout');

interface CloseEvent extends Event {}
const CloseEvent = defineEvent<CloseEvent>('close');

interface BubblingEvent extends Event {
  n: number;
}
const BubblingEvent = defineEvent<BubblingEvent>('bubbling', { bubbles: true, cancelable: true });

class Server extends EventTarget<
  UserLoginEvent | UserLogoutEvent | CloseEvent | BubblingEvent
> {
  login(userId: string) {
    this.dispatchEvent(new UserLoginEvent({ userId, timestamp: 1 }));
  }
}

describe('defineEvent', () => {
  it('copies payload properties onto the instance and sets event.type', () => {
    const e = new UserLoginEvent({ userId: 'u1', timestamp: 42 });
    assert.strictEqual(e.type, 'userLogin');
    assert.strictEqual(e.userId, 'u1');
    assert.strictEqual(e.timestamp, 42);
  });

  it('supports no-arg events', () => {
    const e = new CloseEvent();
    assert.strictEqual(e.type, 'close');
  });

  it('passes EventInit to the Event constructor', () => {
    const e = new BubblingEvent({ n: 1 });
    assert.strictEqual(e.bubbles, true);
    assert.strictEqual(e.cancelable, true);
    assert.strictEqual(e.n, 1);
  });

  it('throws when a payload key collides with a reserved Event name', () => {
    const Bad = defineEvent<Event>('bad') as unknown as new (props: { type: string }) => Event;
    assert.throws(
      () => new Bad({ type: 'x' }),
      /reserved/i
    );
  });

  it('throws when a payload key is a reserved method name', () => {
    const Bad = defineEvent<Event>('bad2') as unknown as new (props: { preventDefault: () => void }) => Event;
    assert.throws(
      () => new Bad({ preventDefault: () => {} }),
      /reserved/i
    );
  });
});

describe('EventTarget', () => {
  it('delivers dispatched events to addEventListener handlers', () => {
    const server = new Server();
    const seen: string[] = [];
    server.addEventListener('userLogin', (e) => {
      seen.push(e.userId);
    });
    server.login('alice');
    assert.deepStrictEqual(seen, ['alice']);
  });

  it('supports removeEventListener', () => {
    const server = new Server();
    const seen: string[] = [];
    const handler = (e: UserLoginEvent) => seen.push(e.userId);
    server.addEventListener('userLogin', handler);
    server.login('a');
    server.removeEventListener('userLogin', handler);
    server.login('b');
    assert.deepStrictEqual(seen, ['a']);
  });

  it('supports { once: true }', () => {
    const server = new Server();
    let count = 0;
    server.addEventListener(
      'userLogin',
      () => {
        count += 1;
      },
      { once: true }
    );
    server.login('x');
    server.login('x');
    assert.strictEqual(count, 1);
  });

  it('respects cancelable and defaultPrevented', () => {
    const server = new Server();
    server.addEventListener('bubbling', (e) => {
      e.preventDefault();
    });
    const ok = server.dispatchEvent(new BubblingEvent({ n: 1 }));
    assert.strictEqual(ok, false);
  });
});
