# Option 1: `createEvent<Props>("type")` class-factory (recommended candidate)

Define events as classes extending a factory-generated base:

```ts
class UserLoginEvent extends defineEvent<{
  userId: string;
  timestamp: number
}>("user-login") {}
```

# Option 2: Interface + `defineEvent<TEvent>("type")`

Define type and constructor separately:

```ts
interface UserLoginEvent extends Event {
  type: 'user-login';
  userId: string;
  timestamp: number;
}
const UserLoginEvent = defineEvent<UserLoginEvent>('user-login');
```
