# Heartbeat

Heartbeat is done by sending the a series of persistable information to Redis:

At first time:

```
sadd CLIENT_NAME_SET_KEY CLIENT_NAME
```

every `HEARTBEAT_INTERVAL`:

```
set HEARTBEAT_KEY TIMESTAMP
expire HEARTBEAT_KEY TIMEOUTS
```

Check for status:

```
//1. get all client's HEARTBEAT_KEY
keys HEARTBEAT_KEYS
//2. get all registered clients
smembers CLIENT_NAME_SET_KEY
```

The intersection of names in the two lists are the living clients.