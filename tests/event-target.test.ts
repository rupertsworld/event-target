import { describe, it } from 'node:test';
import assert from 'node:assert';
import { defineEvent, EventTarget } from '../src/index.js';

interface UserLoginEvent extends Event {
  type: 'user-login';
  userId: string;
  timestamp: number;
}
const UserLoginEvent = defineEvent<UserLoginEvent>();

interface UserLogoutEvent extends Event {
  type: 'user-logout';
  userId: string;
}
const UserLogoutEvent = defineEvent<UserLogoutEvent>();

interface AppCloseEvent extends Event {
  type: 'close';
}
const AppCloseEvent = defineEvent<AppCloseEvent>();

class Server extends EventTarget<
  UserLoginEvent | UserLogoutEvent | AppCloseEvent
> {
  login(userId: string) {
    this.dispatchEvent(new UserLoginEvent('user-login', { userId, timestamp: 1 }));
  }
}

describe('defineEvent', () => {
  it('copies payload properties onto the instance and sets event.type', () => {
    const e = new UserLoginEvent('user-login', { userId: 'u1', timestamp: 42 });
    assert.strictEqual(e.type, 'user-login');
    assert.strictEqual(e.userId, 'u1');
    assert.strictEqual(e.timestamp, 42);
  });

  it('supports events with no props (optional init)', () => {
    const e = new AppCloseEvent('close');
    assert.strictEqual(e.type, 'close');
  });

  it('supports events with no props but with EventInit', () => {
    const e = new AppCloseEvent('close', { bubbles: true });
    assert.strictEqual(e.type, 'close');
    assert.strictEqual(e.bubbles, true);
  });

  it('supports custom payload events', () => {
    interface CounterEvent extends Event {
      type: 'counter';
      n: number;
    }
    const CounterEvent = defineEvent<CounterEvent>();
    const e = new CounterEvent('counter', { n: 1 });
    assert.strictEqual(e.type, 'counter');
    assert.strictEqual(e.n, 1);
  });

  it('throws when a payload key collides with a reserved Event name', () => {
    interface Bad extends Event {
      type: 'bad';
      defaultPrevented: boolean;
    }
    const Bad = defineEvent<Bad>() as unknown as new (
      type: 'bad',
      init: { defaultPrevented: boolean }
    ) => Event;
    assert.throws(
      () => new Bad('bad', { defaultPrevented: true }),
      /reserved/i
    );
  });

  it('throws when a payload key is a reserved method name', () => {
    interface Bad extends Event {
      type: 'bad2';
      preventDefault: () => void;
    }
    const Bad = defineEvent<Bad>() as unknown as new (
      type: 'bad2',
      init: { preventDefault: () => void }
    ) => Event;
    assert.throws(
      () => new Bad('bad2', { preventDefault: () => {} }),
      /reserved/i
    );
  });

  it('forwards EventInit options to Event constructor', () => {
    const e = new UserLoginEvent('user-login', {
      userId: 'u1',
      timestamp: 42,
      bubbles: true,
      cancelable: true,
      composed: true,
    });
    assert.strictEqual(e.bubbles, true);
    assert.strictEqual(e.cancelable, true);
    assert.strictEqual(e.composed, true);
  });

  it('throws if init.type is passed', () => {
    const LoginEventAny = UserLoginEvent as unknown as new (
      type: string,
      init: { userId: string; timestamp: number; type?: string }
    ) => UserLoginEvent;
    assert.throws(
      () => new LoginEventAny('user-login', {
        userId: 'u1',
        timestamp: 42,
        type: 'hijack',
      }),
      /Do not pass "type" in init/
    );
  });

  it('returns instances that satisfy instanceof checks', () => {
    const e = new UserLoginEvent('user-login', { userId: 'u1', timestamp: 42 });
    assert.strictEqual(e instanceof UserLoginEvent, true);
    assert.strictEqual(e instanceof Event, true);
  });
});

describe('EventTarget', () => {
  it('delivers dispatched events to addEventListener handlers', () => {
    const server = new Server();
    const seen: string[] = [];
    server.addEventListener('user-login', (e) => {
      seen.push(e.userId);
    });
    server.login('alice');
    assert.deepStrictEqual(seen, ['alice']);
  });

  it('supports removeEventListener', () => {
    const server = new Server();
    const seen: string[] = [];
    const handler = (e: UserLoginEvent) => seen.push(e.userId);
    server.addEventListener('user-login', handler);
    server.login('a');
    server.removeEventListener('user-login', handler);
    server.login('b');
    assert.deepStrictEqual(seen, ['a']);
  });

  it('supports { once: true }', () => {
    const server = new Server();
    let count = 0;
    server.addEventListener(
      'user-login',
      () => {
        count += 1;
      },
      { once: true }
    );
    server.login('x');
    server.login('x');
    assert.strictEqual(count, 1);
  });

  it('supports discrimination by .type literal', () => {
    const pickUserId = (event: UserLoginEvent | UserLogoutEvent) => {
      if (event.type === 'user-login') {
        return event.userId;
      }
      return event.userId;
    };

    assert.strictEqual(
      pickUserId(new UserLoginEvent('user-login', { userId: 'u1', timestamp: 0 })),
      'u1'
    );
  });

  it('supports instanceof narrowing style checks', () => {
    const describeEvent = (event: UserLoginEvent | UserLogoutEvent) => {
      if (event instanceof UserLoginEvent) {
        return `${event.type}:${event.userId}:${event.timestamp}`;
      }
      return `${event.type}:${event.userId}`;
    };

    assert.strictEqual(
      describeEvent(new UserLoginEvent('user-login', { userId: 'u1', timestamp: 99 })),
      'user-login:u1:99'
    );
    assert.strictEqual(
      describeEvent(new UserLogoutEvent('user-logout', { userId: 'u2' })),
      'user-logout:u2'
    );
  });
});

describe('Native Event behavior', () => {
  it('preserves all standard Event properties', () => {
    const e = new UserLoginEvent('user-login', {
      userId: 'u1',
      timestamp: 1,
      bubbles: true,
      cancelable: true,
    });

    assert.strictEqual(e.type, 'user-login');
    assert.strictEqual(e.bubbles, true);
    assert.strictEqual(e.cancelable, true);
    assert.strictEqual(e.composed, false);
    assert.strictEqual(e.defaultPrevented, false);
    assert.strictEqual(e.isTrusted, false);
    assert.strictEqual(typeof e.timeStamp, 'number');
    assert.ok(e.timeStamp > 0);
    assert.strictEqual(e.eventPhase, 0);
    assert.strictEqual(e.target, null);
    assert.strictEqual(e.currentTarget, null);
  });

  it('supports preventDefault()', () => {
    const e = new UserLoginEvent('user-login', {
      userId: 'u1',
      timestamp: 1,
      cancelable: true,
    });
    assert.strictEqual(e.defaultPrevented, false);
    e.preventDefault();
    assert.strictEqual(e.defaultPrevented, true);
  });

  it('supports composedPath()', () => {
    const e = new UserLoginEvent('user-login', { userId: 'u1', timestamp: 1 });
    assert.deepStrictEqual(e.composedPath(), []);
  });
});

describe('Native EventTarget behavior', () => {
  it('dispatchEvent returns true when not canceled', () => {
    const server = new Server();
    const result = server.dispatchEvent(
      new UserLoginEvent('user-login', { userId: 'u1', timestamp: 1 })
    );
    assert.strictEqual(result, true);
  });

  it('dispatchEvent returns false when preventDefault called on cancelable event', () => {
    const server = new Server();
    server.addEventListener('user-login', (e) => e.preventDefault());
    const result = server.dispatchEvent(
      new UserLoginEvent('user-login', { userId: 'u1', timestamp: 1, cancelable: true })
    );
    assert.strictEqual(result, false);
  });

  it('supports stopImmediatePropagation()', () => {
    const server = new Server();
    const results: string[] = [];
    server.addEventListener('user-login', (e) => {
      results.push('first');
      e.stopImmediatePropagation();
    });
    server.addEventListener('user-login', () => {
      results.push('second');
    });
    server.dispatchEvent(
      new UserLoginEvent('user-login', { userId: 'u1', timestamp: 1 })
    );
    assert.deepStrictEqual(results, ['first']);
  });

  it('supports { capture: true } option', () => {
    const server = new Server();
    const results: string[] = [];
    server.addEventListener('user-login', () => results.push('capture'), { capture: true });
    server.addEventListener('user-login', () => results.push('bubble'));
    server.dispatchEvent(
      new UserLoginEvent('user-login', { userId: 'u1', timestamp: 1 })
    );
    assert.deepStrictEqual(results, ['capture', 'bubble']);
  });

  it('is instanceof both EventTarget and globalThis.EventTarget', () => {
    const server = new Server();
    assert.strictEqual(server instanceof EventTarget, true);
    assert.strictEqual(server instanceof globalThis.EventTarget, true);
  });

  it('sets target and currentTarget during dispatch', () => {
    const server = new Server();
    let capturedTarget: globalThis.EventTarget | null = null;
    let capturedCurrentTarget: globalThis.EventTarget | null = null;
    server.addEventListener('user-login', (e) => {
      capturedTarget = e.target;
      capturedCurrentTarget = e.currentTarget;
    });
    server.dispatchEvent(
      new UserLoginEvent('user-login', { userId: 'u1', timestamp: 1 })
    );
    assert.strictEqual(capturedTarget, server);
    assert.strictEqual(capturedCurrentTarget, server);
  });
});
